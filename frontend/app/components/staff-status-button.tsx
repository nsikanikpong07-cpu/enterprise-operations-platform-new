"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ConfirmDialog from "./confirm-dialog";
import styles from "./management-actions.module.css";

interface StaffStatusButtonProps {
  membershipId: string;
  staffName: string;
  status: string;
}

export default function StaffStatusButton({
  membershipId,
  staffName,
  status,
}: StaffStatusButtonProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const isActive = status.toLowerCase() === "active";
  const isInactive = status.toLowerCase() === "inactive";

  // Suspended staff are not automatically reactivated by this control.
  if (!isActive && !isInactive) {
    return <span className={styles.unavailable}>—</span>;
  }

  async function updateStatus() {
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
            status: isActive ? "inactive" : "active",
          }),
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(
          typeof result?.message === "string"
            ? result.message
            : "Could not update staff status.",
        );
      }

      setOpen(false);
      router.refresh();
    } catch {
      setMessage(
        "The connection was interrupted. Refresh the page to check the current status before trying again.",
      );
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.actionGroup}>
      <button
        type="button"
        className={isActive ? styles.dangerOutline : styles.reactivateButton}
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        {isActive ? "Deactivate" : "Reactivate"}
      </button>

      {message && (
        <p className={styles.feedback} role="status">
          {message}
        </p>
      )}

      <ConfirmDialog
        open={open}
        title={`${isActive ? "Deactivate" : "Reactivate"} ${staffName}?`}
        description={
          isActive
            ? "This person will no longer be able to access the company workspace while their membership is inactive. Their account and assigned roles will remain recorded."
            : "This will make their company membership active again. Access also depends on their user account and company being active."
        }
        confirmLabel={isActive ? "Deactivate staff" : "Reactivate staff"}
        pending={pending}
        danger={isActive}
        onCancel={() => setOpen(false)}
        onConfirm={updateStatus}
      />
    </div>
  );
}
