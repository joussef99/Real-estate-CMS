import { API_BASE } from '../utils/api';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Blog } from '../types';
import { SectionHeading } from '../components/ui/section-heading';
import { BlogCardSkeleton } from '../components/ui/blog-card-skeleton';

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const normalize = <T,>(data: any, key?: string): T[] => {
      if (Array.isArray(data)) return data;
      if (key && data && Array.isArray(data[key])) return data[key];
      if (data && Array.isArray(data.blogs)) return data.blogs;
      return [];
    };

    setLoading(true);
    fetch(`${API_BASE}/api/blogs?limit=9&page=${currentPage}`)
      .then(res => res.json())
      .then(data => {
        setBlogs(normalize<Blog>(data, 'blogs'));
        setCurrentPage(data?.current_page || 1);
        setTotalPages(Math.max(data?.total_pages || 1, 1));
      })
      .finally(() => setLoading(false));
  }, [currentPage]);

  return (
    <div className="bg-slate-50 px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Editorial"
          title="Insights and Market Stories"
          description="Deep dives into market movements, high-yield opportunities, and luxury property trends."
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 9 }).map((_, index) => <BlogCardSkeleton key={index} />)
            : blogs.map((blog, index) => (
            <motion.article
              key={blog.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              whileHover={{ y: -6 }}
              className="group h-full overflow-hidden rounded-2xl border border-white/60 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
            >
              <Link to={`/blogs/${blog.slug || blog.id}`}>
                <div className="aspect-16/10 overflow-hidden">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8">
                  <span className="mb-4 inline-block text-xs uppercase tracking-[0.24em] text-gray-500">{blog.category}</span>
                  <h2 className="mb-4 text-2xl font-semibold leading-tight text-slate-950 group-hover:text-slate-700">
                    {blog.title}
                  </h2>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>By {blog.author}</span>
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
                    Read article <ArrowUpRight className="h-4 w-4" />
                  </p>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-6 py-4 shadow-sm md:flex-row">
            <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
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
