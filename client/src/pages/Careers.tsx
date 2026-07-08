import { normalizeListResponse } from '../utils/api';
import { useCallback } from 'react';
import { Career } from '../types';
import { Button } from '../components/Button';
import { Briefcase, MapPin, Clock } from 'lucide-react';
import { ErrorState, EmptyState } from '../components/ui/state-message';
import { useApiData } from '../hooks/useApiData';

export default function Careers() {
  const normalize = useCallback((raw: any) => normalizeListResponse<Career>(raw, 'careers'), []);
  const { data, loading, error, refetch } = useApiData<Career[]>('/api/careers', normalize);
  const jobs = data ?? [];

  const hasApplyLink = (career: Career) => Boolean(career.apply_link?.trim());

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">Join Our Team</h1>
          <p className="text-lg text-zinc-500">Help us build the future of luxury real estate technology.</p>
        </div>

        {error && !loading && (
          <ErrorState message="We couldn't load open positions right now." onRetry={refetch} className="mb-8" />
        )}

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-3xl bg-zinc-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {!error && jobs.length === 0 ? (
              <EmptyState message="No open positions at the moment. Check back later!" />
            ) : (
              jobs.map(job => (
                <div key={job.id} className="flex flex-col items-start justify-between rounded-3xl border border-zinc-100 bg-white p-8 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center">
                  <div>
                    <h3 className="mb-2 text-xl font-bold">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                      <span className="flex items-center"><MapPin className="mr-1 h-4 w-4" /> {job.location}</span>
                      <span className="flex items-center"><Clock className="mr-1 h-4 w-4" /> {job.type}</span>
                    </div>
                  </div>
                  {hasApplyLink(job) ? (
                    <Button asChild variant="outline" className="mt-4 md:mt-0">
                      <a href={job.apply_link!} target="_blank" rel="noreferrer">
                        Apply Now
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="mt-4 md:mt-0" disabled>
                      Apply Now
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
