import Link from 'next/link';
import {redirect} from 'next/navigation';
import {currentCompany} from '../../../../../lib/company';
import {backendGet} from '../../../../../lib/backend';
import OrderWorkspace from '../../../../components/order-workspace';
import styles from '../../procurement.module.css';
export default async function NewOrder(){const current=await currentCompany();if(current.status===401)redirect('/login');if(!current.company)return <p>Company workspace unavailable.</p>;const id=encodeURIComponent(current.company.id);const [suppliers,requisitions]=await Promise.all([backendGet(`/procurement/eligible-suppliers?companyId=${id}`),backendGet(`/procurement/requisitions?companyId=${id}`)]);return <section className={styles.page}><Link href="/workspace/procurement/orders">← Back to purchase orders</Link><h1>Create purchase order</h1><p className={styles.intro}>Order items from an approved requisition.</p>{suppliers.status===200&&requisitions.status===200&&Array.isArray(suppliers.data)&&Array.isArray(requisitions.data)?<OrderWorkspace orders={[]} suppliers={suppliers.data} requisitions={requisitions.data} createOnly/>:<p role="alert">Suppliers or requisitions could not be loaded.</p>}</section>}
