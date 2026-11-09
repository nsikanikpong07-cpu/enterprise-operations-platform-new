"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import ConfirmDialog from "./confirm-dialog";
import styles from "./organization-actions.module.css";

interface OrganizationActionsProps {
  kind: "department" | "location";
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  isActive?: boolean;
}

export default function OrganizationActions({
  kind,
  id,
  name,
  code,
  address,
  isActive,
}: OrganizationActionsProps) {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const isLocation = kind === "location";

  async function sendUpdate(body: Record<string, unknown>) {
    setPending(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/organization/${kind === "department" ? "departments" : "locations"}/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(
          Array.isArray(result?.message)
            ? result.message.join(" ")
            : result?.message || "The update could not be completed.",
        );
        return false;
      }

      router.refresh();
      return true;
    } catch {
      setMessage(
        "The connection was interrupted. Refresh the page to check whether the change was saved.",
      );
      router.refresh();
      return false;
    } finally {
      setPending(false);
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const updatedName = String(data.get("name") ?? "").trim();

    if (!updatedName) {
      setMessage("Please enter a name.");
      return;
    }

    const body: Record<string, unknown> = {
      name: updatedName,
    };

    if (kind === "department") {
      const updatedCode = String(data.get("code") ?? "").trim();

      // Leave the existing code unchanged if the field is empty.
      if (updatedCode) {
        body.code = updatedCode;
      }
    } else {
      body.address = String(data.get("address") ?? "").trim();
    }

    const saved = await sendUpdate(body);

    if (saved) {
      setEditing(false);
    }
  }

  async function changeLocationStatus() {
    if (typeof isActive !== "boolean") {
      setMessage("Location status is unavailable. Refresh and try again.");
      setConfirming(false);
      return;
    }

    const saved = await sendUpdate({
      isActive: !isActive,
    });

    if (saved) {
      setConfirming(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.iconButton}
          title={`Edit ${kind}`}
          aria-label={`Edit ${kind}: ${name}`}
          onClick={() => {
            setEditing(!editing);
            setMessage("");
          }}
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

        {isLocation && typeof isActive === "boolean" && (
          <button
            type="button"
            className={isActive ? styles.dangerButton : styles.reactivateButton}
            title={isActive ? "Deactivate location" : "Reactivate location"}
            aria-label={`${isActive ? "Deactivate" : "Reactivate"} location: ${name}`}
            onClick={() => {
              setMessage("");
              setConfirming(true);
            }}
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
              <path d="M12 2v10" />
              <path d="M6.3 5.7a8 8 0 1 0 11.4 0" />
            </svg>
          </button>
        )}
      </div>

      {editing && (
        <form className={styles.editForm} onSubmit={saveEdit}>
          <label>
            Name
            <input name="name" defaultValue={name} required maxLength={150} />
          </label>

          {kind === "department" ? (
            <label>
              Code
              <input name="code" defaultValue={code ?? ""} maxLength={50} />
            </label>
          ) : (
            <label>
              Address
              <input name="address" defaultValue={address ?? ""} />
            </label>
          )}

          <div className={styles.formButtons}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => {
                setEditing(false);
                setMessage("");
              }}
              disabled={pending}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={pending}
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}

      {message && (
        <p className={styles.message} role="status">
          {message}
        </p>
      )}

      <ConfirmDialog
        open={confirming}
        title={`${isActive ? "Deactivate" : "Reactivate"} ${name}?`}
        description={
          isActive
            ? "This location will be marked inactive. Its record will remain in the system."
            : "This location will be marked active again."
        }
        confirmLabel={isActive ? "Deactivate location" : "Reactivate location"}
        danger={isActive === true}
        pending={pending}
        onCancel={() => setConfirming(false)}
        onConfirm={changeLocationStatus}
      />
    </div>
  );
}
