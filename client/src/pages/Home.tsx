import { apiJson } from '../utils/api';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Building2, ChevronDown, MapPin, Search, Tag } from 'lucide-react';
import { Button } from '../components/Button';
import { ProjectCard } from '../components/ProjectCard';
import { SectionHeading } from '../components/ui/section-heading';
import { Blog, Destination, Developer, Project } from '../types';
import { FALLBACK_IMAGE_URL, cloudinaryOptimizedUrl, resolveImageUrl, withFallbackImage } from '../utils/image';

const PRICE_RANGES = ['Under 5M EGP', '5M - 15M EGP', '15M - 30M EGP', 'Over 30M EGP'];

const HERO_VIDEO_URL = '/hero-video.mp4';
const HERO_POSTER_URL = '/livin-copy.png';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

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
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => setHeroVideoReady(true), 1400);
    return () => window.clearTimeout(fallbackTimer);
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
      <section className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover transition-opacity duration-1000 ease-out"
            style={{ opacity: heroVideoReady ? 1 : 0.68 }}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={HERO_POSTER_URL}
            onCanPlay={() => setHeroVideoReady(true)}
            onLoadedData={() => setHeroVideoReady(true)}
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
        </div>

        <div className="absolute inset-0 bg-linear-to-r from-slate-950/34 via-slate-950/12 to-slate-950/8 sm:from-slate-950/24 sm:via-transparent sm:to-slate-950/10" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/88 via-slate-950/32 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-slate-950 via-slate-950/55 to-transparent sm:h-36" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-end px-5 pb-10 pt-24 sm:px-6 sm:pb-14 sm:pt-28 md:pb-40 md:pt-36">
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
            animate={heroVideoReady ? { opacity: 1, y: 0 } : { opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
            transition={{ duration: prefersReducedMotion ? 0.45 : 1.15, delay: heroVideoReady ? 0.28 : 0, ease: EASE_OUT }}
            className="max-w-xl sm:max-w-2xl md:max-w-3xl"
          >
            <p className="text-[0.6rem] uppercase tracking-[0.32em] text-white/60 sm:text-[0.72rem] sm:tracking-[0.42em]">
              Signature Living
            </p>
            <h1 className="mt-3 max-w-[8ch] text-4xl font-semibold leading-[0.96] tracking-[-0.045em] text-white/96 sm:mt-4 sm:max-w-none sm:text-6xl sm:tracking-[-0.05em] md:text-7xl lg:text-[5.5rem] lg:leading-[0.94]">
              WHERE LUXURY 
              <span className="mt-1.5 block text-white/86 sm:mt-2">BEGINS</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 28 }}
            animate={heroVideoReady ? { opacity: 1, y: 0 } : { opacity: 0, y: prefersReducedMotion ? 0 : 28 }}
            transition={{ duration: prefersReducedMotion ? 0.45 : 0.95, delay: heroVideoReady ? 1.05 : 0, ease: EASE_OUT }}
            className="mt-10 w-full md:absolute md:bottom-10 md:left-1/2 md:z-10 md:mt-0 md:w-[calc(100%-3rem)] md:max-w-6xl md:-translate-x-1/2"
          >
            <div className="overflow-hidden rounded-[1.4rem] border border-white/14 bg-slate-950/28 p-1.5 shadow-[0_18px_50px_rgba(2,6,23,0.2)] backdrop-blur-xl sm:rounded-[1.75rem] sm:bg-white/10 sm:p-2">
              <div className="grid grid-cols-1 gap-1.5 sm:gap-2 md:grid-cols-2 lg:grid-cols-4">

                {/* Location */}
                <label className="flex cursor-text flex-col rounded-[1.15rem] bg-slate-950/34 px-3.5 py-3 ring-1 ring-inset ring-white/10 transition-colors duration-300 focus-within:bg-slate-950/42 focus-within:ring-white/24 sm:rounded-2xl sm:bg-slate-950/24 sm:px-4 sm:py-3.5 sm:focus-within:bg-slate-950/34">
                  <div className="mb-1.5 flex items-center gap-2">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-200/72" />
                    <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/50 sm:text-[10px] sm:tracking-[0.25em]">
                      Location
                    </span>
                  </div>
                  <input
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="New Cairo, North Coast..."
                    className="bg-transparent text-[0.95rem] text-white placeholder:text-white/34 focus:outline-none sm:text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </label>

                {/* Property Type */}
                <label className="relative flex cursor-pointer flex-col rounded-[1.15rem] bg-slate-950/34 px-3.5 py-3 ring-1 ring-inset ring-white/10 transition-colors duration-300 focus-within:bg-slate-950/42 focus-within:ring-white/24 sm:rounded-2xl sm:bg-slate-950/24 sm:px-4 sm:py-3.5 sm:focus-within:bg-slate-950/34">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Building2 className="h-3 w-3 shrink-0 text-slate-200/72" />
                    <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/50 sm:text-[10px] sm:tracking-[0.25em]">
                      Property Type
                    </span>
                  </div>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="cursor-pointer appearance-none bg-transparent pr-8 text-[0.95rem] text-white focus:outline-none sm:text-sm"
                  >
                    <option value="" className="bg-slate-950 text-white">Any Type</option>
                    {propertyTypes.map((type) => (
                      <option key={type} value={type} className="bg-slate-950 text-white">{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-[2.35rem] h-4 w-4 text-white/54 sm:right-4 sm:top-[2.55rem]" />
                </label>

                {/* Price Range */}
                <label className="relative flex cursor-pointer flex-col rounded-[1.15rem] bg-slate-950/34 px-3.5 py-3 ring-1 ring-inset ring-white/10 transition-colors duration-300 focus-within:bg-slate-950/42 focus-within:ring-white/24 sm:rounded-2xl sm:bg-slate-950/24 sm:px-4 sm:py-3.5 sm:focus-within:bg-slate-950/34">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Tag className="h-3 w-3 shrink-0 text-slate-200/72" />
                    <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/50 sm:text-[10px] sm:tracking-[0.25em]">
                      Price Range
                    </span>
                  </div>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="cursor-pointer appearance-none bg-transparent pr-8 text-[0.95rem] text-white focus:outline-none sm:text-sm"
                  >
                    <option value="" className="bg-slate-950 text-white">Any Budget</option>
                    {PRICE_RANGES.map((range) => (
                      <option key={range} value={range} className="bg-slate-950 text-white">{range}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-[2.35rem] h-4 w-4 text-white/54 sm:right-4 sm:top-[2.55rem]" />
                </label>

                {/* Search CTA */}
                <motion.button
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                  onClick={handleSearch}
                  className="flex min-h-14 items-center justify-center gap-2.5 rounded-[1.15rem] bg-white/92 px-4 text-sm font-semibold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors duration-300 hover:bg-white sm:min-h-15.5 sm:rounded-2xl"
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
