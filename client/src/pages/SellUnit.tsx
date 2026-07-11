import { apiJson, apiUploadJson, normalizeListResponse } from '../utils/api';
import { Mail, Phone, Upload, X } from 'lucide-react';
import { Button } from '../components/Button';
import { SelectWithOther } from '../components/ui/select-with-other';
import { useEffect, useState } from 'react';
import type React from 'react';
import { optimizeImageFiles } from '../utils/imageUpload';
import { RESALE_BEDS_OPTIONS } from '../utils/resaleFormOptions';
import type { Project } from '../types';

const MAX_PHOTOS = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SellUnit() {
  const [formData, setFormData] = useState({
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    location: '',
    unit_type: '',
    beds: '',
    size: '',
    asking_price: '',
    paid_amount: '',
    installment_value: '',
    remaining_amount: '',
    remaining_installments: '',
    delivery_time: '',
    description: '',
  });
  const [compoundOptions, setCompoundOptions] = useState<string[]>([]);
  const [unitTypeOptions, setUnitTypeOptions] = useState<string[]>([]);
  const [photos, setPhotos] = useState<{ file: File; previewUrl: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length + files.length > MAX_PHOTOS) {
      alert(`Maximum ${MAX_PHOTOS} photos allowed.`);
      e.target.value = '';
      return;
    }

    const next = Array.from(files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...next]);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].previewUrl);
      return current.filter((_, i) => i !== index);
    });
  };

  const validate = (): string | null => {
    if (!formData.owner_name.trim()) return 'Your name is required.';
    if (!formData.owner_phone.trim()) return 'Your phone number is required.';
    if (formData.owner_email.trim() && !EMAIL_PATTERN.test(formData.owner_email.trim())) return 'Enter a valid email address, or leave it blank.';
    if (!formData.location.trim()) return 'Compound name is required.';
    if (!formData.unit_type.trim()) return 'Unit type is required.';
    if (!formData.beds.trim()) return 'Beds is required.';
    if (!formData.size.trim()) return 'Size is required.';
    if (!formData.asking_price.trim()) return 'Asking price is required.';

    for (const [field, label] of [
      ['asking_price', 'Asking price'],
      ['paid_amount', 'Paid amount'],
      ['installment_value', 'Installment value'],
      ['remaining_amount', 'Remaining amount'],
      ['remaining_installments', 'Remaining installments'],
    ] as const) {
      const value = formData[field];
      if (value !== '' && (Number.isNaN(Number(value)) || Number(value) < 0)) {
        return `${label} must be a non-negative number.`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const optimizedFiles = photos.length > 0
        ? await optimizeImageFiles(photos.map((p) => p.file), {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.75,
            fileNamePrefix: 'resale-submission',
          })
        : [];

      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') body.append(key, value);
      });
      optimizedFiles.forEach((file) => body.append('photos', file));

      await apiUploadJson('/api/resale/submissions', body, setUploadProgress);

      setSubmitted(true);
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPhotos([]);
      setFormData({
        owner_name: '', owner_email: '', owner_phone: '', location: '',
        unit_type: '', beds: '', size: '', asking_price: '', paid_amount: '', installment_value: '',
        remaining_amount: '', remaining_installments: '', delivery_time: '', description: '',
      });
    } catch (err) {
      alert((err as Error).message || 'Error sending your submission. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h1 className="mb-6 text-4xl font-bold">List Your Unit for Resale</h1>
            <p className="mb-12 text-lg text-zinc-500">
              Tell us about your unit — including a few photos if you have them — and our team will review
              it, add professional photography if needed, and publish it as a resale listing.
            </p>

            <div className="space-y-8">
              <div className="flex items-start">
                <div className="mr-4 rounded-full bg-zinc-100 p-3">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Email Us</h3>
                  <p className="text-zinc-500">operationslivin@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 rounded-full bg-zinc-100 p-3">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Call Us</h3>
                  <p className="text-zinc-500"> +20 109 620 7770</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl border border-zinc-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitted && (
                <div className="rounded-xl bg-green-50 p-4 text-green-800">
                  Thank you! We've received your submission and will be in touch.
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Your Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <SelectWithOther
                  label="Compound Name"
                  required
                  options={compoundOptions}
                  value={formData.location}
                  onChange={(value) => setFormData({ ...formData, location: value })}
                  placeholder="Select a compound"
                  otherPlaceholder="Type the compound name"
                />
                <SelectWithOther
                  label="Unit Type"
                  required
                  options={unitTypeOptions}
                  value={formData.unit_type}
                  onChange={(value) => setFormData({ ...formData, unit_type: value })}
                  placeholder="Select a unit type"
                  otherPlaceholder="Type the unit type"
                />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Beds <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={formData.beds}
                    onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  >
                    <option value="">Select beds</option>
                    {RESALE_BEDS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Size <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g. 1,250 sqm"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Amount Paid So Far</label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                    placeholder="e.g. 1200000"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Asking Price <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    required
                    value={formData.asking_price}
                    onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                    placeholder="e.g. 1850000"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Monthly Installment</label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={formData.installment_value}
                    onChange={(e) => setFormData({ ...formData, installment_value: e.target.value })}
                    placeholder="e.g. 25000"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Delivery Time</label>
                  <input
                    type="text"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                    placeholder="e.g. Q4 2027, Ready to move"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Remaining Amount Owed</label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={formData.remaining_amount}
                    onChange={(e) => setFormData({ ...formData, remaining_amount: e.target.value })}
                    placeholder="e.g. 800000"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Remaining Installments</label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={formData.remaining_installments}
                    onChange={(e) => setFormData({ ...formData, remaining_installments: e.target.value })}
                    placeholder="e.g. 12"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Description</label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us more about the unit..."
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Photos (up to {MAX_PHOTOS})</label>
                <div className="rounded-xl border-2 border-dashed border-zinc-300 p-6 text-center">
                  <input
                    type="file"
                    id="submission-photos"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    disabled={photos.length >= MAX_PHOTOS}
                    className="hidden"
                  />
                  <label
                    htmlFor="submission-photos"
                    className={`flex cursor-pointer flex-col items-center justify-center ${photos.length >= MAX_PHOTOS ? 'opacity-50' : ''}`}
                  >
                    <Upload className="mb-2 h-6 w-6 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-700">Click to add photos</p>
                  </label>
                </div>

                {photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                        <img src={photo.previewUrl} alt={`Upload ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {loading && uploadProgress > 0 && (
                <div className="overflow-hidden rounded-full bg-zinc-200">
                  <div className="h-2 bg-black transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? 'Submitting...' : 'Submit Your Unit'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
