import { API_BASE } from './utils/api';
import { Suspense, lazy, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Button } from './components/Button';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { RouteSkeleton } from './components/ui/route-skeleton';

const Home = lazy(() => import('./pages/Home'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Careers = lazy(() => import('./pages/Careers'));
const Blogs = lazy(() => import('./pages/Blogs'));
const BlogDetails = lazy(() => import('./pages/BlogDetails'));
const Developers = lazy(() => import('./pages/Developers'));
const DeveloperProjects = lazy(() => import('./pages/DeveloperProjects'));
const Destinations = lazy(() => import('./pages/Destinations'));
const DestinationProjects = lazy(() => import('./pages/DestinationProjects'));
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ManageProjects = lazy(() => import('./pages/admin/ManageProjects'));
const ManageDevelopers = lazy(() => import('./pages/admin/ManageDevelopers'));
const ManageDestinations = lazy(() => import('./pages/admin/ManageDestinations'));
const ManageBlogs = lazy(() => import('./pages/admin/ManageBlogs'));
const ManageCareers = lazy(() => import('./pages/admin/ManageCareers'));
const AddProject = lazy(() => import('./pages/admin/AddProject'));
const AddEditDeveloper = lazy(() => import('./pages/admin/AddEditDeveloper'));
const AddEditDestination = lazy(() => import('./pages/admin/AddEditDestination'));
const AddEditBlog = lazy(() => import('./pages/admin/AddEditBlog'));
const AddEditCareer = lazy(() => import('./pages/admin/AddEditCareer'));
const AdminPropertyTypes = lazy(() => import('./pages/admin/AdminPropertyTypes'));
const AdminAmenities = lazy(() => import('./pages/admin/AdminAmenities'));
const AdminLeads = lazy(() => import('./pages/admin/AdminLeads'));
const AdminNewsletterSubscribers = lazy(() => import('./pages/admin/AdminNewsletterSubscribers'));
const ChangePassword = lazy(() => import('./pages/admin/ChangePassword'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-white font-sans text-zinc-900 antialiased">
        <ConditionalNavbar />
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:slug" element={<BlogDetails />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/developers/:slug" element={<DeveloperProjects />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/destinations/:slug" element={<DestinationProjects />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/projects" element={<ManageProjects />} />
            <Route path="/admin/projects/new" element={<AddProject />} />
            <Route path="/admin/projects/edit/:id" element={<AddProject />} />
            <Route path="/admin/developers" element={<ManageDevelopers />} />
            <Route path="/admin/developers/new" element={<AddEditDeveloper />} />
            <Route path="/admin/developers/edit/:id" element={<AddEditDeveloper />} />
            <Route path="/admin/destinations" element={<ManageDestinations />} />
            <Route path="/admin/destinations/new" element={<AddEditDestination />} />
            <Route path="/admin/destinations/edit/:id" element={<AddEditDestination />} />
            <Route path="/admin/blogs" element={<ManageBlogs />} />
            <Route path="/admin/blogs/new" element={<AddEditBlog />} />
            <Route path="/admin/blogs/edit/:id" element={<AddEditBlog />} />
            <Route path="/admin/careers" element={<ManageCareers />} />
            <Route path="/admin/careers/new" element={<AddEditCareer />} />
            <Route path="/admin/careers/edit/:id" element={<AddEditCareer />} />
            <Route path="/admin/property-types" element={<AdminPropertyTypes />} />
            <Route path="/admin/amenities" element={<AdminAmenities />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
            <Route path="/admin/newsletter" element={<AdminNewsletterSubscribers />} />
            <Route path="/admin/change-password" element={<ChangePassword />} />
            <Route path="*" element={<div className="pt-32 text-center">Page Not Found</div>} />
          </Routes>
        </Suspense>
        <Footer />
      </div>
    </Router>
  );
}

function ConditionalNavbar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  if (isAdmin) return null;
  return <Navbar />;
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return <p className="text-sm text-emerald-400">You're subscribed. Thank you!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
        placeholder="Email"
        className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
      />
      <Button type="submit" size="sm" disabled={status === 'loading'}>
        {status === 'loading' ? '...' : 'Join'}
      </Button>
      {status === 'error' && (
        <p className="mt-1 text-xs text-red-400">Try again.</p>
      )}
    </form>
  );
}

function Footer() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  if (isAdmin) return null;

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950 px-6 py-24 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.22),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_35%)]" />
      <div className="mx-auto max-w-7xl">
        <div className="relative grid gap-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-semibold tracking-tight text-white">
              LIVIN <span className="font-light text-slate-400">INVESTMENT</span>
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-slate-300">
              A premium real estate platform connecting modern investors with extraordinary properties and trusted developers.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="https://www.instagram.com/livin.investments" className="rounded-xl border border-white/20 bg-white/10 p-2.5 transition-all hover:bg-white/20" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.linkedin.com/company/livin-ofo" className="rounded-xl border border-white/20 bg-white/10 p-2.5 transition-all hover:bg-white/20" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://www.facebook.com/share/1cQKZQ4fYw/" className="rounded-xl border border-white/20 bg-white/10 p-2.5 transition-all hover:bg-white/20" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Explore</h4>
            <ul className="space-y-4 text-sm text-slate-300">
              <li><Link to="/projects" className="hover:text-white">Projects</Link></li>
              <li><Link to="/developers" className="hover:text-white">Developers</Link></li>
              <li><Link to="/destinations" className="hover:text-white">Destinations</Link></li>
              <li><Link to="/blogs" className="hover:text-white">Blogs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Company</h4>
            <ul className="space-y-4 text-sm text-slate-300">
              <li><Link to="/about" className="hover:text-white">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/projects" className="hover:text-white">Premium Listings</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Stay Updated</h4>
            <p className="mb-4 text-sm text-slate-300">Get curated launches and market updates for premium buyers.</p>
            <NewsletterForm />
          </div>
        </div>
        <div className="relative mt-16 border-t border-white/10 pt-8 text-center text-xs text-slate-400">
          © 2026 Livin Investment. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
