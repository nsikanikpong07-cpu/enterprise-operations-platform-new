import { redirect } from "next/navigation";
import { currentCompany } from "../../../lib/company";
import { backendGet } from "../../../lib/backend";
interface AuditEntry {
  id: string;
  action?: string;
  entityType?: string;
  createdAt?: string;
  user?: { firstName?: string; lastName?: string; email?: string } | null;
}
export default async function AuditPage() {
  const c = await currentCompany();
  if (c.status === 401) redirect("/login");
  if (!c.company)
    return (
      <section>
        <h1>Audit trail</h1>
        <p>A company workspace is required.</p>
      </section>
    );
  const result = await backendGet(
    `/audit/logs?companyId=${encodeURIComponent(c.company.id)}`,
  );
  if (result.status !== 200 || !Array.isArray(result.data))
    return (
      <section>
        <h1>Audit trail</h1>
        <p>
          {result.status === 403
            ? "You do not have permission to view audit records."
            : "Audit records could not be loaded."}
        </p>
      </section>
    );
  const entries = result.data as AuditEntry[];
  return (
    <section>
      <p className="eyebrow">{c.company.name}</p>
      <h1>Audit trail</h1>
      <p className="hint">The latest 200 events, when available.</p>
      {entries.length === 0 ? (
        <p>No audit records found.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Record</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.createdAt
                      ? new Date(item.createdAt)
                          .toISOString()
                          .replace("T", " ")
                          .replace(".000Z", " UTC")
                      : "Not provided"}
                  </td>
                  <td>{item.action ?? "Not provided"}</td>
                  <td>{item.entityType ?? "Not provided"}</td>
                  <td>
                    {[item.user?.firstName, item.user?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                      item.user?.email ||
                      "System or unavailable"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
