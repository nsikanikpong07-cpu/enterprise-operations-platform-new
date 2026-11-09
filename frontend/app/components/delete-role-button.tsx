"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ConfirmDialog from "./confirm-dialog";
import styles from "./management-actions.module.css";

interface DeleteRoleButtonProps {
  roleId: string;
  roleName: string;
}

export default function DeleteRoleButton({
  roleId,
  roleName,
}: DeleteRoleButtonProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function deleteRole() {
    setPending(true);
    setMessage("");

    try {
      const response = await fetch(`/api/roles/${encodeURIComponent(roleId)}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(
          typeof result?.message === "string"
            ? result.message
            : "Could not delete this role.",
        );
        setOpen(false);
        router.refresh();
        return;
      }

      router.push("/workspace/roles");
      router.refresh();
    } catch {
      setMessage(
        "The connection was interrupted. Return to the roles list and check whether this role still exists.",
      );
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.actionGroup}>
      <button
        type="button"
        className={styles.dangerOutline}
        onClick={() => setOpen(true)}
      >
        Delete role
      </button>

      {message && (
        <p className={styles.feedback} role="status">
          {message}
        </p>
      )}

      <ConfirmDialog
        open={open}
        title={`Delete ${roleName}?`}
        description="This removes the role from assigned staff and removes its permission grants. Staff may lose access provided by this role. This action cannot be undone."
        confirmLabel="Delete role"
        pending={pending}
        danger
        onCancel={() => setOpen(false)}
        onConfirm={deleteRole}
      />
    </div>
  );
}
