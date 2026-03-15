import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Building2, Plus, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/Button';
import { Project } from '../../types';

export default function ManageProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchProjects();
  }, [token, navigate]);

  const fetchProjects = () => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const projectList = Array.isArray(data)
          ? data
          : Array.isArray(data.projects)
            ? data.projects
            : [];
        setProjects(projectList);
      });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      fetchProjects();
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar - Same as Dashboard */}
      <aside className="w-64 border-r bg-white p-6">
        <h2 className="mb-10 text-xl font-bold tracking-tighter">LUXE ADMIN</h2>
        <nav className="space-y-2">
          <Link to="/admin/dashboard" className="flex items-center rounded-xl p-3 text-sm font-medium text-zinc-500 hover:bg-zinc-50">
            <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
          </Link>
          <Link to="/admin/projects" className="flex items-center rounded-xl bg-zinc-100 p-3 text-sm font-medium text-black">
            <Building2 className="mr-3 h-5 w-5" /> Projects
          </Link>
          {/* Add other links here too */}
        </nav>
      </aside>

      <main className="flex-1 p-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <Link to="/admin/dashboard" className="mb-2 flex items-center text-sm text-zinc-500 hover:text-black">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Manage Projects</h1>
          </div>
          <Link to="/admin/projects/new">
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" /> Add Project
            </Button>
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-zinc-50 text-sm font-medium text-zinc-500">
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Beds</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img src={project.main_image} alt="" className="mr-3 h-10 w-10 rounded-lg object-cover" />
                      <span className="font-medium">{project.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{project.location}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{project.type}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{project.beds || '-'}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">{project.size || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium">
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/admin/projects/edit/${project.id}`)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-black"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(project.id)}
                        className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
