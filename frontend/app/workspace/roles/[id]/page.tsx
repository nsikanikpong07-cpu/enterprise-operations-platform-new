import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { WorkspaceIcon } from "../../../components/workspace-icons";
import PermissionList from "../../../components/permission-list";
import { backendGet } from "../../../../lib/backend";
import { currentCompany } from "../../../../lib/company";
import DeleteRoleButton from "../../../components/delete-role-button";
interface Role {
  id: string;
  name: string;
  description?: string | null;
}

interface Permission {
  id: string;
  name: string;
  description?: string | null;
}

interface PermissionGrant {
  permission?: {
    id?: string;
  };
}

export default async function RoleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const companyResult = await currentCompany();

  if (companyResult.status === 401) {
    redirect("/login");
  }

  if (companyResult.status !== 200 || !companyResult.company) {
    return (
      <section>
        <h1>Role unavailable</h1>
        <p>The company workspace could not be loaded.</p>
      </section>
    );
  }

  const companyId = encodeURIComponent(companyResult.company.id);
  const roleId = encodeURIComponent(id);

  const [roleResult, permissionsResult, grantsResult] = await Promise.all([
    backendGet(`/iam/roles/${roleId}`),
    backendGet(`/iam/permissions?companyId=${companyId}`),
    backendGet(`/iam/roles/${roleId}/permissions`),
  ]);

  if (
    roleResult.status === 401 ||
    permissionsResult.status === 401 ||
    grantsResult.status === 401
  ) {
    redirect("/login");
  }

  if (roleResult.status === 404) {
    notFound();
  }

  if (
    roleResult.status !== 200 ||
    permissionsResult.status !== 200 ||
    grantsResult.status !== 200 ||
    !Array.isArray(permissionsResult.data) ||
    !Array.isArray(grantsResult.data)
  ) {
    const forbidden =
      roleResult.status === 403 ||
      permissionsResult.status === 403 ||
      grantsResult.status === 403;

    return (
      <section>
        <Link href="/workspace/roles">← Back to roles</Link>

        <h1>Role unavailable</h1>

        <p>
          {forbidden
            ? "You do not have permission to manage this role."
            : "The role or its permissions could not be loaded. Please try again."}
        </p>
      </section>
    );
  }

  const role = roleResult.data as Role;
  const permissions = permissionsResult.data as Permission[];
  const grants = grantsResult.data as PermissionGrant[];

  const grantedIds = grants
    .map((grant) => grant.permission?.id)
    .filter((permissionId): permissionId is string => Boolean(permissionId));

  return (
    <section>
      <Link href="/workspace/roles">← Back to roles</Link>

      <p
        style={{
          display: "table",
          margin: "24px 0 18px",
          paddingBottom: "10px",
          borderBottom: "3px solid #bd6b45",
          color: "var(--theme-text-234b36, #234b36)",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        Roles &amp; permissions
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <span
          className="im-card-icon"
          style={{ width: "48px", height: "48px" }}
        >
          <WorkspaceIcon name="roles" />
        </span>

        <h1
          style={{
            margin: 0,
            color: "var(--theme-text-172d21, #172d21)",
            fontSize: "clamp(32px, 4vw, 46px)",
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
          }}
        >
          {role.name}
        </h1>
      </div>
      <p
        style={{
          margin: "8px 0 26px",
          color: "var(--theme-text-626a64, #626a64)",
          fontSize: "17px",
          lineHeight: 1.5,
        }}
      >
        {role.description || "Manage permissions for this role."}
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <DeleteRoleButton roleId={role.id} roleName={role.name} />
      </div>

      <PermissionList
        roleId={role.id}
        roleName={role.name}
        permissions={permissions}
        grantedIds={grantedIds}
      />
    </section>
  );
}
