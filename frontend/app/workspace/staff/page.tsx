import { redirect } from "next/navigation";

import StaffForm from "../../components/staff-form";
import StaffDepartmentEditor from "../../components/staff-department-editor";
import StaffStatusButton from "../../components/staff-status-button";

import { backendGet } from "../../../lib/backend";
import { currentCompany } from "../../../lib/company";

import styles from "./staff.module.css";

interface Membership {
  id: string;
  status?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;

  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}

interface Department {
  id: string;
  name: string;
}

function getInitials(firstName?: string | null, lastName?: string | null) {
  const initials = [firstName, lastName]
    .map((name) => name?.trim().charAt(0) ?? "")
    .join("")
    .toUpperCase();

  return initials || "?";
}

export default async function StaffPage() {
  const companyResult = await currentCompany();

  if (companyResult.status === 401) {
    redirect("/login");
  }

  if (companyResult.status !== 200) {
    return (
      <section className={styles.page}>
        <h1>Staff</h1>

        <p className={styles.message}>
          We could not load your company. Please try again.
        </p>
      </section>
    );
  }

  const company = companyResult.company;

  if (!company) {
    return (
      <section className={styles.page}>
        <h1>Staff</h1>

        <p className={styles.message}>
          A company workspace is required to view staff.
        </p>
      </section>
    );
  }

  const companyId = encodeURIComponent(company.id);

  const [result, departmentsResult] = await Promise.all([
    backendGet(`/iam/users/companies/${companyId}/members`),
    backendGet(`/organization/companies/${companyId}/departments`),
  ]);

  if (result.status === 401 || departmentsResult.status === 401) {
    redirect("/login");
  }

  if (result.status !== 200 || !Array.isArray(result.data)) {
    return (
      <section className={styles.page}>
        <p className={styles.eyebrow}>Your workspace</p>

        <h1>Staff</h1>

        <p className={styles.message}>
          {result.status === 403
            ? "You do not have permission to view staff."
            : "Staff information could not be loaded. Please try again."}
        </p>
      </section>
    );
  }

  const staff = result.data as Membership[];

  const departmentsAvailable =
    departmentsResult.status === 200 && Array.isArray(departmentsResult.data);

  const departments: Department[] = departmentsAvailable
    ? (departmentsResult.data as Department[])
    : [];

  return (
    <section className={styles.page}>
      <p className={styles.eyebrow}>Your workspace</p>

      <h1>Staff</h1>

      <p className={styles.introduction}>
        View and add members of your organization.
      </p>

      <div className={styles.tableCard}>
        {staff.length === 0 ? (
          <p className={styles.emptyMessage}>No staff records found.</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Job title</th>
                  <th scope="col">Department</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {staff.map((membership) => {
                  const firstName = membership.user?.firstName;
                  const lastName = membership.user?.lastName;

                  const fullName =
                    [firstName, lastName].filter(Boolean).join(" ") ||
                    "Not provided";

                  const status = membership.status || "Not provided";

                  const departmentName = departmentsAvailable
                    ? departments.find(
                        (department) =>
                          department.id === membership.departmentId,
                      )?.name ||
                      (membership.departmentId
                        ? "Department unavailable"
                        : "Not assigned")
                    : "Could not load departments";

                  return (
                    <tr key={membership.id}>
                      <td>
                        <div className={styles.person}>
                          <span className={styles.avatar} aria-hidden="true">
                            {getInitials(firstName, lastName)}
                          </span>

                          <span className={styles.personName}>{fullName}</span>
                        </div>
                      </td>

                      <td>{membership.user?.email || "Not provided"}</td>

                      <td>{membership.jobTitle || "Not provided"}</td>

                      <td>{departmentName}</td>

                      <td>
                        <span
                          className={
                            status.toLowerCase() === "active"
                              ? styles.activeStatus
                              : styles.otherStatus
                          }
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <div className={styles.rowActions}>
                          <StaffStatusButton
                            membershipId={membership.id}
                            staffName={fullName}
                            status={status}
                          />

                          <StaffDepartmentEditor
                            membershipId={membership.id}
                            staffName={fullName}
                            currentDepartmentId={membership.departmentId}
                            departments={departments}
                            departmentsAvailable={departmentsAvailable}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StaffForm
        departments={departments}
        departmentsAvailable={departmentsAvailable}
      />
    </section>
  );
}
