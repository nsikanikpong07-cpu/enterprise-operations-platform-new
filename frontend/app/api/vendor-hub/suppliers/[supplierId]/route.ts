import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentCompany } from '../../../../../lib/company';

export async function GET(_request: Request, context: { params: Promise<{ supplierId: string }> }) {
  const token = (await cookies()).get('enterprise_session')?.value;
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  const current = await currentCompany();
  if (!current.company) return NextResponse.json({ message: 'Company workspace unavailable.' }, { status: current.status === 200 ? 403 : current.status });
  const { supplierId } = await context.params;
  try {
    const response = await fetch(`${process.env.BACKEND_URL ?? 'https://enterprise-operations-platform-new.onrender.com'}/vendor-hub/suppliers/${encodeURIComponent(supplierId)}?companyId=${encodeURIComponent(current.company.id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    return NextResponse.json(await response.json().catch(() => null), { status: response.status });
  } catch { return NextResponse.json({ message: 'Vendor Hub service unavailable.' }, { status: 503 }); }
}
