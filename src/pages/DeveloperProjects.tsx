import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Project, Developer } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { SectionHeading } from '../components/ui/section-heading';
import { ProjectCardSkeleton } from '../components/ui/project-card-skeleton';

export default function DeveloperProjects() {
  const { slug } = useParams<{ slug: string }>();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    setError(null);

    fetch(`/api/developers/${encodeURIComponent(slug)}/projects`)
      .then(async res => {
        const contentType = res.headers.get('content-type') || '';

        if (res.status === 404) {
          setNotFound(true);
          return [] as Project[];
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
      .then(data => {
        const projectsData = Array.isArray(data)
          ? data
          : Array.isArray(data?.projects)
            ? data.projects
            : [];

        setProjects(projectsData);
        if (projectsData.length > 0) {
          setDeveloper({
            id: projectsData[0].developer_id,
            name: projectsData[0].developer_name || slug,
            logo: '',
            description: '',
            slug,
          });
        } else {
          setDeveloper({ id: 0, name: slug, logo: '', description: '', slug });
        }
      })
      .catch(err => {
        setError(err?.message || 'Failed to load projects');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 h-6 w-32 animate-pulse rounded-lg bg-slate-200" />
          <div className="mb-12 h-64 animate-pulse rounded-3xl bg-slate-200" />
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !developer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 pt-32 text-center">
        <h1 className="text-4xl font-bold text-slate-900">Developer Not Found</h1>
        <p className="text-slate-500">The developer you're looking for doesn't exist or may have been removed.</p>
        <Link
          to="/developers"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Developers
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 pt-32 text-center">
        <h1 className="text-4xl font-bold text-slate-900">Unable to load developer projects</h1>
        <p className="max-w-xl text-slate-500">{error}</p>
        <Link
          to="/developers"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Developers
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10"
        >
          <Link
            to="/developers"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            All Developers
          </Link>
        </motion.div>

        {/* Developer Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-20 overflow-hidden rounded-3xl border border-slate-100 bg-white p-10 shadow-lg md:p-14"
        >
          <div className="flex flex-col gap-10 md:flex-row md:items-center">
            <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 p-6 shadow-inner">
              {developer.logo ? (
                <img
                  src={developer.logo}
                  alt={developer.name}
                  className="h-full w-full object-contain"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-4xl font-bold text-slate-300">
                  {developer.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-400">Developer</p>
              <h1 className="mb-4 text-4xl font-bold text-slate-950 md:text-5xl">{developer.name}</h1>
              {developer.description && (
                <p className="max-w-2xl leading-relaxed text-slate-500">{developer.description}</p>
              )}
            </div>

            <div className="shrink-0">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-8 py-6 text-center">
                <span className="block text-4xl font-bold text-slate-900">{projects.length}</span>
                <span className="mt-1 block text-sm font-medium text-slate-500">
                  {projects.length === 1 ? 'Project' : 'Projects'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <>
            <SectionHeading
              eyebrow="Portfolio"
              title={`Projects by ${developer.name}`}
              description={`Explore all ${projects.length} development${projects.length !== 1 ? 's' : ''} from ${developer.name}.`}
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
            <p className="text-lg font-medium text-slate-500">No projects listed yet for {developer.name}.</p>
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
