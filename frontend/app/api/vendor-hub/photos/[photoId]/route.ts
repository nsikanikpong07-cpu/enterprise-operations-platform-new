import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentCompany } from '../../../../../lib/company';

export async function GET(_request: Request, context: { params: Promise<{ photoId: string }> }) {
  const token = (await cookies()).get('enterprise_session')?.value;
  if (!token) return new NextResponse('Please sign in.', { status: 401 });
  const current = await currentCompany();
  if (!current.company) return new NextResponse('Company workspace unavailable.', { status: current.status === 200 ? 403 : current.status });
  const { photoId } = await context.params;
  try {
    const response = await fetch(`${process.env.BACKEND_URL ?? 'https://enterprise-operations-platform-new.onrender.com'}/vendor-hub/photos/${encodeURIComponent(photoId)}?companyId=${encodeURIComponent(current.company.id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) return new NextResponse('Photo unavailable.', { status: response.status });
    return new NextResponse(await response.arrayBuffer(), { headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream', 'Cache-Control': 'private, max-age=300' } });
  } catch { return new NextResponse('Vendor Hub service unavailable.', { status: 503 }); }
}
