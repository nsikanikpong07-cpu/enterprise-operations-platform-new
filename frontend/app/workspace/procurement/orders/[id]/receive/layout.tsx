import { redirect } from "next/navigation";
import { myPermissions } from "../../../../../../lib/permissions";
export default async function ReceiveAccess({ children }: { children: React.ReactNode }) {
 const permissions = await myPermissions();
 if (!permissions.includes("receive_goods")) redirect("/workspace");
 return children;
}
