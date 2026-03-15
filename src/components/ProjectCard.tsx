import { Link } from 'react-router-dom';
import { MapPin, Building2, Bed, Maximize2 } from 'lucide-react';
import { Project } from '../types';
import { motion } from 'motion/react';

export const ProjectCard = (props: any) => {
  const { project } = props;
  
  // Get the first image from gallery, or use main_image, or fallback to placeholder
  const getCardImage = () => {
    if (project.images && Array.isArray(project.images) && project.images.length > 0) {
      return project.images[0];
    }
    if (project.gallery) {
      const galleryArray = typeof project.gallery === 'string' ? JSON.parse(project.gallery) : project.gallery;
      if (galleryArray.length > 0) return galleryArray[0];
    }
    return project.main_image || 'https://picsum.photos/seed/realestate/800/600';
  };

  const projectUrl = project.slug || project.id;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl"
    >
      <Link to={`/projects/${projectUrl}`}>
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={getCardImage()}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {project.type}
            </span>
            <span className="text-sm font-medium text-black">
              {project.price_range}
            </span>
          </div>
          <h3 className="mb-4 text-xl font-semibold text-zinc-900">{project.name}</h3>
          
          <div className="mb-4 grid grid-cols-2 gap-4 border-y border-zinc-100 py-4">
            <div className="flex items-center text-sm text-zinc-600">
              <Bed className="mr-2 h-4 w-4 text-emerald-600" />
              <span className="font-medium">{project.beds || 'N/A'}</span>
            </div>
            <div className="flex items-center text-sm text-zinc-600">
              <Maximize2 className="mr-2 h-4 w-4 text-emerald-600" />
              <span className="font-medium">{project.size || 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center text-sm text-zinc-500">
              <MapPin className="mr-2 h-4 w-4" />
              {project.location}
            </div>
            <div className="flex items-center text-sm text-zinc-500">
              <Building2 className="mr-2 h-4 w-4" />
              {project.developer_name}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
