import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { createStripeBillingPortalSession, getOrCreateStripeCustomer } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.uid) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access the billing portal.' },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database connection unavailable.' },
        { status: 500 }
      );
    }

    const userDoc = await adminDb.collection('users').doc(session.uid).get();
    const userData = userDoc.data();
    let customerId = userData?.stripeCustomerId;

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://dev.memoryweaver.studio';

    if (!customerId) {
      if (session.email) {
        customerId = await getOrCreateStripeCustomer({
          uid: session.uid,
          email: session.email,
          displayName: session.displayName,
        });
      } else {
        return NextResponse.json(
          { error: 'No active Stripe billing profile found. Please purchase a pass or vault tier first.' },
          { status: 404 }
        );
      }
    }

    const returnUrl = `${origin}/settings`;
    const portalSession = await createStripeBillingPortalSession({
      customerId,
      returnUrl,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error: any) {
    console.error('Error creating Stripe Billing Portal session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to open billing portal. Please try again.' },
      { status: 500 }
    );
  }
}
