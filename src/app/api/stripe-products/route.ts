import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = "force-dynamic";

// Use test keys in development, otherwise use production keys
const secretKey = process.env.NODE_ENV === 'development'
  ? process.env.STRIPE_TEST_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(secretKey!, {
  apiVersion: '2023-10-16'
});

export async function GET() {
  try {
    // Minimal logging
    console.log('Fetching Stripe prices');
    
    const prices = await stripe.prices.list({
      expand: ['data.product'],
      active: true
    });

    // Simple processing to avoid type errors
    const validPrices = prices.data.map(price => {
      const productData = typeof price.product === 'object' ? price.product : null;
      
      return {
        id: price.id,
        active: price.active,
        currency: price.currency,
        unit_amount: price.unit_amount,
        recurring: price.recurring,
        product: {
          id: productData ? productData.id : (price.product as string),
          name: productData ? productData.name : 'Unknown',
          description: productData ? productData.description : null,
          images: productData ? productData.images : [],
          metadata: productData ? productData.metadata : {}
        }
      };
    });

    return NextResponse.json(validPrices);
  } catch (error: any) {
    console.error('Error fetching Stripe products:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}