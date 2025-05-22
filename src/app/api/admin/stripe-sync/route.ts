import { NextResponse } from 'next/server';
import { syncStripeData } from '@/lib/stripe-sync';

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Verify admin key
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Run the sync
    const result = await syncStripeData();
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in stripe-sync endpoint:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Also handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key',
    },
  });
}