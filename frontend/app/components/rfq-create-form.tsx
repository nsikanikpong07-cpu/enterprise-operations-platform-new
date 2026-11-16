'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import styles from '../workspace/procurement/procurement.module.css';

type Line = { name: string; type: 'product'|'service'; quantity: string; unit: string; scope: string; location: string };
export default function RfqCreateForm({ suppliers }: { suppliers: Array<{id:string;name:string}> }) {
  const router = useRouter();
  const [supplierResults,setSupplierResults]=useState(suppliers);
  const [supplierSearch,setSupplierSearch]=useState('');
  const [selectedNames,setSelectedNames]=useState<Record<string,string>>({});
  const [searchBusy,setSearchBusy]=useState(false);
  const [lines,setLines]=useState<Line[]>([{name:'',type:'product',quantity:'1',unit:'unit',scope:'',location:''}]);
  const [title,setTitle]=useState(''); const [deadline,setDeadline]=useState(''); const [selected,setSelected]=useState<string[]>([]);
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  useEffect(()=>{
    const timer=setTimeout(async()=>{
      setSearchBusy(true);
      try{
        const params=new URLSearchParams({page:'1',pageSize:'50'});
        if(supplierSearch.trim())params.set('search',supplierSearch.trim());
        const response=await fetch(`/api/vendor-hub?${params}`,{cache:'no-store'});
        const result=await response.json().catch(()=>null);
        if(response.ok&&Array.isArray(result?.items))setSupplierResults(result.items.map((item:{id:string;name:string})=>({id:item.id,name:item.name})));
      }catch{/* Keep the last supplier results if search is temporarily unavailable. */}
      finally{setSearchBusy(false);}
    },250);
    return ()=>clearTimeout(timer);
  },[supplierSearch]);
  function toggle(id:string){setSelected(values=>values.includes(id)?values.filter(value=>value!==id):[...values,id]);}
  function updateLine(index:number, change:Partial<Line>){setLines(values=>values.map((value,i)=>i===index?{...value,...change}:value));}
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError('');try{
    const response=await fetch('/api/rfqs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title,responseDeadline:new Date(deadline).toISOString(),items:lines.map(item=>({...item,quantity:Number(item.quantity)})),supplierIds:selected})});
    const result=await response.json().catch(()=>null); if(!response.ok) throw new Error(result?.message||'RFQ could not be created.');
    router.push('/workspace/procurement/rfqs');router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'RFQ could not be created.');}finally{setBusy(false);}}
  return <section className={styles.page}>
    <Link href="/workspace/procurement/rfqs">← Requests for quotation</Link><p className={styles.eyebrow}>Procurement</p><h1>Create request for quotation</h1><p className={styles.intro}>Invite verified suppliers to quote for products or services.</p>
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.card}><h2>Request details</h2><label>RFQ title<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={200} required /></label><label>Response deadline<input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} required /></label></div>
      <div className={styles.card}><h2>Items and services</h2>{lines.map((line,index)=><fieldset key={index} style={{border:'0',borderTop:index?'1px solid #e5e2da':'0',padding:'16px 0',margin:'0'}}><legend>Line {index+1}</legend><label>Item or service name<input value={line.name} onChange={e=>updateLine(index,{name:e.target.value})} maxLength={255} required /></label><div className={styles.filters}><label>Type<select value={line.type} onChange={e=>updateLine(index,{type:e.target.value as Line['type']})}><option value="product">Product</option><option value="service">Service</option></select></label><label>Quantity<input type="number" min="0.001" step="0.001" value={line.quantity} onChange={e=>updateLine(index,{quantity:e.target.value})} required /></label><label>Unit<input value={line.unit} onChange={e=>updateLine(index,{unit:e.target.value})} maxLength={80} required /></label></div><label>Scope or specifications<textarea value={line.scope} onChange={e=>updateLine(index,{scope:e.target.value})} required /></label><label>Delivery or service location<input value={line.location} onChange={e=>updateLine(index,{location:e.target.value})} maxLength={255} required /></label>{lines.length>1&&<button type="button" onClick={()=>setLines(values=>values.filter((_,i)=>i!==index))}>Remove line</button>}</fieldset>)}<button type="button" onClick={()=>setLines(values=>values.length>=100?values:[...values,{name:'',type:'product',quantity:'1',unit:'unit',scope:'',location:''}])}>＋ Add item or service</button></div>
      <div className={styles.card}><h2>Invite suppliers</h2><p>Only currently verified suppliers with published offerings are listed.</p><label>Search suppliers<input value={supplierSearch} onChange={event=>setSupplierSearch(event.target.value)} placeholder="Search by supplier or offering" /></label>{selected.length>0&&<p><strong>Selected:</strong> {selected.map(id=>selectedNames[id]??supplierResults.find(supplier=>supplier.id===id)?.name??'Supplier').join(', ')}</p>}{searchBusy&&<p role="status">Searching verified suppliers…</p>}{supplierResults.length ? <div className={styles.form}>{supplierResults.map(supplier=><label key={supplier.id}><span><input type="checkbox" checked={selected.includes(supplier.id)} onChange={()=>{setSelectedNames(names=>({...names,[supplier.id]:supplier.name}));toggle(supplier.id);}} /> {supplier.name}</span></label>)}</div> : <p>No eligible verified suppliers match this search.</p>}</div>
      {error&&<p className={styles.statusBad} role="alert">{error}</p>}<button className={styles.primaryLink} type="submit" disabled={busy||!selected.length}>{busy?'Creating…':'Send RFQ invitations'}</button>
    </form>
  </section>;
}
