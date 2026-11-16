import { backendGet } from "./backend";
import { currentCompany } from "./company";
export async function myPermissions(): Promise<string[]> {
 const company = await currentCompany();
 if (!company.company) return [];
 const result = await backendGet(`/auth/my-permissions?companyId=${encodeURIComponent(company.company.id)}`);
 if (result.status !== 200 || !result.data || typeof result.data !== "object") return [];
 const permissions = (result.data as {permissions?:unknown}).permissions;
 return Array.isArray(permissions) ? permissions.filter((p):p is string => typeof p === "string") : [];
}
