import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "../../../lib/origin";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ message: "Request origin is not allowed." }, { status: 403 });
  const token = (await cookies()).get("enterprise_session")?.value;
  if (!token) return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  let input: Record<string, unknown>;
  try { const body:unknown=await request.json(); if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error(); input=body as Record<string,unknown>; }
  catch { return NextResponse.json({ message: "Invalid request." }, { status: 400 }); }
  const valid=(value:unknown):value is string=>typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  let path:string; let method="POST"; let payload:Record<string,unknown>={};
  if (input.action === "cancel" && valid(input.requisitionId)) path=`/procurement/requisitions/${encodeURIComponent(input.requisitionId)}/cancel`;
  else if (input.action === "submit" && valid(input.requisitionId)) path=`/procurement/requisitions/${encodeURIComponent(input.requisitionId)}/submit`;
  else if(input.action === "assign" && valid(input.requisitionId) && valid(input.approverId) && Number.isInteger(input.approvalLevel) && Number(input.approvalLevel)>0){path="/procurement/approvals";payload={requisitionId:input.requisitionId,approverId:input.approverId,approvalLevel:input.approvalLevel};}
  else if(input.action === "decide" && valid(input.requisitionId) && (input.decision === "Approved" || input.decision === "Rejected") && (input.decision !== "Rejected" || (typeof input.reason === "string" && input.reason.trim()))) {path=`/procurement/approvals/requisitions/${encodeURIComponent(input.requisitionId)}/decision`; method="POST"; payload={approvalStatus:input.decision,...(input.decision === "Rejected" ? {rejectionReason:input.reason} : {}),...(typeof input.comments === "string" && input.comments.trim() ? {comments:input.comments.trim()} : {})};}
  else return NextResponse.json({message:"Invalid action."},{status:400});
  try { const response=await fetch(`${process.env.BACKEND_URL??"https://enterprise-operations-platform-new.onrender.com"}${path}`,{method,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"}); const result=await response.json().catch(()=>null); return NextResponse.json({message:response.ok ? (input.action === "submit" ? "Requisition submitted." : input.action === "cancel" ? "Requisition cancelled." : input.action === "decide" ? "Decision saved." : "Approver assigned.") : result?.message ?? "The action could not be completed."},{status:response.status}); }
  catch { return NextResponse.json({message:"Connection interrupted. Refresh the page to check the result before trying again."},{status:503}); }
}
