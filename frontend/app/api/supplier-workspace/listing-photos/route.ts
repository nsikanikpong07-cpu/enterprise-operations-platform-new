import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sameOrigin } from '../../../../lib/origin';

const backend = () => process.env.BACKEND_URL ?? 'https://enterprise-operations-platform-new.onrender.com';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  const token = (await cookies()).get('enterprise_session')?.value;
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  let source: FormData;
  try { source = await request.formData(); } catch { return NextResponse.json({ message: 'Choose an image file.' }, { status: 400 }); }
  const file = source.get('file');
  if (!(file instanceof File)) return NextResponse.json({ message: 'Choose an image file.' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ message: 'Choose a photo up to 5 MB.' }, { status: 413 });
  const body = new FormData();
  body.append('file', file, file.name);
  try {
    const response = await fetch(`${backend()}/vendor/me/listing-photos`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body, cache: 'no-store',
    });
    const result = await response.json().catch(() => null);
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ message: 'Photo storage is unavailable.' }, { status: 503 });
  }
}
