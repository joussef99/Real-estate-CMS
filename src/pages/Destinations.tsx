import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Destination, Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { SectionHeading } from '../components/ui/section-heading';

export default function Destinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const projectsByDestination = useMemo(() => {
    return projects.reduce<Record<number, Project[]>>((acc, project) => {
      if (!project.destination_id) return acc;
      if (!acc[project.destination_id]) {
        acc[project.destination_id] = [];
      }
      acc[project.destination_id].push(project);
      return acc;
    }, {});
  }, [projects]);

  useEffect(() => {
    const normalize = <T,>(data: any, key?: string): T[] => {
      if (Array.isArray(data)) return data;
      if (key && data && Array.isArray(data[key])) return data[key];
      if (data && Array.isArray(data.destinations)) return data.destinations;
      if (data && Array.isArray(data.projects)) return data.projects;
      return [];
    };

    fetch('/api/destinations')
      .then(res => res.json())
      .then(data => setDestinations(normalize<Destination>(data, 'destinations')));

    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(normalize<Project>(data, 'projects')));
  }, []);

  return (
    <div className="bg-slate-50 px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Destinations"
          title="Explore Prime Locations"
          description="From beachfront retreats to metropolitan landmarks, discover where luxury meets opportunity."
        />
        
        <div className="space-y-24">
          {destinations.map(dest => {
            const destinationProjects = projectsByDestination[dest.id] || [];
            const previewProjects = destinationProjects.slice(0, 2);

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
                      <img src={dest.image} alt={dest.name} className="h-full w-full object-cover" loading="lazy" decoding="async" sizes="(max-width: 1024px) 100vw, 33vw" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-900/20 to-transparent" />
                      <div className="absolute bottom-6 left-6 rounded-2xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl">
                        {destinationProjects.length} active projects
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
      </div>
    </div>
  );
}
