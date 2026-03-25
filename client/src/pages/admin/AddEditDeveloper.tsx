import { API_BASE, authFetch, authUploadJson } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/AdminSidebar';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { NoticeToast } from '../../components/ui/notice-toast';
import { useCleanupNotice } from '../../hooks/useCleanupNotice';
import { optimizeImageFile } from '../../utils/imageUpload';
import { MediaAsset } from '../../types';
import { useTemporaryMediaManager } from '../../hooks/useTemporaryMediaManager';

export default function AddEditDeveloper() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    logo_meta: null as MediaAsset | null,
    description: '',
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { notice, showNotice } = useCleanupNotice();
  const { cleanupTemporaryUpload, isTemporaryUpload, markSaved, trackTemporaryUpload } = useTemporaryMediaManager();

  useEffect(() => {
    if (id) {
      fetch(`${API_BASE}/api/developers`)
        .then(res => res.json())
        .then(data => {
          const dev = data.find((d: any) => d.id === parseInt(id));
          if (dev) {
            setFormData({
              name: dev.name,
              logo: dev.logo,
              logo_meta: dev.logo_meta || null,
              description: dev.description,
            });
          }
        });
    }
  }, [id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setUploadProgress(0);
    setUploadMessage(null);

    try {
      const optimizedFile = await optimizeImageFile(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.70,
        fileNamePrefix: 'developer-logo',
      });

      const formDataUpload = new FormData();
      formDataUpload.append('logo', optimizedFile);

      if (isTemporaryUpload(formData.logo_meta?.public_id)) {
        const cleaned = await cleanupTemporaryUpload(formData.logo_meta?.public_id);
        if (cleaned) {
          showNotice('Previous image removed');
        }
      }

      const data = await authUploadJson<any>('/api/upload/developer-logo', formDataUpload, setUploadProgress);
      trackTemporaryUpload(data.asset?.public_id);
      setFormData({ ...formData, logo: data.logo, logo_meta: data.asset || null });
      setUploadMessage('Logo uploaded successfully.');
    } catch (err) {
      setUploadMessage((err as Error).message || 'Upload failed.');
    } finally {
      setUploadingLogo(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const removeLogo = async () => {
    if (isTemporaryUpload(formData.logo_meta?.public_id)) {
      const cleaned = await cleanupTemporaryUpload(formData.logo_meta?.public_id);
      if (cleaned) {
        showNotice('Unsaved image removed');
      }
    }

    setFormData({ ...formData, logo: '', logo_meta: null });
    setUploadMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = id ? `${API_BASE}/api/developers/${id}` : `${API_BASE}/api/developers`;
    const method = id ? 'PUT' : 'POST';

    const res = await authFetch(id ? `/api/developers/${id}` : '/api/developers', {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      markSaved();
      navigate('/admin/developers');
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <NoticeToast message={notice} />
      <AdminSidebar />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-3xl">
          <button onClick={() => navigate('/admin/developers')} className="mb-6 flex items-center text-sm text-zinc-500 hover:text-black">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Developers
          </button>
          
          <div className="rounded-3xl bg-white p-10 shadow-xl border border-zinc-100">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900">{id ? 'Edit Developer' : 'Add New Developer'}</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Developer Name</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="mb-4 block text-sm font-medium text-zinc-700">Developer Logo</label>
                <div className="mb-4 rounded-xl border-2 border-dashed border-zinc-300 p-8 text-center">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`flex cursor-pointer flex-col items-center justify-center ${uploadingLogo ? 'opacity-50' : ''}`}
                  >
                    <Upload className="mb-2 h-8 w-8 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-700">
                      {uploadingLogo ? 'Uploading...' : 'Click to upload logo or drag and drop'}
                    </p>
                    <p className="text-xs text-zinc-500">Auto-converted to WebP, max 800px, up to 5MB source</p>
                    <p className="mt-2 text-xs text-zinc-500">Images upload instantly. Unsaved ones are removed automatically.</p>
                  </label>
                </div>

                {uploadingLogo && (
                  <div className="mb-4 overflow-hidden rounded-full bg-zinc-200">
                    <div className="h-2 bg-black transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}

                {formData.logo && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-zinc-500">Current logo preview</p>
                      <label htmlFor="logo-upload" className="cursor-pointer rounded-lg border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                        Replace Image
                      </label>
                    </div>
                    <div className="relative w-32 overflow-hidden rounded-lg bg-zinc-100">
                      <img
                        src={formData.logo}
                        alt="Logo preview"
                        className="h-32 w-32 object-contain"
                      />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100"
                      >
                        <X className="h-6 w-6 text-white" />
                      </button>
                    </div>
                    {uploadMessage && <p className="text-xs text-zinc-600">{uploadMessage}</p>}
                  </div>
                )}

                {!formData.logo && uploadMessage && <p className="text-xs text-zinc-600">{uploadMessage}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Description</label>
                <textarea
                  rows={5}
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">{id ? 'Update Developer' : 'Create Developer'}</Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/developers')}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
