import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentCompany } from '../../../lib/company';
import { sameOrigin } from '../../../lib/origin';

const backend = () => process.env.BACKEND_URL ?? 'https://enterprise-operations-platform-new.onrender.com';

async function auth() {
  const token = (await cookies()).get('enterprise_session')?.value;
  const current = await currentCompany();
  return { token, current };
}

export async function GET(request: Request) {
  const { token, current } = await auth();
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  if (!current.company) return NextResponse.json({ message: 'Company workspace unavailable.' }, { status: current.status === 200 ? 403 : current.status });
  const incoming = new URL(request.url);
  const params = new URLSearchParams(incoming.searchParams);
  params.set('companyId', current.company.id);
  const view = params.get('view');
  params.delete('view');
  const path = view === 'my-suppliers' ? '/vendor-hub/my-suppliers' : '/vendor-hub';
  try {
    const response = await fetch(`${backend()}${path}?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    return NextResponse.json(await response.json().catch(() => null), { status: response.status });
  } catch { return NextResponse.json({ message: 'Vendor Hub service unavailable.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  const { token, current } = await auth();
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  if (!current.company) return NextResponse.json({ message: 'Company workspace unavailable.' }, { status: current.status === 200 ? 403 : current.status });
  let body: { supplierId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }
  if (typeof body.supplierId !== 'string') return NextResponse.json({ message: 'Select a supplier.' }, { status: 400 });
  try {
    const response = await fetch(`${backend()}/vendor-hub/suppliers/${encodeURIComponent(body.supplierId)}?companyId=${encodeURIComponent(current.company.id)}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    return NextResponse.json(await response.json().catch(() => null), { status: response.status });
  } catch { return NextResponse.json({ message: 'Vendor Hub service unavailable.' }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  const { token, current } = await auth();
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  if (!current.company) return NextResponse.json({ message: 'Company workspace unavailable.' }, { status: current.status === 200 ? 403 : current.status });
  let body: { profileId?: unknown; supplierCode?: unknown; relationshipStatus?: unknown; notes?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }
  if (typeof body.profileId !== 'string') return NextResponse.json({ message: 'Supplier relationship is required.' }, { status: 400 });
  const { profileId, ...changes } = body;
  try {
    const response = await fetch(`${backend()}/vendor-hub/relationships/${encodeURIComponent(profileId)}?companyId=${encodeURIComponent(current.company.id)}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(changes), cache: 'no-store' });
    return NextResponse.json(await response.json().catch(() => null), { status: response.status });
  } catch { return NextResponse.json({ message: 'Vendor Hub service unavailable.' }, { status: 503 }); }
}
