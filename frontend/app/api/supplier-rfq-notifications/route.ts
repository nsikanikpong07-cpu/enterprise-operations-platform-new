import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sameOrigin } from '../../../lib/origin';
const backend=()=>process.env.BACKEND_URL??'http://127.0.0.1:3001';
export async function GET(){
  const token=(await cookies()).get('enterprise_session')?.value;
  if(!token)return NextResponse.json({message:'Please sign in.'},{status:401});
  try{const response=await fetch(`${backend()}/procurement/rfqs/supplier/notifications`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});return NextResponse.json(await response.json().catch(()=>null),{status:response.status});}
  catch{return NextResponse.json({message:'Notifications are unavailable.'},{status:503});}
}
export async function POST(request:Request){
  if(!sameOrigin(request))return NextResponse.json({message:'Request origin is not allowed.'},{status:403});
  const token=(await cookies()).get('enterprise_session')?.value;if(!token)return NextResponse.json({message:'Please sign in.'},{status:401});
  let body:unknown;try{body=await request.json();}catch{return NextResponse.json({message:'Invalid request.'},{status:400});}
  const id=body&&typeof body==='object'&&!Array.isArray(body)?(body as Record<string,unknown>).id:null;
  if(typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({message:'Invalid notification.'},{status:400});
  try{const response=await fetch(`${backend()}/procurement/rfqs/supplier/notifications/${encodeURIComponent(id)}/read`,{method:'POST',headers:{Authorization:`Bearer ${token}`},cache:'no-store'});return NextResponse.json(await response.json().catch(()=>null),{status:response.status});}
  catch{return NextResponse.json({message:'Notifications are unavailable.'},{status:503});}
}
