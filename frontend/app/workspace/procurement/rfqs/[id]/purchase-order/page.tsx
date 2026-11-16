import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { backendGet } from '../../../../../../lib/backend';
import { myPermissions } from '../../../../../../lib/permissions';
import styles from '../../../procurement.module.css';

type DraftPo={po_number:string;status:string;total_amount:string;currency:string;proposed_date:string;terms:string;supplier_name:string;items_snapshot:Array<{name:string;item_type:string;quantity:string;unit:string;scope:string;location:string;unit_price:string;line_total:string}>};
export default async function RfqPurchaseOrderPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const permissions=await myPermissions();if(!permissions.includes('create_rfq'))redirect('/workspace');
 const result=await backendGet(`/procurement/rfqs/${encodeURIComponent(id)}/purchase-order`);if(result.status===401)redirect('/login');if(result.status===404||result.data===null)notFound();
 if(result.status!==200||!result.data||typeof result.data!=='object')return <section className={styles.page}><h1>Purchase order draft unavailable</h1><p>Review the RFQ before trying again.</p></section>;
 const po=result.data as DraftPo;
 return <section className={styles.page}><Link href={`/workspace/procurement/rfqs/${encodeURIComponent(id)}`}>← Back to quotations</Link><p className={styles.eyebrow}>RFQ award</p><h1>Purchase order draft</h1><p className={styles.intro}>{po.po_number} · {po.status}</p><article className={styles.card}><h2>{po.supplier_name}</h2><p><strong>Proposed date:</strong> {new Intl.DateTimeFormat('en-NG',{dateStyle:'long'}).format(new Date(po.proposed_date))}</p><p><strong>Total:</strong> {po.currency} {Number(po.total_amount).toLocaleString('en-NG',{minimumFractionDigits:2})}</p><p><strong>Terms:</strong> {po.terms}</p><div className={styles.scroll}><table><thead><tr><th>Item/service</th><th>Qty</th><th>Unit price</th><th>Line total</th><th>Scope</th><th>Location</th></tr></thead><tbody>{po.items_snapshot.map((item,index)=><tr key={index}><td>{item.name}</td><td>{item.quantity} {item.unit}</td><td>{po.currency} {Number(item.unit_price).toLocaleString('en-NG',{minimumFractionDigits:2})}</td><td>{po.currency} {Number(item.line_total).toLocaleString('en-NG',{minimumFractionDigits:2})}</td><td>{item.scope}</td><td>{item.location}</td></tr>)}</tbody></table></div><p>This is a draft prepared from the selected quotation. It is not yet an issued purchase order.</p></article></section>;
}
