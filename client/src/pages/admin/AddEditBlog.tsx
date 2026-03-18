import { API_BASE } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/AdminSidebar';
import { ArrowLeft } from 'lucide-react';
import { slugify } from '../../utils/slugify';

export default function AddEditBlog() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    image: '',
    category: '',
    author: '',
    meta_title: '',
    meta_description: '',
  });
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');
  const [slugDirty, setSlugDirty] = useState(false);

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
              category: blog.category,
              author: blog.author,
              meta_title: blog.meta_title || '',
              meta_description: blog.meta_description || '',
            });
          }
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = id ? `${API_BASE}/api/blogs/${id}` : `${API_BASE}/api/blogs`;
    const method = id ? 'PUT' : 'POST';

    const body = {
      ...formData,
      slug: formData.slug ? slugify(formData.slug) : slugify(formData.title),
      meta_title: formData.meta_title.trim(),
      meta_description: formData.meta_description.trim(),
    };

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      navigate('/admin/blogs');
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
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
                <input
                  type="text"
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  required
                />
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
