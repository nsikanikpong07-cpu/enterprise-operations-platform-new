"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "../workspace/procurement/procurement.module.css";

type Profile = { id: string; supplier?: { legalName?: string; tradingName?: string } | null };
type Supplier = { id: string; legalName?: string; tradingName?: string };
type ReviewCase = { id: string; caseNumber: string; status: string; expiresAt?: string | null; verifiedById?: string | null };
type CertificateDocument = { id: string; documentType: string; status: string; createdAt?: string; ocrResult?: OcrResult | null };
type OcrField = { certificate: string | null; qr: string | null; match: boolean; note?: string | null };
type OcrResult = {
  comparison: "fields_match_qr" | "manual_review_needed";
  fields: Record<string, OcrField>;
  reasons: string[];
  notes: string[];
  reviewerDecisionRequired: true;
  verificationStatusChanged: false;
};

export default function SupplierReview({ profiles, suppliers, suppliersAvailable }: {
  profiles: Profile[];
  suppliers: Supplier[];
  suppliersAvailable: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState("");
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [ocrResults, setOcrResults] = useState<Record<string, OcrResult>>({});
  const [caseDocuments, setCaseDocuments] = useState<Record<string, CertificateDocument[]>>({});
  const [selectedDocuments, setSelectedDocuments] = useState<Record<string, string>>({});

  async function load(id: string) {
    if (!id) { setCases([]); return; }
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/supplier-review?profileId=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw Error(typeof data?.message === "string" ? data.message : "Could not load cases.");
      setCases(data);
      setOcrResults({});
      setSelectedDocuments({});
      const documents = await Promise.all(data.map(async (item: ReviewCase) => {
        const response = await fetch(`/api/supplier-review?caseId=${encodeURIComponent(item.id)}`, { cache: "no-store" });
        const items = await response.json();
        return [item.id, response.ok && Array.isArray(items) ? items as CertificateDocument[] : []] as const;
      }));
      setCaseDocuments(Object.fromEntries(documents));
      setOcrResults(Object.fromEntries(documents.flatMap(([, items]) => items.flatMap((doc) => doc.ocrResult ? [[doc.id, doc.ocrResult] as const] : []))));
    } catch (error) {
      setCases([]);
      setMessage(error instanceof Error ? error.message : "Could not load cases.");
    } finally { setPending(false); }
  }

  async function send(body: Record<string, unknown>) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/supplier-review", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(Array.isArray(data?.message) ? data.message.join(" ") : data?.message || "Update failed.");
        return false;
      }
      return true;
    } catch {
      setMessage("Connection interrupted. Refresh and check before retrying.");
      return false;
    } finally { setPending(false); }
  }

  async function openCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (await send({ action: "open", profileId: profile, caseNumber: data.get("caseNumber"), expiresAt: data.get("expiresAt") })) {
      form.reset(); await load(profile); setMessage("Verification case opened.");
    }
  }

  async function onboard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (await send({ action: "onboard", supplierId: data.get("supplierId") })) {
      form.reset(); setMessage("Supplier profile added."); router.refresh();
    }
  }

  async function decide(caseId: string, status: "approved" | "rejected") {
    if (await send({ action: "decision", caseId, status })) {
      await load(profile); setMessage(`Case ${status}.`);
    }
  }

  async function runOcr(event: FormEvent<HTMLFormElement>, caseId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const documentId = new FormData(form).get("documentId");
    if (typeof documentId !== "string" || !documentId) { setMessage("Select a CAC certificate first."); return; }
    setSelectedDocuments((current) => ({ ...current, [caseId]: documentId }));
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/supplier-review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ocr", caseId, documentId }), cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw Error(data?.message || "OCR check could not be completed.");
      setOcrResults((current) => ({ ...current, [documentId]: data as OcrResult }));
      setMessage("OCR comparison completed. Review the certificate and results before making a decision.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "OCR check could not be completed.");
    } finally { setPending(false); }
  }

  return <section className={styles.card}>
    <h2>Review suppliers</h2>
    <p>OCR compares the certificate details with its QR code. A match does not confirm CAC registration or approve the supplier.</p>
    {!suppliersAvailable && <p>Registered suppliers could not be loaded.</p>}
    <form className={styles.form} onSubmit={onboard}>
      <h3>Link a registered supplier</h3>
      <label>Registered supplier<select name="supplierId" required disabled={!suppliersAvailable || pending} defaultValue="">
        <option value="">Select a supplier</option>
        {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.tradingName || supplier.legalName || "Unnamed supplier"}</option>)}
      </select></label>
      <button className={styles.primary} type="submit" disabled={!suppliersAvailable || pending || !suppliers.length}>Link supplier</button>
    </form>
    {profiles.length === 0 ? <p>No supplier profiles exist for this company yet.</p> : <>
      <label>Supplier <select value={profile} disabled={pending} onChange={(event) => { setProfile(event.target.value); void load(event.target.value); }}>
        <option value="">Select a supplier</option>
        {profiles.map((item) => <option value={item.id} key={item.id}>{item.supplier?.tradingName || item.supplier?.legalName || "Unnamed supplier"}</option>)}
      </select></label>
      {profile && <>
        <form className={styles.form} onSubmit={openCase}>
          <h3>Open verification case</h3>
          <label>Case number<input name="caseNumber" maxLength={100} required /></label>
          <label>Verification expires on<input name="expiresAt" type="date" required /></label>
          <button className={styles.primary} disabled={pending} type="submit">Open case</button>
        </form>
        <h3>Cases</h3>
        {cases.length === 0 ? <p>No cases found.</p> : cases.map((item) => {
          const selectedDocumentId = selectedDocuments[item.id] ?? "";
          const result = selectedDocumentId ? ocrResults[selectedDocumentId] : undefined;
          return <div className={styles.form} key={item.id}>
            <strong>{item.caseNumber}</strong>
            <span>Status: {item.status} {item.status === "approved" && !item.verifiedById ? "(requires new review)" : ""}</span>
            <span>Expires: {item.expiresAt ? String(item.expiresAt).slice(0, 10) : "Not set"}</span>
            <form onSubmit={(event) => void runOcr(event, item.id)}>
              <label>CAC certificate<select name="documentId" required disabled={pending} value={selectedDocumentId} onChange={(event) => setSelectedDocuments((current) => ({ ...current, [item.id]: event.target.value }))}>
                <option value="">Select a supplier-uploaded certificate</option>
                {(caseDocuments[item.id] ?? []).filter((doc) => /\bcac\b/i.test(doc.documentType)).map((doc) => <option key={doc.id} value={doc.id}>{doc.documentType} · {doc.status}</option>)}
              </select></label>
              {(caseDocuments[item.id] ?? []).filter((doc) => /\bcac\b/i.test(doc.documentType)).map((doc) => <p key={`view-${doc.id}`}>
                <a href={`/api/supplier-review/cases/${item.id}/documents/${doc.id}/file`} target="_blank" rel="noreferrer">View {doc.documentType}</a>
              </p>)}
              <button type="submit" disabled={pending || !(caseDocuments[item.id] ?? []).some((doc) => /\bcac\b/i.test(doc.documentType))}>{pending ? "Checking certificate…" : "Run OCR comparison"}</button>
            </form>
            {result && <div aria-live="polite">
              <strong>{result.comparison === "fields_match_qr" ? "Certificate fields match the QR code" : "Manual review needed"}</strong>
              <p>This result does not verify registration with CAC. The reviewer must inspect the document and decide.</p>
              <dl>{Object.entries(result.fields).map(([key, field]) => <div key={key}>
                <dt>{key.replace(/_/g, " ")}</dt>
                <dd>Certificate: {field.certificate ?? "Not read"} · QR: {field.qr ?? "Not found"} · {field.match ? "Match" : field.note || "Review"}</dd>
              </div>)}</dl>
              {result.reasons.map((reason) => <p key={reason}>{reason}</p>)}
            </div>}
            <div className={styles.actions}>
              <button type="button" disabled={pending} onClick={() => void decide(item.id, "approved")}>Approve</button>
              <button type="button" disabled={pending} onClick={() => void decide(item.id, "rejected")}>Reject</button>
            </div>
          </div>;
        })}
      </>}
    </>}
    {message && <p role="status">{message}</p>}
  </section>;
}
