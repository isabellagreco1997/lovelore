import { NextResponse } from 'next/server';
import { syncStripeData } from '@/lib/stripe-sync';

export async function POST(request: Request) {
  try {
    // Add authentication check here
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const result = await syncStripeData();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}