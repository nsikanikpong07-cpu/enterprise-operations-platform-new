import { redirect } from 'next/navigation';
import { backendGet } from '../../../../../lib/backend';
import { currentCompany } from '../../../../../lib/company';
import { myPermissions } from '../../../../../lib/permissions';
import RfqCreateForm from '../../../../components/rfq-create-form';

export default async function CreateRfqPage() {
  const permissions = await myPermissions();
  if (!permissions.includes('create_rfq')) redirect('/workspace');
  const company = await currentCompany();
  if (company.status === 401) redirect('/login');
  if (!company.company) return <section><h1>Create request for quotation</h1><p>Company workspace unavailable.</p></section>;
  const result = await backendGet(`/vendor-hub?companyId=${encodeURIComponent(company.company.id)}&page=1&pageSize=50`);
  const suppliers = result.status === 200 && result.data && typeof result.data === 'object' && Array.isArray((result.data as {items?:unknown[]}).items)
    ? (result.data as {items:Array<{id:string;name:string}>}).items : [];
  return <RfqCreateForm suppliers={suppliers} />;
}
