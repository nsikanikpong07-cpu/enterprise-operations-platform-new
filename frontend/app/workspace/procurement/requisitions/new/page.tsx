import Link from 'next/link';
import {redirect} from 'next/navigation';
import {backendGet} from '../../../../../lib/backend';
import {currentCompany} from '../../../../../lib/company';
import RequisitionCreatePage from '../../../../components/requisition-create-page';
import styles from '../../procurement.module.css';
export default async function NewRequisition(){const current=await currentCompany();if(current.status===401)redirect('/login');if(!current.company)return <p>Company workspace unavailable.</p>;const id=encodeURIComponent(current.company.id);const [items,units,departments]=await Promise.all([backendGet(`/catalog/items?companyId=${id}`),backendGet('/catalog/units'),backendGet(`/organization/companies/${id}/departments`)]);const available=[items,units,departments].every(x=>x.status===200&&Array.isArray(x.data));return <section className={styles.page}><Link href="/workspace/procurement/requisitions">← Back to requisitions</Link><h1>Create requisition</h1><p className={styles.intro}>Describe what you need and add items.</p><RequisitionCreatePage items={Array.isArray(items.data)?items.data.filter((i:{isActive?:boolean})=>i.isActive!==false):[]} units={Array.isArray(units.data)?units.data:[]} departments={Array.isArray(departments.data)?departments.data:[]} available={available}/></section>}
