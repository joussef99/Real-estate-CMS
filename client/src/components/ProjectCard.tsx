import { Link } from 'react-router-dom';
import { MapPin, Building2, Bed, Maximize2, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { FALLBACK_IMAGE_URL, cloudinaryOptimizedUrl, resolveImageUrl, withFallbackImage } from '../utils/image';

export const ProjectCard = (props: any) => {
  const { project } = props;
  
  // Get the first image from gallery, or use main_image, or fallback to placeholder
  const getCardImage = () => {
    if (project.main_image) {
      return resolveImageUrl(project.main_image);
    }
    if (project.images && Array.isArray(project.images) && project.images.length > 0) {
      return resolveImageUrl(project.images[0]);
    }
    if (project.gallery) {
      const galleryArray = typeof project.gallery === 'string' ? JSON.parse(project.gallery) : project.gallery;
      if (galleryArray.length > 0) return resolveImageUrl(galleryArray[0]);
    }
    return resolveImageUrl(project.main_image) || FALLBACK_IMAGE_URL;
  };

  const projectUrl = project.slug || project.id;
  const destinationUrl = project.destination_slug ? `/destinations/${project.destination_slug}` : '/destinations';

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
            src={cloudinaryOptimizedUrl(getCardImage(), { width: 900, height: 620 }) || FALLBACK_IMAGE_URL}
            alt={project.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            referrerPolicy="no-referrer"
            onError={withFallbackImage}
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
      </Link>

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

            {project.destination_name && (
              <Link
                to={destinationUrl}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                <MapPin className="h-3.5 w-3.5" />
                {project.destination_name}
              </Link>
            )}
          </div>

          <Button size="sm" className="min-w-34.5" asChild>
            <Link to={`/projects/${projectUrl}`}>
              View Details <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
};
