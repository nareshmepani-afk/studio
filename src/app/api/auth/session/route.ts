import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();
    const session = cookieStore.get('firebase-session')?.value || '';

    if (!session) {
        return NextResponse.json({ isLogged: false }, { status: 200 });
    }

    // TODO: We could add a check here to verify the session with Firebase Admin if needed
    // For now, we'll assume if the cookie exists, the user is logged in on the client-side.

    return NextResponse.json({ isLogged: true }, { status: 200 });
}

export {}; // Add this to ensure it's treated as a module
