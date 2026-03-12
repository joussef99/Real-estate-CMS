import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { ProjectCard } from '../components/ProjectCard';
import { Project, Destination, Developer, Blog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, Filter, X, ChevronDown, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Penthouse', 'Townhouse'];
const BED_OPTIONS = ['1', '2', '3', '4', '5'];
const PRICE_RANGES = [
  { label: 'Under 5M EGP', min: 0, max: 5000000 },
  { label: '5M - 15M EGP', min: 5000000, max: 15000000 },
  { label: '15M - 30M EGP', min: 15000000, max: 30000000 },
  { label: 'Over 30M EGP', min: 30000000, max: Infinity },
];

export default function Home() {
  const [latestProjects, setLatestProjects] = useState<Project[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  
  const [search, setSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBeds, setSelectedBeds] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setAllProjects(data);
        setLatestProjects(data.slice(0, 3));
        setFeaturedProjects(data.filter((p: Project) => p.is_featured === 1).slice(0, 2));
      });
    fetch('/api/destinations').then(res => res.json()).then(data => setDestinations(data));
    fetch('/api/developers').then(res => res.json()).then(data => setDevelopers(data.slice(0, 4)));
    fetch('/api/blogs').then(res => res.json()).then(data => setBlogs(data.slice(0, 3)));
  }, []);

  const toggleFilter = (list: string[], setList: (val: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (selectedTypes.length) params.set('types', selectedTypes.join(','));
    if (selectedBeds.length) params.set('beds', selectedBeds.join(','));
    if (selectedPriceRanges.length) params.set('prices', selectedPriceRanges.join(','));
    if (selectedDestinations.length) params.set('destinations', selectedDestinations.join(','));
    
    navigate(`/projects?${params.toString()}`);
  };

  const activeFiltersCount = selectedTypes.length + selectedBeds.length + selectedPriceRanges.length + selectedDestinations.length;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-hidden flex items-center">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920"
          alt="Luxury Home"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative w-full px-6 pt-20">
          <div className="mx-auto max-w-5xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl"
            >
              Discover Luxury Living <br /> Across Egypt
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-10 text-lg text-zinc-200 md:text-xl"
            >
              Explore exclusive projects in the New Capital, North Coast, and Egypt's most prestigious destinations.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto w-full max-w-4xl"
            >
              <div className="relative flex flex-col gap-4 rounded-[2.5rem] bg-white/90 p-4 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:rounded-full">
                <div className="flex flex-1 items-center px-4">
                  <Search className="mr-3 h-5 w-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by location, developer, or project..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border-none bg-transparent py-3 text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="flex items-center gap-2 px-2">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-bold transition-all ${
                      showFilters ? 'bg-black text-white border-black' : 'bg-zinc-100 text-zinc-900 border-transparent hover:bg-zinc-200'
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className={`ml-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${showFilters ? 'bg-white text-black' : 'bg-black text-white'}`}>
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                  <Button size="lg" className="flex-1 md:flex-none" onClick={handleSearch}>Search</Button>
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-4 overflow-hidden rounded-[2.5rem] bg-white/95 p-8 text-left shadow-2xl backdrop-blur-xl"
                  >
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                      {/* Destinations */}
                      <div>
                        <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                          <MapPin className="h-3 w-3" /> Destinations
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {destinations.slice(0, 6).map(dest => (
                            <button
                              key={dest.id}
                              onClick={() => toggleFilter(selectedDestinations, setSelectedDestinations, dest.name)}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                                selectedDestinations.includes(dest.name)
                                  ? 'bg-black text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                            >
                              {dest.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Property Type */}
                      <div>
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Property Type</h3>
                        <div className="flex flex-wrap gap-2">
                          {PROPERTY_TYPES.map(type => (
                            <button
                              key={type}
                              onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                                selectedTypes.includes(type)
                                  ? 'bg-black text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bedrooms */}
                      <div>
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Bedrooms</h3>
                        <div className="flex flex-wrap gap-2">
                          {BED_OPTIONS.map(bed => (
                            <button
                              key={bed}
                              onClick={() => toggleFilter(selectedBeds, setSelectedBeds, bed)}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                                selectedBeds.includes(bed)
                                  ? 'bg-black text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                            >
                              {bed === '5' ? '5+ Beds' : `${bed} Bed`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-400">Price Range</h3>
                        <div className="flex flex-wrap gap-2">
                          {PRICE_RANGES.map(range => (
                            <button
                              key={range.label}
                              onClick={() => toggleFilter(selectedPriceRanges, setSelectedPriceRanges, range.label)}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                                selectedPriceRanges.includes(range.label)
                                  ? 'bg-black text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                            >
                              {range.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {activeFiltersCount > 0 && (
                      <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-6">
                        <div className="flex flex-wrap gap-2">
                          {[...selectedDestinations, ...selectedTypes, ...selectedBeds.map(b => `${b} Bed`), ...selectedPriceRanges].map(filter => (
                            <span key={filter} className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase text-zinc-500">
                              {filter}
                              <button onClick={() => {
                                if (destinations.some(d => d.name === filter)) setSelectedDestinations(selectedDestinations.filter(d => d !== filter));
                                else if (PROPERTY_TYPES.includes(filter)) setSelectedTypes(selectedTypes.filter(t => t !== filter));
                                else if (filter.includes('Bed')) setSelectedBeds(selectedBeds.filter(b => `${b} Bed` !== filter));
                                else setSelectedPriceRanges(selectedPriceRanges.filter(p => p !== filter));
                              }}>
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedDestinations([]);
                            setSelectedTypes([]);
                            setSelectedBeds([]);
                            setSelectedPriceRanges([]);
                          }}
                          className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="bg-zinc-900 py-16 px-6 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Egypt's Exclusive Selection</span>
                <h2 className="mt-1 text-2xl font-bold md:text-3xl">Featured Residences</h2>
              </div>
              <Link to="/projects" className="hidden text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white md:block">
                Explore All <ArrowRight className="ml-1 inline h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {featuredProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative aspect-[16/9] overflow-hidden rounded-[2.5rem] bg-zinc-800"
                >
                  <Link to={`/projects/${project.id}`}>
                    <img
                      src={(() => {
                        if (project.gallery) {
                          const gallery = typeof project.gallery === 'string' ? JSON.parse(project.gallery) : project.gallery;
                          return gallery[0] || project.main_image || '/placeholder.jpg';
                        }
                        return project.main_image || '/placeholder.jpg';
                      })()}
                      alt={project.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
                    <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10">
                      <div className="mb-2">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                          {project.developer_name}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white md:text-4xl">{project.name}</h3>
                      <p className="mt-2 text-sm text-zinc-300 line-clamp-1">{project.location}</p>
                      
                      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                        <span className="text-xl font-bold text-white">{project.price_range}</span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:scale-110">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Projects */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-zinc-900 md:text-4xl">Latest Projects</h2>
              <p className="text-zinc-500">Explore our newest additions to the luxury portfolio.</p>
            </div>
            <Link to="/projects" className="flex items-center font-medium text-black hover:underline">
              View All Projects <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {latestProjects.length > 0 ? (
              latestProjects.map(project => <ProjectCard key={project.id} project={project} />)
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="h-96 animate-pulse rounded-2xl bg-zinc-100" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="bg-zinc-50 py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Egypt's Finest</span>
            <h2 className="mt-2 text-3xl font-bold text-zinc-900 md:text-5xl">Elite Locations</h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-500">
              Discover exclusive properties in Egypt's most sought-after locations, from the modern skyline of the New Capital to the pristine beaches of the North Coast.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((dest, i) => (
              <motion.div
                key={dest.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-zinc-200 lg:aspect-[3/4]"
              >
                <Link to="/destinations">
                  <img
                    src={dest.image || `https://picsum.photos/seed/city${i}/800/1000`}
                    alt={dest.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <div className="mb-2">
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                        {dest.project_count || 0} Projects
                      </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{dest.name}</h3>
                    <div className="mt-2 flex items-center text-sm font-medium text-zinc-300 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 translate-y-4">
                      Explore Projects <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Developers */}
      <section className="py-24 px-6 bg-zinc-50 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Our Partners</span>
            <h2 className="mt-2 text-3xl font-bold text-zinc-900 md:text-5xl">World-Class Developers</h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-500">
              We collaborate with the most prestigious developers to bring you exclusive luxury residences.
            </p>
          </div>

          {/* Auto-sliding Carousel */}
          <div className="relative mb-16">
            <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <motion.div
                animate={{
                  x: [0, -100 * developers.length],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="flex gap-12 py-4"
              >
                {[...developers, ...developers].map((dev, i) => (
                  <button
                    key={`${dev.id}-${i}`}
                    onClick={() => {
                      const selected = developers.find(d => d.id === dev.id);
                      if (selected) {
                        // Toggle or set
                        if (selectedDeveloperId === dev.id) {
                          setSelectedDeveloperId(null);
                        } else {
                          setSelectedDeveloperId(dev.id);
                        }
                      }
                    }}
                    className={`group relative flex h-32 w-48 flex-shrink-0 items-center justify-center rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md ${
                      selectedDeveloperId === dev.id ? 'ring-2 ring-black' : ''
                    }`}
                  >
                    <img
                      src={dev.logo}
                      alt={dev.name}
                      className={`h-full w-full object-contain transition-all group-hover:scale-110 ${
                        selectedDeveloperId === dev.id ? 'opacity-100' : 'opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Developer Projects */}
          <AnimatePresence mode="wait">
            {selectedDeveloperId && (
              <motion.div
                key={selectedDeveloperId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-zinc-900">
                      {developers.find(d => d.id === selectedDeveloperId)?.name} Projects
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {developers.find(d => d.id === selectedDeveloperId)?.description}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedDeveloperId(null)}
                    className="text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-black"
                  >
                    Close
                  </button>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {allProjects
                    .filter(p => p.developer_id === selectedDeveloperId)
                    .map(project => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
                {allProjects.filter(p => p.developer_id === selectedDeveloperId).length === 0 && (
                  <div className="py-12 text-center text-zinc-500">
                    No projects found for this developer.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
