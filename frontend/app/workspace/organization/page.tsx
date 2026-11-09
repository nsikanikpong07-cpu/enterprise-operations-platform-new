import { redirect } from "next/navigation";

import DepartmentForm from "../../components/department-form";
import LocationForm from "../../components/location-form";
import OrganizationActions from "../../components/organization-actions";
import { WorkspaceIcon } from "../../components/workspace-icons";

import { backendGet } from "../../../lib/backend";
import { currentCompany } from "../../../lib/company";

import styles from "./organization.module.css";

interface OrganizationEntry {
  id: string;
  name: string;
  code?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  isActive?: boolean;
}

interface ManagerOption {
  id: string;
  name: string;
}

interface StaffMembership {
  id: string;
  status?: string | null;

  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    status?: string | null;
  } | null;
}

interface RecordsProps {
  title: "Departments" | "Locations";
  status: number;
  data: unknown;
}

function Records({ title, status, data }: RecordsProps) {
  if (status !== 200 || !Array.isArray(data)) {
    return (
      <p className={styles.message}>
        Could not load {title.toLowerCase()}. Check your access and try again.
      </p>
    );
  }

  const entries = data as OrganizationEntry[];

  if (entries.length === 0) {
    return <p className={styles.message}>No {title.toLowerCase()} found.</p>;
  }

  return (
    <ul className={styles.recordList}>
      {entries.map((entry) => {
        const locationDetails = [entry.address, entry.city, entry.state]
          .filter(Boolean)
          .join(", ");

        return (
          <li className={styles.record} key={entry.id}>
            <span className={styles.recordIcon} aria-hidden="true">
              <WorkspaceIcon
                name={title === "Departments" ? "department" : "location"}
              />
            </span>

            <div>
              <p className={styles.recordName}>{entry.name}</p>

              {title === "Departments" && entry.code && (
                <p className={styles.recordDetail}>Code: {entry.code}</p>
              )}

              {title === "Locations" && locationDetails && (
                <p className={styles.recordDetail}>{locationDetails}</p>
              )}

              {title === "Locations" && typeof entry.isActive === "boolean" && (
                <p className={styles.recordDetail}>
                  Status: {entry.isActive ? "Active" : "Inactive"}
                </p>
              )}
            </div>

            <OrganizationActions
              kind={title === "Departments" ? "department" : "location"}
              id={entry.id}
              name={entry.name}
              code={entry.code}
              address={entry.address}
              isActive={entry.isActive}
            />
          </li>
        );
      })}
    </ul>
  );
}

export default async function OrganizationPage() {
  const result = await currentCompany();

  if (result.status === 401) {
    redirect("/login");
  }

  if (result.status !== 200) {
    return (
      <section className={styles.page}>
        <p className={styles.eyebrow}>Your workspace</p>
        <h1>Organization</h1>

        <p className={styles.message}>
          Unable to load company information. Check your access and try again.
        </p>
      </section>
    );
  }

  const company = result.company;

  if (!company) {
    return (
      <section className={styles.page}>
        <p className={styles.eyebrow}>Your workspace</p>
        <h1>Organization</h1>

        <p className={styles.message}>
          No company workspace is available for this account.
        </p>
      </section>
    );
  }

  const companyId = encodeURIComponent(company.id);

  const [departments, locations, staffResult] = await Promise.all([
    backendGet(`/organization/companies/${companyId}/departments`),
    backendGet(`/organization/companies/${companyId}/locations`),
    backendGet(`/iam/users/companies/${companyId}/members`),
  ]);

  if (
    departments.status === 401 ||
    locations.status === 401 ||
    staffResult.status === 401
  ) {
    redirect("/login");
  }

  const managersAvailable =
    staffResult.status === 200 && Array.isArray(staffResult.data);

  const managerOptions: ManagerOption[] = managersAvailable
    ? (staffResult.data as StaffMembership[])
        .filter(
          (member) =>
            member.status?.toLowerCase() === "active" &&
            member.user?.status?.toLowerCase() === "active",
        )
        .map((member) => {
          const fullName = [member.user?.firstName, member.user?.lastName]
            .filter(Boolean)
            .join(" ")
            .trim();

          return {
            id: member.id,
            name: fullName || member.user?.email || "Unnamed staff member",
          };
        })
    : [];

  return (
    <section className={styles.page}>
      <p className={styles.eyebrow}>Your workspace</p>

      <h1>Organization</h1>

      <p className={styles.introduction}>
        Your company information and structure.
      </p>

      <section className={styles.companyCard} aria-labelledby="company-name">
        <span className={styles.companyIcon} aria-hidden="true">
          <WorkspaceIcon name="organization" />
        </span>

        <div className={styles.companyDetails}>
          <h2 id="company-name">{company.name}</h2>

          <p>Legal name: {company.legalName || "Not provided"}</p>

          <span
            className={
              company.status?.toLowerCase() === "active"
                ? styles.activeStatus
                : styles.neutralStatus
            }
          >
            {company.status || "Status not provided"}
          </span>
        </div>
      </section>

      <div className={styles.panelGrid}>
        <section className={styles.panel} aria-labelledby="departments-heading">
          <div className={styles.panelHeading}>
            <span className={styles.panelIcon} aria-hidden="true">
              <WorkspaceIcon name="department" />
            </span>

            <h2 id="departments-heading">Departments</h2>
          </div>

          <details className={styles.recordsDropdown}>
            <summary className={styles.recordsSummary}>
              <span>View departments</span>
              <span className={styles.dropdownChevron} aria-hidden="true" />
            </summary>

            <Records title="Departments" {...departments} />
          </details>

          <DepartmentForm
            managers={managerOptions}
            managersAvailable={managersAvailable}
          />
        </section>

        <section className={styles.panel} aria-labelledby="locations-heading">
          <div className={styles.panelHeading}>
            <span className={styles.panelIcon} aria-hidden="true">
              <WorkspaceIcon name="location" />
            </span>

            <h2 id="locations-heading">Locations</h2>
          </div>

          <details className={styles.recordsDropdown}>
            <summary className={styles.recordsSummary}>
              <span>View locations</span>
              <span className={styles.dropdownChevron} aria-hidden="true" />
            </summary>

            <Records title="Locations" {...locations} />
          </details>

          <LocationForm />
        </section>
      </div>
    </section>
  );
}
