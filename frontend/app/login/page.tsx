"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import styles from "../auth-design.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        setError(
          typeof result?.message === "string"
            ? result.message
            : "Sign in could not be completed.",
        );

        return;
      }

      router.replace("/workspace");
      router.refresh();
    } catch {
      setError("Could not reach the service. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>IM</span>
          <span>IMPRESSOR</span>
        </Link>

        <h1 className={styles.title}>Sign in</h1>

        <p className={styles.introduction}>
          Enter your work email and password to continue.
        </p>

        {error && (
          <p className={`${styles.message} ${styles.error}`} role="alert">
            {error}
          </p>
        )}

        <form className={styles.form} onSubmit={submit}>
          <label htmlFor="email">Email address</label>

          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="password">Password</label>

          <div className={styles.passwordField}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button
              className={styles.passwordToggle}
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
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
                {showPassword && <path d="M3 3l18 18" />}
              </svg>
            </button>
          </div>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={pending}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className={styles.links}>
          <p>
            <Link href="/forgot-password">Forgot password?</Link>
          </p>

          <p>
            New organization?{" "}
            <Link href="/register">Register an organization</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
