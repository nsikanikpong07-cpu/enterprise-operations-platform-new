"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import styles from "./register.module.css";

type AccountType = "company" | "vendor" | "both";

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>("company");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const includesVendor = accountType === "vendor" || accountType === "both";
  const includesCompany = accountType === "company" || accountType === "both";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setPending(true);

    const form = event.currentTarget;
    const data = new FormData(form);

    function value(name: string) {
      return String(data.get(name) ?? "").trim();
    }

    const legalName = value("legalName");
    const registrationNumber = value("registrationNumber");
    const taxIdentificationNumber = value("taxIdentificationNumber");
    const industry = value("industry");

    const payload = {
      accountType,
      name: value("name"),

      ...(legalName ? { legalName } : {}),
      ...(registrationNumber ? { registrationNumber } : {}),
      ...(taxIdentificationNumber ? { taxIdentificationNumber } : {}),
      ...(industry ? { industry } : {}),

      countryCode: value("countryCode").toUpperCase(),

      ...(includesCompany
        ? {
            defaultCurrency: value("defaultCurrency").toUpperCase(),
            timezone: value("timezone"),
          }
        : {}),

      owner: {
        firstName: value("firstName"),
        lastName: value("lastName"),
        email: value("email"),
        // Do not trim passwords: spaces can be part of a password.
        password: String(data.get("password") ?? ""),
      },
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(
          Array.isArray(result?.message)
            ? result.message.join(" ")
            : typeof result?.message === "string"
              ? result.message
              : "Registration failed. Please check your details and try again.",
        );

        return;
      }

      form.reset();
      setAccountType("company");
      setShowPassword(false);
      setMessage("Registration completed. You can now sign in.");
    } catch {
      setMessage(
        "The connection was interrupted. Registration may have completed. " +
          "Please try signing in before submitting the form again.",
      );
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

        <header className={styles.header}>
          <h1>Register an organization</h1>

          <p>
            Create an account for an organization that buys, sells, or does
            both.
          </p>
        </header>

        {message && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}

        <form className={styles.form} onSubmit={submit}>
          <fieldset className={styles.accountTypes}>
            <legend>
              Account type <span aria-hidden="true">*</span>
            </legend>

            <div className={styles.accountGrid}>
              <label
                className={`${styles.accountOption} ${
                  accountType === "company" ? styles.selected : ""
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="company"
                  checked={accountType === "company"}
                  onChange={() => setAccountType("company")}
                />

                <span>
                  <strong>Company</strong>
                  <small>
                    <small>Manage my organization and its operations.</small>
                  </small>
                </span>
              </label>

              <label
                className={`${styles.accountOption} ${
                  accountType === "vendor" ? styles.selected : ""
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="vendor"
                  checked={accountType === "vendor"}
                  onChange={() => setAccountType("vendor")}
                />

                <span>
                  <strong>Vendor</strong>
                  <small>
                    <small>Offer goods or services to organizations.</small>
                  </small>
                </span>
              </label>

              <label
                className={`${styles.accountOption} ${
                  accountType === "both" ? styles.selected : ""
                }`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value="both"
                  checked={accountType === "both"}
                  onChange={() => setAccountType("both")}
                />

                <span>
                  <strong>Both</strong>
                  <small>
                    <small>
                      Manage my organization and offer goods or services.
                    </small>
                  </small>
                </span>
              </label>
            </div>
          </fieldset>

          {includesVendor && (
            <p className={styles.notice}>
              <strong>Certificate upload: coming soon.</strong> Vendor
              verification is a separate step from registration.
            </p>
          )}

          <div className={styles.columns}>
            <section className={styles.column}>
              <h2>Organization details</h2>

              <div className={styles.field}>
                <label htmlFor="name">Organization name *</label>

                <input id="name" name="name" required maxLength={255} />
              </div>

              <div className={styles.field}>
                <label htmlFor="legalName">
                  Legal name {includesVendor ? "*" : "(optional)"}
                </label>

                <input
                  id="legalName"
                  name="legalName"
                  required={includesVendor}
                  maxLength={255}
                />

                {includesVendor && (
                  <small>
                    Legal name is currently required for Vendor and Both
                    accounts.
                  </small>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="registrationNumber">
                  Registration number (optional)
                </label>

                <input
                  id="registrationNumber"
                  name="registrationNumber"
                  maxLength={100}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="taxIdentificationNumber">
                  Tax identification number (optional)
                </label>

                <input
                  id="taxIdentificationNumber"
                  name="taxIdentificationNumber"
                  maxLength={100}
                />
              </div>

              {includesCompany && (
                <div className={styles.field}>
                  <label htmlFor="industry">Industry (optional)</label>

                  <input
                    id="industry"
                    name="industry"
                    maxLength={100}
                    placeholder="For example, oil and gas"
                  />
                </div>
              )}
            </section>

            <section className={styles.column}>
              <h2>Location and preferences</h2>

              <div className={styles.twoFields}>
                <div className={styles.field}>
                  <label htmlFor="countryCode">Country code *</label>

                  <input
                    id="countryCode"
                    name="countryCode"
                    defaultValue="NG"
                    required
                    minLength={2}
                    maxLength={2}
                    pattern="[A-Za-z]{2}"
                    title="Enter a two-letter country code, such as NG."
                  />
                </div>

                {includesCompany && (
                  <div className={styles.field}>
                    <label htmlFor="defaultCurrency">Currency code *</label>

                    <input
                      id="defaultCurrency"
                      name="defaultCurrency"
                      defaultValue="NGN"
                      required
                      minLength={3}
                      maxLength={3}
                      pattern="[A-Za-z]{3}"
                      title="Enter a three-letter currency code, such as NGN."
                    />
                  </div>
                )}
              </div>

              {includesCompany && (
                <div className={styles.field}>
                  <label htmlFor="timezone">Time zone *</label>

                  <input
                    id="timezone"
                    name="timezone"
                    defaultValue="Africa/Lagos"
                    required
                    maxLength={100}
                    placeholder="Africa/Lagos"
                  />

                  <small>Use a time-zone name such as Africa/Lagos.</small>
                </div>
              )}

              <h2 className={styles.ownerHeading}>Organization owner</h2>

              {includesCompany && (
                <p className={styles.ownerNote}>
                  The person registering will become the company administrator.
                </p>
              )}

              <div className={styles.twoFields}>
                <div className={styles.field}>
                  <label htmlFor="firstName">First name *</label>

                  <input
                    id="firstName"
                    name="firstName"
                    required
                    maxLength={100}
                    autoComplete="given-name"
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="lastName">Last name *</label>

                  <input
                    id="lastName"
                    name="lastName"
                    required
                    maxLength={100}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Email address *</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="password">Password *</label>

                <div className={styles.passwordField}>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={15}
                    maxLength={128}
                    autoComplete="new-password"
                    aria-describedby="password-help"
                  />

                  <button
                    className={styles.passwordToggle}
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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

                <small id="password-help">Use at least 15 characters.</small>
              </div>
            </section>
          </div>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={pending}
          >
            {pending ? "Registering…" : "Register"}
          </button>
        </form>

        <p className={styles.signIn}>
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
