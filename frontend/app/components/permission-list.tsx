"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./permission-list.module.css";
import ConfirmDialog from "./confirm-dialog";

interface Permission {
  id: string;
  name: string;
  description?: string | null;
}

interface PermissionListProps {
  roleId: string;
  roleName: string;
  permissions: Permission[];
  grantedIds: string[];
}

function readableName(name: string) {
  return name.replaceAll("_", " ");
}

export default function PermissionList({
  roleId,
  roleName,
  permissions,
  grantedIds,
}: PermissionListProps) {
  const router = useRouter();

  const [pendingId, setPendingId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    permissionId: string;
    text: string;
  } | null>(null);

  const [selection, setSelection] = useState<{
    permission: Permission;
    currentlyGranted: boolean;
  } | null>(null);

  const granted = new Set(grantedIds);

  async function changePermission(
    permission: Permission,
    currentlyGranted: boolean,
  ) {
    const action = currentlyGranted ? "remove" : "grant";

    setPendingId(permission.id);
    setFeedback(null);

    try {
      const response = await fetch("/api/role-permissions", {
        method: currentlyGranted ? "DELETE" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          roleId,
          permissionId: permission.id,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback({
          permissionId: permission.id,
          text:
            typeof result?.message === "string"
              ? result.message
              : `Could not ${action} this permission.`,
        });

        router.refresh();
        return;
      }

      setFeedback({
        permissionId: permission.id,
        text: currentlyGranted ? "Permission removed." : "Permission granted.",
      });

      // Refresh so the displayed status comes from the backend.
      router.refresh();
    } catch {
      setFeedback({
        permissionId: permission.id,
        text:
          "The connection was interrupted. The result is uncertain. " +
          "Refresh the page to check the current status before trying again.",
      });

      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className={styles.section}>
      <h2>Permissions</h2>

      <p className={styles.introduction}>
        Available permissions are defined by the platform.
      </p>

      {permissions.length === 0 ? (
        <p>No platform permissions are available.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Permission</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {permissions.map((permission) => {
                const isGranted = granted.has(permission.id);
                const isPending = pendingId === permission.id;

                return (
                  <tr key={permission.id}>
                    <td className={styles.permissionCell}>
                      <strong className={styles.permissionName}>
                        {readableName(permission.name)}
                      </strong>

                      {permission.description && (
                        <p className={styles.description}>
                          {permission.description}
                        </p>
                      )}

                      {feedback?.permissionId === permission.id && (
                        <p className={styles.feedback} role="status">
                          {feedback.text}
                        </p>
                      )}
                    </td>

                    <td className={styles.statusCell}>
                      <span
                        className={
                          isGranted
                            ? styles.grantedStatus
                            : styles.notGrantedStatus
                        }
                      >
                        <span className={styles.statusDot} aria-hidden="true" />

                        {isGranted ? "Granted" : "Not granted"}
                      </span>
                    </td>

                    <td className={styles.actionCell}>
                      <button
                        type="button"
                        className={
                          isGranted ? styles.removeButton : styles.grantButton
                        }
                        disabled={pendingId !== null}
                        onClick={() =>
                          setSelection({
                            permission,
                            currentlyGranted: isGranted,
                          })
                        }
                      >
                        {isPending
                          ? isGranted
                            ? "Removing…"
                            : "Granting…"
                          : isGranted
                            ? "Remove"
                            : "Grant"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={selection !== null}
        title={
          selection?.currentlyGranted
            ? "Remove permission?"
            : "Grant permission?"
        }
        description={
          selection
            ? selection.currentlyGranted
              ? `You are about to remove "${readableName(selection.permission.name)}" from the "${roleName}" role.`
              : `You are about to grant the "${roleName}" role permission to "${readableName(selection.permission.name)}".`
            : ""
        }
        confirmLabel={
          selection?.currentlyGranted ? "Remove permission" : "Grant permission"
        }
        danger={selection?.currentlyGranted ?? false}
        pending={pendingId !== null}
        onCancel={() => setSelection(null)}
        onConfirm={() => {
          if (!selection) return;

          const { permission, currentlyGranted } = selection;

          setSelection(null);
          void changePermission(permission, currentlyGranted);
        }}
      />
    </section>
  );
}
