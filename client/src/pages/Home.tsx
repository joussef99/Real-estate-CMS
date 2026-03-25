import { apiJson } from '../utils/api';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Building2, MapPin, Search, Tag } from 'lucide-react';
import { Button } from '../components/Button';
import { ProjectCard } from '../components/ProjectCard';
import { SectionHeading } from '../components/ui/section-heading';
import { Blog, Destination, Developer, Project } from '../types';
import { FALLBACK_IMAGE_URL, cloudinaryOptimizedUrl, resolveImageUrl, withFallbackImage } from '../utils/image';

const PRICE_RANGES = ['Under 5M EGP', '5M - 15M EGP', '15M - 30M EGP', 'Over 30M EGP'];

const HERO_STATS = [
  { value: 500, suffix: '+', label: 'Premium Properties' },
  { value: 50,  suffix: '+', label: 'Trusted Developers' },
  { value: 12,  suffix: '+', label: 'Prime Destinations' },
  { value: 98,  suffix: '%', label: 'Client Satisfaction' },
];

const HEADLINE_WORDS: { word: string; highlight: boolean }[] = [
  { word: 'Own',         highlight: false },
  { word: 'a',           highlight: false },
  { word: 'Signature',   highlight: true  },
  { word: 'Address',     highlight: true  },
  { word: 'in',          highlight: false },
  { word: "Egypt's",     highlight: false },
  { word: 'Most',        highlight: false },
  { word: 'Prestigious', highlight: false },
  { word: 'Communities', highlight: false },
];

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const brandBlueStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const wordContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.55 } },
};

const wordVariants = {
  hidden:  { opacity: 0, y: 32, filter: 'blur(6px)'  },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE_OUT } },
};

