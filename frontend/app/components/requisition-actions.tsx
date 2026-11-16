"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./confirm-dialog";
import styles from "../workspace/procurement/procurement.module.css";
type Member={id:string;status?:string|null;user?:{firstName?:string|null;lastName?:string|null;email?:string|null}|null};
export default function RequisitionActions({id,number,status,staff,staffAvailable}:{id:string;number:string;status:string;staff:Member[];staffAvailable:boolean}){
 const router=useRouter();const [confirm,setConfirm]=useState<"submit"|"cancel"|null>(null);const [pending,setPending]=useState(false);const [message,setMessage]=useState("");
 async function call(action:string,values:Record<string,unknown>={}){setPending(true);setMessage("");try{const response=await fetch("/api/procurement-actions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,requisitionId:id,...values})});const result=await response.json().catch(()=>null);if(!response.ok){setMessage(Array.isArray(result?.message)?result.message.join(" "):result?.message||"Action failed.");return false;}setMessage(action==="submit"?"Requisition submitted.":action==="cancel"?"Requisition cancelled.":"Approver assigned.");router.refresh();return true;}catch{setMessage("Connection interrupted. Refresh to check the result before trying again.");router.refresh();return false;}finally{setPending(false)}}

 return <div><div className={styles.actions}>{status==="Draft"&&<><button type="button" disabled={pending} onClick={()=>setConfirm("submit")}>Submit</button></>}<button type="button" disabled={pending} onClick={()=>setConfirm("cancel")}>Cancel requisition</button></div>{message&&<p role="status">{message}</p>}<ConfirmDialog open={Boolean(confirm)} title={confirm==="cancel"?"Cancel requisition?":"Submit requisition?"} description={`You are about to ${confirm==="cancel"?"cancel":"submit"} “${number}”.`} confirmLabel={confirm==="cancel"?"Cancel requisition":"Submit"} danger={confirm==="cancel"} pending={pending} onCancel={()=>setConfirm(null)} onConfirm={async()=>{if(confirm)await call(confirm);setConfirm(null)}} /></div>
}
