'use client';

import { useMemo, useState } from 'react';
import styles from './vendor-hub.module.css';

type Listing = { id: string; name: string; category: string; description?: string; pricingModel: string; price?: string | number | null; currency?: string; unit?: string; photos?: string[]; specifications?: string; dimensions?: string; serviceArea?: string };
type Supplier = { id: string; name: string; legalName?: string; registrationNumber?: string; supplierType?: string; countryCode?: string; verificationStatus?: string; verificationExpiresAt?: string; offerings?: Listing[] };
type Relationship = { profileId: string; supplierId: string; supplierCode?: string; name: string; legalName?: string; platformVerification: string; verificationExpiresAt?: string; relationshipStatus: string; notes?: string; onboardingStatus?: string };
type PageData<T> = { items: T[]; total: number; page: number; pageSize: number };

const priceLabel = (item: Listing) => item.pricingModel === 'price_on_request' || item.price == null ? 'Price on request' : `${item.currency ?? 'NGN'} ${Number(item.price).toLocaleString()}${item.unit ? ` / ${item.unit}` : ''}`;
const labelClass = (text: string) => `${styles.status} ${text === 'prospective' ? styles.prospective : ['suspended','blocked','expired'].includes(text) ? styles.suspended : text === 'unverified' ? styles.unverified : styles.active}`;

