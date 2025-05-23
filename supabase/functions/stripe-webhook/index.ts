import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

// Explicitly determine if we are in a development/test-like environment
// You might set DENO_ENV to 'development' in your local/staging Supabase env vars
const IS_DEVELOPMENT_ENV = Deno.env.get('DENO_ENV') === 'development';

let stripeSecret: string;
let stripeWebhookSecret: string | undefined;
let isTestMode: boolean;

if (IS_DEVELOPMENT_ENV) {
  stripeSecret = Deno.env.get('STRIPE_TEST_SECRET_KEY')!;
  stripeWebhookSecret = Deno.env.get('STRIPE_TEST_WEBHOOK_SECRET') || undefined;
  isTestMode = true;
  console.log('ENVIRONMENT: DEVELOPMENT (using TEST Stripe keys and TEST webhook secret)');
  if (!stripeSecret) console.error("⚠️ STRIPE_TEST_SECRET_KEY is MISSING for DEVELOPMENT environment!");
  if (!stripeWebhookSecret) console.warn("⚠️ STRIPE_TEST_WEBHOOK_SECRET is MISSING for DEVELOPMENT environment!");
} else {
  stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
  stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || undefined;
  isTestMode = false; // In production, isTestMode should be false
  console.log('ENVIRONMENT: PRODUCTION (using LIVE Stripe keys and LIVE webhook secret)');
  if (!stripeSecret) console.error("⚠️ STRIPE_SECRET_KEY is MISSING for PRODUCTION environment!");
  if (!stripeWebhookSecret) console.warn("⚠️ STRIPE_WEBHOOK_SECRET is MISSING for PRODUCTION environment!");
}