function StatItem({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2400;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - progress, 3)) * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: EASE_OUT }}
      className="flex flex-col items-center gap-1.5"
    >
      <span className="text-3xl font-bold tracking-tight text-white md:text-4xl">
        {count}<span style={brandBlueStyle}>{suffix}</span>
      </span>
      <span className="text-[10px] uppercase tracking-[0.25em] text-white/45">{label}</span>
    </motion.div>
  );
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

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
    apiJson<any>(`/api/projects?limit=6`)
      .then((data) => setProjects(normalize<Project>(data, 'projects')))
      .catch(() => setProjects([]));

    apiJson<any>(`/api/projects/featured?limit=6`)
      .then((data) => setFeaturedProjects(normalize<Project>(data, 'projects')))
      .catch(() => setFeaturedProjects([]));

    apiJson<any>(`/api/destinations?limit=6&page=1`)
      .then((data) => setDestinations(normalize<Destination>(data, 'destinations')))
      .catch(() => setDestinations([]));

    apiJson<any>(`/api/developers?limit=10&page=1`)
      .then((data) => {
        setDevelopers(Array.isArray(data) ? data : data?.developers || []);
      })
      .catch(() => setDevelopers([]));

    apiJson<any>(`/api/blogs?limit=3`)
      .then((data) => setBlogs(normalize<Blog>(data, 'blogs')))
      .catch(() => setBlogs([]));

    apiJson<{ name: string }[]>(`/api/property-types`)
      .then((data: { name: string }[]) =>
        setPropertyTypes(Array.isArray(data) ? data.map((pt) => pt.name) : [])
      )
      .catch(() => setPropertyTypes([]));
  }, []);

  const latestProjects = useMemo(() => projects.slice(0, 3), [projects]);
  const developersForMarquee = useMemo(() => {
    if (!developers.length) return [] as Developer[];
    return [...developers, ...developers];
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

      {/* ══════════════════════ CINEMATIC HERO ══════════════════════ */}
      <section className="relative flex min-h-screen items-center overflow-hidden pb-24 pt-36">

        {/* Background — slow cinematic zoom-out */}
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 20, ease: 'linear' }}
        >
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2200"
            alt="Luxury property"
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Layered gradient overlays for depth */}
        <div className="absolute inset-0 z-1 bg-linear-to-r from-slate-950/92 via-slate-900/68 to-slate-900/25" />
        <div className="absolute inset-0 z-1 bg-linear-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        {/* Bottom dissolve into next section */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-2 h-52 bg-linear-to-t from-slate-950 to-transparent" />

        {/* Hero content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">

          {/* ① Animated brand accent line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.15, ease: EASE_OUT }}
            className="mb-8 h-[1.5px] w-16 origin-left"
            style={{ background: 'linear-gradient(90deg, #0f172a, #1e293b 60%, transparent)' }}
          />

          {/* ② Eyebrow label */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="mb-7 text-[11px] uppercase tracking-[0.38em] text-slate-300/80"
          >
            Curated Luxury Residences — Egypt
          </motion.p>

          {/* ③ Word-by-word headline */}
          <motion.h1
            variants={wordContainerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl text-5xl font-bold leading-[1.07] tracking-tight text-white md:text-6xl lg:text-7xl"
          >
            {HEADLINE_WORDS.map((item, i) => (
              <motion.span
                key={i}
                variants={wordVariants}
                className="mr-[0.22em] inline-block last:mr-0"
                style={item.highlight ? brandBlueStyle : undefined}
              >
                {item.word}
              </motion.span>
            ))}
          </motion.h1>

          {/* ④ Description */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 1.3, ease: EASE_OUT }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300/80"
          >
            Discover handpicked properties from trusted developers, prime destinations,
            and refined living standards.
          </motion.p>

          {/* ⑤ Stats — authority proof with count-up */}
          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 sm:grid-cols-4">
            {HERO_STATS.map((s, i) => (
              <StatItem
                key={s.label}
                value={s.value}
                suffix={s.suffix}
                label={s.label}
                delay={1.55 + i * 0.1}
              />
            ))}
          </div>

          {/* ⑥ Floating premium search panel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.88, ease: EASE_OUT }}
            className="mt-10"
          >
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/7 p-1.5 shadow-[0_8px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
              <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 lg:grid-cols-4">

                {/* Location */}
                <label className="flex cursor-text flex-col rounded-xl bg-white/8 px-4 py-3.5 ring-1 ring-inset ring-white/10 transition-all duration-300 hover:bg-white/13 focus-within:bg-white/15 focus-within:ring-slate-700/60">
                  <div className="mb-1.5 flex items-center gap-2">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-300" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/50">
                      Location
                    </span>
                  </div>
                  <input
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="New Cairo, North Coast..."
                    className="bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </label>

                {/* Property Type */}
                <label className="flex cursor-pointer flex-col rounded-xl bg-white/8 px-4 py-3.5 ring-1 ring-inset ring-white/10 transition-all duration-300 hover:bg-white/13 focus-within:bg-white/15 focus-within:ring-slate-700/60">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Building2 className="h-3 w-3 shrink-0 text-slate-300" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/50">
                      Property Type
                    </span>
                  </div>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="cursor-pointer appearance-none bg-transparent text-sm text-white focus:outline-none"
                  >
                    <option value="" className="bg-slate-900 text-white">Any Type</option>
                    {propertyTypes.map((type) => (
                      <option key={type} value={type} className="bg-slate-900 text-white">{type}</option>
                    ))}
                  </select>
                </label>

                {/* Price Range */}
                <label className="flex cursor-pointer flex-col rounded-xl bg-white/8 px-4 py-3.5 ring-1 ring-inset ring-white/10 transition-all duration-300 hover:bg-white/13 focus-within:bg-white/15 focus-within:ring-slate-700/60">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Tag className="h-3 w-3 shrink-0 text-slate-300" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/50">
                      Price Range
                    </span>
                  </div>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="cursor-pointer appearance-none bg-transparent text-sm text-white focus:outline-none"
                  >
                    <option value="" className="bg-slate-900 text-white">Any Budget</option>
                    {PRICE_RANGES.map((range) => (
                      <option key={range} value={range} className="bg-slate-900 text-white">{range}</option>
                    ))}
                  </select>
                </label>

                {/* Search CTA */}
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(30,41,59,0.40)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSearch}
                  className="flex min-h-15.5 items-center justify-center gap-2.5 rounded-xl bg-slate-900 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800"
                >
                  <Search className="h-4 w-4" />
                  Explore Properties
                </motion.button>

              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════ FEATURED COLLECTION ══════════════════════ */}
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

      {/* ══════════════════════ LATEST PROJECTS ══════════════════════ */}
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

      {/* ══════════════════════ TOP DESTINATIONS ══════════════════════ */}
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
                    src={cloudinaryOptimizedUrl(resolveImageUrl(dest.image), { width: 900, height: 1200 }) || `https://picsum.photos/seed/destination-${dest.id}/900/1200`}
                    alt={dest.name}
                    className="h-96 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    referrerPolicy="no-referrer"
                    onError={withFallbackImage}
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

      {/* ══════════════════════ TRUSTED DEVELOPERS ══════════════════════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Trusted Developers"
            title="Partners Behind Landmark Communities"
            description="Browse the developers shaping premium real estate experiences."
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group/marquee relative"
          >
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-20 bg-linear-to-r from-white via-white/85 to-transparent" />
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-20 bg-linear-to-l from-white via-white/85 to-transparent" />

            <div className="overflow-hidden">
              <div className="marquee-track flex w-max items-center gap-8 py-2 sm:gap-10 lg:gap-14">
                {developersForMarquee.map((developer, index) => {
                  const developerUrl = developer.slug ? `/developers/${developer.slug}` : `/developers/${developer.id}`;
                  return (
                    <Link
                      key={`${developer.id}-${index}`}
                      to={developerUrl}
                      className="logo-link relative inline-flex h-20 w-40 items-center justify-center overflow-hidden rounded-xl opacity-100 transition-all duration-300 hover:scale-[1.03] sm:h-22 sm:w-44 lg:h-24 lg:w-48"
                      aria-label={`View ${developer.name}`}
                    >
                      <span className="logo-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-linear-to-r from-transparent via-white/85 to-transparent opacity-0 transition-opacity duration-300" />
                      <img
                        src={cloudinaryOptimizedUrl(resolveImageUrl(developer.logo), { width: 320, height: 180, crop: 'fit' }) || FALLBACK_IMAGE_URL}
                        alt={developer.name}
                        className="max-h-12 max-w-full object-contain transition-all duration-300 sm:max-h-14 lg:max-h-16"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={withFallbackImage}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>

            <style>{`
              .marquee-track {
                animation: developer-marquee 42s linear infinite;
                will-change: transform;
                transform: translate3d(0, 0, 0);
              }

              .group\/marquee:hover .marquee-track {
                animation-play-state: paused;
              }

              .logo-link:hover {
                box-shadow: 0 0 18px rgba(30, 58, 138, 0.18);
              }

              .logo-link:hover .logo-sheen {
                opacity: 1;
                animation: logo-sheen-sweep 1.35s linear 1;
              }

              @keyframes logo-sheen-sweep {
                from {
                  transform: translate3d(0, 0, 0);
                }
                to {
                  transform: translate3d(300%, 0, 0);
                }
              }

              @keyframes developer-marquee {
                from {
                  transform: translate3d(0, 0, 0);
                }
                to {
                  transform: translate3d(-50%, 0, 0);
                }
              }
            `}</style>
          </motion.div>

          <div className="mt-10">
            <Button asChild>
              <Link to="/developers" className="inline-flex items-center gap-2">
                View All Developers <Building2 className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════ MARKET INTELLIGENCE ══════════════════════ */}
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
                    src={cloudinaryOptimizedUrl(resolveImageUrl(blog.image), { width: 900, height: 560 }) || FALLBACK_IMAGE_URL}
                    alt={blog.title}
                    className="h-56 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    referrerPolicy="no-referrer"
                    onError={withFallbackImage}
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
