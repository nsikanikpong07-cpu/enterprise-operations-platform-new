import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkspaceIcon } from "../components/workspace-icons";
import { backendGet } from "../../lib/backend";

export default async function Workspace() {
  const result = await backendGet("/auth/me");

  if (result.status === 401) {
    redirect("/login");
  }

  if (result.status !== 200) {
    return (
      <section className="im-overview">
        <p className="im-overview-label">IMPRESSOR</p>
        <h1>Workspace unavailable</h1>

        <p className="im-overview-intro">
          We could not load your account. Check that the backend is running,
          then refresh the page.
        </p>
      </section>
    );
  }

  const user = result.data as { firstName?: string } | null;

  return (
    <section className="im-overview">
      <p className="im-overview-label">Your workspace</p>

      <h1>{user?.firstName ? `Welcome, ${user.firstName}` : "Welcome"}</h1>

      <p className="im-overview-intro">
        Manage your organization, your people, and their access in one place.
      </p>

      <h2 className="im-section-heading">Where would you like to go?</h2>

      <div className="im-card-grid">
        <Link className="im-overview-card" href="/workspace/organization">
          <span className="im-card-icon">
            <WorkspaceIcon name="organization" />
          </span>

          <h3>Organization</h3>
          <p>View your company workspace and organization details.</p>

          <span className="im-card-action">
            Open organization <span aria-hidden="true">→</span>
          </span>
        </Link>

        <Link className="im-overview-card" href="/workspace/staff">
          <span className="im-card-icon">
            <WorkspaceIcon name="staff" />
          </span>

          <h3>Staff</h3>
          <p>View the people who belong to your company.</p>

          <span className="im-card-action">
            Open staff <span aria-hidden="true">→</span>
          </span>
        </Link>

        <Link className="im-overview-card" href="/workspace/roles">
          <span className="im-card-icon">
            <WorkspaceIcon name="roles" />
          </span>

          <h3>Roles &amp; permissions</h3>
          <p>View the roles that define what people can do.</p>

          <span className="im-card-action">
            Open roles <span aria-hidden="true">→</span>
          </span>
        </Link>
      </div>

      <p className="im-permissions-note">
        What you can view or change depends on your permissions.
      </p>
    </section>
  );
}
