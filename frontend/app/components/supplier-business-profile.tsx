"use client";

import { useState, type FormEvent } from "react";
import styles from "../supplier-workspace/business-profile/business-profile.module.css";

export type SupplierContact = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  isPrimary: boolean;
};

export type SupplierBusinessProfileData = {
  supplier: {
    id: string;
    legalName: string;
    tradingName?: string | null;
    registrationNumber?: string | null;
    taxIdentificationNumber?: string | null;
    supplierType?: string | null;
    countryCode?: string | null;
  };
  contacts: SupplierContact[];
};

type ContactDraft = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  isPrimary: boolean;
};

export default function SupplierBusinessProfile({
  initialData,
}: {
  initialData: SupplierBusinessProfileData;
}) {
  const [supplier, setSupplier] = useState(initialData.supplier);
  const [contacts, setContacts] = useState(initialData.contacts);
  const [editingProfile, setEditingProfile] = useState(false);
  const [contactDraft, setContactDraft] = useState<ContactDraft | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function request(path: string, method: string, body?: unknown) {
    const response = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      const reason = Array.isArray(result?.message)
        ? result.message.join(" ")
        : typeof result?.message === "string"
          ? result.message
          : "The change could not be saved.";
      throw new Error(reason);
    }
    return result;
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(
      [
        "legalName",
        "tradingName",
        "registrationNumber",
        "taxIdentificationNumber",
        "supplierType",
        "countryCode",
      ].map((key) => [key, String(data.get(key) ?? "").trim() || null]),
    );
    try {
      const updated = await request("/api/supplier-workspace", "PATCH", payload);
      setSupplier((current) => ({ ...current, ...updated }));
      setEditingProfile(false);
      setMessage("Business information saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Business information could not be saved.");
    } finally {
      setPending(false);
    }
  }

  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contactDraft) return;
    setPending(true);
    setMessage("");
    const payload = {
      name: contactDraft.name.trim(),
      email: contactDraft.email.trim() || null,
      phone: contactDraft.phone.trim() || null,
      position: contactDraft.position.trim() || null,
      isPrimary: contactDraft.isPrimary,
    };
    try {
      const saved = contactDraft.id
        ? await request(`/api/supplier-workspace/contacts/${contactDraft.id}`, "PATCH", payload)
        : await request("/api/supplier-workspace/contacts", "POST", payload);
      setContacts((current) => {
        const wasPrimary = current.some((contact) => contact.id === saved.id && contact.isPrimary);
        const promotedId = !saved.isPrimary && wasPrimary
          ? current.find((contact) => contact.id !== saved.id)?.id
          : undefined;
        const next = contactDraft.id
          ? current.map((contact) => contact.id === saved.id ? saved : contact)
          : [...current, saved];
        if (saved.isPrimary) {
          return next.map((contact) => ({ ...contact, isPrimary: contact.id === saved.id }));
        }
        if (promotedId) {
          return next.map((contact) => ({ ...contact, isPrimary: contact.id === promotedId }));
        }
        return next;
      });
      setContactDraft(null);
      setMessage(contactDraft.id ? "Contact updated." : "Contact added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Contact could not be saved.");
    } finally {
      setPending(false);
    }
  }

  async function removeContact(contact: SupplierContact) {
    if (!window.confirm(`Remove ${contact.name} from your contacts?`)) return;
    setPending(true);
    setMessage("");
    try {
      await request(`/api/supplier-workspace/contacts/${contact.id}`, "DELETE");
      const next = contacts.filter((item) => item.id !== contact.id);
      if (contact.isPrimary && next.length) next[0] = { ...next[0], isPrimary: true };
      setContacts(next);
      setMessage("Contact removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Contact could not be removed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {message && <p className={styles.message} role="status">{message}</p>}

      <section className={styles.card} aria-labelledby="business-information-title">
        <div className={styles.cardHeading}>
          <h2 id="business-information-title">Business information</h2>
          {!editingProfile && (
            <button type="button" className={styles.secondaryButton} onClick={() => setEditingProfile(true)}>
              Edit
            </button>
          )}
        </div>
        {editingProfile ? (
          <form className={styles.profileForm} onSubmit={saveProfile}>
            <label>Legal name<input name="legalName" required maxLength={255} defaultValue={supplier.legalName} /></label>
            <label>Trading name<input name="tradingName" maxLength={255} defaultValue={supplier.tradingName ?? ""} /></label>
            <label>CAC registration number<input name="registrationNumber" maxLength={100} defaultValue={supplier.registrationNumber ?? ""} /></label>
            <label>Tax identification number<input name="taxIdentificationNumber" maxLength={100} defaultValue={supplier.taxIdentificationNumber ?? ""} /></label>
            <label>Business type<input name="supplierType" maxLength={50} defaultValue={supplier.supplierType ?? ""} /></label>
            <label>Country code<input name="countryCode" required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" defaultValue={supplier.countryCode ?? "NG"} /></label>
            <div className={styles.formActions}>
              <button type="button" className={styles.ghostButton} disabled={pending} onClick={() => setEditingProfile(false)}>Cancel</button>
              <button type="submit" className={styles.primaryButton} disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        ) : (
          <dl className={styles.details}>
            <div><dt>Legal name</dt><dd>{supplier.legalName}</dd></div>
            <div><dt>Trading name</dt><dd>{supplier.tradingName || "Not provided"}</dd></div>
            <div><dt>CAC registration number</dt><dd>{supplier.registrationNumber || "Not provided"}</dd></div>
            <div><dt>Tax identification number</dt><dd>{supplier.taxIdentificationNumber || "Not provided"}</dd></div>
            <div><dt>Business type</dt><dd>{supplier.supplierType || "Not provided"}</dd></div>
            <div><dt>Country</dt><dd>{supplier.countryCode || "Not provided"}</dd></div>
          </dl>
        )}
      </section>

      <section className={styles.card} aria-labelledby="contact-people-title">
        <div className={styles.cardHeading}>
          <div>
            <h2 id="contact-people-title">Contact people</h2>
            <p>The primary contact receives verification and RFQ notifications.</p>
          </div>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setContactDraft({ name: "", email: "", phone: "", position: "", isPrimary: contacts.length === 0 })}
          >
            + Add contact
          </button>
        </div>
        {contacts.length === 0 ? (
          <p className={styles.empty}>No contacts added yet. Add a primary contact to receive supplier updates.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Contact status</th><th>Actions</th></tr></thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>{contact.name}</td>
                    <td>{contact.position || "Contact"}</td>
                    <td>{contact.email || "—"}</td>
                    <td>{contact.phone || "—"}</td>
                    <td><span className={contact.isPrimary ? styles.primaryBadge : styles.secondaryBadge}>{contact.isPrimary ? "Primary" : "Secondary"}</span></td>
                    <td className={styles.rowActions}>
                      <button type="button" disabled={pending} onClick={() => setContactDraft({ id: contact.id, name: contact.name, email: contact.email ?? "", phone: contact.phone ?? "", position: contact.position ?? "", isPrimary: contact.isPrimary })}>Edit</button>
                      <button type="button" disabled={pending} onClick={() => void removeContact(contact)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {contactDraft && (
        <div className={styles.dialogBackdrop}>
          <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title">
            <h2 id="contact-dialog-title">{contactDraft.id ? "Edit contact" : "Add contact"}</h2>
            <form className={styles.profileForm} onSubmit={saveContact}>
              <label>Name<input required maxLength={200} value={contactDraft.name} onChange={(event) => setContactDraft({ ...contactDraft, name: event.target.value })} /></label>
              <label>Role<input maxLength={150} value={contactDraft.position} onChange={(event) => setContactDraft({ ...contactDraft, position: event.target.value })} /></label>
              <label>Email<input type="email" maxLength={255} value={contactDraft.email} onChange={(event) => setContactDraft({ ...contactDraft, email: event.target.value })} /></label>
              <label>Phone<input type="tel" maxLength={50} value={contactDraft.phone} onChange={(event) => setContactDraft({ ...contactDraft, phone: event.target.value })} /></label>
              <label className={styles.checkboxLabel}><input type="checkbox" checked={contactDraft.isPrimary} onChange={(event) => setContactDraft({ ...contactDraft, isPrimary: event.target.checked })} /> Set as primary contact</label>
              <div className={styles.formActions}>
                <button type="button" className={styles.ghostButton} disabled={pending} onClick={() => setContactDraft(null)}>Cancel</button>
                <button type="submit" className={styles.primaryButton} disabled={pending}>{pending ? "Saving…" : "Save contact"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
