import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// Ensure the secret is loaded from environment variables and is of sufficient length
const GUEST_SECRET = new TextEncoder().encode(process.env.GUEST_SESSION_SECRET);

export async function POST() {
  // In a real-world application, this endpoint would be protected and 
  // might verify a purchase or a specific user right before issuing a pass.
  
  try {
    // Create the 6-month Guest Access Pass
    const token = await new SignJWT({ role: 'guest' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('180d') // 180 days
      .sign(GUEST_SECRET);

    const response = NextResponse.json({ success: true, message: "Guest Access Pass created." });

    // Set the pass in an HTTP-only cookie
    response.cookies.set('guest_pass', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 180, // 180 days in seconds
    });

    return response;
  } catch (error) {
    console.error('Error creating guest access pass:', error);
    return NextResponse.json({ success: false, error: 'Could not create guest pass.' }, { status: 500 });
  }
}
