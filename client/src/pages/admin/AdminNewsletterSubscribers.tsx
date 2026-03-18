import { authFetch, clearAdminToken, getAdminToken } from '../../utils/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Trash2, AlertCircle, Check } from 'lucide-react';
import { Button } from '../../components/Button';

interface Subscriber {
  id: number;
  email: string;
  created_at: string;
}

export default function AdminNewsletterSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const token = getAdminToken();

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        const res = await authFetch('/api/newsletter');

        if (res.status === 401) {
          clearAdminToken();
          navigate('/admin/login');
          return;
        }

        if (!res.ok) throw new Error('Failed to fetch subscribers');
        const data = await res.json();
        setSubscribers(Array.isArray(data) ? data : []);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load subscribers');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribers();
  }, [token, navigate]);

  const handleDelete = async (id: number) => {
    if (!token) return;
    
    setDeletingId(id);
    try {
      const res = await authFetch(`/api/newsletter/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete subscriber');
      
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      setDeleteId(null);
    } catch (err) {
      setError('Failed to delete subscriber');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Newsletter Subscribers</h1>
            <p className="mt-2 text-slate-600">Manage your newsletter subscription list</p>
          </div>
          <div className="rounded-3xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900">
            {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <p className="text-slate-500">Loading subscribers...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Mail className="mb-4 h-12 w-12 text-slate-300" />
              <p className="text-lg font-medium text-slate-900">No subscribers yet</p>
              <p className="text-sm text-slate-500">Newsletter subscribers will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Subscribed</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-900">{sub.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {deleteId === sub.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <p className="text-sm text-slate-600">Delete?</p>
                            <button
                              onClick={() => handleDelete(sub.id)}
                              disabled={deletingId === sub.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                            >
                              {deletingId === sub.id ? '...' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(sub.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-red-100 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
