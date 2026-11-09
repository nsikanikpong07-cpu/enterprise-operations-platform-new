import { backendGet } from "./backend";
export interface Company {
  id: string;
  name: string;
  legalName?: string | null;
  status?: string;
}
export async function currentCompany(): Promise<{
  status: number;
  company: Company | null;
}> {
  const result = await backendGet("/organization/companies");
  const companies = Array.isArray(result.data)
    ? (result.data as Company[])
    : [];
  return { status: result.status, company: companies[0] ?? null };
}
