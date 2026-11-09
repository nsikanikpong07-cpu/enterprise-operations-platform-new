import Link from "next/link";
import { redirect } from "next/navigation";

import RoleForm from "../../components/role-form";
import { WorkspaceIcon } from "../../components/workspace-icons";
import { currentCompany } from "../../../lib/company";
import { backendGet } from "../../../lib/backend";

interface Role {
  id: string;
  name: string;
  description?: string | null;
}

export default async function RolesPage() {
  const companyResult = await currentCompany();

  if (companyResult.status === 401) {
    redirect("/login");
  }

  if (companyResult.status !== 200) {
    return (
      <section>
        <h1>Roles &amp; permissions</h1>
        <p>Unable to load the company workspace.</p>
      </section>
    );
  }

  const company = companyResult.company;

  if (!company) {
    return (
      <section>
        <h1>Roles &amp; permissions</h1>
        <p>A company workspace is required.</p>
      </section>
    );
  }

  const result = await backendGet(
    `/iam/roles?companyId=${encodeURIComponent(company.id)}`,
  );

  if (result.status === 401) {
    redirect("/login");
  }

  if (result.status !== 200 || !Array.isArray(result.data)) {
    return (
      <section>
        <h1>Roles &amp; permissions</h1>

        <p>
          {result.status === 403
            ? "You do not have permission to view roles."
            : "Roles could not be loaded."}
        </p>
      </section>
    );
  }

  const roles = result.data as Role[];

  return (
    <section>
      <p className="im-overview-label">Your workspace</p>

      <h1>Roles &amp; permissions</h1>

      <p className="im-overview-intro">
        Manage the roles that define what people can do in your organization.
      </p>

      <div className="table-wrap" style={{ marginTop: "28px" }}>
        {roles.length === 0 ? (
          <p style={{ padding: "20px" }}>No roles found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">Role</th>
                <th scope="col">Description</th>
              </tr>
            </thead>

            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <Link
                      href={`/workspace/roles/${encodeURIComponent(role.id)}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        fontWeight: 700,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-flex",
                          width: "22px",
                          height: "22px",
                          color: "#b34f29",
                        }}
                      >
                        <WorkspaceIcon name="roles" />
                      </span>

                      {role.name}
                    </Link>
                  </td>

                  <td>{role.description || "Not provided"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: "24px" }}>
        <RoleForm />
      </div>
    </section>
  );
}
