import Link from "next/link";
import { redirect } from "next/navigation";
import { currentCompany } from "../../../../../lib/company";
import { backendGet } from "../../../../../lib/backend";
import DepartmentStaff from "../../../../components/department-staff";
import styles from "../../organization.module.css";

type Department = { id: string; name: string; code?: string | null };
type Member = { id: string; departmentId?: string | null; status?: string | null; jobTitle?: string | null; user?: { firstName?: string | null; lastName?: string | null } | null };

export default async function DepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await currentCompany();
  if (current.status === 401) redirect("/login");
  if (!current.company) return <p role="alert">Company workspace could not be loaded.</p>;
  const companyId = encodeURIComponent(current.company.id);
  const [departments, staff] = await Promise.all([
    backendGet(`/organization/companies/${companyId}/departments`),
    backendGet(`/iam/users/companies/${companyId}/members`),
  ]);
  if (departments.status === 401 || staff.status === 401) redirect("/login");
  if (departments.status !== 200 || !Array.isArray(departments.data)) return <p role="alert">Departments could not be loaded.</p>;
  const department = (departments.data as Department[]).find(d => d.id === id);
  if (!department) return <p role="alert">Department not found.</p>;
  return <section className={styles.page}>
    <Link href="/workspace/organization">← Back to organization</Link>
    <h1>{department.name}</h1><p className={styles.introduction}>Department details</p>
    {department.code && <p>Code: {department.code}</p>}
    <section className={styles.panel}><h2>Staff in this department</h2>
      {staff.status === 200 && Array.isArray(staff.data) ? <DepartmentStaff staff={(staff.data as Member[]).filter(member => member.departmentId === id)} /> : <p role="alert">Staff could not be loaded. Check your access and try again.</p>}
    </section>
  </section>;
}
