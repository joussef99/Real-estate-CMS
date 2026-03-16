import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Blog } from '../types';
import { SectionHeading } from '../components/ui/section-heading';

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    const normalize = <T,>(data: any, key?: string): T[] => {
      if (Array.isArray(data)) return data;
      if (key && data && Array.isArray(data[key])) return data[key];
      if (data && Array.isArray(data.blogs)) return data.blogs;
      return [];
    };

    fetch('/api/blogs')
      .then(res => res.json())
      .then(data => setBlogs(normalize<Blog>(data, 'blogs')));
  }, []);

  return (
    <div className="bg-slate-50 px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Editorial"
          title="Insights and Market Stories"
          description="Deep dives into market movements, high-yield opportunities, and luxury property trends."
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog, index) => (
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
      </div>
    </div>
  );
}
