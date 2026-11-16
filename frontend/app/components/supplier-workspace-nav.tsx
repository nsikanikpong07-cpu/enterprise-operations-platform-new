"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WorkspaceIcon } from "./workspace-icons";

const navigation = [
  { href: "/supplier-workspace", label: "Overview", icon: "overview" as const },
  { href: "/supplier-workspace/business-profile", label: "Business profile", icon: "organization" as const },
  { href: "/supplier-workspace/products", label: "Products & services", icon: "catalog" as const },
  { href: "/supplier-workspace/requests", label: "Requests for quotation", icon: "audit" as const },
  { href: "/supplier-workspace/verification", label: "Verification", icon: "roles" as const },
];

export default function SupplierWorkspaceNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`supplier-sidebar${collapsed ? " supplier-sidebar--collapsed" : ""}`}>
      <div className="supplier-sidebar-header">
        <Link className="supplier-brand" href="/" aria-label="Go to IMPRESSOR home page" title="IMPRESSOR home">
          <span className="supplier-brand-mark" aria-hidden="true">IM</span>
          {!collapsed && <span className="supplier-brand-wordmark">IMPRESSOR</span>}
        </Link>
        <button
          type="button"
          className="supplier-sidebar-toggle"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="supplier-workspace-navigation"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <WorkspaceIcon name="sidebar" />
        </button>
      </div>

      <div className="supplier-sidebar-divider" />

      <nav id="supplier-workspace-navigation" aria-label="Supplier workspace navigation">
        {navigation.map((item) => {
          const active = item.href === "/supplier-workspace"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="supplier-nav-link"
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span className="supplier-nav-icon"><WorkspaceIcon name={item.icon} /></span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
