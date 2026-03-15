import { useState, useEffect } from 'react';
import { ProjectCard } from '../components/ProjectCard';
import { Project } from '../types';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';

const BED_OPTIONS = ['1', '2', '3', '4', '5'];
const PRICE_RANGES = [
  { label: 'Under $1M', min: 0, max: 1000000 },
  { label: '$1M - $3M', min: 1000000, max: 3000000 },
  { label: '$3M - $5M', min: 3000000, max: 5000000 },
  { label: 'Over $5M', min: 5000000, max: Infinity },
];

export default function Projects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(searchParams.get('types')?.split(',').filter(Boolean) || []);
  const [selectedBeds, setSelectedBeds] = useState<string[]>(searchParams.get('beds')?.split(',').filter(Boolean) || []);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>(searchParams.get('prices')?.split(',').filter(Boolean) || []);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(searchParams.get('destinations')?.split(',').filter(Boolean) || []);
  const [showFilters, setShowFilters] = useState(searchParams.toString().length > 0);

  useEffect(() => {
    const normalize = <T,>(data: any, key?: string): T[] => {
      if (Array.isArray(data)) return data;
      if (key && data && Array.isArray(data[key])) return data[key];
      if (data && Array.isArray(data.projects)) return data.projects;
      return [];
    };

    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(normalize<Project>(data, 'projects')));

    fetch('/api/property-types')
      .then(res => res.json())
      .then(data => setPropertyTypes((Array.isArray(data) ? data : []).map(pt => pt.name)));
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (selectedTypes.length) params.set('types', selectedTypes.join(','));
    if (selectedBeds.length) params.set('beds', selectedBeds.join(','));
    if (selectedPriceRanges.length) params.set('prices', selectedPriceRanges.join(','));
    if (selectedDestinations.length) params.set('destinations', selectedDestinations.join(','));
    setSearchParams(params, { replace: true });
  }, [search, selectedTypes, selectedBeds, selectedPriceRanges, selectedDestinations, setSearchParams]);

  const toggleFilter = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const parsePrice = (priceStr: string): number => {
    const match = priceStr.match(/\$?([\d.]+)([MKk])?/);
    if (!match) return 0;
    let val = parseFloat(match[1]);
    const unit = match[2]?.toLowerCase();
    if (unit === 'm') val *= 1000000;
    if (unit === 'k') val *= 1000;
    return val;
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.location.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(p.type);
    
    const matchesBeds = selectedBeds.length === 0 || selectedBeds.some(b => p.beds.includes(b));
    
    const matchesDestination = selectedDestinations.length === 0 || selectedDestinations.some(d => p.location.toLowerCase().includes(d.toLowerCase()));
    
    const projectPrice = parsePrice(p.price_range);
    const matchesPrice = selectedPriceRanges.length === 0 || selectedPriceRanges.some(rangeLabel => {
      const range = PRICE_RANGES.find(r => r.label === rangeLabel);
      if (!range) return false;
      return projectPrice >= range.min && projectPrice <= range.max;
    });

    return matchesSearch && matchesType && matchesBeds && matchesPrice && matchesDestination;
  });

  const activeFiltersCount = selectedTypes.length + selectedBeds.length + selectedPriceRanges.length + selectedDestinations.length;

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="mb-4 text-4xl font-bold text-zinc-900">All Projects</h1>
            <p className="text-zinc-500">Discover our full collection of luxury properties across prime locations.</p>
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
          <div className="relative">
            <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-white py-4 pl-14 pr-6 text-lg shadow-sm focus:border-black focus:outline-none transition-all"
            />
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid gap-8 rounded-3xl border border-zinc-100 bg-zinc-50/50 p-8 md:grid-cols-2 lg:grid-cols-4">
                  {/* Destinations (Dynamic from projects if needed, but let's use search for now or just filter by location) */}
                  <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Destinations</h3>
                    <div className="flex flex-wrap gap-2">
                      {(Array.from(new Set(projects.map(p => p.location.split(',').pop()?.trim()))).filter(Boolean) as string[]).slice(0, 6).map(dest => (
                        <button
                          key={dest}
                          onClick={() => toggleFilter(selectedDestinations, setSelectedDestinations, dest)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            selectedDestinations.includes(dest)
                              ? 'bg-black text-white'
                              : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          {dest}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Property Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {propertyTypes.map(type => (
                        <button
                          key={type}
                          onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            selectedTypes.includes(type)
                              ? 'bg-black text-white'
                              : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Bedrooms</h3>
                    <div className="flex flex-wrap gap-2">
                      {BED_OPTIONS.map(bed => (
                        <button
                          key={bed}
                          onClick={() => toggleFilter(selectedBeds, setSelectedBeds, bed)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            selectedBeds.includes(bed)
                              ? 'bg-black text-white'
                              : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          {bed === '5' ? '5+ Beds' : `${bed} Bed`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Price Range</h3>
                    <div className="flex flex-wrap gap-2">
                      {PRICE_RANGES.map(range => (
                        <button
                          key={range.label}
                          onClick={() => toggleFilter(selectedPriceRanges, setSelectedPriceRanges, range.label)}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            selectedPriceRanges.includes(range.label)
                              ? 'bg-black text-white'
                              : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {[...selectedDestinations, ...selectedTypes, ...selectedBeds.map(b => `${b} Bed`), ...selectedPriceRanges].map(filter => (
                      <span key={filter} className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                        {filter}
                        <button onClick={() => {
                          if (selectedDestinations.includes(filter)) setSelectedDestinations(selectedDestinations.filter(d => d !== filter));
                          else if (propertyTypes.includes(filter)) setSelectedTypes(selectedTypes.filter(t => t !== filter));
                          else if (filter.includes('Bed')) setSelectedBeds(selectedBeds.filter(b => `${b} Bed` !== filter));
                          else setSelectedPriceRanges(selectedPriceRanges.filter(p => p !== filter));
                        }}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {activeFiltersCount > 0 && (
                    <button 
                      onClick={() => {
                        setSelectedDestinations([]);
                        setSelectedTypes([]);
                        setSelectedBeds([]);
                        setSelectedPriceRanges([]);
                      }}
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

        {/* Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-lg text-zinc-500">No projects found matching your criteria.</p>
            <button 
              onClick={() => {
                setSearch('');
                setSelectedDestinations([]);
                setSelectedTypes([]);
                setSelectedBeds([]);
                setSelectedPriceRanges([]);
              }}
              className="mt-4 font-medium text-black underline"
            >
              Reset all search and filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
