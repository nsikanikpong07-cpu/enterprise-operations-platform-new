import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const backend = () => process.env.BACKEND_URL ?? 'http://127.0.0.1:3001';
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function GET(_request: Request, context: { params: Promise<{ caseId: string; documentId: string }> }) {
  const { caseId, documentId } = await context.params;
  if (!isUuid(caseId) || !isUuid(documentId)) return NextResponse.json({ message: 'Invalid document reference.' }, { status: 400 });
  const session = (await cookies()).get('enterprise_session')?.value;
  if (!session) return NextResponse.json({ message: 'Please sign in.' }, { status: 401 });
  try {
    const response = await fetch(`${backend()}/vendor/verification/cases/${caseId}/documents/${documentId}/file`, {
      headers: { Authorization: `Bearer ${session}` }, cache: 'no-store',
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return NextResponse.json({ message: data?.message ?? 'Certificate could not be loaded.' }, { status: response.status });
    }
    return new NextResponse(await response.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/octet-stream',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Certificate service unavailable.' }, { status: 503 });
  }
}
