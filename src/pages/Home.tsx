import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, MapPin, Search } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { Button } from '../components/Button';
import { ProjectCard } from '../components/ProjectCard';
import { GlassPanel } from '../components/ui/glass-panel';
import { SectionHeading } from '../components/ui/section-heading';
import { Blog, Destination, Developer, Project } from '../types';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Penthouse', 'Townhouse'];
const PRICE_RANGES = ['Under 5M EGP', '5M - 15M EGP', '15M - 30M EGP', 'Over 30M EGP'];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  const [locationQuery, setLocationQuery] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const navigate = useNavigate();

  const normalize = <T,>(data: any, key?: string): T[] => {
    if (Array.isArray(data)) return data;
    if (key && data && Array.isArray(data[key])) return data[key];
    if (data && Array.isArray(data.projects)) return data.projects;
    if (data && Array.isArray(data.destinations)) return data.destinations;
    if (data && Array.isArray(data.developers)) return data.developers;
    if (data && Array.isArray(data.blogs)) return data.blogs;
    return [];
  };

  useEffect(() => {
    fetch('/api/projects?limit=6')
      .then((res) => res.json())
      .then((data) => setProjects(normalize<Project>(data, 'projects')));

    fetch('/api/projects/featured?limit=6')
      .then((res) => res.json())
      .then((data) => setFeaturedProjects(normalize<Project>(data, 'projects')));

    fetch('/api/destinations')
      .then((res) => res.json())
      .then((data) => setDestinations(normalize<Destination>(data, 'destinations')));

    fetch('/api/developers')
      .then((res) => res.json())
      .then((data) => {
        setDevelopers(Array.isArray(data) ? data : data?.developers || []);
      });

    fetch('/api/blogs?limit=3')
      .then((res) => res.json())
      .then((data) => setBlogs(normalize<Blog>(data, 'blogs')));
  }, []);

  const latestProjects = useMemo(() => projects.slice(0, 3), [projects]);
  const developersForSlider = useMemo(() => {
    if (!developers.length) return [] as Developer[];
    const minimumSlides = 10;
    const repeatCount = Math.ceil(minimumSlides / developers.length);
    return Array.from({ length: repeatCount }, () => developers).flat();
  }, [developers]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (locationQuery.trim()) params.set('q', locationQuery.trim());
    if (propertyType) params.set('types', propertyType);
    if (priceRange) params.set('prices', priceRange);
    navigate(`/projects?${params.toString()}`);
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 pb-20 pt-36">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2200"
          alt="Luxury property"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-r from-slate-950/85 via-slate-900/60 to-slate-900/25" />

        <div className="relative mx-auto w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <p className="mb-6 text-xs uppercase tracking-[0.28em] text-white/75">Curated Luxury Residences</p>
            <h1 className="text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
              Own a Signature Address in Egypt's Most Prestigious Communities
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-200">
              Discover handpicked properties from trusted developers, prime destinations, and refined living standards.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-10"
          >
            <GlassPanel className="p-4 md:p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <label className="rounded-2xl bg-white/30 p-3 backdrop-blur-xl">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/80">Location</span>
                  <input
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="New Cairo, North Coast..."
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/65 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </label>

                <label className="rounded-2xl bg-white/30 p-3 backdrop-blur-xl">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/80">Property Type</span>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                  >
                    <option value="" className="text-slate-900">Any Type</option>
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type} className="text-slate-900">
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="rounded-2xl bg-white/30 p-3 backdrop-blur-xl">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/80">Price Range</span>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                  >
                    <option value="" className="text-slate-900">Any Budget</option>
                    {PRICE_RANGES.map((range) => (
                      <option key={range} value={range} className="text-slate-900">
                        {range}
                      </option>
                    ))}
                  </select>
                </label>

                <Button className="h-full min-h-14 text-base" onClick={handleSearch}>
                  <Search className="h-4 w-4" /> Explore
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Featured Collection"
            title="Residences That Define Premium Living"
            description="A refined selection of iconic properties from Egypt's leading developers."
            action={
              <Button variant="secondary" size="sm" asChild>
                <Link to="/projects">View All</Link>
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(featuredProjects.length ? featuredProjects : latestProjects).slice(0, 6).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Latest Projects"
            title="Fresh Market Opportunities"
            description="Explore newly launched communities and high-demand properties."
            action={
              <Button variant="ghost" asChild>
                <Link to="/projects" className="inline-flex items-center gap-2">
                  Browse Listings <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {latestProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Top Destinations"
            title="Prime Areas for Lifestyle and Investment"
            description="Explore destinations chosen for prestige, growth, and exceptional quality of life."
            align="center"
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {destinations.map((dest, index) => (
              <motion.article
                key={dest.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ y: -8 }}
                className="group relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl"
              >
                <Link to={dest.slug ? `/destinations/${dest.slug}` : '/destinations'} className="block">
                  <img
                    src={dest.image || `https://picsum.photos/seed/destination-${dest.id}/900/1200`}
                    alt={dest.name}
                    className="h-96 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="mb-2 inline-flex rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs backdrop-blur-xl">
                      {dest.project_count || 0} projects
                    </p>
                    <h3 className="text-3xl font-semibold">{dest.name}</h3>
                    <p className="mt-2 flex items-center text-sm text-white/80">
                      <MapPin className="mr-2 h-4 w-4" /> Signature communities
                    </p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Trusted Developers"
            title="Partners Behind Landmark Communities"
            description="Browse the developers shaping premium real estate experiences."
          />

          <Swiper
            modules={[Autoplay]}
            spaceBetween={30}
            speed={850}
            loop
            grabCursor
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: { slidesPerView: 2 },
              768: { slidesPerView: 3 },
              1024: { slidesPerView: 5 },
            }}
            className="pb-2"
          >
            {developersForSlider.map((developer, index) => (
              <SwiperSlide key={`${developer.id}-${index}`} className="h-auto">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  whileHover={{ y: -6, scale: 1.03 }}
                  className="h-full rounded-2xl border border-slate-100 bg-white p-4 shadow-lg transition-all duration-300 hover:shadow-2xl md:p-5"
                >
                  <div className="mb-4 flex h-16 items-center justify-center rounded-xl bg-slate-50 md:h-20">
                    <img
                      src={developer.logo}
                      alt={developer.name}
                      className="max-h-11 max-w-full object-contain md:max-h-14"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="line-clamp-1 text-center text-sm font-semibold text-slate-900 md:text-base">{developer.name}</h3>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="mt-10">
            <Button asChild>
              <Link to="/developers" className="inline-flex items-center gap-2">
                View All Developers <Building2 className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Market Intelligence"
            title="Insights for High-Value Decisions"
            description="Read expert takes on market shifts, investment trends, and lifestyle-led developments."
            action={
              <Button variant="secondary" asChild>
                <Link to="/blogs">Explore Blogs</Link>
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogs.slice(0, 3).map((blog, index) => (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl"
              >
                <Link to={`/blogs/${blog.slug || blog.id}`} className="block">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="h-56 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">{blog.category}</p>
                    <h3 className="mt-3 line-clamp-2 text-2xl font-semibold leading-tight">{blog.title}</h3>
                    <p className="mt-4 text-sm text-white/70">By {blog.author}</p>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
