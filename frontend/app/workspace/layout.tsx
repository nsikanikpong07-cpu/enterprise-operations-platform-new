import { redirect } from "next/navigation";

import { backendGet } from "../../lib/backend";
import Sidebar from "./sidebar";
import { myPermissions } from "../../lib/permissions";
import Link from "next/link";
import ThemeToggle from "../components/theme-toggle";

import "./workspace.css";
import "./sidebar.css";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check the user's session before displaying the workspace.
  const session = await backendGet("/auth/me");

  if (session.status === 401) {
    redirect("/login");
  }

  if (session.status !== 200) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Workspace unavailable</h1>

          <p>
            Unable to verify your session. Check that the backend is running,
            then refresh the page.
          </p>
        </section>
      </main>
    );
  }

  const [permissions, reviewer] = await Promise.all([
    myPermissions(),
    backendGet("/vendor/suppliers"),
  ]);
  return (
    <div className="im-workspace">
      <Sidebar permissions={permissions} platformReviewer={reviewer.status === 200} />

      <div className="im-workspace-main">
        <header className="im-topbar">
          <span className="im-topbar-title">Workspace</span>

          <div className="im-topbar-actions">
            <Link href="/workspace/change-password">Change password</Link><ThemeToggle /><form action="/api/logout" method="post">
            <button className="im-signout-button" type="submit">
              <span aria-hidden="true">↪</span>
              Sign out
            </button>
          </form></div>
        </header>

        <main className="im-workspace-content">{children}</main>
      </div>
    </div>
  );
}
