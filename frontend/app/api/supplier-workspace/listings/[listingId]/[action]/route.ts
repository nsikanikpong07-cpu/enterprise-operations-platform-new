import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sameOrigin } from '../../../../../../lib/origin';

const backend = () => process.env.BACKEND_URL ?? 'https://enterprise-operations-platform-new.onrender.com';
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: Request, { params }: { params: Promise<{ listingId: string; action: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  const token = (await cookies()).get('enterprise_session')?.value;
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  const { listingId, action } = await params;
  if (!isUuid(listingId) || !['publish', 'unpublish', 'draft'].includes(action)) {
    return NextResponse.json({ message: 'Invalid listing action.' }, { status: 400 });
  }
  try {
    const response = await fetch(`${backend()}/vendor/me/listings/${encodeURIComponent(listingId)}/${action}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const result = await response.json().catch(() => null);
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Supplier service unavailable.' }, { status: 503 });
  }
}
