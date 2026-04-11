import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hostId = searchParams.get('hostId');

  if (!hostId || !adminAuth) {
     return NextResponse.json({ error: "No hostId or admin service available." }, { status: 400 });
  }

  try {
     // Mint a custom token for the Host's UID, essentially making the phone "the Host"
     // This allows it to bypass any Firebase Security Rules limited to the owner.
     const customToken = await adminAuth.createCustomToken(hostId, {
        role: 'interviewer_guest',
        host_access: true,
     });

     return NextResponse.json({ token: customToken });
  } catch (error) {
     console.error("Failed to mint Guest Token:", error);
     return NextResponse.json({ error: "Failed to securely mint guest token." }, { status: 500 });
  }
}
