import { Link } from 'react-router-dom';
import { MapPin, Building2, Bed, Maximize2, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './Button';

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
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group overflow-hidden rounded-2xl border border-white/40 bg-white/85 shadow-lg transition-all duration-300 hover:shadow-2xl"
    >
      <Link to={`/projects/${projectUrl}`} className="block">
        <div className="relative aspect-16/11 overflow-hidden">
          <img
            src={getCardImage()}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-900/20 to-transparent" />
          <div className="absolute left-4 top-4 rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xl">
            {project.price_range || 'Price on request'}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/80">{project.type || 'Property'}</p>
            <h3 className="line-clamp-1 text-2xl font-semibold">{project.name}</h3>
            <div className="mt-2 flex items-center text-sm text-white/85">
              <MapPin className="mr-2 h-4 w-4" />
              <span className="line-clamp-1">{project.location}</span>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Bed className="h-4 w-4 text-slate-900" />
              <span className="font-medium">{project.beds || 'N/A'} Beds</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Maximize2 className="h-4 w-4 text-slate-900" />
              <span className="font-medium">{project.size || 'Area N/A'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{project.developer_name || 'Top Developer'}</span>
              </div>
            </div>
            <Button size="sm" className="min-w-34.5">
              View Details <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
