import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentCompany } from '../../../../lib/company';
import { backendGet } from '../../../../lib/backend';
import { myPermissions } from '../../../../lib/permissions';
import OrderWorkspace from '../../../components/order-workspace';
import styles from '../procurement.module.css';

type RfqOrderDraft = {
  id: string;
  reference: string;
  title: string;
  draft_purchase_order_id?: string | null;
  po_number?: string | null;
};

export default async function OrdersPage() {
  const current = await currentCompany();
  if (current.status === 401) redirect('/login');
  if (!current.company) return <p>Company workspace unavailable.</p>;

  const permissions = await myPermissions();
  const companyId = encodeURIComponent(current.company.id);
  const canCreatePurchaseOrders = permissions.includes('create_purchase_order');
  const canManageRfqs = permissions.includes('create_rfq');
  const [orders, suppliers, requisitions, rfqs] = await Promise.all([
    backendGet(`/procurement/purchase-orders?companyId=${companyId}`),
    canCreatePurchaseOrders
      ? backendGet(`/procurement/eligible-suppliers?companyId=${companyId}`)
      : Promise.resolve({ status: 200, data: [] }),
    canCreatePurchaseOrders
      ? backendGet(`/procurement/requisitions?companyId=${companyId}`)
      : Promise.resolve({ status: 200, data: [] }),
    canManageRfqs
      ? backendGet(`/procurement/rfqs?companyId=${companyId}`)
      : Promise.resolve({ status: 200, data: [] }),
  ]);
  if (orders.status === 401 || rfqs.status === 401) redirect('/login');

  const rfqDrafts = rfqs.status === 200 && Array.isArray(rfqs.data)
    ? (rfqs.data as RfqOrderDraft[]).filter((rfq) => Boolean(rfq.draft_purchase_order_id))
    : [];

  return (
    <section className={styles.page}>
      <Link href="/workspace/procurement">← Back to procurement</Link>
      <h1>Purchase orders</h1>
      <p className={styles.intro}>Create and track orders.</p>
      {orders.status === 200 && suppliers.status === 200 && Array.isArray(orders.data) && Array.isArray(suppliers.data)
        ? <OrderWorkspace canCreate={canCreatePurchaseOrders} orders={orders.data} suppliers={suppliers.data} requisitions={Array.isArray(requisitions.data) ? requisitions.data : []} />
        : <p role="alert">Purchase orders or suppliers could not be loaded.</p>}

      {canManageRfqs && (
        <section className={styles.card} aria-labelledby="rfq-order-drafts">
          <h2 id="rfq-order-drafts">Purchase order drafts from RFQs</h2>
          <p>When you select a quotation, IMPRESSOR prepares a draft here for review. It does not issue the order automatically.</p>
          {rfqs.status !== 200
            ? <p role="alert">RFQ purchase order drafts could not be loaded.</p>
            : rfqDrafts.length === 0
              ? <p>No RFQ purchase order drafts yet.</p>
              : <div className={styles.scroll}>
                  <table>
                    <thead><tr><th>Draft</th><th>Request</th><th>Action</th></tr></thead>
                    <tbody>{rfqDrafts.map((rfq) => (
                      <tr key={rfq.id}>
                        <td>{rfq.po_number}</td>
                        <td>{rfq.reference} · {rfq.title}</td>
                        <td><Link href={`/workspace/procurement/rfqs/${encodeURIComponent(rfq.id)}/purchase-order`}>Review draft</Link></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>}
        </section>
      )}
    </section>
  );
}
