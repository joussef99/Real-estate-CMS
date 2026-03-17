import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Calendar, Copy, Facebook, Linkedin, Twitter, User } from 'lucide-react';
import { Blog } from '../types';
import { Button } from '../components/Button';
import { GlassPanel } from '../components/ui/glass-panel';

const authorBios: Record<string, string> = {
  'Editorial Team': 'A team of analysts and storytellers covering market movements and premium real estate opportunities.',
};

const sectionReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function BlogDetails() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.2,
  });

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/blogs/${slug}`).then((res) => {
        if (!res.ok) throw new Error('Blog not found');
        return res.json();
      }),
      fetch('/api/blogs?limit=4&page=1').then((res) => res.json()),
    ])
      .then(([blogData, blogsData]) => {
        setBlog(blogData);
        setBlogs(Array.isArray(blogsData) ? blogsData : blogsData?.blogs || []);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load blog');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!blog) return;

    const previousTitle = document.title;
    document.title = blog.meta_title || blog.title;

    const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
    const previousOgTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const previousOgDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    const previousOgImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const previousCanonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');

    const setMeta = (selector: string, value: string) => {
      let element = document.querySelector(selector) as HTMLElement | null;
      if (!element) {
        element = document.createElement('meta');
        const key = selector.match(/(name|property)="([^"]+)"/)?.[1];
        const keyVal = selector.match(/(name|property)="([^"]+)"/)?.[2];
        if (key && keyVal) {
          element.setAttribute(key, keyVal);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    const excerpt = blog.meta_description || blog.content.substring(0, 160) || '';

    setMeta('meta[name="description"]', excerpt);
    setMeta('meta[property="og:title"]', blog.meta_title || blog.title);
    setMeta('meta[property="og:description"]', excerpt);
    setMeta('meta[property="og:image"]', blog.image || '');

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = window.location.href;

    return () => {
      document.title = previousTitle;
      if (previousDescription !== undefined) document.querySelector('meta[name="description"]')?.setAttribute('content', previousDescription);
      if (previousOgTitle !== undefined) document.querySelector('meta[property="og:title"]')?.setAttribute('content', previousOgTitle);
      if (previousOgDescription !== undefined) document.querySelector('meta[property="og:description"]')?.setAttribute('content', previousOgDescription);
      if (previousOgImage !== undefined) document.querySelector('meta[property="og:image"]')?.setAttribute('content', previousOgImage);
      if (previousCanonical !== undefined) document.querySelector('link[rel="canonical"]')?.setAttribute('href', previousCanonical);
    };
  }, [blog]);

  const relatedBlogs = useMemo(() => {
    if (!blog) return [] as Blog[];
    return blogs.filter((item) => item.id !== blog.id).slice(0, 3);
  }, [blog, blogs]);

  const contentBlocks = useMemo(() => {
    if (!blog?.content) return [] as string[];
    return blog.content
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);
  }, [blog]);

  const shareTo = (platform: 'twitter' | 'linkedin' | 'facebook') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(blog?.title || '');

    const links = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };

    window.open(links[platform], '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-12 w-2/3 rounded-2xl bg-slate-200" />
          <div className="h-105 rounded-3xl bg-slate-200" />
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="h-5 rounded-lg bg-slate-200" />
            <div className="h-5 rounded-lg bg-slate-200" />
            <div className="h-5 w-5/6 rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="px-6 pb-24 pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-3xl font-bold text-slate-900">Blog Not Found</h1>
          <p className="mb-8 text-slate-500">{error || 'The blog you are looking for could not be found.'}</p>
          <Button asChild>
            <Link to="/blogs" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blogs
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const publishedDate = new Date(blog.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const authorBio =
    authorBios[blog.author] ||
    `${blog.author} shares perspective on market trends, premium communities, and smart property decisions.`;

  return (
    <div className="scroll-smooth bg-slate-50 pb-24 text-slate-900">
      <motion.div style={{ scaleX: progressScale }} className="fixed left-0 right-0 top-0 z-60 h-1 origin-left bg-slate-900" />

      <section className="relative mb-16 overflow-hidden px-6 pb-14 pt-32 md:pt-36">
        <motion.img
          initial={{ scale: 1.12, opacity: 0.75 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9 }}
          src={blog.image}
          alt={blog.title}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/92 via-slate-900/58 to-slate-900/25" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            to="/blogs"
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blogs
          </Link>

          <motion.div
            variants={sectionReveal}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.55 }}
            className="max-w-4xl"
          >
            <p className="mb-3 inline-flex rounded-full border border-white/35 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-xl">
              {blog.category}
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">{blog.title}</h1>
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {publishedDate}
              </span>
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                By {blog.author}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[90px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <div className="sticky top-28 space-y-3">
              <button
                type="button"
                onClick={() => shareTo('twitter')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all hover:scale-105 hover:text-slate-950"
                aria-label="Share on X"
              >
                <Twitter className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => shareTo('linkedin')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all hover:scale-105 hover:text-slate-950"
                aria-label="Share on LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => shareTo('facebook')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all hover:scale-105 hover:text-slate-950"
                aria-label="Share on Facebook"
              >
                <Facebook className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-all hover:scale-105 hover:text-slate-950"
                aria-label="Copy link"
              >
                <Copy className="h-4 w-4" />
              </button>
              {copied && <p className="text-xs font-semibold text-slate-500">Copied</p>}
            </div>
          </div>

          <motion.article
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-full max-w-3xl"
          >
            <div className="space-y-6 leading-relaxed">
              {contentBlocks.map((block, index) => {
                const isHeading = /:$/.test(block) || (block.length < 90 && block.split(' ').length <= 8);
                if (isHeading && index !== 0) {
                  return (
                    <h2 key={`${block}-${index}`} className="pt-4 text-2xl font-semibold text-slate-950 md:text-3xl">
                      {block.replace(/:$/, '')}
                    </h2>
                  );
                }

                if (index === 0) {
                  return (
                    <p key={`${block}-${index}`} className="text-lg text-gray-600">
                      <span className="float-left mr-2 mt-1 font-serif text-6xl leading-[0.8] text-slate-950">{block.charAt(0)}</span>
                      {block.slice(1)}
                    </p>
                  );
                }

                return (
                  <p key={`${block}-${index}`} className="text-lg text-gray-600">
                    {block}
                  </p>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="mt-14"
            >
              <GlassPanel className="rounded-xl p-6 md:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author)}&background=0f172a&color=ffffff&size=240`}
                    alt={blog.author}
                    className="h-16 w-16 rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Written By</p>
                    <h3 className="mt-1 text-2xl font-semibold text-slate-950">{blog.author}</h3>
                    <p className="mt-2 text-sm text-slate-600">{authorBio}</p>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          </motion.article>
        </div>
      </section>

      <section className="px-6 pb-24 pt-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="mb-10"
          >
            <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">Related Posts</h2>
            <p className="mt-3 text-slate-500">More perspectives from our editorial desk.</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {relatedBlogs.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                whileHover={{ y: -6 }}
                className="group overflow-hidden rounded-2xl border border-white/50 bg-white shadow-lg"
              >
                <Link to={`/blogs/${item.slug || item.id}`}>
                  <div className="aspect-16/10 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-3 p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.category}</p>
                    <h3 className="line-clamp-2 text-2xl font-semibold text-slate-950">{item.title}</h3>
                    <p className="line-clamp-2 text-sm text-slate-600">{item.meta_description || item.content.substring(0, 120)}...</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                      Read article <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xl"
        >
          <h2 className="text-4xl font-bold text-slate-950 md:text-5xl">Explore More Properties</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Discover premium projects selected for lifestyle excellence and long-term investment potential.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link to="/projects" className="inline-flex items-center gap-2">
                Explore Projects <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
