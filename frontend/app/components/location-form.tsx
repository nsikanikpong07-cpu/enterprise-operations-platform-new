"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import styles from "./organization-actions.module.css";

export default function LocationForm() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    setPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/organization/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: String(data.get("name") ?? "").trim(),
          code: String(data.get("code") ?? "").trim(),
          type: data.get("type"),
          address: String(data.get("address") ?? "").trim(),
          city: String(data.get("city") ?? "").trim(),
          state: String(data.get("state") ?? "").trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(
          Array.isArray(result?.message)
            ? result.message.join(" ")
            : result?.message || "The location could not be created.",
        );
        return;
      }

      form.reset();
      setOpen(false);
      router.refresh();
    } catch {
      setMessage(
        "The connection was interrupted. Refresh the page to check whether the location was created.",
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.locationFormContainer}>
      <button
        type="button"
        className={styles.addButton}
        onClick={() => {
          setOpen(!open);
          setMessage("");
        }}
        aria-expanded={open}
      >
        <span aria-hidden="true">＋</span> Add location
      </button>

      {open && (
        <form className={styles.editForm} onSubmit={submit}>
          <label>
            Location name
            <input name="name" required maxLength={150} />
          </label>

          <label>
            Location code
            <input name="code" required maxLength={50} />
          </label>

          <label>
            Type
            <select name="type" defaultValue="office">
              <option value="office">Office</option>
              <option value="warehouse">Warehouse</option>
              <option value="branch">Branch</option>
              <option value="site">Site</option>
              <option value="factory">Factory</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            Address (optional)
            <input name="address" />
          </label>

          <label>
            City (optional)
            <input name="city" maxLength={100} />
          </label>

          <label>
            State (optional)
            <input name="state" maxLength={100} />
          </label>

          {message && (
            <p className={styles.message} role="status">
              {message}
            </p>
          )}

          <div className={styles.formButtons}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={pending}
            >
              {pending ? "Adding…" : "Add location"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
