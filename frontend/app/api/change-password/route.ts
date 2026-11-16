import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sameOrigin } from "../../../lib/origin";
export async function POST(request: Request) {
 if (!sameOrigin(request)) return NextResponse.json({message:"Request origin is not allowed."},{status:403});
 const jar = await cookies(); const token = jar.get("enterprise_session")?.value;
 if (!token) return NextResponse.json({message:"Please sign in."},{status:401});
 let input: unknown; try { input = await request.json(); } catch { return NextResponse.json({message:"Invalid request."},{status:400}); }
 if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({message:"Invalid request."},{status:400});
 const {currentPassword,newPassword} = input as Record<string,unknown>;
 if (typeof currentPassword !== "string" || typeof newPassword !== "string" || currentPassword.length < 8 || currentPassword.length > 128 || newPassword.length < 15 || newPassword.length > 128) return NextResponse.json({message:"Enter your current password and a new password of 15 to 128 characters."},{status:400});
 try {
  const response = await fetch(`${process.env.BACKEND_URL ?? "http://127.0.0.1:3001"}/auth/change-password`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({currentPassword,newPassword}),cache:"no-store"});
  const body = await response.json().catch(()=>null);
  if(response.ok) jar.delete("enterprise_session");
  return NextResponse.json({message:body?.message ?? (response.ok ? "Password changed. Please sign in again." : "Could not change password.")},{status:response.status});
 } catch { return NextResponse.json({message:"The connection was interrupted. If your password changed, sign in using the new password."},{status:503}); }
}
