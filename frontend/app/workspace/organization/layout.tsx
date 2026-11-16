import { redirect } from "next/navigation";
import { myPermissions } from "../../../lib/permissions";
export default async function AccessLayout({ children }: { children: React.ReactNode }) {
 const permissions = await myPermissions();
 if (!["manage_organization"].some(permission => permissions.includes(permission))) redirect("/workspace");
 return children;
}
