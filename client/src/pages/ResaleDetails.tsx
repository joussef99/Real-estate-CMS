import { apiFetch, parseJsonResponse } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ResaleListing } from '../types';
import { MapPin, Bed, Maximize2, ChevronLeft, ChevronRight, CalendarClock, ListChecks, Wallet, Layers } from 'lucide-react';
import { Button } from '../components/Button';
import { FavoriteButton } from '../components/FavoriteButton';
import { ShareButton } from '../components/ShareButton';
import { FALLBACK_IMAGE_URL, resolveImageUrl, withFallbackImage } from '../utils/image';
import { formatSize } from '../utils/size';
import { formatPrice } from '../utils/price';
import { ErrorState } from '../components/ui/state-message';
import { useApiData } from '../hooks/useApiData';

export default function ResaleDetails() {
  const { slug } = useParams();
  const { data: listing, loading, error, refetch } = useApiData<ResaleListing>(slug ? `/api/resale/listings/${slug}` : null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const notFound = Boolean(error) && error!.toLowerCase().includes('not found');
  const genericError = error && !notFound;

  useEffect(() => {
    if (listing) {
      setActiveImage(resolveImageUrl(listing.main_image) || FALLBACK_IMAGE_URL);
    }
  }, [listing]);

  useEffect(() => {
    if (!listing) return;

    const previousTitle = document.title;
    document.title = listing.meta_title || listing.title;

    const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
    const previousOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const previousOgDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    const previousOgImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');

    const setMeta = (selector: string, value: string) => {
      let element = document.querySelector(selector) as HTMLElement | null;
      if (!element) {
        element = document.createElement('meta');
        const key = selector.match(/(name|property)="([^"]+)"/)?.[1];
        const keyVal = selector.match(/(name|property)="([^"]+)"/)?.[2];
        if (key && keyVal) element.setAttribute(key, keyVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    setMeta('meta[name="description"]', listing.meta_description || listing.description || '');
    setMeta('meta[property="og:title"]', listing.meta_title || listing.title);
    setMeta('meta[property="og:description"]', listing.meta_description || listing.description || '');
    setMeta('meta[property="og:image"]', resolveImageUrl(listing.main_image) || '');

    return () => {
      document.title = previousTitle;
      if (previousDescription != null) document.querySelector('meta[name="description"]')?.setAttribute('content', previousDescription);
      if (previousOgTitle != null) document.querySelector('meta[property="og:title"]')?.setAttribute('content', previousOgTitle);
      if (previousOgDescription != null) document.querySelector('meta[property="og:description"]')?.setAttribute('content', previousOgDescription);
      if (previousOgImage != null) document.querySelector('meta[property="og:image"]')?.setAttribute('content', previousOgImage);
    };
  }, [listing]);

  const handleEnquire = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await apiFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message,
          resale_listing_id: listing?.id || null,
        }),
      });

      await parseJsonResponse(res);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      alert('Error sending enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const getGalleryImages = () => {
    if (!listing) return [];
    const images: string[] = [];
    if (listing.main_image) {
      const mainImage = resolveImageUrl(listing.main_image);
      if (mainImage) images.push(mainImage);
    }
    if (listing.gallery) {
      const gallery = typeof listing.gallery === 'string' ? JSON.parse(listing.gallery) : listing.gallery;
      if (Array.isArray(gallery)) {
        images.push(...gallery.map((image) => resolveImageUrl(image)).filter(Boolean) as string[]);
      }
    }
    return [...new Set(images)];
  };

  const galleryImages = getGalleryImages();

  if (loading) {
    return (
      <div className="pt-24 pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="aspect-video animate-pulse rounded-[2.5rem] bg-slate-200" />
          <div className="mt-16 h-12 w-3/4 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }
  if (genericError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-xl text-center">
          <h1 className="mb-6 text-3xl font-bold text-slate-900">Unable to load this listing</h1>
          <ErrorState onRetry={refetch} />
        </div>
      </div>
    );
  }
  if (!listing) return <div className="flex h-screen items-center justify-center">Listing not found</div>;

  return (
    <div className="pt-24 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="space-y-6">
          <div className="group relative aspect-video w-full overflow-hidden rounded-[2.5rem] bg-zinc-100 shadow-2xl">
            <img
              src={activeImage}
              alt={listing.title}
              className="h-full w-full object-cover"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={withFallbackImage}
            />
            {galleryImages.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => {
                    const currentIndex = galleryImages.indexOf(activeImage);
                    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
                    setActiveImage(galleryImages[prevIndex]);
                  }}
                  className="rounded-full bg-white/20 p-3 text-white backdrop-blur-md transition-all hover:bg-white/40"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => {
                    const currentIndex = galleryImages.indexOf(activeImage);
                    const nextIndex = (currentIndex + 1) % galleryImages.length;
                    setActiveImage(galleryImages[nextIndex]);
                  }}
                  className="rounded-full bg-white/20 p-3 text-white backdrop-blur-md transition-all hover:bg-white/40"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative aspect-3/2 w-32 shrink-0 overflow-hidden rounded-2xl border-2 transition-all md:w-48 ${activeImage === img ? 'border-black ring-4 ring-black/5' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Gallery ${i}`} className="h-full w-full object-cover" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={withFallbackImage} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-zinc-100 px-4 py-1 text-sm font-semibold uppercase text-zinc-600">
                    {listing.unit_type || 'Resale Unit'}
                  </span>
                  <span className="text-2xl font-bold text-black">{formatPrice(listing.price, listing.price_display)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShareButton variant="solid" url={`/resale/${slug}`} title={listing.title} />
                  <FavoriteButton
                    variant="solid"
                    type="resale"
                    id={listing.id}
                    title={listing.title}
                    slug={listing.slug}
                    image={listing.main_image}
                    subtitle={listing.location}
                    price={formatPrice(listing.price, listing.price_display)}
                  />
                </div>
              </div>
              <h1 className="mb-4 text-4xl font-bold text-zinc-900 md:text-5xl">{listing.title}</h1>
              <div className="flex flex-wrap gap-6 text-zinc-500">
                <div className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" /> {listing.location}
                </div>
              </div>
            </div>

            <div className="mb-12 grid grid-cols-2 gap-6 rounded-3xl border border-zinc-100 bg-zinc-50/50 p-8 sm:grid-cols-3">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Bed className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Bedrooms</p>
                  <p className="font-bold text-zinc-900">{listing.beds || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Maximize2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Size</p>
                  <p className="font-bold text-zinc-900">{formatSize(listing.size)}</p>
                </div>
              </div>
              {listing.delivery_time && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <CalendarClock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Delivery</p>
                    <p className="font-bold text-zinc-900">{listing.delivery_time}</p>
                  </div>
                </div>
              )}
              {listing.paid_amount != null && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Amount Paid</p>
                    <p className="font-bold text-zinc-900">{listing.paid_amount.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {listing.installment_value != null && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <span className="text-sm font-bold">DP</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Monthly Installment</p>
                    <p className="font-bold text-zinc-900">{listing.installment_value.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {listing.remaining_amount != null && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <span className="text-lg font-bold">$</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Remaining Amount</p>
                    <p className="font-bold text-zinc-900">{listing.remaining_amount.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {listing.remaining_installments != null && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <ListChecks className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Installments Left</p>
                    <p className="font-bold text-zinc-900">{listing.remaining_installments}</p>
                  </div>
                </div>
              )}
              {listing.finishing_status && (
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Finishing</p>
                    <p className="font-bold text-zinc-900">{listing.finishing_status}</p>
                  </div>
                </div>
              )}
            </div>

            {listing.description && (
              <div className="mb-12">
                <h2 className="mb-4 text-2xl font-bold">About This Unit</h2>
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-600">{listing.description}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-32 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
              <h3 className="mb-6 text-xl font-bold">Enquire About This Unit</h3>
              <form onSubmit={handleEnquire} className="space-y-4">
                {submitted && (
                  <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
                    Thank you! Your enquiry has been sent successfully.
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                    placeholder="I'm interested in this unit..."
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Sending...' : 'Send Enquiry'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
