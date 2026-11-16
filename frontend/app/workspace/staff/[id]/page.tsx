import Link from "next/link";
import { redirect } from "next/navigation";
import { currentCompany } from "../../../../lib/company";
import { backendGet } from "../../../../lib/backend";
import ManageStaff from "../../../components/manage-staff";
import styles from "../staff.module.css";
type Role = { id: string; name: string };
type Member = { id: string; departmentId?: string | null; jobTitle?: string | null; status?: string | null; user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null };
export default async function ManageStaffPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params; const current = await currentCompany(); if (current.status === 401) redirect("/login"); if (!current.company) return <p role="alert">Company workspace unavailable.</p>;
 const cid = encodeURIComponent(current.company.id); const mid = encodeURIComponent(id);
 const [members, departments, roles, assigned] = await Promise.all([backendGet(`/iam/users/companies/${cid}/members`), backendGet(`/organization/companies/${cid}/departments`), backendGet(`/iam/roles?companyId=${cid}`), backendGet(`/iam/user-roles/${mid}`)]);
 if ([members, departments, roles, assigned].some(r => r.status === 401)) redirect("/login");
 if ([members, departments, roles, assigned].some(r => r.status !== 200 || !Array.isArray(r.data))) return <p role="alert">Staff details could not be loaded. Check your access and try again.</p>;
 const member = (members.data as Member[]).find(m => m.id === id); if (!member) return <p role="alert">Staff member not found.</p>;
 const currentRoles = (assigned.data as { role?: Role }[]).flatMap(x => x.role ? [x.role] : []);
 const name = [member.user?.firstName, member.user?.lastName].filter(Boolean).join(" ") || "Staff member";
 return <section className={styles.page}><Link href="/workspace/staff">← Back to staff</Link><h1>Manage staff</h1><p className={styles.introduction}>{name} · {member.user?.email || "Email not provided"}</p><p>Job title: {member.jobTitle || "Not provided"} · Status: {member.status || "Not provided"}</p><ManageStaff id={id} departmentId={member.departmentId ?? null} departments={departments.data as Role[]} roles={roles.data as Role[]} assigned={currentRoles}/></section>;
}
