import Link from "next/link";
import { redirect } from "next/navigation";
import { backendGet } from "../../lib/backend";
import SupplierWorkspaceNav from "../components/supplier-workspace-nav";
import "./supplier-workspace.css";

export default async function SupplierWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await backendGet("/auth/me");
  if (session.status === 401) redirect("/login");

  const supplier = await backendGet("/vendor/me");
  if (supplier.status === 401) redirect("/login");
  if (supplier.status !== 200) {
    return (
      <main className="supplier-unavailable">
        <section>
          <h1>Supplier workspace unavailable</h1>
          <p>
            This account is not connected to a supplier profile. Sign in with
            the account used to register the supplier.
          </p>
          <Link href="/workspace">Return to workspace</Link>
        </section>
      </main>
    );
  }

  return (
    <div className="supplier-workspace">
      <aside className="supplier-sidebar">
        <Link className="supplier-brand" href="/supplier-workspace/business-profile">
          <span className="supplier-brand-mark" aria-hidden="true">◢</span>
          <span>
            <strong>IMPRESSOR</strong>
            <small>SUPPLIER WORKSPACE</small>
          </span>
        </Link>
        <SupplierWorkspaceNav />
      </aside>
      <div className="supplier-main">
        <header className="supplier-topbar">
          <span>Supplier workspace</span>
          <span className="supplier-topbar-user">Supplier account</span>
        </header>
        <main className="supplier-content">{children}</main>
      </div>
    </div>
  );
}
