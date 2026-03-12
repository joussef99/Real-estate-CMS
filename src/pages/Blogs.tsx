import { useState, useEffect } from 'react';
import { Blog } from '../types';
import { Link } from 'react-router-dom';

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    fetch('/api/blogs').then(res => res.json()).then(setBlogs);
  }, []);

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold">Insights & News</h1>
          <p className="text-zinc-500">The latest trends and news in the luxury real estate market.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map(blog => (
            <article key={blog.id} className="group overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-xl">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={blog.image} alt={blog.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
              </div>
              <div className="p-8">
                <span className="mb-4 inline-block text-xs font-bold uppercase tracking-widest text-zinc-400">{blog.category}</span>
                <h2 className="mb-4 text-2xl font-bold leading-tight text-zinc-900 group-hover:text-zinc-600">
                  <Link to={`/blogs/${blog.id}`}>{blog.title}</Link>
                </h2>
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>By {blog.author}</span>
                  <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
