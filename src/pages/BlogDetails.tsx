import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Blog } from '../types';
import { ChevronLeft, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlogDetails() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(`/api/blogs/${slug}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Blog not found');
        }
        return res.json();
      })
      .then(data => {
        setBlog(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load blog');
        setLoading(false);
      });
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

    setMeta('meta[name="description"]', blog.meta_description || blog.content.substring(0, 160) || '');
    setMeta('meta[property="og:title"]', blog.meta_title || blog.title);
    setMeta('meta[property="og:description"]', blog.meta_description || blog.content.substring(0, 160) || '');
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

  if (loading) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="animate-pulse">
            <div className="h-12 bg-zinc-200 rounded-lg mb-8"></div>
            <div className="h-64 bg-zinc-200 rounded-lg mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-zinc-200 rounded-lg"></div>
              <div className="h-4 bg-zinc-200 rounded-lg"></div>
              <div className="h-4 bg-zinc-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="pt-32 pb-24 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-4">Blog Not Found</h1>
            <p className="text-zinc-500 mb-8">{error || 'The blog you are looking for could not be found.'}</p>
            <Link to="/blogs" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              <ChevronLeft size={20} />
              Back to Blogs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-3xl">
        {/* Back Link */}
        <Link to="/blogs" className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-8 transition-colors">
          <ChevronLeft size={20} />
          Back to Blogs
        </Link>

        {/* Blog Header */}
        <article className="mb-12">
          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-zinc-600">
            <span className="inline-block px-3 py-1 bg-zinc-100 rounded-full text-xs font-bold uppercase tracking-widest text-zinc-700">
              {blog.category}
            </span>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <time dateTime={blog.created_at}>
                {new Date(blog.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>By {blog.author}</span>
            </div>
          </div>

          {/* Cover Image */}
          <div className="relative w-full aspect-video overflow-hidden rounded-3xl mb-12 shadow-lg">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Blog Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <div className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-base lg:text-lg">
              {blog.content}
            </div>
          </div>
        </article>

        {/* Divider */}
        <div className="border-t border-zinc-200 pt-8">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ChevronLeft size={18} />
            Read More Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
