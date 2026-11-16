import Link from 'next/link';
import { redirect } from 'next/navigation';
import { backendGet } from '../../../../lib/backend';
import styles from '../procurement.module.css';

type Rfq = { id: string; reference: string; title: string; response_deadline: string; status: string; invited_count: number; quotation_count: number; declined_count: number };

export default async function CompanyRfqsPage() {
  const permissions = await import('../../../../lib/permissions').then(module => module.myPermissions());
  if (!permissions.includes('create_rfq')) redirect('/workspace');
  const company = await import('../../../../lib/company').then(module => module.currentCompany());
  if (company.status === 401) redirect('/login');
  if (!company.company) return <section className={styles.page}><h1>Requests for quotation</h1><p>Company workspace unavailable.</p></section>;
  const result = await backendGet(`/procurement/rfqs?companyId=${encodeURIComponent(company.company.id)}`);
  if (result.status === 401) redirect('/login');
  const requests = result.status === 200 && Array.isArray(result.data) ? result.data as Rfq[] : [];
  return <section className={styles.page}>
    <div className={styles.head}><div><p className={styles.eyebrow}>Procurement</p><h1>Requests for quotation</h1><p className={styles.intro}>Invite verified suppliers to quote and review their responses.</p></div><Link className={styles.primaryLink} href="/workspace/procurement/rfqs/new">Create an RFQ</Link></div>
    {result.status !== 200 ? <div className={styles.card}><strong>RFQs could not be loaded.</strong><p>Refresh the page or check your procurement access.</p></div> : requests.length === 0 ? <div className={styles.card}><h2>No RFQs yet</h2><p>Create an RFQ to invite verified suppliers and collect quotations in IMPRESSOR.</p></div> : <div className={styles.scroll}><table><thead><tr><th>Request</th><th>Response deadline</th><th>Status</th><th>Invited</th><th>Quotations</th><th>Action</th></tr></thead><tbody>{requests.map(rfq => <tr key={rfq.id}><td><strong>{rfq.reference}</strong><br />{rfq.title}</td><td>{new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short',timeZone:'Africa/Lagos'}).format(new Date(rfq.response_deadline))} WAT</td><td><span className={rfq.status === 'open' ? styles.statusGood : styles.statusNeutral}>{rfq.status}</span></td><td>{rfq.invited_count}</td><td>{rfq.quotation_count} received · {rfq.declined_count} declined</td><td><Link href={`/workspace/procurement/rfqs/${encodeURIComponent(rfq.id)}`}>Review</Link></td></tr>)}</tbody></table></div>}
  </section>;
}
