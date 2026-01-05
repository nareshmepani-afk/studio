import { NextResponse } from 'next/server';
import { deleteUser } from '@/actions/deleteUserAction';

export async function GET() {
  const uid = 'pjkbZGEojiffirfAwza50dK4WkM2'; // UID for nareshmepani@gmail.com
  console.log(`API route triggered to delete user: ${uid}`);

  try {
    const result = await deleteUser(uid);
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
