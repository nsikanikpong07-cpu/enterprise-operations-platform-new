import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentCompany } from '../../../lib/company';
import { sameOrigin } from '../../../lib/origin';

const backend = () => process.env.BACKEND_URL ?? 'http://127.0.0.1:3001';

async function context() {
  const token = (await cookies()).get('enterprise_session')?.value;
  const current = await currentCompany();
  return { token, company: current.company, status: current.status };
}

export async function GET(request: Request) {
  const { token, company, status } = await context();
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  if (!company) return NextResponse.json({ message: 'Company workspace unavailable.' }, { status: status === 200 ? 403 : status });
  const filter = new URL(request.url).searchParams.get('status');
  const params = new URLSearchParams({ companyId: company.id });
  if (filter === 'open' || filter === 'closed') params.set('status', filter);
  try {
    const response = await fetch(`${backend()}/procurement/rfqs?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    return NextResponse.json(await response.json().catch(() => null), { status: response.status });
  } catch { return NextResponse.json({ message: 'RFQ service is unavailable.' }, { status: 503 }); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  const { token, company, status } = await context();
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  if (!company) return NextResponse.json({ message: 'Company workspace unavailable.' }, { status: status === 200 ? 403 : status });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ message: 'Invalid request.' }, { status: 400 });
  try {
    const response = await fetch(`${backend()}/procurement/rfqs?companyId=${encodeURIComponent(company.id)}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store',
    });
    return NextResponse.json(await response.json().catch(() => null), { status: response.status });
  } catch { return NextResponse.json({ message: 'RFQ service is unavailable.' }, { status: 503 }); }
}
