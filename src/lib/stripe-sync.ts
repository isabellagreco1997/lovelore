import { supabaseAdmin } from './supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function syncStripeData() {
  const supabase = supabaseAdmin();
  
  try {
    // Get all customers from Stripe
    const customers = await stripe.customers.list();
    
    for (const customer of customers.data) {
      // Get user_id from customer metadata
      const userId = customer.metadata.userId;
      if (!userId) continue;
      
      // Insert or update customer record
      await supabase.from('stripe_customers').upsert({
        user_id: userId,
        customer_id: customer.id
      }, { onConflict: 'customer_id' });
      
      // Get customer's subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1,
        status: 'all',
        expand: ['data.default_payment_method']
      });
      
      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;
        
        // Update subscription record
        await supabase.from('stripe_subscriptions').upsert({
          customer_id: customer.id,
          subscription_id: subscription.id,
          price_id: subscription.items.data[0].price.id,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          payment_method_brand: paymentMethod?.card?.brand || null,
          payment_method_last4: paymentMethod?.card?.last4 || null,
          status: subscription.status
        }, { onConflict: 'customer_id' });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error syncing Stripe data:', error);
    return { error: error.message };
  }
}