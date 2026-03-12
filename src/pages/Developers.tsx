import { useState, useEffect } from 'react';
import { Developer, Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';

export default function Developers() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch('/api/developers').then(res => res.json()).then(setDevelopers);
    fetch('/api/projects').then(res => res.json()).then(setProjects);
  }, []);

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-12 text-4xl font-bold">Our Partner Developers</h1>
        
        <div className="space-y-24">
          {developers.map(dev => (
            <div key={dev.id} className="border-t pt-16">
              <div className="mb-12 grid gap-12 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <div className="mb-6 h-32 w-32 overflow-hidden rounded-2xl bg-zinc-50 p-6">
                    <img src={dev.logo} alt={dev.name} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <h2 className="mb-4 text-3xl font-bold">{dev.name}</h2>
                  <p className="mb-6 text-zinc-500 leading-relaxed">{dev.description}</p>
                </div>
                
                <div className="lg:col-span-2">
                  <h3 className="mb-6 text-xl font-bold">Projects by {dev.name}</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {projects.filter(p => p.developer_id === dev.id).map(p => (
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
