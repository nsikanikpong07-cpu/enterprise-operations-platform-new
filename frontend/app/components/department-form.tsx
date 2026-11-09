"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import styles from "../workspace/organization/organization.module.css";

interface ManagerOption {
  id: string;
  name: string;
}

interface DepartmentFormProps {
  managers: ManagerOption[];
  managersAvailable: boolean;
}

export default function DepartmentForm({
  managers,
  managersAvailable,
}: DepartmentFormProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function closeForm() {
    setIsOpen(false);
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    setPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/organization/departments", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: data.get("name"),
          code: data.get("code"),
          managerId: data.get("managerId") || undefined,
        }),
      });

      const result = await response.json().catch(() => null);

      if (response.ok) {
        form.reset();
        setMessage("Department added successfully.");
        router.refresh();
        return;
      }

      const responseMessage = result?.message;

      setMessage(
        Array.isArray(responseMessage)
          ? responseMessage.join(" ")
          : typeof responseMessage === "string"
            ? responseMessage
            : "Could not add the department. Please try again.",
      );
    } catch {
      setMessage(
        "The connection was interrupted. Refresh the page to check whether the department was added.",
      );

      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.departmentFormSection}>
      <button
        className={styles.addDepartmentToggle}
        type="button"
        aria-expanded={isOpen}
        aria-controls="add-department-form"
        disabled={pending}
        onClick={() => {
          if (isOpen) {
            closeForm();
          } else {
            setIsOpen(true);
          }
        }}
      >
        <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
        <span>Add department</span>
      </button>

      {isOpen && (
        <div className={styles.formBox} id="add-department-form">
          <h3>Add department</h3>

          <form onSubmit={submit}>
            <div className={styles.formFields}>
              <div className={styles.field}>
                <label htmlFor="department-name">Name</label>

                <input
                  id="department-name"
                  name="name"
                  placeholder="e.g. Operations"
                  required
                  maxLength={150}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="department-code">Code (optional)</label>

                <input
                  id="department-code"
                  name="code"
                  placeholder="e.g. OPS"
                  maxLength={50}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="department-manager">
                  Department manager (optional)
                </label>

                <select
                  id="department-manager"
                  name="managerId"
                  disabled={!managersAvailable}
                >
                  <option value="">
                    {managersAvailable
                      ? "Select a manager"
                      : "Staff list unavailable"}
                  </option>

                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>

                {!managersAvailable && (
                  <small>
                    The staff list could not be loaded. You can still create the
                    department without a manager.
                  </small>
                )}

                {managersAvailable && managers.length === 0 && (
                  <small>No eligible active staff members were found.</small>
                )}
              </div>
            </div>

            <div className={styles.departmentFormActions}>
              <button
                className={styles.submitButton}
                type="submit"
                disabled={pending}
              >
                {pending ? "Saving…" : "Add department"}
              </button>

              <button
                className={styles.cancelButton}
                type="button"
                disabled={pending}
                onClick={closeForm}
              >
                Cancel
              </button>
            </div>

            {message && (
              <p className={styles.formMessage} role="status">
                {message}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
