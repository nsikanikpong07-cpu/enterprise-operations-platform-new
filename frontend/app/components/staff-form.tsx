"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import styles from "../workspace/staff/staff.module.css";

interface Department {
  id: string;
  name: string;
}

interface StaffFormProps {
  departments: Department[];
  departmentsAvailable: boolean;
}

export default function StaffForm({
  departments,
  departmentsAvailable,
}: StaffFormProps) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    setPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(data.entries())),
      });

      const result = await response.json().catch(() => null);

      if (response.ok) {
        form.reset();
        setShowPassword(false);
        setMessage("Staff account created successfully.");
        router.refresh();
        return;
      }

      const responseMessage = result?.message;

      setMessage(
        Array.isArray(responseMessage)
          ? responseMessage.join(" ")
          : typeof responseMessage === "string"
            ? responseMessage
            : "Could not create the staff account. Please try again.",
      );
    } catch {
      setMessage(
        "The connection was interrupted. Check whether the staff account was created before trying again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <details className={styles.formCard}>
      <summary className={styles.formSummary}>
        <span className={styles.summaryTitle}>
          <svg
            className={styles.addIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="7" r="3.5" />
            <path d="M3 20v-2a6 6 0 0 1 11-3" />
            <path d="M18 14v7M14.5 17.5h7" />
          </svg>

          <span>Add staff</span>
        </span>

        <span className={styles.chevron} aria-hidden="true">
          ⌄
        </span>
      </summary>

      <form className={styles.staffForm} onSubmit={submit}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="staff-first">First name *</label>

            <input
              id="staff-first"
              name="firstName"
              placeholder="e.g. Jordan"
              autoComplete="given-name"
              required
              maxLength={100}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="staff-last">Last name *</label>

            <input
              id="staff-last"
              name="lastName"
              placeholder="e.g. Reyes"
              autoComplete="family-name"
              required
              maxLength={100}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="staff-email">Email *</label>

            <input
              id="staff-email"
              name="email"
              type="email"
              placeholder="e.g. jordan@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="staff-password">Initial password *</label>

            <div className={styles.passwordField}>
              <input
                id="staff-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-describedby="staff-password-help"
                required
                minLength={15}
                maxLength={128}
              />

              <button
                className={styles.passwordToggle}
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5 0 8.5 4.2 9.5 7a13.3 13.3 0 0 1-2.2 3.5" />
                    <path d="M6.2 6.3A13.5 13.5 0 0 0 2.5 12c1 2.8 4.5 7 9.5 7 1.4 0 2.7-.3 3.8-.8" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M2.5 12c1-2.8 4.5-7 9.5-7s8.5 4.2 9.5 7c-1 2.8-4.5 7-9.5 7S3.5 14.8 2.5 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <small id="staff-password-help">
              At least 15 characters. Share it securely with the staff member.
            </small>
          </div>

          <div className={styles.field}>
            <label htmlFor="staff-job">Job title (optional)</label>

            <input
              id="staff-job"
              name="jobTitle"
              placeholder="e.g. Procurement Officer"
              maxLength={150}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="staff-number">Employee number (optional)</label>

            <input
              id="staff-number"
              name="employeeNumber"
              placeholder="e.g. EMP-1001"
              maxLength={100}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="staff-department">Department (optional)</label>

            <select
              id="staff-department"
              name="departmentId"
              disabled={!departmentsAvailable}
            >
              <option value="">
                {departmentsAvailable
                  ? "Select a department"
                  : "Departments unavailable"}
              </option>

              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            {!departmentsAvailable && (
              <small>
                Departments could not be loaded. You can create the staff
                account without assigning one.
              </small>
            )}
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            className={styles.submitButton}
            type="submit"
            disabled={pending}
          >
            {pending ? "Saving…" : "Create staff account"}
          </button>
        </div>

        {message && (
          <p className={styles.formMessage} role="status">
            {message}
          </p>
        )}
      </form>
    </details>
  );
}
