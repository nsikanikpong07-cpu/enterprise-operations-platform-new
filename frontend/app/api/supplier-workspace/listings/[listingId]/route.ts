import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sameOrigin } from '../../../../../lib/origin';

const backend = () => process.env.BACKEND_URL ?? 'http://127.0.0.1:3001';
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

async function forward(request: Request, listingId: string, method: 'PATCH' | 'DELETE') {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  const token = (await cookies()).get('enterprise_session')?.value;
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  if (!isUuid(listingId)) return NextResponse.json({ message: 'Invalid listing.' }, { status: 400 });
  let body: string | undefined;
  if (method === 'PATCH') {
    let input: unknown;
    try { input = await request.json(); } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
    body = JSON.stringify(input);
  }
  try {
    const response = await fetch(`${backend()}/vendor/me/listings/${encodeURIComponent(listingId)}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body,
      cache: 'no-store',
    });
    const result = await response.json().catch(() => null);
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Supplier service unavailable.' }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  return forward(request, listingId, 'PATCH');
}

export async function DELETE(request: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  return forward(request, listingId, 'DELETE');
}
