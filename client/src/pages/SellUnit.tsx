import { apiUploadJson } from '../utils/api';
import { Mail, Phone, Upload, X } from 'lucide-react';
import { Button } from '../components/Button';
import { useState } from 'react';
import type React from 'react';
import { optimizeImageFiles } from '../utils/imageUpload';

const MAX_PHOTOS = 6;

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
    installment_value: '',
    remaining_amount: '',
    remaining_installments: '',
    delivery_time: '',
    description: '',
  });
  const [photos, setPhotos] = useState<{ file: File; previewUrl: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    if (!formData.owner_email.trim()) return 'Your email is required.';
    if (!formData.location.trim()) return 'Unit location is required.';

    for (const [field, label] of [
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
        unit_type: '', beds: '', size: '', asking_price: '', installment_value: '',
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
                  <label className="mb-2 block text-sm font-medium">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.owner_email}
                    onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Phone</label>
                  <input
                    type="tel"
                    value={formData.owner_phone}
                    onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Unit Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Downtown, New Cairo"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">Unit Type</label>
                  <input
                    type="text"
                    value={formData.unit_type}
                    onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                    placeholder="Apartment, Villa..."
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Beds</label>
                  <input
                    type="text"
                    value={formData.beds}
                    onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
                    placeholder="e.g. 2"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Size</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g. 1,250 sqm"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Asking Price</label>
                <input
                  type="text"
                  value={formData.asking_price}
                  onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                  placeholder="e.g. EGP 1,850,000"
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Monthly Installment (Optional)</label>
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
                  <label className="mb-2 block text-sm font-medium">Delivery Time (Optional)</label>
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
                  <label className="mb-2 block text-sm font-medium">Remaining Amount Owed (Optional)</label>
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
                  <label className="mb-2 block text-sm font-medium">Remaining Installments (Optional)</label>
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
                <label className="mb-2 block text-sm font-medium">Description (Optional)</label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us more about the unit..."
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Photos (Optional, up to {MAX_PHOTOS})</label>
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
