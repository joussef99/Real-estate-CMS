import { authFetch, getAdminToken, apiJson } from '../../utils/api';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/AdminSidebar';
import { NoticeToast } from '../../components/ui/notice-toast';
import { useCleanupNotice } from '../../hooks/useCleanupNotice';
import { Blog } from '../../types';
import { FALLBACK_IMAGE_URL, resolveImageUrl, withFallbackImage } from '../../utils/image';

export default function ManageBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const navigate = useNavigate();
  const token = getAdminToken();
  const { notice } = useCleanupNotice();

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchBlogs();
  }, [token, navigate]);

  const fetchBlogs = () => {
    apiJson<any>(`/api/blogs`)
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.blogs) ? data.blogs : [];
        setBlogs(list);
      })
      .catch(() => setBlogs([]));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    const res = await authFetch(`/api/blogs/${id}`, {
      method: 'DELETE',
    });
    
    if (res.ok) {
      fetchBlogs();
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <NoticeToast message={notice} />
      <AdminSidebar />

      <main className="flex-1 p-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <Link to="/admin/dashboard" className="mb-2 flex items-center text-sm text-zinc-500 hover:text-black">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900">Manage Blogs</h1>
          </div>
          <Link to="/admin/blogs/new">
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Add Blog Post
            </Button>
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-zinc-100">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-zinc-50 text-sm font-medium text-zinc-500">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {blogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img src={resolveImageUrl(blog.image) || FALLBACK_IMAGE_URL} alt="" className="mr-3 h-10 w-10 rounded-lg object-cover" loading="lazy" decoding="async" onError={withFallbackImage} />
                      <span className="font-medium">{blog.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{blog.category}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{blog.author}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/blogs/edit/${blog.id}`)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-black"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(blog.id)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
