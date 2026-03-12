import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/AdminSidebar';
import { Career } from '../../types';

export default function ManageCareers() {
  const [careers, setCareers] = useState<Career[]>([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchCareers();
  }, [token, navigate]);

  const fetchCareers = () => {
    fetch('/api/careers')
      .then(res => res.json())
      .then(setCareers);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    
    const res = await fetch(`/api/admin/careers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      fetchCareers();
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />

      <main className="flex-1 p-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <Link to="/admin/dashboard" className="mb-2 flex items-center text-sm text-zinc-500 hover:text-black">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900">Manage Careers</h1>
          </div>
          <Link to="/admin/careers/new">
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Add Job Posting
            </Button>
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-zinc-100">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-zinc-50 text-sm font-medium text-zinc-500">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {careers.map((career) => (
                <tr key={career.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4 font-medium">{career.title}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{career.location}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{career.type}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/careers/edit/${career.id}`)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-black"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(career.id)}
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
