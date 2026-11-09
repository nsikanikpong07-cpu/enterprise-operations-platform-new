import pg from "pg";

// Maintenance-only setup for an existing test database. Not an HTTP endpoint.
// You explicitly choose the existing user; no account gets elevated silently.
const [companyId, userId] = process.argv.slice(2);
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if (!uuid.test(companyId ?? "") || !uuid.test(userId ?? "")) {
  throw new Error(
    "Usage: node --env-file=.env scripts/bootstrap-iam-admin.mjs COMPANY_ID USER_ID",
  );
}
const client = new pg.Client(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST ?? "localhost",
        port: Number(process.env.PGPORT ?? 5432),
        user: process.env.PGUSER ?? "enterprise_app",
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE ?? "enterprise_operations",
      },
);
await client.connect();
try {
  await client.query("BEGIN");
  // Serialize setup for this company so repeated commands are safe.
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
    `iam-bootstrap:${companyId}`,
  ]);
  const membership = await client.query(
    `
    SELECT cu.id FROM iam.company_users cu
    JOIN iam.users u ON u.id = cu.user_id
    JOIN organization.companies c ON c.id = cu.company_id
    WHERE cu.company_id = $1 AND cu.user_id = $2
      AND cu.status = 'active' AND u.status = 'active' AND c.status = 'active'
  `,
    [companyId, userId],
  );
  if (membership.rows.length !== 1)
    throw new Error(
      "An active account, company, and existing membership are required.",
    );
  const permission = await client.query(
    "SELECT id FROM iam.permissions WHERE name = 'manage_iam'",
  );
  if (permission.rows.length !== 1)
    throw new Error("Run the IAM authorization migration first.");
  let role = await client.query(
    `
    SELECT id FROM iam.roles WHERE company_id = $1 AND name = 'Company Admin (bootstrap)'
  `,
    [companyId],
  );
  if (!role.rows.length) {
    role = await client.query(
      `
      INSERT INTO iam.roles (company_id, name, description)
      VALUES ($1, 'Company Admin (bootstrap)', 'Explicit initial administrator setup for the existing test workspace')
      RETURNING id
    `,
      [companyId],
    );
  }
  const roleId = role.rows[0].id;
  const others = await client.query(
    `
    SELECT id FROM iam.user_roles WHERE role_id = $1 AND company_user_id <> $2
  `,
    [roleId, membership.rows[0].id],
  );
  if (others.rows.length)
    throw new Error(
      "The bootstrap role is assigned to another member. Setup stopped to avoid elevating them.",
    );
  await client.query(
    `
    INSERT INTO iam.role_permissions (role_id, permission_id) VALUES ($1, $2)
    ON CONFLICT (role_id, permission_id) DO NOTHING
  `,
    [roleId, permission.rows[0].id],
  );
  await client.query(
    `
    INSERT INTO iam.user_roles (company_user_id, role_id) VALUES ($1, $2)
    ON CONFLICT (company_user_id, role_id) DO NOTHING
  `,
    [membership.rows[0].id, roleId],
  );
  await client.query("COMMIT");
  console.log("Company administrator configured:", {
    companyId,
    userId,
    membershipId: membership.rows[0].id,
  });
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
