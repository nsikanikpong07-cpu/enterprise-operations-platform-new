import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "../../../lib/origin";
import { currentCompany } from "../../../lib/company";

const backend = () => process.env.BACKEND_URL ?? "https://enterprise-operations-platform-new.onrender.com";
const valid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
async function token() { return (await cookies()).get("enterprise_session")?.value; }
export async function GET(request: Request) {
  const session = await token(); if (!session) return NextResponse.json({message:"Please sign in."},{status:401});
  const caseId = new URL(request.url).searchParams.get("caseId");
  if (valid(caseId)) {
    try { const response=await fetch(`${backend()}/vendor/verification/cases/${encodeURIComponent(caseId)}/documents`,{headers:{Authorization:`Bearer ${session}`},cache:"no-store"});const data=await response.json().catch(()=>null);return NextResponse.json(response.ok?data:{message:data?.message??"Could not load certificate documents."},{status:response.status}); }
    catch { return NextResponse.json({message:"Verification service unavailable."},{status:503}); }
  }
  const profileId = new URL(request.url).searchParams.get("profileId");
  if (!valid(profileId)) return NextResponse.json({message:"Invalid supplier profile."},{status:400});
  try { const response=await fetch(`${backend()}/vendor/verification/cases?profileId=${encodeURIComponent(profileId)}`,{headers:{Authorization:`Bearer ${session}`},cache:"no-store"});const data=await response.json().catch(()=>null);return NextResponse.json(response.ok?data:{message:data?.message??"Could not load verification cases."},{status:response.status}); }
  catch {return NextResponse.json({message:"Verification service unavailable."},{status:503});}
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({message:"Request origin is not allowed."},{status:403});
  const session = await token(); if (!session) return NextResponse.json({message:"Please sign in."},{status:401});
  let input: Record<string, unknown>;try { const value:unknown=await request.json();if(!value||typeof value!=="object"||Array.isArray(value))throw Error();input=value as Record<string,unknown>; } catch { return NextResponse.json({message:"Invalid request."},{status:400}); }
  let url:string;let method:string;let body:Record<string,unknown>;
  if(input.action==="ocr"&&valid(input.caseId)&&valid(input.documentId)){url=`/vendor/verification/cases/${encodeURIComponent(input.caseId)}/documents/${encodeURIComponent(input.documentId)}/ocr`;method="POST";body={};}
  else if(input.action==="onboard"&&valid(input.supplierId)){const current=await currentCompany();if(!current.company)return NextResponse.json({message:"Company workspace unavailable."},{status:current.status===200?403:current.status});url="/vendor/suppliers/onboard";method="POST";body={companyId:current.company.id,supplierId:input.supplierId};}
  else if(input.action==="open"&&valid(input.profileId)&&typeof input.caseNumber==="string"&&input.caseNumber.trim()&&typeof input.expiresAt==="string"&&input.expiresAt){url="/vendor/verification/cases";method="POST";body={companyProfileId:input.profileId,caseNumber:input.caseNumber.trim(),expiresAt:input.expiresAt};}
  else if(input.action==="decision"&&valid(input.caseId)&&(input.status==="approved"||input.status==="rejected")){url=`/vendor/verification/cases/${encodeURIComponent(input.caseId)}`;method="PATCH";body={status:input.status};}
  else return NextResponse.json({message:"Enter valid verification details."},{status:400});
  try {const response=await fetch(`${backend()}${url}`,{method,headers:{Authorization:`Bearer ${session}`,"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});const data=await response.json().catch(()=>null);return NextResponse.json(response.ok?(input.action==="ocr"?data:{message:"Verification updated."}):{message:data?.message??"Could not update verification."},{status:response.status});}
  catch{return NextResponse.json({message:"Connection interrupted. Refresh and check before retrying."},{status:503});}
}
