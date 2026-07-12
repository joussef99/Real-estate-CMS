import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, User, Building2, Heart } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';
import { WHATSAPP_URL, WhatsAppIcon } from './WhatsAppButton';
import { useFavoritesList } from '../hooks/useFavorites';

// Mirrors the lazy() imports in App.tsx — calling the same dynamic import
// again here doesn't re-fetch the chunk (the bundler dedupes it), so
// prefetching on hover/focus just gets the JS loaded before the user clicks,
// removing the lazy-load delay for the most common navigation path.

const routePrefetchers: Record<string, () => Promise<unknown>> = {
  '/': () => import('../pages/Home'),
  '/projects': () => import('../pages/Projects'),
  '/resale': () => import('../pages/Resale'),
  '/developers': () => import('../pages/Developers'),
  '/destinations': () => import('../pages/Destinations'),
  '/blogs': () => import('../pages/Blogs'),
  '/careers': () => import('../pages/Careers'),
  '/contact': () => import('../pages/Contact'),
  '/about': () => import('../pages/About'),
  '/favorites': () => import('../pages/Favorites'),
};

export const Navbar = () => {
  const prefetchedRef = useRef(new Set<string>());
  const prefetch = (path: string) => {
    if (prefetchedRef.current.has(path)) return;
    prefetchedRef.current.add(path);
    routePrefetchers[path]?.();
  };

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const favoritesCount = useFavoritesList().length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hover-to-prefetch doesn't apply on touch devices, so prefetch every
  // route the moment the mobile drawer opens — the user is about to browse.
  useEffect(() => {
    if (!isOpen) return;
    Object.keys(routePrefetchers).forEach(prefetch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: 'Resale', path: '/resale' },
    { name: 'Developers', path: '/developers' },
    { name: 'Destinations', path: '/destinations' },
    { name: 'Blogs', path: '/blogs' },
    { name: 'Careers', path: '/careers' },
    { name: 'Contact', path: '/contact' },
    { name: 'About', path: '/about' },
  ];

  // The transparent, unscrolled nav style only has enough contrast over the Home
  // page's dark hero video. Every other page has a plain light background at the
  // top, so give the nav its solid dark background there regardless of scroll.
  const isHome = location.pathname === '/';
  const solid = scrolled || !isHome;

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300  ${
        solid ? 'border-b border-black/25 bg-slate-950/70 py-4 shadow-lg backdrop-blur-md' : 'bg-transparent py-6'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-950">
          {/* <span className="inline-flex h-9 w-25 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg"> */}
            {/* <Building2 className="h-10 w-auto" /> */}
            <img src="/livin-copy.png" alt="LIVIN Logo" className="h-15 w-auto" />
          {/* </span> */}
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center space-x-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onMouseEnter={() => prefetch(link.path)}
              onFocus={() => prefetch(link.path)}
              className={`text-sm font-medium transition-colors hover:text-white ${
                location.pathname === link.path ? 'text-white' : 'text-slate-300'
              }`}
            >
              {link.name}
            </Link>
          ))}
          {/* <button className="text-slate-300 hover:text-white" aria-label="Search projects">
            <Link to="/projects" aria-label="Explore projects">
              <Search className="h-5 w-5" />
            </Link>
          </button> */}
          {/* <Link to="/admin/login" className="text-slate-500 hover:text-slate-950" aria-label="Admin login">
            <User className="h-5 w-5" />
          </Link> */}
          <Link
            to="/favorites"
            onMouseEnter={() => prefetch('/favorites')}
            onFocus={() => prefetch('/favorites')}
            className={`relative transition-colors hover:text-white ${location.pathname === '/favorites' ? 'text-white' : 'text-slate-300'}`}
            aria-label="Your favorites"
          >
            <Heart className={`h-5 w-5 ${favoritesCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
            {favoritesCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {favoritesCount}
              </span>
            )}
          </Link>
          <Button size="sm" asChild>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp us">
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp us
            </a>
          </Button>
        </div>

        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
          <Dialog.Trigger asChild>
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-slate-900 shadow-md backdrop-blur lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </Dialog.Trigger>

          <AnimatePresence>
            {isOpen && (
              <Dialog.Portal forceMount>
                <Dialog.Overlay asChild>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/45"
                  />
                </Dialog.Overlay>
                <Dialog.Content asChild>
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="fixed right-0 top-0 z-50 flex h-full w-[86%] max-w-sm flex-col border-l border-white/30 bg-white/85 p-6 backdrop-blur-xl"
                  >
                    <div className="mb-8 flex items-center justify-between">
                      <Dialog.Title className="text-xl font-semibold tracking-tight text-slate-950">Menu</Dialog.Title>
                      <Dialog.Close asChild>
                        <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white" aria-label="Close menu">
                          <X className="h-5 w-5" />
                        </button>
                      </Dialog.Close>
                    </div>

                    <div className="space-y-1">
                      {navLinks.map((link) => (
                        <Dialog.Close asChild key={link.name}>
                          <Link
                            to={link.path}
                            className={`block rounded-xl px-4 py-3 text-base font-medium transition-all duration-300 ${
                              location.pathname === link.path
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {link.name}
                          </Link>
                        </Dialog.Close>
                      ))}
                      <Dialog.Close asChild>
                        <Link
                          to="/favorites"
                          className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-all duration-300 ${
                            location.pathname === '/favorites'
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Heart className={`h-4 w-4 ${favoritesCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                            Favorites
                          </span>
                          {favoritesCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                              {favoritesCount}
                            </span>
                          )}
                        </Link>
                      </Dialog.Close>
                    </div>

                    <div className="mt-auto space-y-3 pt-8">
                      <Dialog.Close asChild>
                        <Button className="w-full" asChild>
                          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                            <WhatsAppIcon className="h-4 w-4" />
                            WhatsApp us
                          </a>
                        </Button>
                      </Dialog.Close>
                      {/* <Dialog.Close asChild>
                        <Button variant="secondary" className="w-full" asChild>
                          <Link to="/admin/login">Admin Login</Link>
                        </Button>
                      </Dialog.Close> */}
                    </div>
                  </motion.div>
                </Dialog.Content>
              </Dialog.Portal>
            )}
          </AnimatePresence>
        </Dialog.Root>
      </div>
    </nav>
  );
};
