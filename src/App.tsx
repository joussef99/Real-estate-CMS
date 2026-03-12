import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import About from './pages/About';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
import Blogs from './pages/Blogs';
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
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/blogs" element={<Blogs />} />
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
    <footer className="border-t bg-zinc-50 py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-bold tracking-tighter text-black">
              LUXE<span className="font-light text-zinc-500">ESTATE</span>
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-zinc-500">
              The world's most prestigious real estate platform. We connect high-net-worth individuals with exceptional properties.
            </p>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><Link to="/projects" className="hover:text-black">Projects</Link></li>
              <li><Link to="/developers" className="hover:text-black">Developers</Link></li>
              <li><Link to="/destinations" className="hover:text-black">Destinations</Link></li>
              <li><Link to="/blogs" className="hover:text-black">Blogs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider">Company</h4>
            <ul className="space-y-4 text-sm text-zinc-500">
              <li><Link to="/about" className="hover:text-black">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-black">Careers</Link></li>
              <li><Link to="/contact" className="hover:text-black">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-black">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-wider">Newsletter</h4>
            <p className="mb-4 text-sm text-zinc-500">Subscribe to receive the latest luxury property listings.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm focus:outline-none" />
              <Button size="sm">Join</Button>
            </div>
          </div>
        </div>
        <div className="mt-24 border-t pt-8 text-center text-xs text-zinc-400">
          © 2026 LuxeEstate. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';
import { Button } from './components/Button';
