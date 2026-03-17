import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react';
import { Destination, Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { SectionHeading } from '../components/ui/section-heading';
import { ProjectCardSkeleton } from '../components/ui/project-card-skeleton';

export default function DestinationProjects() {
  const { slug } = useParams<{ slug: string }>();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setNotFound(false);
    setError(null);

    fetch(`/api/destinations/${encodeURIComponent(slug)}/projects`)
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';

        if (res.status === 404) {
          setNotFound(true);
          return { destination: null, projects: [] as Project[] };
        }

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        if (!contentType.includes('application/json')) {
          const preview = (await res.text()).slice(0, 120);
          throw new Error(`Expected JSON but received: ${preview}`);
        }

        return res.json();
      })
      .then((data) => {
        setDestination(data?.destination || null);
        setProjects(Array.isArray(data?.projects) ? data.projects : []);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load projects');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 h-6 w-32 animate-pulse rounded-lg bg-slate-200" />
          <div className="mb-12 h-72 animate-pulse rounded-3xl bg-slate-200" />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !destination) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 pt-32 text-center">
        <h1 className="text-4xl font-bold text-slate-900">Destination Not Found</h1>
        <p className="text-slate-500">The destination you're looking for doesn't exist or may have been removed.</p>
        <Link
          to="/destinations"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Destinations
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 pt-32 text-center">
        <h1 className="text-4xl font-bold text-slate-900">Unable to load destination projects</h1>
        <p className="max-w-xl text-slate-500">{error}</p>
        <Link
          to="/destinations"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Destinations
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10"
        >
          <Link
            to="/destinations"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All Destinations
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-20 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg"
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="relative min-h-72">
              <img
                src={destination.image || `https://picsum.photos/seed/destination-${destination.id}/1200/900`}
                alt={destination.name}
                className="h-full w-full object-cover"
                fetchPriority="high"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-6 left-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl">
                <MapPin className="h-4 w-4" />
                Destination
              </div>
            </div>

            <div className="p-8 md:p-10">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-400">Destination</p>
              <h1 className="mb-4 text-4xl font-bold text-slate-950 md:text-5xl">{destination.name}</h1>
              {destination.description && (
                <p className="max-w-2xl leading-relaxed text-slate-500">{destination.description}</p>
              )}

              <div className="mt-8 inline-flex rounded-2xl border border-slate-100 bg-slate-50 px-8 py-6 text-center">
                <div>
                  <span className="block text-4xl font-bold text-slate-900">{projects.length}</span>
                  <span className="mt-1 block text-sm font-medium text-slate-500">
                    {projects.length === 1 ? 'Project' : 'Projects'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {projects.length > 0 ? (
          <>
            <SectionHeading
              eyebrow="Portfolio"
              title={`Projects in ${destination.name}`}
              description={`Explore all ${projects.length} project${projects.length !== 1 ? 's' : ''} available in ${destination.name}.`}
              align="left"
            />
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-slate-100 bg-slate-50 py-24 text-center">
            <ExternalLink className="mx-auto mb-4 h-10 w-10 text-slate-300" />
            <p className="text-lg font-medium text-slate-500">No projects listed yet for {destination.name}.</p>
            <Link
              to="/projects"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700"
            >
              Browse All Projects
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
