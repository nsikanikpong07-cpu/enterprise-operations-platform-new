"use client";
import { useState } from "react";
import styles from "../workspace/procurement/procurement.module.css";

type Line = { id: string; description?: string; quantityRequested: string | number; estimatedUnitPrice?: string | number | null; item?: { name?: string }; unitOfMeasure?: { name?: string } };
export default function RequisitionLines({ requisitionId }: { requisitionId: string }) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function toggle() {
    if (open) { setOpen(false); return; }
    setOpen(true); setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/procurement-data?kind=requisition&id=${encodeURIComponent(requisitionId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error(typeof data?.message === "string" ? data.message : "Could not load requisition items.");
      setLines(data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load requisition items."); }
    finally { setLoading(false); }
  }
  return <div><button className={styles.disclosureButton} type="button" onClick={toggle} aria-expanded={open}>{open ? "Hide items" : "View items"}</button>{open && (loading ? <p>Loading items…</p> : message ? <p role="status">{message}</p> : lines.length ? <ul>{lines.map(line => <li key={line.id}><strong>{line.item?.name || "Catalog item"}</strong>: {line.description} — {line.quantityRequested} {line.unitOfMeasure?.name || "units"}{line.estimatedUnitPrice != null && <> · Estimated unit price: {line.estimatedUnitPrice}</>}</li>)}</ul> : <p>No items found.</p>)}</div>;
}
