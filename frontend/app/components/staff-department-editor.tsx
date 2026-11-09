"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import styles from "../workspace/staff/staff.module.css";

interface Department {
  id: string;
  name: string;
}

interface StaffDepartmentEditorProps {
  membershipId: string;
  staffName: string;
  currentDepartmentId?: string | null;
  departments: Department[];
  departmentsAvailable: boolean;
}

export default function StaffDepartmentEditor({
  membershipId,
  staffName,
  currentDepartmentId,
  departments,
  departmentsAvailable,
}: StaffDepartmentEditorProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const selected = String(data.get("departmentId") ?? "");

    setPending(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/staff/${encodeURIComponent(membershipId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            departmentId: selected || null,
          }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(
          Array.isArray(result?.message)
            ? result.message.join(" ")
            : typeof result?.message === "string"
              ? result.message
              : "Could not update the department.",
        );
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setMessage(
        "The connection was interrupted. Refresh the page to check the current department before trying again.",
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.departmentEditor}>
      <button
        type="button"
        className={styles.editDepartmentButton}
        onClick={() => {
          setOpen((current) => !current);
          setMessage("");
        }}
        disabled={!departmentsAvailable || pending}
        aria-expanded={open}
        aria-label={`Edit department for ${staffName}`}
        title={
          departmentsAvailable
            ? "Edit department"
            : "Departments could not be loaded"
        }
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      </button>

      {open && (
        <form className={styles.departmentEditForm} onSubmit={submit}>
          <label htmlFor={`department-${membershipId}`}>
            Department for {staffName}
          </label>

          <select
            id={`department-${membershipId}`}
            name="departmentId"
            defaultValue={currentDepartmentId ?? ""}
            disabled={pending}
          >
            <option value="">Not assigned</option>

            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>

          <div className={styles.departmentEditActions}>
            <button
              type="button"
              className={styles.departmentCancelButton}
              onClick={() => {
                setOpen(false);
                setMessage("");
              }}
              disabled={pending}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.departmentSaveButton}
              disabled={pending}
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      {message && (
        <p className={styles.departmentEditMessage} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
