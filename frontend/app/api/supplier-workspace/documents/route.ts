import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const backend = () => process.env.BACKEND_URL ?? 'http://127.0.0.1:3001';

async function token() { return (await cookies()).get('enterprise_session')?.value; }

export async function GET() {
  const session = await token();
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  try {
    const response = await fetch(`${backend()}/vendor/me/documents`, {
      headers: { Authorization: `Bearer ${session}` }, cache: 'no-store',
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(response.ok ? data : { message: data?.message ?? 'Could not load certificates.' }, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Verification service unavailable.' }, { status: 503 });
  }
}

