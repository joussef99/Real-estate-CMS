import { useState, useEffect } from 'react';
import { Destination, Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';

export default function Destinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch('/api/destinations').then(res => res.json()).then(setDestinations);
    fetch('/api/projects').then(res => res.json()).then(setProjects);
  }, []);

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-12 text-4xl font-bold">Explore Destinations</h1>
        
        <div className="space-y-24">
          {destinations.map(dest => (
            <div key={dest.id} className="border-t pt-16">
              <div className="mb-12 grid gap-12 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <div className="mb-6 aspect-[16/10] overflow-hidden rounded-3xl">
                    <img src={dest.image} alt={dest.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h2 className="mb-4 text-3xl font-bold">{dest.name}</h2>
                  <p className="text-zinc-500 leading-relaxed">{dest.description}</p>
                </div>
                
                <div className="lg:col-span-2">
                  <h3 className="mb-6 text-xl font-bold">Projects in {dest.name}</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {projects.filter(p => p.destination_id === dest.id).map(p => (
                      <ProjectCard key={p.id} project={p} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
