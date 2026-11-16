'use client';
import { useState } from 'react';
type Notice={id:string;rfq_id:string;title:string;message:string;email_status:string;read_at:string|null;created_at:string};
export default function SupplierRfqNotifications({items}:{items:Notice[]}){
 const [notices,setNotices]=useState(items);const [error,setError]=useState('');
 async function read(id:string){setError('');try{const response=await fetch('/api/supplier-rfq-notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})});if(!response.ok)throw new Error('Could not mark this notification as read.');setNotices(rows=>rows.map(row=>row.id===id?{...row,read_at:new Date().toISOString()}:row));}catch(e){setError(e instanceof Error?e.message:'Could not update notification.');}}
 if(!notices.length)return null;
 return <section className="supplier-rfq-notifications" aria-label="RFQ notifications"><h2>RFQ notifications</h2>{error&&<p role="alert">{error}</p>}{notices.map(notice=><article key={notice.id} data-unread={!notice.read_at}><div><strong>{notice.title}</strong><p>{notice.message}</p><small>Email: {notice.email_status==='sent'?'sent':notice.email_status==='not_available'?'no primary email saved':notice.email_status==='failed'?'delivery failed':'pending'}</small></div>{!notice.read_at&&<button type="button" onClick={()=>read(notice.id)}>Mark read</button>}</article>)}</section>;
}
