import { authFetch, authJson } from '../../utils/api';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/AdminSidebar';
import { ResaleListing } from '../../types';
import { FALLBACK_IMAGE_URL, resolveImageUrl, withFallbackImage } from '../../utils/image';

export default function ManageResaleListings() {
  const [listings, setListings] = useState<ResaleListing[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = () => {
    authJson<ResaleListing[]>('/api/resale/admin/listings')
      .then(setListings)
      .catch(() => setListings([]));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resale listing?')) return;

    const res = await authFetch(`/api/resale/admin/listings/${id}`, { method: 'DELETE' });
    if (res.ok) fetchListings();
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
            <h1 className="text-3xl font-bold">Resale Listings</h1>
          </div>
          <Link to="/admin/resale/listings/new">
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> New Listing
            </Button>
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-zinc-50 text-sm font-medium text-zinc-500">
                <th className="px-6 py-4">Listing</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Beds</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={resolveImageUrl(listing.main_image) || FALLBACK_IMAGE_URL}
                        alt=""
                        className="mr-3 h-10 w-10 rounded-lg object-cover"
                        loading="lazy"
                        decoding="async"
                        onError={withFallbackImage}
                      />
                      <span className="font-medium">{listing.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{listing.location}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{listing.price || '-'}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{listing.beds || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium">
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/resale/listings/edit/${listing.id}`)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-black"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
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
          {listings.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-zinc-500">No resale listings yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
