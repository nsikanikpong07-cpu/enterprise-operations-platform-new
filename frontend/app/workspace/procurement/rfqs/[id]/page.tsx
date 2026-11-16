import { notFound, redirect } from 'next/navigation';
import { backendGet } from '../../../../../lib/backend';
import { currentCompany } from '../../../../../lib/company';
import { myPermissions } from '../../../../../lib/permissions';
import RfqComparison from '../../../../components/rfq-comparison';

export default async function RfqComparisonPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const permissions=await myPermissions();if(!permissions.includes('create_rfq'))redirect('/workspace');
 const company=await currentCompany();if(company.status===401)redirect('/login');if(!company.company)notFound();
 const [list,quotesResult]=await Promise.all([backendGet(`/procurement/rfqs?companyId=${encodeURIComponent(company.company.id)}`),backendGet(`/procurement/rfqs/${encodeURIComponent(id)}/quotations`)]);
 if(list.status===401||quotesResult.status===401)redirect('/login');
 const requests=list.status===200&&Array.isArray(list.data)?list.data as Array<{id:string;reference:string;title:string;status:string;response_deadline:string;draft_purchase_order_id?:string|null;po_number?:string|null}>:[];
 const rfq=requests.find(item=>item.id===id);if(!rfq)notFound();
 if(quotesResult.status!==200||!Array.isArray(quotesResult.data))return <section><h1>Quotations unavailable</h1><p>Refresh the page and try again.</p></section>;
 return <RfqComparison rfq={rfq} quotes={quotesResult.data as never[]} purchaseOrderId={rfq.draft_purchase_order_id}/>;
}
