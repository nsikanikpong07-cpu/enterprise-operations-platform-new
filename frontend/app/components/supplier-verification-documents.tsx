"use client";

import { useState, type FormEvent } from 'react';
import styles from '../supplier-workspace/business-profile/business-profile.module.css';

type SupplierDocument = {
  id: string;
  documentType: string;
  documentNumber?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  status: 'pending' | 'valid' | 'expired' | 'rejected' | string;
  createdAt: string;
};

function statusLabel(status: string) {
  return ({ pending: 'Under review', valid: 'Valid', expired: 'Expired', rejected: 'Changes requested' } as Record<string, string>)[status] ?? status;
}

export default function SupplierVerificationDocuments({ initialDocuments, initialStatus }: { initialDocuments: SupplierDocument[]; initialStatus: string }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [verificationStatus, setVerificationStatus] = useState(initialStatus);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get('file');
    if (!(file instanceof File) || file.size === 0) { setMessage('Choose a CAC certificate first.'); return; }
    if (file.size > 15 * 1024 * 1024) { setMessage('The certificate must be 15 MB or smaller.'); return; }
    setPending(true); setMessage('');
    try {
      const ticketResponse = await fetch('/api/supplier-workspace/documents/upload-ticket', { method: 'POST', cache: 'no-store' });
      const ticketData = await ticketResponse.json();
      if (!ticketResponse.ok || typeof ticketData?.ticket !== 'string' || typeof ticketData?.uploadUrl !== 'string') {
        throw Error(ticketData?.message ?? 'Could not prepare a secure certificate upload.');
      }
      const data = new FormData(); data.append('file', file, file.name);
      const response = await fetch(ticketData.uploadUrl, {
        method: 'POST',
        headers: { 'X-Supplier-Upload-Ticket': ticketData.ticket },
        body: data,
      });
      const result = await response.json();
      if (!response.ok) throw Error(result?.message ?? 'Certificate upload failed.');
      const refresh = await fetch('/api/supplier-workspace/documents', { cache: 'no-store' });
      const items = await refresh.json();
      if (refresh.ok && Array.isArray(items)) setDocuments(items);
      setVerificationStatus('under_review');
      form.reset(); setMessage('Certificate uploaded. It is waiting for review.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Certificate upload failed.');
    } finally { setPending(false); }
  }

  return <div className={styles.panelStack}>
    <section className={styles.panel}>
      <h2>Overall status</h2>
      <p>Your business becomes verified when all required checks are complete.</p>
      <span className={styles.statusPill}>{verificationStatus.replace(/_/g, ' ')}</span>
    </section>
    <section className={styles.panel}>
      <h2>Your certificates</h2>
      {documents.length ? <ul className={styles.documentList}>{documents.map((document) => <li key={document.id}>
        <div><strong>{document.documentType}</strong><span>{statusLabel(document.status)}</span></div>
        <small>Submitted {new Date(document.createdAt).toLocaleDateString()}</small>
        {document.status === 'rejected' && <p>Changes were requested. Upload a clearer or corrected copy below.</p>}
      </li>)}</ul> : <p>No certificates have been submitted yet.</p>}
    </section>
    <section className={styles.panel}>
      <h2>{documents[0]?.status === 'rejected' ? 'Upload a replacement' : 'Upload CAC certificate'}</h2>
      <form className={styles.documentForm} onSubmit={upload}>
        <label>PDF, JPG or PNG · Maximum 15 MB<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required disabled={pending} /></label>
        <p>For best results, upload the original PDF or a clear scan.</p>
        <div className={styles.notice}>Your document will be reviewed by the IMPRESSOR team. An OCR match does not confirm CAC registration.</div>
        <button type="submit" disabled={pending}>{pending ? 'Uploading…' : 'Upload for review'}</button>
      </form>
      {message && <p role="status">{message}</p>}
    </section>
  </div>;
}
