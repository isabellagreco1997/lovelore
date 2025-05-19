import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use test keys in development, otherwise use production keys
const secretKey = process.env.NODE_ENV === 'development'
  ? process.env.STRIPE_TEST_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(secretKey!, {
  apiVersion: '2023-10-16'
});

export async function GET() {
  try {
    const prices = await stripe.prices.list({
      expand: ['data.product'],
      active: true
    });

    return NextResponse.json(prices.data);
  } catch (error: any) {
    console.error('Error fetching Stripe products:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}