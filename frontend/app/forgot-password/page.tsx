"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
export default function ForgotPassword() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      const result = await response.json();
      setMessage(
        Array.isArray(result.message)
          ? result.message.join(" ")
          : result.message,
      );
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
        <h1>Reset your password</h1>
        <p className="hint">
          Enter your email and we’ll send instructions if the account is
          eligible.
        </p>
        <form className="form" onSubmit={submit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <button className="button primary" disabled={pending}>
            {pending ? "Sending…" : "Send instructions"}
          </button>
          {message && <p role="status">{message}</p>}
        </form>
      </section>
    </main>
  );
}
