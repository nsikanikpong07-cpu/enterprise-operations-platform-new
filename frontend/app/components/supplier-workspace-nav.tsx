"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceIcon } from './workspace-icons';

const navigation = [
  { href: '/supplier-workspace', label: 'Overview', icon: 'overview' as const },
  { href: '/supplier-workspace/business-profile', label: 'Business profile', icon: 'organization' as const },
  { href: '/supplier-workspace/products', label: 'Products & services', icon: 'catalog' as const },
  { href: '/supplier-workspace/requests', label: 'Requests for quotation', icon: 'audit' as const },
  { href: '/supplier-workspace/verification', label: 'Verification', icon: 'roles' as const },
];

export default function SupplierWorkspaceNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Supplier workspace navigation">
      {navigation.map((item) => {
        const current = item.href === '/supplier-workspace'
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className="supplier-nav-link" aria-current={current ? 'page' : undefined}>
            <WorkspaceIcon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
