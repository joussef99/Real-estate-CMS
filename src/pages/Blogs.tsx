import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Blog } from '../types';

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
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold">Insights & News</h1>
          <p className="text-zinc-500">The latest trends and news in the luxury real estate market.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map(blog => (
            <Link key={blog.id} to={`/blogs/${blog.slug || blog.id}`}>
              <article className="group overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-xl h-full cursor-pointer">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={blog.image} alt={blog.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                </div>
                <div className="p-8">
                  <span className="mb-4 inline-block text-xs font-bold uppercase tracking-widest text-zinc-400">{blog.category}</span>
                  <h2 className="mb-4 text-2xl font-bold leading-tight text-zinc-900 group-hover:text-zinc-600">
                    {blog.title}
                  </h2>
                  <div className="flex items-center justify-between text-sm text-zinc-500">
                    <span>By {blog.author}</span>
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
