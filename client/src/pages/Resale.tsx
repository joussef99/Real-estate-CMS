import { apiJson, normalizeListResponse } from '../utils/api';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Project, ResaleListing } from '../types';
import { ErrorState } from '../components/ui/state-message';
import { FilterSelect, BEDROOM_OPTIONS } from '../components/ui/filter-select';
import { FINISHING_STATUS_OPTIONS } from '../utils/finishingStatusOptions';
import { ResaleListingCard } from '../components/ResaleListingCard';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const RESULTS_PER_PAGE = 12;
const FILTER_DEBOUNCE_MS = 450;

interface ResaleFilters {
  keyword: string;
  location: string;
  unit_type: string;
  finishing_status: string;
  bedrooms: string;
  price_min: string;
  price_max: string;
  size_min: string;
  size_max: string;
}

const EMPTY_FILTERS: ResaleFilters = {
  keyword: '',
  location: '',
  unit_type: '',
  finishing_status: '',
  bedrooms: '',
  price_min: '',
  price_max: '',
  size_min: '',
  size_max: '',
};

const getInitialFilters = (searchParams: URLSearchParams): ResaleFilters => ({
  keyword: searchParams.get('keyword') || '',
  location: searchParams.get('location') || '',
  unit_type: searchParams.get('unit_type') || '',
  finishing_status: searchParams.get('finishing_status') || '',
  bedrooms: searchParams.get('bedrooms') || '',
  price_min: searchParams.get('price_min') || '',
  price_max: searchParams.get('price_max') || '',
  size_min: searchParams.get('size_min') || '',
  size_max: searchParams.get('size_max') || '',
});