export default function VendorHubWorkspace({ mode, initial }: { mode: 'hub' | 'suppliers'; initial: PageData<Supplier> | PageData<Relationship> }) {
  const [data, setData] = useState(initial);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState<Relationship | null>(null);
  const [page, setPage] = useState(1);
  const list = data.items as (Supplier | Relationship)[];

  async function load(nextPage = 1) {
    setBusy('load'); setMessage('');
    const params = new URLSearchParams({ page: String(nextPage), pageSize: '10' });
    if (search.trim()) params.set('search', search.trim());
    if (mode === 'hub') { if (category) params.set('category', category); if (location) params.set('location', location); }
    else { params.set('view', 'my-suppliers'); if (relationshipStatus) params.set('relationshipStatus', relationshipStatus); }
    const response = await fetch(`/api/vendor-hub?${params}`, { cache: 'no-store' });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.items) setMessage(result?.message ?? 'Could not load suppliers.');
    else { setData(result); setPage(nextPage); }
    setBusy(null);
  }

  async function add(supplierId: string) {
    setBusy(supplierId); setMessage('');
    const response = await fetch('/api/vendor-hub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplierId }) });
    const result = await response.json().catch(() => null);
    setMessage(response.ok ? (result?.alreadyAdded ? 'This supplier is already on your list.' : 'Supplier added to My suppliers as Prospective.') : result?.message ?? 'Could not add supplier.');
    setBusy(null);
  }

  async function openDetails(supplierId: string) {
    setBusy(supplierId); setMessage('');
    const response = await fetch(`/api/vendor-hub/suppliers/${encodeURIComponent(supplierId)}`);
    const result = await response.json().catch(() => null);
    if (response.ok) setDetails(result); else setMessage(result?.message ?? 'Supplier details are unavailable.');
    setBusy(null);
  }

  async function saveRelationship(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return;
    setBusy(editing.profileId); setMessage('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/vendor-hub', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: editing.profileId, supplierCode: String(form.get('supplierCode') ?? '').trim() || undefined, relationshipStatus: String(form.get('relationshipStatus')), notes: String(form.get('notes') ?? '') }) });
    const result = await response.json().catch(() => null);
    if (!response.ok) setMessage(result?.message ?? 'Could not update supplier relationship.');
    else { setEditing(null); await load(page); setMessage('Supplier relationship updated.'); }
    setBusy(null);
  }

  const maxPage = Math.max(1, Math.ceil(data.total / data.pageSize));
  const visible = useMemo(() => list, [list]);
  return <div className={styles.page}>
    <header className={styles.head}><div><p className={styles.eyebrow}>{mode === 'hub' ? 'Company workspace' : 'Supplier relationships'}</p><h1>{mode === 'hub' ? 'Vendor Hub' : 'My suppliers'}</h1><p className={styles.intro}>{mode === 'hub' ? 'Discover suppliers approved for the platform.' : 'Manage your company’s relationships with suppliers.'}</p></div>{mode === 'suppliers' && <a className={styles.primary} href="/workspace/vendor-hub">⌕ &nbsp; Find suppliers</a>}</header>
    {mode === 'suppliers' && <div className={styles.notice}>Company relationship status does not change platform verification.</div>}
    <div className={styles.filters}><input aria-label="Search suppliers" placeholder={mode === 'hub' ? 'Search suppliers or products' : 'Search by name or supplier code'} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if(e.key==='Enter') void load(1); }} /><select aria-label={mode === 'hub' ? 'Category' : 'Relationship status'} value={mode === 'hub' ? category : relationshipStatus} onChange={e => mode === 'hub' ? setCategory(e.target.value) : setRelationshipStatus(e.target.value)}>{mode === 'hub' ? <><option value="">All categories</option><option>Products</option><option>Services</option><option>Office & Stationery</option><option>Cleaning & Facilities Services</option></> : <><option value="">All relationship statuses</option>{['prospective','active','suspended','blocked','inactive'].map(x=><option key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</option>)}</>}</select>{mode === 'hub' && <input aria-label="Location" placeholder="All locations" value={location} onChange={e=>setLocation(e.target.value)} />}</div>
    <div className={styles.actionRow}><button className={styles.secondary} onClick={()=>void load(1)} disabled={busy==='load'}>{busy==='load'?'Searching…':'Search'}</button></div>
    {message && <p className={styles.feedback} role="status">{message}</p>}
    {mode === 'hub' ? <div className={styles.cards}>{visible.map((raw) => { const supplier = raw as Supplier; return <article className={styles.vendorCard} key={supplier.id}><div className={styles.identity}><span className={styles.mark} aria-hidden="true">▤</span><div><h2>{supplier.name}</h2><p className={styles.muted}>⌑ &nbsp;{supplier.supplierType ?? 'Supplier'}</p><p className={styles.muted}>⌖ &nbsp;{supplier.countryCode ?? 'Location not provided'}</p><span className={styles.verified}>✓ &nbsp;Platform verified</span></div></div><div className={styles.offerings}><p className={styles.offeringsTitle}>Sample offerings</p>{(supplier.offerings ?? []).map(item=><div className={styles.offer} key={item.id}>{item.photos?.[0] ? <img className={styles.thumb} src={`/api/vendor-hub/photos/${encodeURIComponent(item.photos[0])}`} alt="" /> : <span className={styles.thumb} aria-hidden="true"/>}<div className={styles.offerText}><p className={styles.offerName}>{item.name}</p><p className={styles.price}>{priceLabel(item)}</p></div></div>)}</div><div className={styles.actionRow}><button className={styles.secondary} onClick={()=>void openDetails(supplier.id)} disabled={!!busy}>View supplier →</button><button className={styles.primary} onClick={()=>void add(supplier.id)} disabled={!!busy}>{busy===supplier.id?'Adding…':'Add supplier'}</button></div></article>; })}{!visible.length && <div className={styles.panel+' '+styles.empty}>No verified suppliers matched your search.</div>}</div> : <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>Supplier</th><th>Supplier code</th><th>Platform verification</th><th>Relationship</th><th>Action</th></tr></thead><tbody>{visible.map(raw=>{const supplier=raw as Relationship;return <tr key={supplier.profileId}><td><strong>{supplier.name}</strong></td><td>{supplier.supplierCode ?? '—'}</td><td><span className={labelClass(supplier.platformVerification)}>{supplier.platformVerification==='verified'?'✓ Verified':supplier.platformVerification==='expired'?'! Verification expired':'! Unverified'}</span></td><td><span className={labelClass(supplier.relationshipStatus)}>{supplier.relationshipStatus}</span></td><td><button className={styles.outline} onClick={()=>setEditing(supplier)}>Edit relationship</button></td></tr>;})}</tbody></table>{!visible.length && <div className={styles.empty}>No suppliers have been added to your company list yet. Find suppliers in Vendor Hub.</div>}</div>}
    <div className={styles.pagination}><span>Showing {data.total ? (page-1)*data.pageSize+1 : 0}–{Math.min(page*data.pageSize,data.total)} of {data.total} suppliers</span><div className={styles.actionRow}><button onClick={()=>void load(Math.max(1,page-1))} disabled={page<=1||!!busy}>Previous</button><span>Page {page} of {maxPage}</span><button onClick={()=>void load(Math.min(maxPage,page+1))} disabled={page>=maxPage||!!busy}>Next</button></div></div>
    {details && <div className={styles.modalBackdrop} role="presentation" onClick={()=>setDetails(null)}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="supplier-dialog-title" onClick={e=>e.stopPropagation()}><header className={styles.modalHeader}><div><p className={styles.eyebrow}>Verified supplier</p><h2 id="supplier-dialog-title">{(details.supplier as Supplier)?.name}</h2></div><button aria-label="Close supplier details" onClick={()=>setDetails(null)}>×</button></header><p className={styles.muted}>Registration number: {(details.supplier as Supplier)?.registrationNumber ?? 'Not provided'} · Verification valid until {new Date(String((details.supplier as Supplier)?.verificationExpiresAt)).toLocaleDateString()}</p><h3>Products and services</h3><div className={styles.cards}>{((details.offerings as Listing[])??[]).map(item=><article className={styles.panel} key={item.id}><h3>{item.name}</h3><p>{item.description}</p><p className={styles.price}>{priceLabel(item)}</p>{item.specifications&&<p>Specifications: {item.specifications}</p>}{item.dimensions&&<p>Dimensions: {item.dimensions}</p>}{item.serviceArea&&<p>Service area: {item.serviceArea}</p>}</article>)}</div><p className={styles.muted}>Platform review does not replace your company’s own supplier checks.</p></section></div>}
    {editing && <div className={styles.modalBackdrop}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="edit-relationship-title"><header className={styles.modalHeader}><h2 id="edit-relationship-title">Edit supplier relationship</h2><button aria-label="Close" onClick={()=>setEditing(null)}>×</button></header><p className={styles.muted}>{editing.name} · Platform verification: {editing.platformVerification}</p><form className={styles.edit} onSubmit={saveRelationship}><label>Supplier code<input name="supplierCode" defaultValue={editing.supplierCode??''} maxLength={100}/></label><label>Relationship status<select name="relationshipStatus" defaultValue={editing.relationshipStatus}>{['prospective','active','suspended','blocked','inactive'].map(x=><option key={x}>{x}</option>)}</select></label><label>Company notes<textarea name="notes" defaultValue={editing.notes??''} rows={4} maxLength={2000}/></label><div className={styles.actionRow}><button className={styles.primary} disabled={!!busy}>{busy?'Saving…':'Save changes'}</button><button className={styles.secondary} type="button" onClick={()=>setEditing(null)}>Cancel</button></div></form></section></div>}
  </div>;
}
