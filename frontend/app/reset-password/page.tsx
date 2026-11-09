"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
export default function ResetPassword() {
  const token = useRef("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const value = new URL(window.location.href).searchParams.get("token") ?? "";
    token.current = value;
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!token.current) {
      setMessage("This reset link is missing its token.");
      return;
    }
    if (data.get("newPassword") !== data.get("confirmPassword")) {
      setMessage("Passwords do not match.");
      return;
    }
    setMessage("");
    setPending(true);
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.current,
          newPassword: data.get("newPassword"),
        }),
      });
      const result = await response.json();
      setMessage(
        Array.isArray(result.message)
          ? result.message.join(" ")
          : result.message,
      );
      if (response.ok) {
        form.reset();
        token.current = "";
      }
    } catch {
      setMessage("The service is unavailable.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/login">Back to sign in</Link>
        <h1>Choose a new password</h1>
        <form className="form" onSubmit={submit}>
          <label htmlFor="password">New password</label>
          <input
            id="password"
            name="newPassword"
            type="password"
            required
            minLength={15}
            maxLength={128}
            autoComplete="new-password"
          />
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            name="confirmPassword"
            type="password"
            required
            minLength={15}
            maxLength={128}
            autoComplete="new-password"
          />
          <p className="hint">Use at least 15 characters.</p>
          <button className="button primary" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </button>
          {message && <p role="status">{message}</p>}
        </form>
      </section>
    </main>
  );
}
