"use client";

import { useEffect, useRef } from "react";
import styles from "./confirm-dialog.module.css";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending = false,
  danger = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onCancel={(event) => {
        event.preventDefault();

        if (!pending) {
          onCancel();
        }
      }}
    >
      <div className={styles.content}>
        <div className={styles.heading}>
          <span
            className={danger ? styles.dangerIcon : styles.infoIcon}
            aria-hidden="true"
          >
            !
          </span>

          <h2 id="confirm-dialog-title">{title}</h2>
        </div>

        <p id="confirm-dialog-description" className={styles.description}>
          {description}
        </p>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={pending}
            autoFocus
          >
            Cancel
          </button>

          <button
            type="button"
            className={danger ? styles.dangerButton : styles.confirmButton}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
