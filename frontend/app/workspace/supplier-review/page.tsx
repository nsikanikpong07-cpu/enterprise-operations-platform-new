import { redirect } from "next/navigation";
import { backendGet } from "../../../lib/backend";
import { currentCompany } from "../../../lib/company";
import SupplierReview from "../../components/supplier-review";
import styles from "../procurement/procurement.module.css";

export default async function SupplierReviewPage() {
  const current=await currentCompany();
  if(current.status===401) redirect("/login");
  if(!current.company) return <section className={styles.page}><h1>Supplier verification</h1><p>A company workspace is required.</p></section>;
  const [result, registry]=await Promise.all([backendGet(`/vendor/suppliers/profiles?companyId=${encodeURIComponent(current.company.id)}`),backendGet("/vendor/suppliers")]);
  return <section className={styles.page}><p className={styles.eyebrow}>Platform review</p><h1>Supplier verification</h1><p className={styles.intro}>Review supplier profiles for {current.company.name}.</p>{result.status===200&&Array.isArray(result.data)?<SupplierReview profiles={result.data} suppliers={registry.status===200&&Array.isArray(registry.data)?registry.data:[]} suppliersAvailable={registry.status===200&&Array.isArray(registry.data)}/>:<p role="alert">{result.status===403?"Platform reviewer access is required.":"Supplier profiles could not be loaded."}</p>}</section>;
}
