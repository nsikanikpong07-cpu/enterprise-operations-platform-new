"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./confirm-dialog";
import styles from "../workspace/procurement/procurement.module.css";

export default function IssueOrderButton({ id, number }: { id: string; number: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function issue() {
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/procurement-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "issueOrder", orderId: id }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = Array.isArray(result?.message) ? result.message.join(" ") : typeof result?.message === "string" ? result.message : "Could not mark the order issued.";
        setMessage(detail.includes("Supplier verification must be approved and current") ? `${detail}. Ask an authorized platform reviewer to check the supplier's verification.` : detail);
        return;
      }
      setMessage("Purchase order marked issued."); router.refresh();
    } catch { setMessage("Connection interrupted. Refresh the order to check its status before trying again."); }
    finally { setPending(false); setOpen(false); }
  }
  return <div><button type="button" className={styles.primary} onClick={() => { setMessage(""); setOpen(true); }} disabled={pending}>Mark as issued</button>{message && <p role="status">{message}</p>}<ConfirmDialog open={open} title="Mark purchase order as issued?" description={`Confirm that ${number} has been finalised and sent or made available to the supplier. This action does not send the order.`} confirmLabel="Mark as issued" pending={pending} onCancel={() => setOpen(false)} onConfirm={issue}/></div>;
}
