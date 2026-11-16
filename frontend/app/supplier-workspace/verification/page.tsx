import { redirect } from 'next/navigation';
import { backendGet } from '../../../lib/backend';
import SupplierVerificationDocuments from '../../components/supplier-verification-documents';
import styles from '../business-profile/business-profile.module.css';

export default async function SupplierVerificationPage() {
  const [result, workspace] = await Promise.all([backendGet('/vendor/me/documents'), backendGet('/vendor/me')]);
  if (result.status === 401 || workspace.status === 401) redirect('/login');
  const documents = result.status === 200 && Array.isArray(result.data) ? result.data : [];
  const workspaceData = workspace.data && typeof workspace.data === 'object'
    ? workspace.data as { verificationStatus?: unknown }
    : null;
  const initialStatus = workspace.status === 200 && typeof workspaceData?.verificationStatus === 'string'
    ? workspaceData.verificationStatus
    : 'not_verified';
  return <section className={styles.page}>
    <header className={styles.header}>
      <h1>Verification status</h1>
      <p>Track your business verification and required documents.</p>
    </header>
    {result.status === 200
      ? <SupplierVerificationDocuments initialDocuments={documents} initialStatus={initialStatus} />
      : <p role="alert">Your verification documents could not be loaded. Please refresh and try again.</p>}
  </section>;
}
