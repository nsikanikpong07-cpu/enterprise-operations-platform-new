import { redirect } from 'next/navigation';
import { backendGet } from '../../../lib/backend';
import SupplierListings from '../../components/supplier-listings';
import styles from './products.module.css';

export type SupplierListing = {
  id: string;
  listingType: 'product' | 'service';
  name: string;
  category: string;
  description: string;
  pricingModel: 'fixed' | 'price_on_request';
  price: string | null;
  currency: string;
  unit: string | null;
  specifications: string | null;
  dimensions: string | null;
  serviceArea: string | null;
  photos: string[];
  status: 'draft' | 'active' | 'unpublished' | 'deleted';
};

export default async function SupplierProductsPage() {
  const result = await backendGet('/vendor/me/listings');
  if (result.status === 401) redirect('/login');
  const listings = result.status === 200 && Array.isArray(result.data)
    ? result.data as SupplierListing[]
    : [];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Products &amp; services</h1>
          <p>Manage what your business offers to companies.</p>
        </div>
      </header>
      {result.status === 200
        ? <SupplierListings initialListings={listings} />
        : <p className={styles.error} role="alert">Your listings could not be loaded. Please refresh and try again.</p>}
    </section>
  );
}
