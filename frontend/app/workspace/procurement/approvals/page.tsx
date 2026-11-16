import Link from 'next/link';
import {redirect} from 'next/navigation';
import {currentCompany} from '../../../../lib/company';
import {backendGet} from '../../../../lib/backend';
import ApprovalList from '../../../components/approval-list';
import styles from '../procurement.module.css';
export default async function ApprovalsPage(){const current=await currentCompany();if(current.status===401)redirect('/login');if(!current.company)return <p>Company workspace unavailable.</p>;const result=await backendGet(`/procurement/approvals/pending/me?companyId=${encodeURIComponent(current.company.id)}`);if(result.status===401)redirect('/login');return <section className={styles.page}><Link href="/workspace/procurement">← Back to procurement</Link><h1>My approvals</h1><p className={styles.intro}>Review pending requisitions.</p>{result.status===200&&Array.isArray(result.data)?<ApprovalList approvals={result.data}/>:<p role="alert">{result.status===403?'You do not have approval permission.':'Approvals could not be loaded.'}</p>}</section>}
