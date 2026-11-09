"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./role-form.module.css";

export default function RoleForm() {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    setPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.get("name"),
          description: data.get("description"),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          Array.isArray(result.message)
            ? result.message.join(" ")
            : result.message || "Could not create the role.",
        );
        return;
      }

      setMessage(result.message || "Role created successfully.");
      form.reset();
      router.refresh();
    } catch {
      setMessage("Could not reach the service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>
        <span className={styles.summaryTitle}>
          <svg
            className={styles.roleIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s7-3.5 7-10V5l-7-3-7 3v7c0 6.5 7 10 7 10Z" />
            <circle cx="12" cy="10" r="1.5" />
            <path d="M12 11.5V14" />
          </svg>

          <span>Create role</span>
        </span>

        <svg
          className={styles.chevron}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>

      <form className={styles.form} onSubmit={submit}>
        <div className={styles.field}>
          <label htmlFor="role-name">Role name</label>

          <input
            id="role-name"
            name="name"
            type="text"
            placeholder="Enter role name"
            required
            maxLength={100}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="role-description">
            Description <span>(optional)</span>
          </label>

          <textarea
            id="role-description"
            name="description"
            placeholder="Enter role description"
            rows={3}
          />
        </div>

        {message && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}

        <div className={styles.actions}>
          <button
            className={styles.createButton}
            type="submit"
            disabled={pending}
          >
            {pending ? "Creating…" : "Create role"}
          </button>
        </div>
      </form>
    </details>
  );
}
