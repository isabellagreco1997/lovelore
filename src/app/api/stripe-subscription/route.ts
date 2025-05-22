import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// Use test keys in development, otherwise use production keys
const secretKey = process.env.NODE_ENV === 'development'
  ? process.env.STRIPE_TEST_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(secretKey!, {
  apiVersion: '2023-10-16'
});

// Check that required environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseServiceRoleKey && !supabaseAnonKey) {
  console.error('Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is defined');
}

export async function GET() {
  try {
    // Check if Supabase URL is available
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase URL is not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }
    
    // Get authorization header
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token format' },
        { status: 401 }
      );
    }
    
    // Extract the token
    const token = authorization.replace('Bearer ', '');
    
    // Initialize admin Supabase client
    const adminSupabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey || supabaseAnonKey || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Verify the token and get user
    const { data: { user }, error: userError } = await adminSupabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User error:', userError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get Stripe customer ID for this user
    const { data: customer } = await adminSupabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    if (!customer) {
      return NextResponse.json({ subscription: null });
    }

    // Fetch subscriptions directly from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.customer_id,
      status: 'active',
      expand: [
        'data.default_payment_method'
      ]
    });

    // Return the active subscription if exists
    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;
      const price = subscription.items.data[0].price;
      
      // Get product in a separate call to avoid deep nesting
      let product;
      try {
        if (price && typeof price.product === 'string') {
          product = await stripe.products.retrieve(price.product);
        }
      } catch (error) {
        console.error('Error retrieving product:', error);
        product = { name: 'Subscription', description: null };
      }
      
      return NextResponse.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          price_id: price.id,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          payment_method_brand: paymentMethod?.card?.brand || null,
          payment_method_last4: paymentMethod?.card?.last4 || null,
          price: {
            amount: price.unit_amount ? price.unit_amount / 100 : 0,
            currency: price.currency,
            interval: price.recurring?.interval || 'month',
            intervalCount: price.recurring?.interval_count || 1
          },
          product: product ? {
            name: product.name,
            description: product.description
          } : {
            name: 'Subscription',
            description: null
          }
        }
      });
    }

    return NextResponse.json({ subscription: null });
  } catch (error: any) {
    console.error('Error fetching Stripe subscription:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 