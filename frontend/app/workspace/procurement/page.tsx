import Link from "next/link";
import { WorkspaceIcon, type WorkspaceIconName } from "../../components/workspace-icons";
import styles from "./procurement.module.css";
import { myPermissions } from "../../../lib/permissions";

const cards: { title: string; description: string; href: string; label: string; icon: WorkspaceIconName }[] = [
  { title: "Requisitions", description: "Create and track purchase requests.", href: "/workspace/procurement/requisitions", label: "View requisitions", icon: "catalog" },
  { title: "My approvals", description: "Review requisitions waiting for a decision.", href: "/workspace/procurement/approvals", label: "View approvals", icon: "roles" },
  { title: "Purchase orders", description: "Create and track orders and deliveries.", href: "/workspace/procurement/orders", label: "View purchase orders", icon: "procurement" },
  { title: "Requests for quotation", description: "Invite suppliers and compare their quotations.", href: "/workspace/procurement/rfqs", label: "View RFQs", icon: "procurement" },
  { title: "Goods receipts", description: "View deliveries recorded against a purchase order.", href: "/workspace/procurement/receipts", label: "View receipts", icon: "catalog" },
];

export default async function ProcurementPage() {
  const permissions = await myPermissions();
  const has = (...names: string[]) => names.some(name => permissions.includes(name));
  const allowed = (href: string) => href.endsWith("/requisitions") ? has("create_requisition") : href.endsWith("/approvals") ? has("approve_requisition") : href.endsWith("/rfqs") ? has("create_rfq") : href.endsWith("/orders") ? has("create_purchase_order", "receive_goods") : has("receive_goods");
  return <section className={styles.page}>
    <p className={styles.eyebrow}>Your workspace</p>
    <h1>Procurement</h1>
    <p className={styles.intro}>Manage requests, orders and goods received.</p>
    <div className={styles.grid}>{cards.filter(card => allowed(card.href)).map(card => <div className={styles.card} key={card.href}>
      <div className={styles.overviewIcon} aria-hidden="true"><WorkspaceIcon name={card.icon} /></div>
      <h2>{card.title}</h2><p>{card.description}</p><Link href={card.href}>{card.label} →</Link>
    </div>)}</div>
  </section>;
}
