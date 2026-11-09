"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  WorkspaceIcon,
  type WorkspaceIconName,
} from "../components/workspace-icons";

interface NavigationItem {
  href: string;
  label: string;
  icon: WorkspaceIconName;
}

const navigation: NavigationItem[] = [
  { href: "/workspace", label: "Overview", icon: "overview" },
  {
    href: "/workspace/organization",
    label: "Organization",
    icon: "organization",
  },
  { href: "/workspace/staff", label: "Staff", icon: "staff" },
  {
    href: "/workspace/roles",
    label: "Roles & permissions",
    icon: "roles",
  },
  {
    href: "/workspace/catalog",
    label: "Catalog",
    icon: "catalog",
  },
  {
    href: "/workspace/suppliers",
    label: "Suppliers",
    icon: "suppliers",
  },
  {
    href: "/workspace/procurement",
    label: "Procurement",
    icon: "procurement",
  },
  {
    href: "/workspace/audit",
    label: "Audit trail",
    icon: "audit",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`im-sidebar im-collapsible-sidebar ${
        collapsed ? "im-sidebar-collapsed" : ""
      }`}
    >
      <div className="im-sidebar-top">
        <Link
          className="im-brand im-sidebar-brand"
          href="/"
          aria-label="Go to IMPRESSOR home page"
        >
          <span className="im-brand-mark">IM</span>

          {!collapsed && <span className="im-brand-name">IMPRESSOR</span>}
        </Link>

        <button
          type="button"
          className="im-sidebar-toggle"
          onClick={() => setCollapsed((previous) => !previous)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="workspace-navigation"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <WorkspaceIcon name="sidebar" />
        </button>
      </div>

      <div className="im-sidebar-divider" />

      <nav
        id="workspace-navigation"
        className="im-navigation"
        aria-label="Workspace navigation"
      >
        {!collapsed && <p className="im-navigation-heading">Workspace</p>}

        {navigation.map((item) => {
          const active =
            item.href === "/workspace"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`im-navigation-link ${
                active ? "im-navigation-link-active" : ""
              }`}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span className="im-navigation-icon">
                <WorkspaceIcon name={item.icon} />
              </span>

              {!collapsed && (
                <span className="im-navigation-text">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
