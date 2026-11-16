import { redirect } from "next/navigation";
import { backendGet } from "../../../lib/backend";
import SupplierBusinessProfile, {
  type SupplierBusinessProfileData,
} from "../../components/supplier-business-profile";
import styles from "./business-profile.module.css";

function isProfile(value: unknown): value is SupplierBusinessProfileData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<SupplierBusinessProfileData>;
  return Boolean(data.supplier && Array.isArray(data.contacts));
}

export default async function BusinessProfilePage() {
  const result = await backendGet("/vendor/me");
  if (result.status === 401) redirect("/login");

  if (result.status !== 200 || !isProfile(result.data)) {
    return (
      <section className={styles.page}>
        <h1>Business profile</h1>
        <p role="alert">Your supplier profile could not be loaded. Please refresh and try again.</p>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Business profile</h1>
        <p>Manage your registered business information and contact people.</p>
        <p className={styles.hint}>
          <span aria-hidden="true">ⓘ</span>
          The primary contact receives verification and RFQ notifications.
        </p>
      </header>
      <SupplierBusinessProfile initialData={result.data} />
    </section>
  );
}
