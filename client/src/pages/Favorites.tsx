import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import { useFavoritesList } from '../hooks/useFavorites';
import { FavoriteButton } from '../components/FavoriteButton';
import { FALLBACK_IMAGE_URL, resolveImageUrl, withFallbackImage } from '../utils/image';

export default function Favorites() {
  const favorites = useFavoritesList();

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-zinc-900">Your Favorites</h1>
          <p className="text-zinc-500">
            {favorites.length > 0
              ? `${favorites.length} saved ${favorites.length === 1 ? 'listing' : 'listings'}. Saved on this device only.`
              : "Units you save will show up here — saved on this device only."}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-100 bg-zinc-50/50 py-24 text-center">
            <Heart className="mb-4 h-10 w-10 text-zinc-300" />
            <p className="mb-6 text-lg text-zinc-500">No favorites yet.</p>
            <div className="flex gap-3">
              <Link to="/projects" className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800">
                Browse Projects
              </Link>
              <Link to="/resale" className="rounded-full border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 hover:border-zinc-400">
                Browse Resale Units
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {favorites.map((item) => {
              const detailUrl = item.type === 'project'
                ? `/projects/${item.slug || item.id}`
                : `/resale/${item.slug || item.id}`;

              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={detailUrl}
                  className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-lg transition-all hover:shadow-2xl"
                >
                  <div className="relative aspect-16/11 overflow-hidden">
                    <img
                      src={resolveImageUrl(item.image) || FALLBACK_IMAGE_URL}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      onError={withFallbackImage}
                    />
                    <div className="absolute left-4 top-4 rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xl">
                      {item.price || 'Price on request'}
                    </div>
                    <div className="absolute right-4 top-4 rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-xl">
                      {item.type === 'project' ? 'Project' : 'Resale'}
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <FavoriteButton
                        type={item.type}
                        id={item.id}
                        title={item.title}
                        slug={item.slug}
                        image={item.image}
                        subtitle={item.subtitle}
                        price={item.price}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 p-5 sm:p-6">
                    <h3 className="line-clamp-1 text-lg font-semibold text-zinc-900 sm:text-xl">{item.title}</h3>
                    {item.subtitle && (
                      <div className="flex items-center text-sm text-zinc-500">
                        <MapPin className="mr-2 h-4 w-4" />
                        <span className="line-clamp-1">{item.subtitle}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
