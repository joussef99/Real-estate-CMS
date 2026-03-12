import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, MapPin, Newspaper, Briefcase, LogOut, Tag, Mail, Zap } from 'lucide-react';

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/admin/projects', icon: Building2 },
    { name: 'Developers', path: '/admin/developers', icon: UserIcon },
    { name: 'Destinations', path: '/admin/destinations', icon: MapPin },
    { name: 'Blogs', path: '/admin/blogs', icon: Newspaper },
    { name: 'Careers', path: '/admin/careers', icon: Briefcase },
    { name: 'Property Types', path: '/admin/property-types', icon: Tag },
    { name: 'Amenities', path: '/admin/amenities', icon: Zap },
    { name: 'Leads', path: '/admin/leads', icon: Mail },
  ];

  return (
    <aside className="w-64 border-r bg-white p-6 flex flex-col h-screen sticky top-0">
      <h2 className="mb-10 text-xl font-bold tracking-tighter">LUXE ADMIN</h2>
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center rounded-xl p-3 text-sm font-medium transition-colors ${
                isActive ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:bg-zinc-50 hover:text-black'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" /> {item.name}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-auto flex w-full items-center p-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
      >
        <LogOut className="mr-3 h-5 w-5" /> Logout
      </button>
    </aside>
  );
}

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
