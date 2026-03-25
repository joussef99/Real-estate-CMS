import { API_BASE, authFetch, authUploadJson } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/AdminSidebar';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { NoticeToast } from '../../components/ui/notice-toast';
import { useCleanupNotice } from '../../hooks/useCleanupNotice';
import { slugify } from '../../utils/slugify';
import { optimizeImageFile } from '../../utils/imageUpload';
import { MediaAsset } from '../../types';
import { useTemporaryMediaManager } from '../../hooks/useTemporaryMediaManager';

export default function AddEditBlog() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    image: '',
    image_meta: null as MediaAsset | null,
    category: '',
    author: '',
    meta_title: '',
    meta_description: '',
  });
  const navigate = useNavigate();
  const [slugDirty, setSlugDirty] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const { notice, showNotice } = useCleanupNotice();
  const { cleanupTemporaryUpload, isTemporaryUpload, markSaved, trackTemporaryUpload } = useTemporaryMediaManager();

  useEffect(() => {
    if (id) {
      fetch(`${API_BASE}/api/blogs`)
        .then(res => res.json())
        .then(data => {
          const blog = data.find((b: any) => b.id === parseInt(id));
          if (blog) {
            setFormData({
              title: blog.title,
              slug: blog.slug || '',
              content: blog.content,
              image: blog.image,
              image_meta: blog.image_meta || null,
              category: blog.category,
              author: blog.author,
              meta_title: blog.meta_title || '',
              meta_description: blog.meta_description || '',
            });
          }
        });
    }
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadProgress(0);
    setUploadMessage(null);

    try {
      const optimizedFile = await optimizeImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.72,
        fileNamePrefix: 'blog',
      });

      const payload = new FormData();
      payload.append('image', optimizedFile);

      if (isTemporaryUpload(formData.image_meta?.public_id)) {
        const cleaned = await cleanupTemporaryUpload(formData.image_meta?.public_id);
        if (cleaned) {
          showNotice('Previous image removed');
        }
      }

      const data = await authUploadJson<any>('/api/upload/blog-image', payload, setUploadProgress);
      trackTemporaryUpload(data.asset?.public_id);
      setFormData((prev) => ({ ...prev, image: data.image, image_meta: data.asset || null }));
      setUploadMessage('Image uploaded successfully.');
    } catch (error) {
      setUploadMessage((error as Error).message || 'Upload failed.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const removeImage = async () => {
    if (isTemporaryUpload(formData.image_meta?.public_id)) {
      const cleaned = await cleanupTemporaryUpload(formData.image_meta?.public_id);
      if (cleaned) {
        showNotice('Unsaved image removed');
      }
    }

    setFormData((prev) => ({ ...prev, image: '', image_meta: null }));
    setUploadMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = id ? 'PUT' : 'POST';

    const body = {
      ...formData,
      slug: formData.slug ? slugify(formData.slug) : slugify(formData.title),
      meta_title: formData.meta_title.trim(),
      meta_description: formData.meta_description.trim(),
    };

    const res = await authFetch(id ? `/api/blogs/${id}` : '/api/blogs', {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      markSaved();
      navigate('/admin/blogs');
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <NoticeToast message={notice} />
      <AdminSidebar />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-3xl">
          <button onClick={() => navigate('/admin/blogs')} className="mb-6 flex items-center text-sm text-zinc-500 hover:text-black">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Blogs
          </button>
          
          <div className="rounded-3xl bg-white p-10 shadow-xl border border-zinc-100">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900">{id ? 'Edit Blog Post' : 'Add New Blog Post'}</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Title</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={formData.title}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, title: val }));
                    if (!slugDirty) {
                      setFormData(prev => ({ ...prev, slug: slugify(val) }));
                    }
                  }}
                  required
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Slug</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.slug}
                    onChange={e => {
                      setSlugDirty(true);
                      setFormData({ ...formData, slug: e.target.value });
                    }}
                    placeholder="auto-generated from title"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Category</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Market Trends"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Author</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.author}
                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Meta Title</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.meta_title}
                    onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                    placeholder="SEO title"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Meta Description</label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={formData.meta_description}
                  onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="SEO description"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Image URL</label>
                <div className="mb-3 rounded-xl border-2 border-dashed border-zinc-300 p-5 text-center">
                  <input
                    type="file"
                    id="blog-image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <label htmlFor="blog-image-upload" className={`inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700 ${uploadingImage ? 'opacity-50' : ''}`}>
                    <Upload className="h-4 w-4" />
                    {uploadingImage ? 'Uploading...' : 'Upload / Replace Image'}
                  </label>
                  <p className="mt-2 text-xs text-zinc-500">Images upload instantly. Unsaved ones are removed automatically.</p>
                  {uploadMessage && <p className="mt-2 text-xs text-zinc-600">{uploadMessage}</p>}
                </div>
                {uploadingImage && (
                  <div className="mb-3 overflow-hidden rounded-full bg-zinc-200">
                    <div className="h-2 bg-black transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                <input
                  type="text"
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  required
                />
                {formData.image && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-3 py-2">
                      <p className="text-xs font-medium text-zinc-500">Current blog cover preview</p>
                      <button type="button" onClick={removeImage} className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-black">
                        <X className="h-4 w-4" /> Remove
                      </button>
                    </div>
                    <img src={formData.image} alt="Blog cover preview" className="h-44 w-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">Content</label>
                <textarea
                  rows={10}
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">{id ? 'Update Blog Post' : 'Create Blog Post'}</Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/blogs')}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
