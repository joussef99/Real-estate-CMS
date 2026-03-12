import { useState, useEffect } from 'react';
import { Career } from '../types';
import { Button } from '../components/Button';
import { Briefcase, MapPin, Clock } from 'lucide-react';

export default function Careers() {
  const [jobs, setJobs] = useState<Career[]>([]);

  useEffect(() => {
    fetch('/api/careers').then(res => res.json()).then(setJobs);
  }, []);

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">Join Our Team</h1>
          <p className="text-lg text-zinc-500">Help us build the future of luxury real estate technology.</p>
        </div>

        <div className="space-y-6">
          {jobs.length > 0 ? (
            jobs.map(job => (
              <div key={job.id} className="flex flex-col items-start justify-between rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center">
                <div>
                  <h3 className="mb-2 text-xl font-bold">{job.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                    <span className="flex items-center"><MapPin className="mr-1 h-4 w-4" /> {job.location}</span>
                    <span className="flex items-center"><Clock className="mr-1 h-4 w-4" /> {job.type}</span>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 md:mt-0">Apply Now</Button>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-zinc-500">
              No open positions at the moment. Check back later!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
