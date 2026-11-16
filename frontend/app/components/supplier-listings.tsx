"use client";

import { useState, type FormEvent } from 'react';
import type { SupplierListing } from '../supplier-workspace/products/page';
import styles from './supplier-listings.module.css';

type ListingForm = {
  listingType: 'product' | 'service';
  name: string;
  category: string;
  description: string;
  pricingModel: 'fixed' | 'price_on_request';
  price: string;
  currency: string;
  unit: string;
  specifications: string;
  dimensions: string;
  serviceArea: string;
  photos: string[];
};

const emptyForm: ListingForm = {
  listingType: 'product', name: '', category: '', description: '', pricingModel: 'fixed',
  price: '', currency: 'NGN', unit: '', specifications: '', dimensions: '', serviceArea: '', photos: [],
};

const categories = {
  product: ['Office & Stationery', 'Industrial Supplies & Equipment', 'IT Equipment & Services', 'Safety & Protective Equipment', 'Building & Construction', 'Other'],
  service: ['Cleaning & Facilities Services', 'IT & Technology Services', 'Professional Services', 'Logistics & Transport', 'Maintenance & Repairs', 'Other'],
};

function toForm(listing: SupplierListing): ListingForm {
  return {
    listingType: listing.listingType, name: listing.name, category: listing.category,
    description: listing.description, pricingModel: listing.pricingModel,
    price: listing.price ?? '', currency: listing.currency || 'NGN', unit: listing.unit ?? '',
    specifications: listing.specifications ?? '', dimensions: listing.dimensions ?? '',
    serviceArea: listing.serviceArea ?? '', photos: listing.photos ?? [],
  };
}

function statusLabel(status: SupplierListing['status']) {
  return status === 'active' ? 'Published' : status === 'unpublished' ? 'Unpublished' : 'Draft';
}

