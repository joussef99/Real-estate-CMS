import React ,{ useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Project } from '../types';
import { MapPin, Building2, CheckCircle2, Phone, Mail, ChevronLeft, ChevronRight, Bed, Maximize2 } from 'lucide-react';
import { Button } from '../components/Button';
import { motion } from 'motion/react';

export default function ProjectDetails() {
  const { slug } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [projectAmenities, setProjectAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${slug}`)
      .then(res => res.json())
      .then(data => {
        setProject(data);
        setActiveImage(data.main_image);
        setLoading(false);
      });
    
    // Fetch project amenities
    fetch(`/api/projects/${slug}/amenities`)
      .then(res => res.json())
      .then(data => setProjectAmenities(data || []));
  }, [slug]);

  useEffect(() => {
    if (!project) return;

    const previousTitle = document.title;
    document.title = project.meta_title || project.name;

    let descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.name = 'description';
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.content = project.meta_description || project.description || '';

    return () => {
      document.title = previousTitle;
    };
  }, [project]);

  const handleEnquire = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message,
          project_id: project?.id || null
        })
      });
      
      if (res.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setSubmitted(false), 4000);
      }
    } catch (err) {
      alert('Error sending enquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const getGalleryImages = () => {
    if (!project) return [];
    
    const images: string[] = [];
    
    // Add main image first
    if (project.main_image) {
      images.push(project.main_image);
    }
    
    // Add gallery images
    if (project.images && Array.isArray(project.images)) {
      images.push(...project.images);
    } else if (project.gallery) {
      const gallery = typeof project.gallery === 'string' ? JSON.parse(project.gallery) : project.gallery;
      if (Array.isArray(gallery)) {
        images.push(...gallery);
      }
    }
    
    // Remove duplicates
    return [...new Set(images)];
  };

  const amenities = projectAmenities.map((a: any) => a.name);
  const galleryImages = getGalleryImages();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!project) return <div className="flex h-screen items-center justify-center">Project not found</div>;

  return (
    <div className="pt-24 pb-24">
      {/* Professional Gallery */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="space-y-6">
          {/* Main Image Container */}
          <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-[2.5rem] bg-zinc-100 shadow-2xl">
            <motion.img
              key={activeImage}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              src={activeImage}
              alt={project.name}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

            {/* Navigation Buttons */}
            {galleryImages.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-6 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => {
                    const currentIndex = galleryImages.indexOf(activeImage);
                    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
                    setActiveImage(galleryImages[prevIndex]);
                  } }
                  className="rounded-full bg-white/20 p-3 text-white backdrop-blur-md transition-all hover:bg-white/40"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => {
                    const currentIndex = galleryImages.indexOf(activeImage);
                    const nextIndex = (currentIndex + 1) % galleryImages.length;
                    setActiveImage(galleryImages[nextIndex]);
                  } }
                  className="rounded-full bg-white/20 p-3 text-white backdrop-blur-md transition-all hover:bg-white/40"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>

          {/* Thumbnails Carousel */}
          {galleryImages.length > 1 && (
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {galleryImages.map((img, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setActiveImage(img)}
                    className={`relative aspect-[3/2] w-32 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-300 md:w-48 ${activeImage === img ? 'border-black ring-4 ring-black/5' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Gallery ${i}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    {activeImage === img && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute inset-0 bg-black/10" />
                    )}
                  </motion.button>
                ))}
              </div>
              {/* Fade edges for carousel */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent opacity-0 md:opacity-100" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent opacity-0 md:opacity-100" />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-4">
                <span className="rounded-full bg-zinc-100 px-4 py-1 text-sm font-semibold uppercase text-zinc-600">
                  {project.type}
                </span>
                <span className="text-2xl font-bold text-black">{project.price_range}</span>
              </div>
              <h1 className="mb-4 text-4xl font-bold text-zinc-900 md:text-5xl">{project.name}</h1>
              <div className="flex flex-wrap gap-6 text-zinc-500">
                <div className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  {project.location}
                </div>
                <div className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  {project.developer_name}
                </div>
              </div>
            </div>

            {/* Project Overview Stats */}
            <div className="mb-12 grid grid-cols-2 gap-6 rounded-3xl border border-zinc-100 bg-zinc-50/50 p-8 sm:grid-cols-3 lg:grid-cols-3">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Bed className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Bedrooms</p>
                  <p className="font-bold text-zinc-900">{project.beds || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Maximize2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Size</p>
                  <p className="font-bold text-zinc-900">{project.size || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Property Type</p>
                  <p className="font-bold text-zinc-900">{project.type}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Location</p>
                  <p className="font-bold text-zinc-900">{project.location.split(',')[0]}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <span className="text-lg font-bold">$</span>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Price Range</p>
                  <p className="font-bold text-zinc-900">{project.price_range}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Developer</p>
                  <p className="font-bold text-zinc-900">{project.developer_name}</p>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold">About the Project</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-zinc-600">
                {project.description}
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-6 text-2xl font-bold">Amenities & Features</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {amenities.map((item: string) => (
                  <div key={item} className="group flex items-center rounded-2xl border border-zinc-100 bg-white p-4 transition-all hover:border-emerald-200 hover:shadow-md">
                    <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-zinc-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
              <h3 className="mb-6 text-xl font-bold">Enquire About This Project</h3>
              <form onSubmit={handleEnquire} className="space-y-4">
                {submitted && (
                  <div className="rounded-xl bg-green-50 p-4 text-green-800 text-sm">
                    Thank you! Your enquiry has been sent successfully.
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none" 
                    placeholder="John Doe" 
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none" 
                    placeholder="john@example.com" 
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Phone Number</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none" 
                    placeholder="+1 234 567 890" 
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Message</label>
                  <textarea 
                    rows={4} 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none" 
                    placeholder="I'm interested in this project..." 
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Sending...' : 'Send Enquiry'}
                </Button>
              </form>

              <div className="mt-8 border-t pt-8">
                <p className="mb-4 text-sm font-medium text-zinc-500">Or contact us directly:</p>
                <div className="space-y-3">
                  <a href="tel:+1234567890" className="flex items-center text-zinc-900 hover:underline">
                    <Phone className="mr-3 h-4 w-4" /> +1 234 567 890
                  </a>
                  <a href="mailto:info@luxeestate.com" className="flex items-center text-zinc-900 hover:underline">
                    <Mail className="mr-3 h-4 w-4" /> info@luxeestate.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
