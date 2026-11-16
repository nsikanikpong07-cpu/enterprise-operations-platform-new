import Link from "next/link";
import { redirect } from "next/navigation";
import { backendGet } from "../../lib/backend";

type WorkspaceResult = {
  supplier?: { legalName?: string; tradingName?: string };
  verificationStatus?: string;
};

type ListingResult = { status?: string };

const statusCopy: Record<string, { label: string; description: string }> = {
  verified: { label: "Verified", description: "Your business is visible to eligible buyers." },
  under_review: { label: "Under review", description: "The IMPRESSOR team is reviewing your submitted documents." },
  rejected: { label: "Changes requested", description: "Review your verification page for the requested changes." },
  expired: { label: "Expired", description: "Update your documents to restore your verified status." },
  not_verified: { label: "Not verified", description: "Complete your verification to become discoverable to buyers." },
};

export default async function SupplierOverviewPage() {
  const [workspaceResult, listingsResult] = await Promise.all([
    backendGet("/vendor/me"),
    backendGet("/vendor/me/listings"),
  ]);
  if (workspaceResult.status === 401 || listingsResult.status === 401) redirect("/login");

  const workspace = workspaceResult.status === 200
    ? workspaceResult.data as WorkspaceResult
    : null;
  const listings = listingsResult.status === 200 && Array.isArray(listingsResult.data)
    ? listingsResult.data as ListingResult[]
    : [];
  const businessName = workspace?.supplier?.tradingName || workspace?.supplier?.legalName || "your business";
  const verification = statusCopy[workspace?.verificationStatus ?? "not_verified"] ?? statusCopy.not_verified;
  const activeListings = listings.filter((listing) => listing.status === "active").length;

  return (
    <section className="supplier-dashboard">
      <header className="supplier-page-heading">
        <h1>Good day, {businessName}</h1>
        <p>Your supplier workspace at a glance.</p>
      </header>

      {workspaceResult.status !== 200 && (
        <p className="supplier-rfq-error" role="alert">Your business overview could not be loaded. Refresh the page to try again.</p>
      )}

      <section className="supplier-dashboard-status" aria-labelledby="supplier-verification-heading">
        <div>
          <h2 id="supplier-verification-heading">Verification status</h2>
          <p>{verification.description}</p>
        </div>
        <span className="supplier-status-badge" data-status={workspace?.verificationStatus ?? "not_verified"}>
          {workspace?.verificationStatus === "verified" && <span aria-hidden="true">✓</span>}
          {verification.label}
        </span>
      </section>

      <div className="supplier-dashboard-metrics" aria-label="Supplier activity">
        <article className="supplier-dashboard-card">
          <span>Active listings</span>
          <strong>{listingsResult.status === 200 ? activeListings : "—"}</strong>
        </article>
        <article className="supplier-dashboard-card">
          <span>Open RFQs</span>
          <strong aria-label="RFQ count is not available yet">—</strong>
        </article>
        <article className="supplier-dashboard-card">
          <span>Quotations submitted</span>
          <strong aria-label="Quotation count is not available yet">—</strong>
        </article>
      </div>

      <section className="supplier-dashboard-section" aria-labelledby="supplier-recent-rfqs-heading">
        <div className="supplier-dashboard-section-header">
          <h2 id="supplier-recent-rfqs-heading">Recent RFQs</h2>
          <Link className="supplier-dashboard-link" href="/supplier-workspace/requests">View RFQs</Link>
        </div>
        <div className="supplier-dashboard-empty">
          <strong>Your RFQ invitations will appear here.</strong>
          <p>When a buyer invites your business to quote, you can review and respond from Requests for quotation.</p>
        </div>
      </section>

      <section className="supplier-dashboard-section" aria-label="Listing management">
        <div className="supplier-dashboard-section-header">
          <h2>Share what your business offers</h2>
          <Link className="supplier-dashboard-link" href="/supplier-workspace/products">Manage listings</Link>
        </div>
      </section>
    </section>
  );
}
