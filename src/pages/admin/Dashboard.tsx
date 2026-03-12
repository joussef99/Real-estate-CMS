import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, MapPin, Newspaper, Plus, LayoutDashboard } from 'lucide-react';
import { Button } from '../../components/Button';
import { AdminSidebar } from '../../components/AdminSidebar';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }

    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(setStats);
  }, [token, navigate]);

  if (!stats) return <div className="p-10">Loading...</div>;

  const statCards = [
    { name: 'Total Projects', value: stats.projects, icon: Building2, color: 'bg-blue-500' },
    { name: 'Developers', value: stats.developers, icon: LayoutDashboard, color: 'bg-purple-500' },
    { name: 'Destinations', value: stats.destinations, icon: MapPin, color: 'bg-emerald-500' },
    { name: 'Blog Posts', value: stats.blogs, icon: Newspaper, color: 'bg-orange-500' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-10">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-zinc-900">Dashboard Overview</h1>
          <Link to="/admin/projects/new">
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.name} className="rounded-3xl bg-white p-8 shadow-sm border border-zinc-100">
              <div className={`mb-4 inline-flex rounded-2xl p-3 text-white ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-zinc-500">{stat.name}</p>
              <h3 className="text-3xl font-bold text-zinc-900">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-white p-8 shadow-sm border border-zinc-100">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/admin/developers/new">
              <Button variant="outline" className="w-full justify-start">Add New Developer</Button>
            </Link>
            <Link to="/admin/blogs/new">
              <Button variant="outline" className="w-full justify-start">Create Blog Post</Button>
            </Link>
            <Link to="/admin/careers/new">
              <Button variant="outline" className="w-full justify-start">Post Job Opening</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
