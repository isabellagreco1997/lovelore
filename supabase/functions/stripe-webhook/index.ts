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

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};
  console.log('Processing Stripe event:', event.type);

  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  const customerId = stripeData.customer;
  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
    return;
  }

  try {
    // Get customer details from Stripe
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      console.log(`Customer ${customerId} has been deleted`);
      return;
    }

    // Get user_id from customer metadata
    const userId = customer.metadata.userId;
    if (!userId) {
      console.error(`No userId in metadata for customer ${customerId}`);
      return;
    }

    // Update customer record
    const { error: customerError } = await supabase
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        customer_id: customerId,
        updated_at: new Date().toISOString()
      });

    if (customerError) {
      throw new Error(`Failed to update customer: ${customerError.message}`);
    }

    // Get latest subscription data
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method']
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;

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
        });

      if (subError) {
        throw new Error(`Failed to update subscription: ${subError.message}`);
      }
    } else {
      // No active subscription - set to not_started
      const { error: noSubError } = await supabase
        .from('stripe_subscriptions')
        .upsert({
          customer_id: customerId,
          status: 'not_started',
          updated_at: new Date().toISOString()
        });

      if (noSubError) {
        throw new Error(`Failed to update subscription status: ${noSubError.message}`);
      }
    }

    // Handle one-time payments if applicable
    if (event.type === 'checkout.session.completed') {
      const session = stripeData as Stripe.Checkout.Session;
      if (session.mode === 'payment' && session.payment_status === 'paid') {
        const { error: orderError } = await supabase
          .from('stripe_orders')
          .upsert({
            checkout_session_id: session.id,
            payment_intent_id: session.payment_intent as string,
            customer_id: customerId,
            amount_subtotal: session.amount_subtotal || 0,
            amount_total: session.amount_total || 0,
            currency: session.currency || 'usd',
            payment_status: session.payment_status,
            status: 'completed',
            updated_at: new Date().toISOString()
          });

        if (orderError) {
          throw new Error(`Failed to create order record: ${orderError.message}`);
        }
      }
    }

    console.log(`Successfully processed ${event.type} event for customer ${customerId}`);
  } catch (error) {
    console.error(`Failed to process event for customer ${customerId}:`, error);
    throw error;
  }
}