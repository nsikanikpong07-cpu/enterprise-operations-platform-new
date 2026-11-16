import { redirect } from "next/navigation";
import { myPermissions } from "../../../../../lib/permissions";
export default async function AccessLayout({ children }: { children: React.ReactNode }) {
 const permissions = await myPermissions();
 if (!["create_purchase_order"].some(permission => permissions.includes(permission))) redirect("/workspace");
 return children;
}