// Fallback if stripeSecret is still not set (should not happen with proper env vars)
if (!stripeSecret) {
    console.error("CRITICAL: Stripe secret key is not configured. Defaulting to live key if present, but this is likely an error.");
    stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!; // Default to live as a last resort, will likely cause issues in dev
    // isTestMode might be incorrect here, but we need a key to initialize Stripe
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16'
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("CRITICAL: Supabase URL or Service Role Key is not configured!");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log(`Stripe SDK initialized. Effective isTestMode: ${isTestMode}`);

// Log which mode we're running in
console.log(`Stripe webhook running in ${isTestMode ? 'TEST' : 'LIVE'} mode`);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Get detailed information about the request
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('No stripe-signature header found in the request');
      return new Response('No signature found', { status: 400 });
    }

    console.log('Received stripe-signature:', signature);
    console.log('Using webhook secret of length:', stripeWebhookSecret?.length || 0);
    
    // get the raw body - very important to use the exact body as received
    const rawBody = await req.text();
    console.log('Raw body sample (first 50 chars):', rawBody.substring(0, 50) + '...');
    
    // Directly use Stripe's webhook construction without verification to log the event
    try {
      const jsonEvent = JSON.parse(rawBody);
      console.log('Event type from body:', jsonEvent.type);
      console.log('Event ID from body:', jsonEvent.id);
    } catch (e) {
      console.error('Failed to parse event body as JSON:', e);
    }

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      // Use constructEventAsync for newer Stripe library versions that require async crypto operations
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, stripeWebhookSecret);
      console.log('Successfully constructed webhook event:', event.id);
    } catch (error: any) {
      console.error(`Webhook signature verification failed:`, error);
      console.error('Error details:', error.message);
      
      // For testing, you can bypass signature verification in development
      // Remove this in production!
      if (isTestMode) {
        console.log('⚠️ BYPASSING SIGNATURE VERIFICATION IN TEST MODE ⚠️');
        try {
          event = JSON.parse(rawBody) as Stripe.Event;
          console.log('Parsed event without verification:', event.id);
        } catch (e) {
          console.error('Failed to parse event even when bypassing verification:', e);
          return new Response(`Failed to parse event: ${e.message}`, { status: 400 });
        }
      } else {
        return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
      }
    }

    console.log('Processing webhook event:', event.type);

    try {
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          console.log('Handling checkout.session.completed');
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          console.log('Handling subscription event');
          await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;
        case 'payment_intent.succeeded':
          console.log('Handling payment_intent.succeeded');
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'invoice.payment_succeeded':
          console.log('Handling invoice.payment_succeeded');
          // We should also handle invoice payment events
          if ((event.data.object as any).subscription) {
            // This is for a subscription, let's fetch and update
            try {
              const subscriptionId = (event.data.object as any).subscription;
              const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
                expand: ['default_payment_method']
              });
              await handleSubscriptionUpdate(subscription);
            } catch (error) {
              console.error('Error handling invoice payment for subscription:', error);
            }
          }
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // Always return a 200 success status to Stripe to acknowledge receipt
      return new Response(JSON.stringify({ received: true }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error('Error processing webhook event:', error);
      // Still return a 200 to Stripe so they don't retry
      // We'll log the error but acknowledge receipt
      return new Response(JSON.stringify({ 
        received: true,
        error: error.message,
        warning: "Event acknowledged but processing failed" 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
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
        payment_intent_id: session.payment_intent as string || 'no_payment_intent',
        customer_id: customerId,
        amount_subtotal: session.amount_subtotal || 0,
        amount_total: session.amount_total || 0,
        currency: session.currency || 'usd',
        payment_status: session.payment_status,
        status: 'completed'
      });
      console.log('Successfully inserted order for session:', session.id);
    }

    // For subscriptions, fetch the latest subscription data
    if (session.mode === 'subscription') {
      if (session.subscription) {
        console.log('Fetching subscription data for:', session.subscription);
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string, {
            expand: ['default_payment_method']
          });
          await handleSubscriptionUpdate(subscription);
        } catch (subError) {
          console.error('Error retrieving subscription:', subError);
        }
      } else {
        console.log('Subscription checkout completed but no subscription ID found in session');
        
        // Look for pending subscription record and update its status
        const { data: pendingSubscription, error: queryError } = await supabase
          .from('stripe_subscriptions')
          .select('id')
          .eq('customer_id', customerId)
          .eq('status', 'not_started')
          .maybeSingle();
          
        if (queryError) {
          console.error('Error finding pending subscription:', queryError);
        }
        
        if (pendingSubscription) {
          console.log('Found pending subscription record, updating status to wait for Stripe event');
          
          const { error: updateError } = await supabase
            .from('stripe_subscriptions')
            .update({
              checkout_session_id: session.id,
              status: 'incomplete',
              updated_at: new Date().toISOString()
            })
            .eq('id', pendingSubscription.id);
            
          if (updateError) {
            console.error('Error updating pending subscription:', updateError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error handling checkout session:', error);
    throw error;
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Processing subscription update:', subscription.id);
  
  const customerId = subscription.customer as string;
  if (!customerId) {
    console.error('No customer ID in subscription');
    return;
  }
  
  let paymentMethodBrand = null;
  let paymentMethodLast4 = null;
  
  // Safely access payment method information
  try {
    if (subscription.default_payment_method) {
      // If default_payment_method is already expanded
      if (typeof subscription.default_payment_method === 'object') {
        const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;
        paymentMethodBrand = paymentMethod?.card?.brand || null;
        paymentMethodLast4 = paymentMethod?.card?.last4 || null;
      } else {
        // If we need to retrieve the payment method
        const paymentMethod = await stripe.paymentMethods.retrieve(
          subscription.default_payment_method as string
        );
        paymentMethodBrand = paymentMethod?.card?.brand || null;
        paymentMethodLast4 = paymentMethod?.card?.last4 || null;
      }
    }
  } catch (pmError) {
    console.error('Error retrieving payment method:', pmError);
    // Continue without payment method info
  }

  try {
    // Check if we have a customer record for this Stripe customer
    const { data: customer, error: customerError } = await supabase
      .from('stripe_customers')
      .select('user_id')
      .eq('customer_id', customerId)
      .maybeSingle();
    
    if (customerError) {
      console.error('Error finding customer in database:', customerError);
    }
    
    if (!customer) {
      console.warn(`No customer record found for Stripe customer ${customerId}. This might be expected if webhook is running before customer creation.`);
    }

    // First check if subscription record exists for this customer
    const { data: existingSubscription, error: queryError } = await supabase
      .from('stripe_subscriptions')
      .select('id, status')
      .eq('customer_id', customerId)
      .maybeSingle();
    
    if (queryError) {
      console.error('Error querying for existing subscription:', queryError);
    }
      
    console.log('Existing subscription check:', existingSubscription ? `Found (status: ${existingSubscription.status})` : 'Not found');
    
    const subscriptionData = {
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: subscription.items.data[0]?.price?.id || null,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      payment_method_brand: paymentMethodBrand,
      payment_method_last4: paymentMethodLast4,
      status: subscription.status,
      updated_at: new Date().toISOString()
    };
    
    console.log('Updating with subscription data:', {
      subscription_id: subscription.id,
      price_id: subscription.items.data[0]?.price?.id || null,
      status: subscription.status
    });
    
    let result;
    if (existingSubscription) {
      // Update existing record
      result = await supabase
        .from('stripe_subscriptions')
        .update(subscriptionData)
        .eq('customer_id', customerId);
        
      console.log('Update operation result:', result.error ? 'Error' : 'Success');
    } else {
      // Insert new record
      result = await supabase
        .from('stripe_subscriptions')
        .insert(subscriptionData);
        
      console.log('Insert operation result:', result.error ? 'Error' : 'Success');  
    }

    if (result.error) {
      console.error('Database operation error:', result.error);
      throw result.error;
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

  const customerId = paymentIntent.customer as string;

  try {
    // Only handle one-time payments (not subscription payments)
    if (!paymentIntent.invoice) {
      // Try to find the checkout session ID from metadata or related objects
      let checkoutSessionId = 'direct_payment';
      
      if (paymentIntent.metadata && paymentIntent.metadata.checkout_session_id) {
        checkoutSessionId = paymentIntent.metadata.checkout_session_id;
      } else {
        // Try to find associated checkout session
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1
        });
        
        if (sessions.data.length > 0) {
          checkoutSessionId = sessions.data[0].id;
        }
      }
      
      await supabase.from('stripe_orders').upsert({
        payment_intent_id: paymentIntent.id,
        customer_id: customerId,
        amount_subtotal: paymentIntent.amount,
        amount_total: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_status: paymentIntent.status,
        status: 'completed',
        checkout_session_id: checkoutSessionId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'payment_intent_id'
      });
      
      console.log('Successfully updated order for payment intent:', paymentIntent.id);
    }
  } catch (error) {
    console.error('Error handling payment intent:', error);
    throw error;
  }
}