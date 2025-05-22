import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Stripe with the appropriate secret key
const secretKey = process.env.NODE_ENV === 'development'
  ? process.env.STRIPE_TEST_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(secretKey!, {
  apiVersion: '2023-10-16',
});

// Supabase client details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase URL or Service Role Key is not configured.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token format' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('Portal link auth error:', userError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Get Stripe customer ID from your database
    const { data: customerData, error: dbError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single();

    if (dbError || !customerData?.customer_id) {
      console.error('Failed to retrieve Stripe customer ID:', dbError);
      return NextResponse.json({ error: 'Could not find your billing information.' }, { status: 404 });
    }

    const customerId = customerData.customer_id;

    // Define the return URL (where users come back to after managing billing)
    const returnUrl = `${request.headers.get('origin')}/account`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Error creating Stripe portal session:', error);
    return NextResponse.json({ error: error.message || 'Failed to create billing portal session.' }, { status: 500 });
  }
} 