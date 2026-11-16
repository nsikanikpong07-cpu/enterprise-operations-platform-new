import { redirect } from "next/navigation";
import { myPermissions } from "../../../../../lib/permissions";
export default async function NewRequisitionAccess({ children }: { children: React.ReactNode }) { const permissions = await myPermissions(); if (!permissions.includes("create_requisition")) redirect("/workspace"); return children; }
