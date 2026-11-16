import { notFound, redirect } from 'next/navigation';
import { backendGet } from '../../../../lib/backend';
import SupplierRfqResponse from '../../../components/supplier-rfq-response';

export default async function SupplierRfqDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await backendGet(`/procurement/rfqs/supplier/${encodeURIComponent(id)}`);
  if (result.status === 401) redirect('/login');
  if (result.status === 404) notFound();
  if (result.status !== 200 || !result.data || typeof result.data !== 'object') return <section className="supplier-rfq-page"><h1>Request unavailable</h1><p>We could not load this invitation. Please refresh the page.</p></section>;
  return <SupplierRfqResponse data={result.data as never} />;
}
