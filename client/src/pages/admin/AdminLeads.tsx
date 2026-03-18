import { API_BASE } from '../../utils/api';
import { useState, useEffect } from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        await loadLeads();
      } else {
        alert('Failed to delete lead');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error deleting lead');
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => navigate('/admin/projects')} className="mb-6 flex items-center text-sm text-zinc-500 hover:text-black">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </button>

          <div className="rounded-3xl bg-white p-10 shadow-xl border border-zinc-100">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900">Manage Leads</h1>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-zinc-500">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500">No leads received yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Phone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Project</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Message</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Date</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-zinc-700 font-medium">{lead.name}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                            {lead.email}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {lead.phone ? (
                            <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 font-medium">
                          {lead.project_name ? (
                            <a href={`/projects/${lead.project_id}`} className="text-blue-600 hover:underline">
                              {lead.project_name}
                            </a>
                          ) : (
                            <span className="text-zinc-400">General Enquiry</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 max-w-xs truncate" title={lead.message}>
                          {lead.message}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {new Date(lead.created_at).toLocaleDateString('en-US', {
                            year: '2-digit',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
