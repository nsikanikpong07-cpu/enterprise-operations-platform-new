'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

type Rfq = {
  id: string; reference: string; title: string; buyer: string; response_deadline: string; status: string;
  response_status?: string | null;
  items: Array<{ id: string; name: string; type: string; quantity: number; unit: string; scope: string; location: string }>;
};

export default function SupplierRfqResponse({ data }: { data: Rfq }) {
  const [itemPrices,setItemPrices]=useState<Record<string,string>>({});
  const [currency, setCurrency] = useState('NGN');
  const [proposedDate, setProposedDate] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const deadline = new Date(data.response_deadline);
  const closed = data.status !== 'open' || deadline <= new Date();
  const quoteTotal=data.items.reduce((sum,item)=>sum+(Number(item.quantity)*Number(itemPrices[item.id]||0)),0);

  async function send(event: FormEvent<HTMLFormElement>, action: 'submit' | 'decline') {
    event.preventDefault(); setMessage(''); setBusy(true);
    try {
      const response = await fetch(`/api/supplier-rfqs/${encodeURIComponent(data.id)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'decline' ? { action, reason } : { action, currency, total: quoteTotal, items:data.items.map(item=>({itemId:item.id,unitPrice:Number(itemPrices[item.id])})), proposedDate, terms, notes }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || 'The response could not be saved.');
      setMessage(action === 'decline' ? 'You declined this request. The buyer has been notified in IMPRESSOR.' : 'Your quotation has been submitted.');
      window.location.reload();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'The response could not be saved.'); }
    finally { setBusy(false); }
  }

  return <section className="supplier-rfq-page supplier-rfq-detail">
    <Link className="supplier-dashboard-link" href="/supplier-workspace/requests">← Requests for quotation</Link>
    <header className="supplier-page-heading"><h1>Request for quotation</h1><p>{data.reference} · {closed ? 'Closed' : 'Open'}</p></header>
    <div className="supplier-rfq-deadline"><span aria-hidden="true">▣</span> Response deadline: <strong>{new Intl.DateTimeFormat('en-NG', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Lagos' }).format(deadline)} WAT</strong></div>
    {!closed && <aside className="supplier-rfq-tip"><strong>Respond promptly</strong><p>Submit your quotation as early as possible. The buyer may close this request before the deadline and select a supplier.</p></aside>}
    {closed && <aside className="supplier-rfq-notice"><p>This request is closed. You can no longer submit a quotation or decline it.</p></aside>}
    {message && <p className="supplier-rfq-feedback" role="status">{message}</p>}
    <div className="supplier-rfq-detail-grid">
      <section className="supplier-rfq-panel"><h2>Request summary</h2><p><strong>Buyer</strong><span>{data.buyer}</span></p>{data.items.map(item => <article className="supplier-rfq-item" key={item.id}><h3>{item.name} <small>{item.type}</small></h3><p>Location: {item.location}</p><p>Quantity: {item.quantity} {item.unit}</p><p>{item.scope}</p></article>)}</section>
      <section className="supplier-rfq-panel"><h2>Your quotation</h2>{data.response_status === 'submitted' ? <p>Your quotation has been submitted. Contact the buyer through your registered RFQ contact if you need to clarify anything.</p> : data.response_status === 'declined' ? <p>You declined to quote on this request.</p> : closed ? <p>This RFQ is closed.</p> : <form className="supplier-rfq-form" onSubmit={(event) => send(event, 'submit')}>
        <label>Currency<select value={currency} onChange={event => setCurrency(event.target.value)}><option value="NGN">NGN – Nigerian Naira</option><option value="USD">USD – US Dollar</option><option value="GBP">GBP – Pound Sterling</option><option value="EUR">EUR – Euro</option></select></label>
        {data.items.map(item=><label key={item.id}>Price per {item.unit} — {item.name}<input type="number" min="0.01" step="0.01" value={itemPrices[item.id]??''} onChange={event=>setItemPrices(values=>({...values,[item.id]:event.target.value}))} required /></label>)}
        <div className="supplier-rfq-total"><span>Quotation total</span><strong>{currency} {quoteTotal.toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div>
        <label>Proposed start or delivery date<input type="date" value={proposedDate} onChange={event => setProposedDate(event.target.value)} required /></label>
        <label>Terms<textarea value={terms} onChange={event => setTerms(event.target.value)} maxLength={2000} required placeholder="Include what the price covers, service conditions and payment terms." /></label>
        <label>Notes (optional)<textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={1000} /></label>
        <div className="supplier-rfq-actions"><button type="button" className="supplier-rfq-secondary" onClick={() => setDeclineOpen(value => !value)}>Decline to quote</button><button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit quotation'}</button></div>
      </form>}
      {declineOpen && !closed && !data.response_status && <form className="supplier-rfq-decline" onSubmit={event => send(event, 'decline')}><label>Why can’t you quote? <textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} required placeholder="Briefly explain why you cannot meet this request." /></label><button type="submit" disabled={busy}>{busy ? 'Sending…' : 'Confirm decline'}</button></form>}
      </section>
    </div>
  </section>;
}
