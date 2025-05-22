import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

export async function POST(request: Request) {
  try {
    // Get body content
    const body = await request.json();
    // Simplify logging
    console.log("Checkout initiated");
    const { price_id, success_url, cancel_url, mode } = body;
    
    // Validate required parameters
    if (!price_id) {
      console.error("Missing price_id");
      return NextResponse.json(
        { error: 'Missing required parameter price_id' },
        { status: 400 }
      );
    }
    
    if (!success_url || !cancel_url || !mode) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    if (mode !== 'payment' && mode !== 'subscription') {
      return NextResponse.json(
        { error: 'Mode must be either "payment" or "subscription"' },
        { status: 400 }
      );
    }
    
    // Check if Supabase URL is available
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase URL is not configured. Please check your environment variables.' },
        { status: 500 }
      );
    }
    
    // Get auth token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token format' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase client
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey || supabaseAnonKey || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Get user information
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Get or create Stripe customer
    let customerId;
    
    // Check if customer exists
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();
      
    if (customer) {
      customerId = customer.customer_id;
    } else {
      // Create new customer in Stripe
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      
      // Save customer mapping in database
      await supabase.from('stripe_customers').insert({
        user_id: user.id,
        customer_id: newCustomer.id,
      });
      
      customerId = newCustomer.id;
      
      // Create subscription record if needed
      if (mode === 'subscription') {
        await supabase.from('stripe_subscriptions').insert({
          customer_id: customerId,
          status: 'not_started',
        });
      }
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode,
      success_url,
      cancel_url,
      // Make the session expire after 1 hour (in seconds)
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    });
    
    console.log(`Created checkout session ${session.id} for customer ${customerId}`);
    
    // Return both the session ID and URL to allow for client or server-side redirects
    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url,
      success: true 
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}