import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, User, Building2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: 'Developers', path: '/developers' },
    { name: 'Destinations', path: '/destinations' },
    { name: 'Blogs', path: '/blogs' },
    { name: 'Careers', path: '/careers' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'border-b border-white/25 bg-white/70 py-4 shadow-lg backdrop-blur' : 'bg-transparent py-6'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-950">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg">
            <Building2 className="h-5 w-5" />
          </span>
          LIVIN
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center space-x-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-slate-950 ${
                location.pathname === link.path ? 'text-slate-950' : 'text-slate-500'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <button className="text-slate-500 hover:text-slate-950" aria-label="Search projects">
            <Search className="h-5 w-5" />
          </button>
          <Link to="/admin/login" className="text-slate-500 hover:text-slate-950" aria-label="Admin login">
            <User className="h-5 w-5" />
          </Link>
          <Button size="sm" asChild>
            <Link to="/projects">Explore Projects</Link>
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
                    </div>

                    <div className="mt-auto space-y-3 pt-8">
                      <Dialog.Close asChild>
                        <Button className="w-full" asChild>
                          <Link to="/projects">Explore Projects</Link>
                        </Button>
                      </Dialog.Close>
                      <Dialog.Close asChild>
                        <Button variant="secondary" className="w-full" asChild>
                          <Link to="/admin/login">Admin Login</Link>
                        </Button>
                      </Dialog.Close>
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
