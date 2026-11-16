import { redirect } from "next/navigation";
import { backendGet } from "../../../lib/backend";
import { currentCompany } from "../../../lib/company";
import CatalogWorkspace from "../../components/catalog-workspace";
import styles from "./catalog.module.css";

export default async function CatalogPage() {
  const current = await currentCompany();
  if (current.status === 401) redirect("/login");
  if (current.status !== 200 || !current.company) return <section><h1>Item catalog</h1><p>Company workspace could not be loaded.</p></section>;
  const companyId = encodeURIComponent(current.company.id);
  const [items, categories, units] = await Promise.all([backendGet(`/catalog/items?companyId=${companyId}`), backendGet(`/catalog/categories?companyId=${companyId}`), backendGet("/catalog/units")]);
  if ([items.status, categories.status, units.status].includes(401)) redirect("/login");
  if (items.status !== 200 || categories.status !== 200 || units.status !== 200 || !Array.isArray(items.data) || !Array.isArray(categories.data) || !Array.isArray(units.data)) return <section><h1>Item catalog</h1><p>Catalog information could not be loaded. Check your access and try again.</p></section>;
  return <section className={styles.page}><p className={styles.eyebrow}>Your workspace</p><h1>Item catalog</h1><p className={styles.intro}>Manage the products and services your organization uses.</p><CatalogWorkspace items={items.data} categories={categories.data} units={units.data} /></section>;
}
