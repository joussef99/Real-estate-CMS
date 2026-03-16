import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Button } from './components/Button';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
import Blogs from './pages/Blogs';
import BlogDetails from './pages/BlogDetails';
import Developers from './pages/Developers';
import Destinations from './pages/Destinations';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ManageProjects from './pages/admin/ManageProjects';
import ManageDevelopers from './pages/admin/ManageDevelopers';
import ManageDestinations from './pages/admin/ManageDestinations';
import ManageBlogs from './pages/admin/ManageBlogs';
import ManageCareers from './pages/admin/ManageCareers';
import AddProject from './pages/admin/AddProject';
import AddEditDeveloper from './pages/admin/AddEditDeveloper';
import AddEditDestination from './pages/admin/AddEditDestination';
import AddEditBlog from './pages/admin/AddEditBlog';
import AddEditCareer from './pages/admin/AddEditCareer';
import AdminPropertyTypes from './pages/admin/AdminPropertyTypes';
import AdminAmenities from './pages/admin/AdminAmenities';
import AdminLeads from './pages/admin/AdminLeads';
import { useEffect } from 'react';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

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
          <Route path="/destinations" element={<Destinations />} />
          
          {/* Admin Routes */}
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
          
          {/* Fallback */}
          <Route path="*" element={<div className="pt-32 text-center">Page Not Found</div>} />
        </Routes>
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
              LIVIN <span className="font-light text-slate-400">PRESTIGE</span>
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-slate-300">
              A premium real estate platform connecting modern investors with extraordinary properties and trusted developers.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="#" className="rounded-xl border border-white/20 bg-white/10 p-2.5 transition-all hover:bg-white/20" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-xl border border-white/20 bg-white/10 p-2.5 transition-all hover:bg-white/20" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-xl border border-white/20 bg-white/10 p-2.5 transition-all hover:bg-white/20" aria-label="Facebook">
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
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email"
                className="flex-1 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
              <Button size="sm">Join</Button>
            </div>
          </div>
        </div>
        <div className="relative mt-16 border-t border-white/10 pt-8 text-center text-xs text-slate-400">
          © 2026 Livin Prestige. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
