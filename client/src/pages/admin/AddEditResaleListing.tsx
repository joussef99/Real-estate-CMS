import { apiJson, authFetch, authJson, authUploadJson, normalizeListResponse } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/AdminSidebar';
import { SelectWithOther } from '../../components/ui/select-with-other';
import { ArrowLeft, X, Upload } from 'lucide-react';
import { NoticeToast } from '../../components/ui/notice-toast';
import { useCleanupNotice } from '../../hooks/useCleanupNotice';
import { slugify } from '../../utils/slugify';
import { optimizeImageFiles } from '../../utils/imageUpload';
import { MediaAsset, Project, ResaleSubmission } from '../../types';
import { useTemporaryMediaManager } from '../../hooks/useTemporaryMediaManager';
import { RESALE_BEDS_OPTIONS } from '../../utils/resaleFormOptions';

export default function AddEditResaleListing() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fromSubmissionId = searchParams.get('fromSubmission');

  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryMeta, setGalleryMeta] = useState<MediaAsset[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [slugDirty, setSlugDirty] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [compoundOptions, setCompoundOptions] = useState<string[]>([]);
  const [unitTypeOptions, setUnitTypeOptions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    location: '',
    price: '',
    unit_type: '',
    beds: '',
    size: '',
    paid_amount: '',
    installment_value: '',
    remaining_amount: '',
    remaining_installments: '',
    delivery_time: '',
    description: '',
    meta_title: '',
    meta_description: '',
    status: 'published',
  });
  const navigate = useNavigate();
  const { notice, showNotice } = useCleanupNotice();
  const { cleanupTemporaryUpload, isTemporaryUpload, markSaved, trackTemporaryUpload } = useTemporaryMediaManager();

  useEffect(() => {
    apiJson<any>('/api/projects?limit=100')
      .then((data) => {
        const projects = normalizeListResponse<Project>(data, 'projects');
        const names = Array.from(new Set(projects.map((p) => p.name).filter(Boolean)));
        setCompoundOptions(names.sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {});

    apiJson<any>('/api/property-types')
      .then((data) => {
        const types = (Array.isArray(data) ? data : []).map((pt: { name: string }) => pt.name).filter(Boolean);
        setUnitTypeOptions(types);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      authJson<any>(`/api/resale/admin/listings/${id}`).then((data) => {
        setFormData({
          title: data.title,
          slug: data.slug || '',
          location: data.location || '',
          price: data.price || '',
          unit_type: data.unit_type || '',
          beds: data.beds || '',
          size: data.size || '',
          paid_amount: data.paid_amount != null ? String(data.paid_amount) : '',
          installment_value: data.installment_value != null ? String(data.installment_value) : '',
          remaining_amount: data.remaining_amount != null ? String(data.remaining_amount) : '',
          remaining_installments: data.remaining_installments != null ? String(data.remaining_installments) : '',
          delivery_time: data.delivery_time || '',
          description: data.description || '',
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || '',
          status: data.status || 'published',
        });
        if (data.gallery) {
          setGallery(typeof data.gallery === 'string' ? JSON.parse(data.gallery) : data.gallery);
        }
        if (Array.isArray(data.gallery_meta)) {
          setGalleryMeta(data.gallery_meta);
        }
      });
      return;
    }

    if (fromSubmissionId) {
      setSubmissionId(fromSubmissionId);
      authJson<ResaleSubmission[]>('/api/resale/submissions').then((submissions) => {
        const submission = submissions.find((s) => String(s.id) === fromSubmissionId);
        if (!submission) return;
        setFormData((prev) => ({
          ...prev,
          title: `${submission.unit_type || 'Unit'} in ${submission.location}`,
          slug: slugify(`${submission.unit_type || 'unit'}-${submission.location}-${submission.id}`),
          location: submission.location,
          price: submission.asking_price || '',
          unit_type: submission.unit_type || '',
          beds: submission.beds || '',
          size: submission.size || '',
          paid_amount: submission.paid_amount != null ? String(submission.paid_amount) : '',
          installment_value: submission.installment_value != null ? String(submission.installment_value) : '',
          remaining_amount: submission.remaining_amount != null ? String(submission.remaining_amount) : '',
          remaining_installments: submission.remaining_installments != null ? String(submission.remaining_installments) : '',
          delivery_time: submission.delivery_time || '',
          description: submission.description || '',
        }));

        // Pre-fill the gallery from the owner's submitted photos — admin can still add/replace before publishing.
        if (submission.photos) {
          const photoUrls = typeof submission.photos === 'string' ? JSON.parse(submission.photos) : submission.photos;
          if (Array.isArray(photoUrls)) setGallery(photoUrls);
        }
        if (Array.isArray(submission.photos_meta)) {
          setGalleryMeta(submission.photos_meta);
        }
      });
    }
  }, [id, fromSubmissionId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (gallery.length + files.length > 10) {
      alert('Maximum 10 images allowed per listing');
      return;
    }

    setUploadingImages(true);
    setUploadProgress(0);
    setUploadMessage(null);

    try {
      const optimizedFiles = await optimizeImageFiles(files, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.70,
        fileNamePrefix: 'resale',
      });

      const formDataUpload = new FormData();
      optimizedFiles.forEach((file) => {
        formDataUpload.append('images', file);
      });

      const data = await authUploadJson<any>('/api/upload', formDataUpload, setUploadProgress);
      const newImages = Array.isArray(data?.images) ? data.images : [];
      const newAssets = Array.isArray(data?.assets) ? data.assets : [];
      newAssets.forEach((asset: MediaAsset) => trackTemporaryUpload(asset.public_id));
      setGallery([...gallery, ...newImages]);
      setGalleryMeta([...galleryMeta, ...newAssets]);
      setUploadMessage(`${newImages.length} image${newImages.length === 1 ? '' : 's'} uploaded successfully.`);
    } catch (err) {
      setUploadMessage((err as Error).message || 'Upload failed.');
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const removeImage = async (index: number) => {
    const asset = galleryMeta[index];
    if (asset?.public_id && isTemporaryUpload(asset.public_id)) {
      const cleaned = await cleanupTemporaryUpload(asset.public_id);
      if (cleaned) {
        showNotice('Unsaved image removed');
      }
    }

    setGallery(gallery.filter((_, i) => i !== index));
    setGalleryMeta(galleryMeta.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (gallery.length === 0) {
      alert('Please upload at least 1 image for this listing.');
      return;
    }

    for (const [field, label] of [
      ['paid_amount', 'Paid amount'],
      ['installment_value', 'Installment value'],
      ['remaining_amount', 'Remaining amount'],
      ['remaining_installments', 'Remaining installments'],
    ] as const) {
      const value = formData[field];
      if (value !== '' && (Number.isNaN(Number(value)) || Number(value) < 0)) {
        alert(`${label} must be a non-negative number.`);
        return;
      }
    }

    const normalizedSlug = formData.slug ? slugify(formData.slug) : slugify(formData.title);

    const res = await authFetch(id ? `/api/resale/admin/listings/${id}` : '/api/resale/admin/listings', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        slug: normalizedSlug,
        gallery,
        gallery_meta: galleryMeta,
        main_image_meta: galleryMeta[0] || null,
        ...(submissionId ? { submission_id: Number(submissionId) } : {}),
      }),
    });

    if (res.ok) {
      markSaved();
      navigate('/admin/resale/listings');
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <NoticeToast message={notice} />
      <AdminSidebar />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-3xl">
          <button onClick={() => navigate('/admin/resale/listings')} className="mb-6 flex items-center text-sm text-zinc-500 hover:text-black">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Resale Listings
          </button>

          <div className="rounded-3xl bg-white p-10 shadow-xl border border-zinc-100">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900">{id ? 'Edit Resale Listing' : 'Publish Resale Listing'}</h1>
            {submissionId && (
              <p className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Pre-filled from the owner's submission. Add your own photos and clean up the details before publishing.
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Title</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({ ...prev, title: value }));
                      if (!slugDirty) {
                        setFormData((prev) => ({ ...prev, slug: slugify(value) }));
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Slug</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.slug}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, slug: e.target.value }));
                      setSlugDirty(true);
                    }}
                    placeholder="auto-generated from title"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <SelectWithOther
                  label="Compound Name"
                  required
                  options={compoundOptions}
                  value={formData.location}
                  onChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
                  placeholder="Select a compound"
                  otherPlaceholder="Type the compound name"
                />
                <SelectWithOther
                  label="Unit Type"
                  options={unitTypeOptions}
                  value={formData.unit_type}
                  onChange={(value) => setFormData((prev) => ({ ...prev, unit_type: value }))}
                  placeholder="Select a unit type"
                  otherPlaceholder="Type the unit type"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Beds</label>
                  <select
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.beds}
                    onChange={(e) => setFormData((prev) => ({ ...prev, beds: e.target.value }))}
                  >
                    <option value="">Select beds</option>
                    {RESALE_BEDS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Size (Sqft)</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.size}
                    onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
                    placeholder="e.g. 1,250 sqft"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Price</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. EGP 1,850,000"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Amount Paid So Far</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={formData.paid_amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paid_amount: e.target.value }))}
                  placeholder="e.g. 1200000"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Monthly Installment</label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.installment_value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, installment_value: e.target.value }))}
                    placeholder="e.g. 25000"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Delivery Time</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, delivery_time: e.target.value }))}
                    placeholder="e.g. Q4 2027, Ready to move"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Remaining Amount Owed</label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.remaining_amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remaining_amount: e.target.value }))}
                    placeholder="e.g. 800000"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Remaining Installments</label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.remaining_installments}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remaining_installments: e.target.value }))}
                    placeholder="e.g. 12"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Meta Title</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.meta_title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Meta Description</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.meta_description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO description"
                  />
                </div>
              </div>

              <div>
                <label className="mb-4 block text-sm font-medium text-zinc-700">Description</label>
                <textarea
                  rows={5}
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-4 block text-sm font-medium text-zinc-700">Listing Gallery ({gallery.length}/10 images)</label>
                <div className="mb-4 rounded-xl border-2 border-dashed border-zinc-300 p-8 text-center">
                  <input
                    type="file"
                    id="resale-gallery-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImages || gallery.length >= 10}
                    className="hidden"
                  />
                  <label
                    htmlFor="resale-gallery-upload"
                    className={`flex cursor-pointer flex-col items-center justify-center ${uploadingImages || gallery.length >= 10 ? 'opacity-50' : ''}`}
                  >
                    <Upload className="mb-2 h-8 w-8 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-700">
                      {uploadingImages ? 'Uploading...' : 'Click to upload images or drag and drop'}
                    </p>
                    <p className="text-xs text-zinc-500">Auto-compressed to WebP, max 1600px, up to 5MB source</p>
                  </label>
                </div>

                {uploadingImages && (
                  <div className="mb-4 overflow-hidden rounded-full bg-zinc-200">
                    <div className="h-2 bg-black transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}

                {uploadMessage && <p className="mb-3 text-xs text-zinc-600">{uploadMessage}</p>}

                {gallery.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-700">Uploaded Images</h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {gallery.map((img, idx) => (
                        <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                          <img src={img} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-6 w-6 text-white" />
                          </button>
                          {idx === 0 && (
                            <div className="absolute bottom-1 left-1 inline-flex rounded bg-black/50 px-2 py-1 text-xs font-medium text-white">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="unpublished"
                  className="mr-2 h-5 w-5 rounded border-zinc-300 text-black focus:ring-black"
                  checked={formData.status === 'unpublished'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.checked ? 'unpublished' : 'published' }))}
                />
                <label htmlFor="unpublished" className="text-sm font-medium text-zinc-700">Hide from public resale listings (unpublished)</label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">{id ? 'Update Listing' : 'Publish Listing'}</Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/resale/listings')}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
