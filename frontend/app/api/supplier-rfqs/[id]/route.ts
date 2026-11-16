import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sameOrigin } from '../../../../lib/origin';

const backend = () => process.env.BACKEND_URL ?? 'http://127.0.0.1:3001';
const validId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ message: 'Request origin is not allowed.' }, { status: 403 });
  const token = (await cookies()).get('enterprise_session')?.value;
  if (!token) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  const { id } = await context.params;
  if (!validId(id)) return NextResponse.json({ message: 'Invalid RFQ.' }, { status: 400 });
  let body: Record<string, unknown>;
  try { const parsed: unknown = await request.json(); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); body = parsed as Record<string, unknown>; }
  catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }
  const action = body.action;
  const path = action === 'decline' ? 'decline' : action === 'submit' ? 'quotation' : null;
  if (!path) return NextResponse.json({ message: 'Choose a quotation action.' }, { status: 400 });
  const payload = { ...body }; delete payload.action;
  try {
    const response = await fetch(`${backend()}/procurement/rfqs/supplier/${encodeURIComponent(id)}/${path}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), cache: 'no-store',
    });
    return NextResponse.json(await response.json().catch(() => null), { status: response.status });
  } catch { return NextResponse.json({ message: 'RFQ service is unavailable. Try again.' }, { status: 503 }); }
}
