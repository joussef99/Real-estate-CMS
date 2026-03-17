import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/AdminSidebar';
import { ArrowLeft, X, Upload } from 'lucide-react';
import { slugify } from '../../utils/slugify';
import { optimizeImageFiles } from '../../utils/imageUpload';

export default function AddProject() {
  const { id } = useParams();
  const [developers, setDevelopers] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<any[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [slugDirty, setSlugDirty] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    location: '',
    price_range: '',
    type: '',
    status: 'Off-Plan',
    description: '',
    meta_title: '',
    meta_description: '',
    developer_id: '',
    destination_id: '',
    is_featured: false,
    beds: '',
    size: '',
  });
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetch('/api/developers').then(res => res.json()).then(setDevelopers);
    fetch('/api/destinations').then(res => res.json()).then(setDestinations);
    fetch('/api/property-types').then(res => res.json()).then(data => {
      setPropertyTypes(data);
      if (!id && data.length > 0) {
        setFormData(prev => ({ ...prev, type: data[0].name }));
      }
    });
    fetch('/api/amenities').then(res => res.json()).then(setAmenitiesList);

    if (id) {
      fetch(`/api/projects/${id}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            name: data.name,
            slug: data.slug || '',
            location: data.location,
            price_range: data.price_range,
            type: data.type,
            status: data.status,
            description: data.description,
            meta_title: data.meta_title || '',
            meta_description: data.meta_description || '',
            developer_id: data.developer_id,
            destination_id: data.destination_id,
            is_featured: data.is_featured === 1,
            beds: data.beds || '',
            size: data.size || '',
          });
          if (data.gallery) {
            setGallery(typeof data.gallery === 'string' ? JSON.parse(data.gallery) : data.gallery);
          }
        });
      
      // Fetch project amenities
      fetch(`/api/projects/${id}/amenities`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data)) {
            setSelectedAmenities(data.map((a: any) => a.amenity_id));
          }
        });
    }
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (gallery.length + files.length > 10) {
      alert('Maximum 10 images allowed per project');
      return;
    }

    setUploadingImages(true);

    try {
      const optimizedFiles = await optimizeImageFiles(files, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.70,
        fileNamePrefix: 'project',
      });

      const formDataUpload = new FormData();
      optimizedFiles.forEach((file) => {
        formDataUpload.append('images', file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setGallery([...gallery, ...data.images]);
      } else {
        const error = await res.json();
        alert(error.error || 'Upload failed');
      }
    } catch (err) {
      alert('Upload error: ' + (err as Error).message);
    } finally {
      setUploadingImages(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (gallery.length === 0) {
      alert('Please upload at least 1 image to the project gallery.');
      return;
    }

    const url = id ? `/api/projects/${id}` : '/api/projects';
    const method = id ? 'PUT' : 'POST';

    const normalizedSlug = formData.slug ? slugify(formData.slug) : slugify(formData.name);

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...formData,
        slug: normalizedSlug,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        images: gallery,
        gallery,
        amenities: selectedAmenities
      }),
    });
    if (res.ok) {
      navigate('/admin/projects');
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-3xl">
          <button onClick={() => navigate('/admin/projects')} className="mb-6 flex items-center text-sm text-zinc-500 hover:text-black">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
          </button>
          
          <div className="rounded-3xl bg-white p-10 shadow-xl border border-zinc-100">
            <h1 className="mb-8 text-3xl font-bold text-zinc-900">{id ? 'Edit Project' : 'Add New Project'}</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Project Name</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.name}
                    onChange={e => {
                      const value = e.target.value;
                      setFormData(prev => ({ ...prev, name: value }));
                      if (!slugDirty) {
                        setFormData(prev => ({ ...prev, slug: slugify(value) }));
                      }
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Slug</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.slug}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, slug: e.target.value }));
                      setSlugDirty(true);
                    }}
                    placeholder="auto-generated from name"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Location</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Price Range</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.price_range}
                    onChange={e => setFormData(prev => ({ ...prev, price_range: e.target.value }))}
                    placeholder="e.g. $1.2M - $5M"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Status</label>
                  <select
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value="Off-Plan">Off-Plan</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Completed">Completed</option>
                    <option value="Available">Available</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Property Type</label>
                  <select
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="">Select Property Type</option>
                    {propertyTypes.map(pt => <option key={pt.id} value={pt.name}>{pt.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Meta Title</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.meta_title}
                    onChange={e => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Meta Description</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.meta_description}
                    onChange={e => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO description"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Number of Beds</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.beds}
                    onChange={e => setFormData({ ...formData, beds: e.target.value })}
                    placeholder="e.g. Studio, 1, 2, 3+"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Size (Sqft)</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.size}
                    onChange={e => setFormData({ ...formData, size: e.target.value })}
                    placeholder="e.g. 1,250 sqft"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Developer</label>
                  <select
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.developer_id}
                    onChange={e => setFormData({ ...formData, developer_id: e.target.value })}
                    required
                  >
                    <option value="">Select Developer</option>
                    {developers.map(dev => <option key={dev.id} value={dev.id}>{dev.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">Destination</label>
                  <select
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    value={formData.destination_id}
                    onChange={e => setFormData({ ...formData, destination_id: e.target.value })}
                    required
                  >
                    <option value="">Select Destination</option>
                    {destinations.map(dest => <option key={dest.id} value={dest.id}>{dest.name}</option>)}
                  </select>
                </div>
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

              <div>
                <label className="mb-4 block text-sm font-medium text-zinc-700">Project Gallery ({gallery.length}/10 images)</label>
                <div className="mb-4 rounded-xl border-2 border-dashed border-zinc-300 p-8 text-center">
                  <input
                    type="file"
                    id="gallery-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImages || gallery.length >= 10}
                    className="hidden"
                  />
                  <label
                    htmlFor="gallery-upload"
                    className={`flex cursor-pointer flex-col items-center justify-center ${uploadingImages || gallery.length >= 10 ? 'opacity-50' : ''}`}
                  >
                    <Upload className="mb-2 h-8 w-8 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-700">
                      {uploadingImages ? 'Uploading...' : 'Click to upload images or drag and drop'}
                    </p>
                    <p className="text-xs text-zinc-500">Auto-compressed to WebP, max 1600px, up to 5MB source</p>
                  </label>
                </div>

                {gallery.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-zinc-700">Uploaded Images</h3>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {gallery.map((img, idx) => (
                        <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                          <img
                            src={img}
                            alt={`Gallery ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-6 w-6 text-white" />
                          </button>
                          {idx === 0 && (
                            <div className="absolute bottom-1 left-1 inline-flex rounded bg-black/50 px-2 py-1 text-xs font-medium text-white">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-4 block text-sm font-medium text-zinc-700">Amenities</label>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {amenitiesList.map(amenity => (
                    <label key={amenity.id} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedAmenities([...selectedAmenities, amenity.id]);
                          } else {
                            setSelectedAmenities(selectedAmenities.filter(id => id !== amenity.id));
                          }
                        }}
                        className="mr-2 h-4 w-4 rounded border-zinc-300 text-black focus:ring-black"
                      />
                      <span className="text-sm text-zinc-700">{amenity.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  className="mr-2 h-5 w-5 rounded border-zinc-300 text-black focus:ring-black"
                  checked={formData.is_featured}
                  onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                />
                <label htmlFor="featured" className="text-sm font-medium text-zinc-700">Feature this project on home page</label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">{id ? 'Update Project' : 'Create Project'}</Button>
                <Button type="button" variant="outline" onClick={() => navigate('/admin/projects')}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
