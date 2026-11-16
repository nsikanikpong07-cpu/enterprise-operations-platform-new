import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentCompany } from '../../../../lib/company';
import { sameOrigin } from '../../../../lib/origin';
const backend=()=>process.env.BACKEND_URL??'http://127.0.0.1:3001';
export async function POST(request:Request,context:{params:Promise<{id:string}>}){
 if(!sameOrigin(request))return NextResponse.json({message:'Request origin is not allowed.'},{status:403});
 const token=(await cookies()).get('enterprise_session')?.value;if(!token)return NextResponse.json({message:'Please sign in.'},{status:401});
 const company=await currentCompany();if(company.status!==200||!company.company)return NextResponse.json({message:'Company workspace unavailable.'},{status:company.status===200?403:company.status});
 const {id}=await context.params;if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({message:'Invalid RFQ.'},{status:400});
 let body:Record<string,unknown>;try{const value:unknown=await request.json();if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();body=value as Record<string,unknown>;}catch{return NextResponse.json({message:'Invalid request.'},{status:400});}
 const action=body.action;const path=action==='close'?'close':action==='select'?'select-quote':null;if(!path||(action==='select'&&(typeof body.quoteId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.quoteId))))return NextResponse.json({message:'Invalid RFQ action.'},{status:400});
 try{const response=await fetch(`${backend()}/procurement/rfqs/${encodeURIComponent(id)}/${path}?companyId=${encodeURIComponent(company.company.id)}`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(action==='select'?{quoteId:body.quoteId}:{}),cache:'no-store'});return NextResponse.json(await response.json().catch(()=>null),{status:response.status});}
 catch{return NextResponse.json({message:'RFQ service is unavailable.'},{status:503});}
}