export default function Resale() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page') || '1');
  const [listings, setListings] = useState<ResaleListing[]>([]);
  const [compoundOptions, setCompoundOptions] = useState<string[]>([]);
  const [unitTypeOptions, setUnitTypeOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(Number.isNaN(pageParam) ? 1 : Math.max(pageParam, 1));
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState<ResaleFilters>(() => getInitialFilters(searchParams));
  const [debouncedFilters, setDebouncedFilters] = useState<ResaleFilters>(() => getInitialFilters(searchParams));
  const [showFilters, setShowFilters] = useState(searchParams.toString().length > 0);
  const [retryToken, setRetryToken] = useState(0);

  const showSkeleton = loading && listings.length === 0;
  const isRefetching = loading && listings.length > 0;

  const activeFiltersCount = Object.values(filters).filter((value) => value.trim()).length;

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];

    if (filters.keyword.trim()) {
      chips.push({ key: 'keyword', label: `Keyword: ${filters.keyword.trim()}`, clear: () => updateFilters({ keyword: '' }) });
    }
    if (filters.location) {
      chips.push({ key: 'location', label: `Compound: ${filters.location}`, clear: () => updateFilters({ location: '' }) });
    }
    if (filters.unit_type) {
      chips.push({ key: 'unit_type', label: `Type: ${filters.unit_type}`, clear: () => updateFilters({ unit_type: '' }) });
    }
    if (filters.finishing_status) {
      chips.push({ key: 'finishing_status', label: `Finishing: ${filters.finishing_status}`, clear: () => updateFilters({ finishing_status: '' }) });
    }
    if (filters.bedrooms) {
      chips.push({ key: 'bedrooms', label: `Beds: ${filters.bedrooms}`, clear: () => updateFilters({ bedrooms: '' }) });
    }
    if (filters.price_min) {
      chips.push({ key: 'price_min', label: `Min Price: ${Number(filters.price_min).toLocaleString()}`, clear: () => updateFilters({ price_min: '' }) });
    }
    if (filters.price_max) {
      chips.push({ key: 'price_max', label: `Max Price: ${Number(filters.price_max).toLocaleString()}`, clear: () => updateFilters({ price_max: '' }) });
    }
    if (filters.size_min) {
      chips.push({ key: 'size_min', label: `Min Size: ${Number(filters.size_min).toLocaleString()}`, clear: () => updateFilters({ size_min: '' }) });
    }
    if (filters.size_max) {
      chips.push({ key: 'size_max', label: `Max Size: ${Number(filters.size_max).toLocaleString()}`, clear: () => updateFilters({ size_max: '' }) });
    }

    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();

    apiJson<any>('/api/projects?limit=100', { signal: controller.signal })
      .then((data) => {
        const projects = normalizeListResponse<Project>(data, 'projects');
        const names = Array.from(new Set(projects.map((p) => p.name).filter(Boolean)));
        setCompoundOptions(names.sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {});

    apiJson<any>('/api/property-types', { signal: controller.signal })
      .then((data) => {
        const types = (Array.isArray(data) ? data : []).map((pt: { name: string }) => pt.name).filter(Boolean);
        setUnitTypeOptions(types);
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedFilters(filters), FILTER_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
    if (filters.location) params.set('location', filters.location);
    if (filters.unit_type) params.set('unit_type', filters.unit_type);
    if (filters.finishing_status) params.set('finishing_status', filters.finishing_status);
    if (filters.bedrooms) params.set('bedrooms', filters.bedrooms);
    if (filters.price_min) params.set('price_min', filters.price_min);
    if (filters.price_max) params.set('price_max', filters.price_max);
    if (filters.size_min) params.set('size_min', filters.size_min);
    if (filters.size_max) params.set('size_max', filters.size_max);
    if (currentPage > 1) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set('limit', String(RESULTS_PER_PAGE));
    params.set('page', String(currentPage));
    if (debouncedFilters.keyword.trim()) params.set('keyword', debouncedFilters.keyword.trim());
    if (debouncedFilters.location) params.set('location', debouncedFilters.location);
    if (debouncedFilters.unit_type) params.set('unit_type', debouncedFilters.unit_type);
    if (debouncedFilters.finishing_status) params.set('finishing_status', debouncedFilters.finishing_status);
    if (debouncedFilters.bedrooms) params.set('bedrooms', debouncedFilters.bedrooms);
    if (debouncedFilters.price_min) params.set('price_min', debouncedFilters.price_min);
    if (debouncedFilters.price_max) params.set('price_max', debouncedFilters.price_max);
    if (debouncedFilters.size_min) params.set('size_min', debouncedFilters.size_min);
    if (debouncedFilters.size_max) params.set('size_max', debouncedFilters.size_max);

    setLoading(true);
    setError(null);

    apiJson<any>(`/api/resale/listings?${params.toString()}`, { signal: controller.signal })
      .then((data) => {
        setListings(Array.isArray(data?.listings) ? data.listings : []);
        setCurrentPage(data?.current_page || 1);
        setTotalPages(Math.max(data?.total_pages || 1, 1));
        setTotalResults(Number(data?.total || 0));
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setListings([]);
        setTotalPages(1);
        setTotalResults(0);
        setError(err?.message || 'Unable to load resale listings right now.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [currentPage, debouncedFilters, retryToken]);

  useEffect(() => {
    setCurrentPage(Number.isNaN(pageParam) ? 1 : Math.max(pageParam, 1));
  }, [pageParam]);

  const updateFilters = (partial: Partial<ResaleFilters>) => {
    setFilters((current) => ({ ...current, ...partial }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="mb-4 text-4xl font-bold text-zinc-900">Resale Units</h1>
            <p className="text-zinc-500">
              {loading ? 'Refreshing results...' : `Browse ${totalResults.toLocaleString()} resale units listed by owners.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <Link to="/sell" className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800">
              List Your Unit
            </Link>
          </div>
        </div>

        <div className="mb-12 space-y-6">
          <div className="flex flex-col gap-4 rounded-4xl border border-zinc-100 bg-white p-4 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)] md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by location or unit type"
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
                <div className="grid gap-6 rounded-3xl border border-zinc-100 bg-zinc-50/60 p-8 md:grid-cols-2 xl:grid-cols-4">
                  <FilterSelect
                    label="Compound"
                    value={filters.location}
                    onChange={(value) => updateFilters({ location: value })}
                    placeholder="All compounds"
                    options={compoundOptions.map((name) => ({ value: name, label: name }))}
                  />

                  <FilterSelect
                    label="Unit Type"
                    value={filters.unit_type}
                    onChange={(value) => updateFilters({ unit_type: value })}
                    placeholder="All unit types"
                    options={unitTypeOptions.map((name) => ({ value: name, label: name }))}
                  />

                  <FilterSelect
                    label="Finishing"
                    value={filters.finishing_status}
                    onChange={(value) => updateFilters({ finishing_status: value })}
                    placeholder="Any finishing"
                    options={FINISHING_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
                  />

                  <FilterSelect
                    label="Bedrooms"
                    value={filters.bedrooms}
                    onChange={(value) => updateFilters({ bedrooms: value })}
                    placeholder="Any bedrooms"
                    options={BEDROOM_OPTIONS}
                  />

                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-zinc-400">Minimum Price</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="e.g. 3000000"
                      value={filters.price_min}
                      onChange={(e) => updateFilters({ price_min: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-colors focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-zinc-400">Maximum Price</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="e.g. 15000000"
                      value={filters.price_max}
                      onChange={(e) => updateFilters({ price_max: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-colors focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-zinc-400">Minimum Size</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="e.g. 120"
                      value={filters.size_min}
                      onChange={(e) => updateFilters({ size_min: e.target.value })}
                      className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 outline-none transition-colors focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-bold uppercase tracking-wider text-zinc-400">Maximum Size</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="e.g. 300"
                      value={filters.size_max}
                      onChange={(e) => updateFilters({ size_max: e.target.value })}
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

        {error && (
          <ErrorState
            message="We couldn't load resale listings right now."
            onRetry={() => setRetryToken((token) => token + 1)}
            className="mb-8"
          />
        )}

        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          {isRefetching && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          <p>{loading ? 'Updating results...' : `${totalResults.toLocaleString()} resale units found`}</p>
        </div>

        <div className={`grid gap-8 transition-opacity duration-200 md:grid-cols-2 lg:grid-cols-3 ${isRefetching ? 'opacity-40' : ''}`}>
          {showSkeleton
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-lg">
                  <div className="aspect-16/11 animate-pulse bg-zinc-200" />
                  <div className="space-y-3 p-6">
                    <div className="h-6 w-2/3 animate-pulse rounded-lg bg-zinc-200" />
                    <div className="h-5 w-1/2 animate-pulse rounded bg-zinc-200" />
                  </div>
                </div>
              ))
            : listings.map((listing) => (
                <ResaleListingCard key={listing.id} listing={listing} />
              ))}
        </div>

        {!loading && listings.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-lg text-zinc-500">No resale units found matching your criteria.</p>
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
            <p className="text-sm text-zinc-500">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
