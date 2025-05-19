import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16'
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    console.log('Processing webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed');
  
  const customerId = session.customer as string;
  if (!customerId) {
    console.error('No customer ID in session');
    return;
  }

  try {
    // For one-time payments
    if (session.mode === 'payment' && session.payment_status === 'paid') {
      await supabase.from('stripe_orders').insert({
        checkout_session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        customer_id: customerId,
        amount_subtotal: session.amount_subtotal || 0,
        amount_total: session.amount_total || 0,
        currency: session.currency || 'usd',
        payment_status: session.payment_status,
        status: 'completed'
      });
    }

    // For subscriptions, fetch the latest subscription data
    if (session.mode === 'subscription') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
        expand: ['default_payment_method']
      });
      await handleSubscriptionUpdate(subscription);
    }
  } catch (error) {
    console.error('Error handling checkout session:', error);
    throw error;
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Processing subscription update:', subscription.id);
  
  const customerId = subscription.customer as string;
  const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;

  try {
    // Update subscription record
    const { error: subError } = await supabase
      .from('stripe_subscriptions')
      .upsert({
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        payment_method_brand: paymentMethod?.card?.brand || null,
        payment_method_last4: paymentMethod?.card?.last4 || null,
        status: subscription.status,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'customer_id'
      });

    if (subError) {
      console.error('Error updating subscription:', subError);
      throw subError;
    }

    console.log('Successfully updated subscription:', subscription.id);
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Processing payment_intent.succeeded');
  
  if (!paymentIntent.customer) {
    console.log('No customer associated with payment intent');
    return;
  }

  try {
    // Only handle one-time payments (not subscription payments)
    if (!paymentIntent.invoice) {
      await supabase.from('stripe_orders').upsert({
        payment_intent_id: paymentIntent.id,
        customer_id: paymentIntent.customer as string,
        amount_subtotal: paymentIntent.amount,
        amount_total: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_status: paymentIntent.status,
        status: 'completed',
        checkout_session_id: paymentIntent.metadata.checkout_session_id || 'direct_payment',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'payment_intent_id'
      });
    }
  } catch (error) {
    console.error('Error handling payment intent:', error);
    throw error;
  }
}