import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const backend = () => process.env.BACKEND_URL ?? 'https://enterprise-operations-platform-new.onrender.com';
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function GET(_request: Request, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params;
  if (!isUuid(photoId)) return NextResponse.json({ message: 'Invalid photo.' }, { status: 400 });
  const token = (await cookies()).get('enterprise_session')?.value;
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  try {
    const response = await fetch(`${backend()}/vendor/me/listing-photos/${encodeURIComponent(photoId)}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    });
    if (!response.ok) return NextResponse.json({ message: 'Photo unavailable.' }, { status: response.status });
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Photo storage is unavailable.' }, { status: 503 });
  }
}
