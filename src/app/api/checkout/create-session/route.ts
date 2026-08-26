import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createStripeCheckoutSession, CheckoutTier, SupportedCurrency } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.uid || !session?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to initiate checkout.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { tier, currency = 'gbp', returnUrl } = body;

    if (!tier || (tier !== 'director' && tier !== 'generational_vault')) {
      return NextResponse.json(
        { error: 'Invalid or missing tier. Must be "director" or "generational_vault".' },
        { status: 400 }
      );
    }

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://dev.memoryweaver.studio';

    const checkoutSession = await createStripeCheckoutSession({
      uid: session.uid,
      email: session.email,
      displayName: session.displayName || null,
      tier: tier as CheckoutTier,
      currency: (currency.toLowerCase() === 'usd' ? 'usd' : 'gbp') as SupportedCurrency,
      origin,
      returnUrl,
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
