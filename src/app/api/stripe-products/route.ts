import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
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