import { authFetch, authJson } from '../../utils/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/AdminSidebar';
import { Trash2, ArrowLeft, Check, ImageOff } from 'lucide-react';
import { ResaleSubmission } from '../../types';
import { resolveImageUrl } from '../../utils/image';
import { formatSize } from '../../utils/size';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  published: 'bg-emerald-100 text-emerald-700',
};

function getSubmissionPhotoUrls(submission: ResaleSubmission): string[] {
  if (!submission.photos) return [];
  const parsed = typeof submission.photos === 'string' ? JSON.parse(submission.photos) : submission.photos;
  return Array.isArray(parsed) ? parsed : [];
}

export default function AdminResaleSubmissions() {
  const [submissions, setSubmissions] = useState<ResaleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const data = await authJson<ResaleSubmission[]>('/api/resale/submissions');
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to load resale submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Mark this submission as rejected?')) return;
    const res = await authFetch(`/api/resale/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    });
    if (res.ok) loadSubmissions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
    const res = await authFetch(`/api/resale/submissions/${id}`, { method: 'DELETE' });
    if (res.ok) loadSubmissions();
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-6xl">
          <button onClick={() => navigate('/admin/dashboard')} className="mb-6 flex items-center text-sm text-zinc-500 hover:text-black">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </button>

          <div className="rounded-3xl bg-white p-10 shadow-xl border border-zinc-100">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900">Resale Submissions</h1>

            {loading ? (
              <div className="py-12 text-center text-zinc-500">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">No resale submissions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Owner</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Contact</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Unit</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Financials</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Photos</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Date</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
                        <td className="px-6 py-4 text-sm font-medium text-zinc-700">{submission.owner_name}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          <div>{submission.owner_phone}</div>
                          {submission.owner_email && (
                            <a href={`mailto:${submission.owner_email}`} className="text-xs text-blue-600 hover:underline">{submission.owner_email}</a>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          <div className="font-medium">{submission.location}</div>
                          <div className="text-xs text-zinc-400">{[submission.unit_type, submission.beds, formatSize(submission.size)].filter(Boolean).join(' · ')}</div>
                          {submission.delivery_time && <div className="text-xs text-zinc-400">Delivery: {submission.delivery_time}</div>}
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-600">
                          <div>{submission.asking_price || '-'}</div>
                          {submission.paid_amount != null && <div className="text-zinc-400">Paid so far: {submission.paid_amount.toLocaleString()}</div>}
                          {submission.installment_value != null && <div className="text-zinc-400">Installment: {submission.installment_value.toLocaleString()}</div>}
                          {submission.remaining_amount != null && <div className="text-zinc-400">Remaining: {submission.remaining_amount.toLocaleString()}{submission.remaining_installments != null ? ` (${submission.remaining_installments} left)` : ''}</div>}
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const photoUrls = getSubmissionPhotoUrls(submission);
                            if (photoUrls.length === 0) {
                              return <span className="flex items-center gap-1 text-xs text-zinc-400"><ImageOff className="h-4 w-4" /> None</span>;
                            }
                            return (
                              <div className="flex items-center gap-2">
                                <img src={resolveImageUrl(photoUrls[0]) || undefined} alt="" className="h-10 w-10 rounded-lg object-cover" />
                                <span className="text-xs text-zinc-500">{photoUrls.length}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[submission.status] || 'bg-zinc-100 text-zinc-600'}`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {new Date(submission.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {submission.status !== 'published' && (
                              <button
                                onClick={() => navigate(`/admin/resale/listings/new?fromSubmission=${submission.id}`)}
                                className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                                title="Publish as listing"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {submission.status === 'pending' && (
                              <button
                                onClick={() => handleReject(submission.id)}
                                className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(submission.id)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                              title="Delete"
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
