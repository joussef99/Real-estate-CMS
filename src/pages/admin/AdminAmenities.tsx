import { useState, useEffect } from 'react';
import type React from 'react';
import { AdminSidebar } from '../../components/AdminSidebar';
import { Button } from '../../components/Button';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminAmenities() {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    loadAmenities();
  }, []);

  const loadAmenities = async () => {
    try {
      const res = await fetch('/api/amenities');
      const data = await res.json();
      setAmenities(data);
    } catch (error) {
      console.error('Failed to load amenities:', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmenity.trim()) {
      alert('Please enter an amenity name');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/amenities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newAmenity.trim() })
      });

      if (res.ok) {
        setNewAmenity('');
        await loadAmenities();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to add amenity');
      }
    } catch (error) {
      console.error('Error adding amenity:', error);
      alert('Error adding amenity');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this amenity?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/amenities/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        await loadAmenities();
      } else {
        alert('Failed to delete amenity');
      }
    } catch (error) {
      console.error('Error deleting amenity:', error);
      alert('Error deleting amenity');
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-4xl">
          <button onClick={() => navigate('/admin/projects')} className="mb-6 flex items-center text-sm text-zinc-500 hover:text-black">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
          </button>

          <div className="rounded-3xl bg-white p-10 shadow-xl border border-zinc-100">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900">Manage Amenities</h1>

            {/* Add New Amenity */}
            <form onSubmit={handleAdd} className="mb-8 flex gap-4">
              <input
                type="text"
                placeholder="Enter amenity name..."
                value={newAmenity}
                onChange={e => setNewAmenity(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
              />
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Plus className="h-5 w-5" /> Add Amenity
              </Button>
            </form>

            {/* Amenities Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Created</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {amenities.map(amenity => (
                    <tr key={amenity.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-zinc-700 font-medium">{amenity.name}</td>
                      <td className="px-6 py-4 text-sm text-zinc-500">
                        {new Date(amenity.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(amenity.id)}
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

              {amenities.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-zinc-500">No amenities found. Add one to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
