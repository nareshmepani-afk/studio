import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/constants';

export async function GET() {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME)?.value || '';

    if (!session) {
        return NextResponse.json({ isLogged: false }, { status: 200 });
    }

    return NextResponse.json({ isLogged: true }, { status: 200 });
}

export async function POST(request: Request) {
  const { uid } = await request.json();

  if (!uid) {
    return NextResponse.json({ error: 'UID is required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, uid, SESSION_COOKIE_OPTIONS);

  return NextResponse.json({ success: true }, { status: 200 });
}