export default function SupplierListings({ initialListings }: { initialListings: SupplierListing[] }) {
  const [listings, setListings] = useState(initialListings);
  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  function change<K extends keyof ListingForm>(key: K, value: ListingForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(listing: SupplierListing) {
    setEditingId(listing.id);
    setForm(toForm(listing));
    setMessage('');
    document.getElementById('listing-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage('');
  }

  async function postAction(id: string, action: 'publish' | 'unpublish' | 'draft') {
    const response = await fetch(`/api/supplier-workspace/listings/${id}/${action}`, { method: 'POST' });
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.message ?? `Could not ${action} listing.`);
    return result as SupplierListing;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value === 'publish' ? 'publish' : 'draft';
    setPending(true);
    setMessage('');
    const price = form.pricingModel === 'fixed' && form.price.trim() ? Number(form.price) : undefined;
    const payload = {
      listingType: form.listingType, name: form.name.trim(), category: form.category,
      description: form.description.trim(), pricingModel: form.pricingModel,
      ...(form.pricingModel === 'price_on_request' ? { price: null } : price === undefined ? {} : { price }), currency: form.currency,
      ...(form.unit.trim() ? { unit: form.unit.trim() } : {}),
      ...(form.specifications.trim() ? { specifications: form.specifications.trim() } : {}),
      ...(form.dimensions.trim() ? { dimensions: form.dimensions.trim() } : {}),
      ...(form.serviceArea.trim() ? { serviceArea: form.serviceArea.trim() } : {}),
      photos: form.photos,
    };

    try {
      const response = await fetch(editingId ? `/api/supplier-workspace/listings/${editingId}` : '/api/supplier-workspace/listings', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const saved = await response.json().catch(() => null);
      if (!response.ok) throw new Error(Array.isArray(saved?.message) ? saved.message.join(' ') : saved?.message ?? 'Could not save the listing.');
      const id = (saved as SupplierListing).id;
      let finalListing = saved as SupplierListing;
      if (intent === 'publish') {
        finalListing = await postAction(id, 'publish');
      } else if (editingId && finalListing.status !== 'draft') {
        finalListing = await postAction(id, 'draft');
      }
      setListings((current) => [finalListing, ...current.filter((listing) => listing.id !== id)]);
      setMessage(intent === 'publish' ? 'Listing published to the Vendor Hub.' : 'Draft saved.');
      setForm(emptyForm);
      setEditingId(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the listing. Please try again.');
    } finally {
      setPending(false);
    }
  }

  async function changeStatus(listing: SupplierListing, action: 'publish' | 'unpublish') {
    setPending(true);
    setMessage('');
    try {
      const updated = await postAction(listing.id, action);
      setListings((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(action === 'publish' ? 'Listing published.' : 'Listing hidden from the Vendor Hub. You can publish it again later.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update the listing.');
    } finally {
      setPending(false);
    }
  }

  async function uploadPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length) return;
    if (form.photos.length + files.length > 5) {
      setMessage('Add no more than five photos to one listing.');
      return;
    }
    setPending(true);
    setMessage('Uploading photos…');
    try {
      for (const file of files) {
        const body = new FormData();
        body.append('file', file);
        const response = await fetch('/api/supplier-workspace/listing-photos', { method: 'POST', body });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message ?? `Could not upload ${file.name}.`);
        setForm((current) => ({ ...current, photos: [...current.photos, result.id as string] }));
      }
      setMessage('Photos added.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not upload photos.');
    } finally {
      setPending(false);
    }
  }

  async function removeListing(listing: SupplierListing) {
    if (!window.confirm(`Delete “${listing.name}”? This removes it from your listings.`)) return;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch(`/api/supplier-workspace/listings/${listing.id}`, { method: 'DELETE' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? 'Could not delete the listing.');
      setListings((current) => current.filter((item) => item.id !== listing.id));
      if (editingId === listing.id) resetForm();
      setMessage('Listing deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete the listing.');
    } finally {
      setPending(false);
    }
  }

  const visibleListings = listings.filter((listing) => listing.status !== 'deleted');

  return (
    <div className={styles.layout}>
      <section className={styles.listSection} aria-labelledby="your-listings-heading">
        <div className={styles.listHeading}>
          <h2 id="your-listings-heading">Your listings ({visibleListings.length})</h2>
          <button type="button" className={styles.addButton} onClick={resetForm}>＋ <span>Add a listing</span></button>
        </div>
        {visibleListings.length === 0 ? (
          <div className={styles.empty}><strong>No listings yet</strong><p>Add your first product or service so companies can discover what you offer.</p></div>
        ) : (
          <div className={styles.cards}>
            {visibleListings.map((listing) => (
              <article className={styles.listingCard} key={listing.id}>
                <div className={styles.photo}>
                  {listing.photos?.[0] ? <img src={`/api/supplier-workspace/listing-photos/${listing.photos[0]}`} alt="" /> : <span aria-hidden="true">{listing.listingType === 'product' ? '▧' : '⚒'}</span>}
                </div>
                <div className={styles.listingDetails}>
                  <div className={styles.titleLine}>
                    <h3>{listing.name}</h3>
                    <span className={`${styles.badge} ${listing.listingType === 'service' ? styles.service : styles.product}`}>{listing.listingType}</span>
                  </div>
                  <div className={styles.statusLine}><span className={`${styles.status} ${styles[listing.status]}`}>{statusLabel(listing.status)}</span><span>{listing.category}</span></div>
                  <p>{listing.description}</p>
                  <strong className={styles.price}>{listing.pricingModel === 'price_on_request' ? 'Price on request' : `${listing.currency} ${Number(listing.price ?? 0).toLocaleString()}${listing.unit ? ` / ${listing.unit}` : ''}`}</strong>
                  {listing.listingType === 'service' && listing.serviceArea && <small>Service area: {listing.serviceArea}</small>}
                  {listing.specifications && <small>{listing.specifications}</small>}
                  <div className={styles.actions}>
                    <button type="button" onClick={() => startEdit(listing)} disabled={pending}>Edit</button>
                    {listing.status === 'active'
                      ? <button type="button" onClick={() => void changeStatus(listing, 'unpublish')} disabled={pending}>Unpublish</button>
                      : <button type="button" className={styles.publishAction} onClick={() => void changeStatus(listing, 'publish')} disabled={pending}>Publish</button>}
                    <button type="button" className={styles.deleteAction} onClick={() => void removeListing(listing)} disabled={pending}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.formCard} id="listing-form" aria-labelledby="listing-form-heading">
        <h2 id="listing-form-heading">{editingId ? 'Edit listing' : 'Add a listing'}</h2>
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.typeTabs} role="group" aria-label="Listing type">
            <button type="button" aria-pressed={form.listingType === 'product'} className={form.listingType === 'product' ? styles.selectedTab : ''} onClick={() => change('listingType', 'product')}>◇ <span>Product</span></button>
            <button type="button" aria-pressed={form.listingType === 'service'} className={form.listingType === 'service' ? styles.selectedTab : ''} onClick={() => change('listingType', 'service')}>⚒ <span>Service</span></button>
          </div>
          <label>{form.listingType === 'product' ? 'Product name' : 'Service name'} <em>*</em>
            <input required maxLength={255} value={form.name} onChange={(event) => change('name', event.target.value)} placeholder={form.listingType === 'product' ? 'Enter product name' : 'Enter service name'} />
          </label>
          <label>Category <em>*</em>
            <select required value={form.category} onChange={(event) => change('category', event.target.value)}>
              <option value="">Select category</option>
              {categories[form.listingType].map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>Description <em>*</em>
            <textarea required maxLength={3000} rows={3} value={form.description} onChange={(event) => change('description', event.target.value)} placeholder="Describe what you offer" />
          </label>
          {form.listingType === 'service' ? (
            <label>Service area <em>*</em><input required maxLength={255} value={form.serviceArea} onChange={(event) => change('serviceArea', event.target.value)} placeholder="e.g. Lagos, Abuja and Port Harcourt" /></label>
          ) : (
            <>
              <div className={styles.twoColumns}>
                <label>Price <em>*</em><div className={styles.priceControl}><select aria-label="Currency" value={form.currency} onChange={(event) => change('currency', event.target.value)}><option value="NGN">NGN</option><option value="USD">USD</option><option value="GBP">GBP</option></select><input required={form.pricingModel === 'fixed'} disabled={form.pricingModel === 'price_on_request'} type="number" min="0" step="0.01" value={form.price} onChange={(event) => change('price', event.target.value)} placeholder="Enter amount" /></div></label>
                <label>Unit <em>*</em><input required value={form.unit} onChange={(event) => change('unit', event.target.value)} placeholder="e.g. ream, unit, box" /></label>
              </div>
              <label>Specifications <em>*</em><textarea required maxLength={1500} rows={2} value={form.specifications} onChange={(event) => change('specifications', event.target.value)} placeholder="List key specifications, materials or features" /></label>
              <label>Dimensions <span>(optional)</span><input maxLength={255} value={form.dimensions} onChange={(event) => change('dimensions', event.target.value)} placeholder="e.g. 210 mm × 297 mm, 80 gsm" /></label>
            </>
          )}
          <label>Pricing <em>*</em>
            <select value={form.pricingModel} onChange={(event) => change('pricingModel', event.target.value as ListingForm['pricingModel'])}>
              <option value="fixed">Set a price</option><option value="price_on_request">Price on request</option>
            </select>
          </label>
          {form.listingType === 'service' && form.pricingModel === 'fixed' && <label>Price <em>*</em><div className={styles.priceControl}><select aria-label="Currency" value={form.currency} onChange={(event) => change('currency', event.target.value)}><option value="NGN">NGN</option><option value="USD">USD</option><option value="GBP">GBP</option></select><input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => change('price', event.target.value)} placeholder="Enter amount" /></div></label>}
          <div className={styles.photoField}>
            <label htmlFor="listing-photos">Photos <span>(optional, up to 5)</span></label>
            <div className={styles.photoPicker}>
              <span aria-hidden="true">⇧</span>
              <label className={styles.photoButton} htmlFor="listing-photos">Add photos</label>
              <input id="listing-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadPhotos} disabled={pending || form.photos.length >= 5} />
              <small>JPG, PNG or WEBP · Maximum 5 MB each</small>
            </div>
            {form.photos.length > 0 && <div className={styles.photoGrid}>{form.photos.map((photoId) => <figure key={photoId}><img src={`/api/supplier-workspace/listing-photos/${photoId}`} alt="Listing photo" /><button type="button" aria-label="Remove photo" onClick={() => change('photos', form.photos.filter((id) => id !== photoId))}>×</button></figure>)}</div>}
            <small>Photo files are stored privately and linked to the listing you publish.</small>
          </div>
          {message && <p className={styles.message} role="status">{message}</p>}
          <div className={styles.formActions}>
            {editingId && <button type="button" className={styles.cancelButton} onClick={resetForm} disabled={pending}>Cancel</button>}
            <button type="submit" name="intent" value="draft" className={styles.draftButton} disabled={pending}>{pending ? 'Saving…' : 'Save draft'}</button>
            <button type="submit" name="intent" value="publish" className={styles.primaryButton} disabled={pending}>{pending ? 'Saving…' : `Publish ${form.listingType}`}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
