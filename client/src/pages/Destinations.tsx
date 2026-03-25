import { apiJson } from '../utils/api';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Destination, Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { SectionHeading } from '../components/ui/section-heading';
import { DestinationSkeleton } from '../components/ui/destination-skeleton';
import { FALLBACK_IMAGE_URL, resolveImageUrl, withFallbackImage } from '../utils/image';

export default function Destinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const normalize = <T,>(data: any, key?: string): T[] => {
      if (Array.isArray(data)) return data;
      if (key && data && Array.isArray(data[key])) return data[key];
      if (data && Array.isArray(data.destinations)) return data.destinations;
      return [];
    };

    setLoading(true);
    apiJson<any>(`/api/destinations?limit=6&page=${currentPage}&include_project_previews=1&project_preview_limit=2`)
      .then(data => {
        setDestinations(normalize<Destination>(data, 'destinations'));
        setCurrentPage(data?.current_page || 1);
        setTotalPages(Math.max(data?.total_pages || 1, 1));
      })
      .catch(() => {
        setDestinations([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [currentPage]);

  return (
    <div className="bg-slate-50 px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Destinations"
          title="Explore Prime Locations"
          description="From beachfront retreats to metropolitan landmarks, discover where luxury meets opportunity."
        />
        
        <div className="space-y-24">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <DestinationSkeleton key={index} />)
            : destinations.map(dest => {
            const previewProjects = (dest.preview_projects || []).slice(0, 2);

            return (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="overflow-hidden rounded-2xl border border-white/70 bg-white shadow-lg"
              >
                <div className="mb-12 grid gap-12 lg:grid-cols-3">
                  <div className="relative lg:col-span-1">
                    <div className="relative h-full min-h-80 overflow-hidden lg:min-h-135">
                      <img src={resolveImageUrl(dest.image) || FALLBACK_IMAGE_URL} alt={dest.name} className="h-full w-full object-cover" loading="lazy" decoding="async" sizes="(max-width: 1024px) 100vw, 33vw" referrerPolicy="no-referrer" onError={withFallbackImage} />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-900/20 to-transparent" />
                      <div className="absolute bottom-6 left-6 rounded-2xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl">
                        {dest.project_count || 0} active projects
                      </div>
                    </div>
                  </div>

                  <div className="p-8 lg:col-span-2 lg:p-10">
                    <h2 className="mb-4 text-3xl font-semibold text-slate-950">{dest.name}</h2>
                    <p className="mb-8 leading-relaxed text-gray-500">{dest.description}</p>
                    <h3 className="mb-6 text-xl font-semibold text-slate-900">Projects in {dest.name}</h3>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {previewProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                      ))}
                    </div>

                    <Link
                      to={dest.slug ? `/destinations/${dest.slug}` : '/destinations'}
                      className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-700"
                    >
                      View All Projects in {dest.name}
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm md:flex-row">
            <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
