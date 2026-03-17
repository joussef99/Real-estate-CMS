import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Developer, Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { SectionHeading } from '../components/ui/section-heading';

export default function Developers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const normalize = <T,>(data: any, key?: string): T[] => {
      if (Array.isArray(data)) return data;
      if (key && data && Array.isArray(data[key])) return data[key];
      if (data && Array.isArray(data.developers)) return data.developers;
      return [];
    };

    fetch(`/api/developers?limit=6&page=${currentPage}&include_project_previews=1&project_preview_limit=2`)
      .then(res => res.json())
      .then(data => {
        setDevelopers(normalize<Developer>(data, 'developers'));
        setCurrentPage(data?.current_page || 1);
        setTotalPages(Math.max(data?.total_pages || 1, 1));
      });
  }, [currentPage]);

  return (
    <div className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Developers"
          title="Our Partner Developers"
          description="Discover the visionary firms behind Egypt's most sought-after communities."
        />

        <div className="scrollbar-hide -mx-2 mb-16 flex gap-5 overflow-x-auto px-2 pb-2">
          {developers.map((dev, index) => (
            <Link key={dev.id} to={`/developers/${dev.slug}`}>
              <motion.article
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                whileHover={{ scale: 1.03 }}
                className="min-w-60 cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-lg transition-all duration-300 hover:border-slate-300 hover:shadow-2xl"
              >
                <div className="mb-4 flex h-20 items-center justify-center rounded-xl bg-slate-50">
                  <img src={dev.logo} alt={dev.name} className="max-h-14 object-contain" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                </div>
                <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">{dev.name}</h3>
              </motion.article>
            </Link>
          ))}
        </div>
        
        <div className="space-y-24">
          {developers.map(dev => (
            <div key={dev.id} className="rounded-2xl border border-slate-100 bg-white/80 p-8 shadow-lg md:p-10">
              <div className="mb-12 grid gap-12 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <div className="mb-6 h-32 w-32 overflow-hidden rounded-2xl bg-slate-50 p-6">
                    <img src={dev.logo} alt={dev.name} className="h-full w-full object-contain" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                  </div>
                  <h2 className="mb-4 text-3xl font-semibold text-slate-950">{dev.name}</h2>
                  <p className="mb-6 leading-relaxed text-gray-500">{dev.description}</p>
                  <Link
                    to={`/developers/${dev.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-700"
                  >
                    View All Projects
                  </Link>
                </div>
                
                <div className="lg:col-span-2">
                  <h3 className="mb-6 text-xl font-semibold text-slate-900">Projects by {dev.name}</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {(dev.preview_projects || []).map((p: Project) => (
                      <ProjectCard key={p.id} project={p} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
