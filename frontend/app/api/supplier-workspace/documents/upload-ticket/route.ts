import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sameOrigin } from '../../../../../lib/origin';

const backend = () => process.env.BACKEND_URL ?? 'http://127.0.0.1:3001';
const uploadBackend = () => process.env.BACKEND_PUBLIC_URL ?? backend();

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  const session = (await cookies()).get('enterprise_session')?.value;
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });

  try {
    const response = await fetch(`${backend()}/vendor/me/documents/upload-ticket`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) return NextResponse.json({ message: data?.message ?? 'Could not prepare certificate upload.' }, { status: response.status });
    const uploadBase = new URL(uploadBackend());
    if (process.env.NODE_ENV === 'production' && uploadBase.protocol !== 'https:') {
      return NextResponse.json({ message: 'Secure direct uploads are not configured. Set BACKEND_PUBLIC_URL to the HTTPS API address.' }, { status: 503 });
    }
    return NextResponse.json({
      ticket: data.ticket,
      expiresInSeconds: data.expiresInSeconds,
      uploadUrl: `${uploadBase.origin}${uploadBase.pathname.replace(/\/$/, '')}/vendor/document-uploads`,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'Certificate upload service unavailable.' }, { status: 503 });
  }
}
