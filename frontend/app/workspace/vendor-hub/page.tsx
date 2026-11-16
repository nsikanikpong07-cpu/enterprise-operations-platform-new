import { redirect } from 'next/navigation';
import { backendGet } from '../../../lib/backend';
import { currentCompany } from '../../../lib/company';
import VendorHubWorkspace from './vendor-hub-workspace';

export default async function VendorHubPage() {
  const current = await currentCompany();
  if (current.status === 401) redirect('/login');
  if (current.status !== 200 || !current.company) return <section><h1>Vendor Hub</h1><p>Company workspace could not be loaded.</p></section>;
  const result = await backendGet(`/vendor-hub?companyId=${encodeURIComponent(current.company.id)}&page=1&pageSize=10`);
  if (result.status === 401) redirect('/login');
  if (result.status !== 200 || !result.data || typeof result.data !== 'object') return <section><h1>Vendor Hub</h1><p>Verified supplier directory could not be loaded. Check your access and try again.</p></section>;
  return <VendorHubWorkspace mode="hub" initial={result.data as { items: never[]; total: number; page: number; pageSize: number }} />;
}
