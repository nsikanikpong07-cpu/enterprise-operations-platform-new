import { myPermissions } from "../../../../lib/permissions";
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {currentCompany} from '../../../../lib/company';
import {backendGet} from '../../../../lib/backend';
import RequisitionList from '../../../components/requisition-list';
import styles from '../procurement.module.css';
export default async function RequisitionsPage(){const result=await currentCompany();if(result.status===401)redirect('/login');if(!result.company)return <p>Company workspace unavailable.</p>;const permissions=await myPermissions();const canViewProcurement=["approve_requisition","create_purchase_order","receive_goods"].some(p=>permissions.includes(p));const list=await backendGet(`/procurement/requisitions?companyId=${encodeURIComponent(result.company.id)}`);if(list.status===401)redirect('/login');return <section className={styles.page}>{canViewProcurement?<Link href="/workspace/procurement">← Back to procurement</Link>:<Link href="/workspace">← Back to workspace</Link>}<h1>Requisitions</h1><p className={styles.intro}>Create and track purchase requests.</p>{list.status===200&&Array.isArray(list.data)?<RequisitionList canCreate={permissions.includes("create_requisition")} requisitions={list.data} items={[]} units={[]} departments={[]} optionsAvailable={false} staff={[]} staffAvailable={false}/>:<p role="alert">Requisitions could not be loaded.</p>}</section>}
