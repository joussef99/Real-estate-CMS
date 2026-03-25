import { apiJson } from '../utils/api';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectCardSkeleton } from '../components/ui/project-card-skeleton';
import { Destination, Developer, Project } from '../types';
import { Search, Filter, X, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const RESULTS_PER_PAGE = 12;
const FILTER_DEBOUNCE_MS = 450;

interface ProjectFilters {
  keyword: string;
  developer: string;
  destination: string;
  property_type: string;
  price_min: string;
  price_max: string;
}

const LEGACY_PRICE_RANGES: Record<string, { price_min: string; price_max: string }> = {
  'Under 5M EGP': { price_min: '', price_max: '5000000' },
  '5M - 15M EGP': { price_min: '5000000', price_max: '15000000' },
  '15M - 30M EGP': { price_min: '15000000', price_max: '30000000' },
  'Over 30M EGP': { price_min: '30000000', price_max: '' },
};

const normalize = <T,>(data: any, key: string): T[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  return [];
};

const getInitialFilters = (searchParams: URLSearchParams): ProjectFilters => {
  const legacyPriceRange = LEGACY_PRICE_RANGES[searchParams.get('prices') || ''] || { price_min: '', price_max: '' };

  return {
    keyword: searchParams.get('keyword') || searchParams.get('q') || '',
    developer: searchParams.get('developer') || '',
    destination: searchParams.get('destination') || '',
    property_type: searchParams.get('property_type') || searchParams.get('types')?.split(',').map((value) => value.trim()).find(Boolean) || '',
    price_min: searchParams.get('price_min') || legacyPriceRange.price_min,
    price_max: searchParams.get('price_max') || legacyPriceRange.price_max,
  };
};

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page') || '1');
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(Number.isNaN(pageParam) ? 1 : Math.max(pageParam, 1));
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState<ProjectFilters>(() => getInitialFilters(searchParams));
  const [debouncedFilters, setDebouncedFilters] = useState<ProjectFilters>(() => getInitialFilters(searchParams));
  const [showFilters, setShowFilters] = useState(searchParams.toString().length > 0);
  const hasActiveQuery = Boolean(
    debouncedFilters.keyword.trim() ||
    debouncedFilters.developer ||
    debouncedFilters.destination ||
    debouncedFilters.property_type ||
    debouncedFilters.price_min ||
    debouncedFilters.price_max,
  );

  const activeFiltersCount = [
    filters.keyword.trim(),
    filters.developer,
    filters.destination,
    filters.property_type,
    filters.price_min,
    filters.price_max,
  ].filter(Boolean).length;

  const selectedDeveloper = developers.find((developer) => String(developer.id) === filters.developer);
  const selectedDestination = destinations.find((destination) => String(destination.id) === filters.destination);

  const pageTitle = useMemo(() => {
    if (!filters.developer) return 'All Projects';
    return `${selectedDeveloper?.name || projects[0]?.developer_name || 'Developer'} Projects`;
  }, [filters.developer, projects, selectedDeveloper]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];

    if (filters.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `Keyword: ${filters.keyword.trim()}`,
        clear: () => {
          setFilters((current) => ({ ...current, keyword: '' }));
          setCurrentPage(1);
        },
      });
    }

    if (filters.developer) {
      chips.push({
        key: 'developer',
        label: `Developer: ${selectedDeveloper?.name || 'Selected'}`,
        clear: () => {
          setFilters((current) => ({ ...current, developer: '' }));
          setCurrentPage(1);
        },
      });
    }

    if (filters.destination) {
      chips.push({
        key: 'destination',
        label: `Destination: ${selectedDestination?.name || 'Selected'}`,
        clear: () => {
          setFilters((current) => ({ ...current, destination: '' }));
          setCurrentPage(1);
        },
      });
    }

    if (filters.property_type) {
      chips.push({
        key: 'property_type',
        label: `Type: ${filters.property_type}`,
        clear: () => {
          setFilters((current) => ({ ...current, property_type: '' }));
          setCurrentPage(1);
        },
      });
    }

    if (filters.price_min) {
      chips.push({
        key: 'price_min',
        label: `Min: ${Number(filters.price_min).toLocaleString()}`,
        clear: () => {
          setFilters((current) => ({ ...current, price_min: '' }));
          setCurrentPage(1);
        },
      });
    }

    if (filters.price_max) {
      chips.push({
        key: 'price_max',
        label: `Max: ${Number(filters.price_max).toLocaleString()}`,
        clear: () => {
          setFilters((current) => ({ ...current, price_max: '' }));
          setCurrentPage(1);
        },
      });
    }

    return chips;
  }, [filters, selectedDeveloper, selectedDestination]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, FILTER_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      apiJson<any>(`/api/developers`, { signal: controller.signal }),
      apiJson<any>(`/api/destinations`, { signal: controller.signal }),
      apiJson<any>(`/api/property-types`, { signal: controller.signal }),
    ])
      .then(([developersData, destinationsData, propertyTypesData]) => {
        setDevelopers(normalize<Developer>(developersData, 'developers'));
        setDestinations(normalize<Destination>(destinationsData, 'destinations'));
        setPropertyTypes((Array.isArray(propertyTypesData) ? propertyTypesData : []).map((item: { name: string }) => item.name).filter(Boolean));
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.error(err);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
    if (filters.developer) params.set('developer', filters.developer);
    if (filters.destination) params.set('destination', filters.destination);
    if (filters.property_type) params.set('property_type', filters.property_type);
    if (filters.price_min) params.set('price_min', filters.price_min);
    if (filters.price_max) params.set('price_max', filters.price_max);
    if (currentPage > 1) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    params.set('limit', String(RESULTS_PER_PAGE));
    params.set('page', String(currentPage));

    if (debouncedFilters.keyword.trim()) params.set('keyword', debouncedFilters.keyword.trim());
    if (debouncedFilters.developer) params.set('developer', debouncedFilters.developer);
    if (debouncedFilters.destination) params.set('destination', debouncedFilters.destination);
    if (debouncedFilters.property_type) params.set('property_type', debouncedFilters.property_type);
    if (debouncedFilters.price_min) params.set('price_min', debouncedFilters.price_min);
    if (debouncedFilters.price_max) params.set('price_max', debouncedFilters.price_max);

    setLoading(true);
    setError(null);

    apiJson<any>(`/api/projects/search?${params.toString()}`, { signal: controller.signal })
      .then((data) => {
        setProjects(normalize<Project>(data, 'projects'));
        setCurrentPage(data?.current_page || 1);
        setTotalPages(Math.max(data?.total_pages || 1, 1));
        setTotalResults(Number(data?.total || 0));
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setProjects([]);
        setTotalPages(1);
        setTotalResults(0);
        setError(err?.message || 'Unable to load projects right now.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentPage, debouncedFilters]);

  useEffect(() => {
    setCurrentPage(Number.isNaN(pageParam) ? 1 : Math.max(pageParam, 1));
  }, [pageParam]);

  const updateFilters = (partial: Partial<ProjectFilters>) => {
    setFilters((current) => ({ ...current, ...partial }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      developer: '',
      destination: '',
      property_type: '',
      price_min: '',
      price_max: '',
    });
    setCurrentPage(1);
  };

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="mb-4 text-4xl font-bold text-zinc-900">{pageTitle}</h1>
            <p className="text-zinc-500">
              {loading ? 'Refreshing results...' : `Browse ${totalResults.toLocaleString()} luxury properties with live search and filtering.`}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-full border px-6 py-3 font-medium transition-all ${
              showFilters ? 'border-black bg-black text-white' : 'border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className={`ml-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${showFilters ? 'bg-white text-black' : 'bg-black text-white'}`}>
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-12 space-y-6">
          <div className="flex flex-col gap-4 rounded-4xl border border-zinc-100 bg-white p-4 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)] md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by project, location, developer, or destination"
                value={filters.keyword}
                onChange={(e) => updateFilters({ keyword: e.target.value })}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 py-4 pl-14 pr-6 text-base shadow-inner outline-none transition-all focus:border-black focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-5 py-4 text-sm font-medium text-zinc-700 transition-all hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Filters
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid gap-6 rounded-3xl border border-zinc-100 bg-zinc-50/60 p-8 md:grid-cols-2 xl:grid-cols-5">
                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-zinc-400">Developer</label>
                    <select
                      value={filters.developer}
                      onChange={(e) => updateFilters({ developer: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-colors focus:border-black"
                    >
                      <option value="">All developers</option>
                      {developers.map((developer) => (
                        <option key={developer.id} value={developer.id}>{developer.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-zinc-400">Destination</label>
                    <select
                      value={filters.destination}
                      onChange={(e) => updateFilters({ destination: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-colors focus:border-black"
                    >
                      <option value="">All destinations</option>
                      {destinations.map((destination) => (
                        <option key={destination.id} value={destination.id}>{destination.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-zinc-400">Property Type</label>
                    <select
                      value={filters.property_type}
                      onChange={(e) => updateFilters({ property_type: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-colors focus:border-black"
                    >
                      <option value="">All property types</option>
                      {propertyTypes.map((propertyType) => (
                        <option key={propertyType} value={propertyType}>{propertyType}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-zinc-400">Minimum Price</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={filters.price_min}
                      onChange={(e) => updateFilters({ price_min: e.target.value })}
                      placeholder="e.g. 5000000"
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-colors focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-zinc-400">Maximum Price</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={filters.price_max}
                      onChange={(e) => updateFilters({ price_max: e.target.value })}
                      placeholder="e.g. 25000000"
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-colors focus:border-black"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {activeChips.map((chip) => (
                      <span key={chip.key} className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                        {chip.label}
                        <button type="button" onClick={chip.clear}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm font-medium text-zinc-400 hover:text-black"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mb-8 flex items-center justify-between text-sm text-zinc-500">
          <p>{loading ? 'Updating results...' : `${totalResults.toLocaleString()} projects found`}</p>
          {hasActiveQuery && !loading && (
            <p>Debounced live search is active</p>
          )}
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <ProjectCardSkeleton key={index} />)
            : projects.map(project => <ProjectCard key={project.id} project={project} />)}
        </div>

        {!loading && projects.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-lg text-zinc-500">No projects found matching your criteria.</p>
            <button
              onClick={clearFilters}
              className="mt-4 font-medium text-black underline"
            >
              Reset all search and filters
            </button>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-zinc-100 bg-white px-6 py-4 shadow-sm md:flex-row">
            <p className="text-sm text-zinc-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
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
