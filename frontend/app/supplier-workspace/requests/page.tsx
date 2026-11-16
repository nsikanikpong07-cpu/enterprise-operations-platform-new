import Link from "next/link";
import { redirect } from "next/navigation";
import { backendGet } from "../../../lib/backend";
import SupplierRfqNotifications from "../../components/supplier-rfq-notifications";

type RequestStatus = "all" | "open" | "closed";

const filters: Array<{ value: RequestStatus; label: string }> = [
  { value: "all", label: "All requests" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

export default async function SupplierRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status: RequestStatus = params.status === "open" || params.status === "closed"
    ? params.status
    : "all";
  const [result,notificationResult] = await Promise.all([
    backendGet(`/procurement/rfqs/supplier${status === "all" ? "" : `?status=${status}`}`),
    backendGet('/procurement/rfqs/supplier/notifications'),
  ]);
  if (result.status === 401) redirect("/login");
  const requests = result.status === 200 && Array.isArray(result.data) ? result.data as Array<{
    id: string; reference: string; title: string; buyer: string; response_deadline: string; status: string; response_status?: string | null;
  }> : [];
  const notifications=notificationResult.status===200&&Array.isArray(notificationResult.data)?notificationResult.data as Array<{id:string;rfq_id:string;title:string;message:string;email_status:string;read_at:string|null;created_at:string}>:[];

  return (
    <section className="supplier-rfq-page">
      <header className="supplier-page-heading">
        <h1>Requests for quotation</h1>
        <p>Review invitations and respond to buyers.</p>
      </header>

      <SupplierRfqNotifications items={notifications} />

      <nav className="supplier-rfq-toolbar" aria-label="Filter RFQ requests">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            className={`supplier-rfq-filter${status === filter.value ? " supplier-rfq-filter-active" : ""}`}
            href={filter.value === "all" ? "/supplier-workspace/requests" : `?status=${filter.value}`}
            aria-current={status === filter.value ? "page" : undefined}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <div className="supplier-rfq-table-wrap">
        <table className="supplier-rfq-table">
          <thead>
            <tr>
              <th scope="col">Request</th>
              <th scope="col">Buyer</th>
              <th scope="col">Response deadline</th>
              <th scope="col">Status</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => <tr key={request.id}>
              <td><strong>{request.reference}</strong><br />{request.title}</td>
              <td>{request.buyer}</td>
              <td>{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(request.response_deadline))} WAT</td>
              <td><span className="supplier-rfq-state" data-state={request.status}>{request.response_status === "submitted" ? "Quotation submitted" : request.response_status === "declined" ? "Declined" : request.status}</span></td>
              <td><Link className="supplier-rfq-action" href={`/supplier-workspace/requests/${encodeURIComponent(request.id)}`}>View request</Link></td>
            </tr>)}
            {!requests.length && <tr><td colSpan={5}><div className="supplier-rfq-empty">
              {result.status !== 200 ? <><strong>Requests could not be loaded</strong><p>Refresh the page or contact your administrator if the problem continues.</p></> : <><strong>No {status === "all" ? "RFQ invitations" : `${status} RFQ invitations`} yet</strong><p>When a buyer invites your business to quote, the request and its deadline will appear here.</p></>}
            </div></td></tr>}
          </tbody>
        </table>
      </div>

      <aside className="supplier-rfq-notice" role="note">
        <span aria-hidden="true">ⓘ</span>
        <p>If a buyer closes an RFQ early, the request status will update here. You’ll also be notified in your workspace and by email.</p>
      </aside>
    </section>
  );
}
