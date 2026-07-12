import { Heart } from 'lucide-react';
import { FavoriteType, useFavorite } from '../hooks/useFavorites';

interface FavoriteButtonProps {
  type: FavoriteType;
  id: number;
  title: string;
  slug?: string | null;
  image?: string | null;
  subtitle?: string | null;
  price?: string | null;
  className?: string;
  /** 'overlay' for glass buttons on top of an image (cards); 'solid' for plain page backgrounds (detail headers). */
  variant?: 'overlay' | 'solid';
}

const VARIANT_CLASSES = {
  overlay: 'border border-white/35 bg-white/20 text-white backdrop-blur-xl hover:bg-white/35',
  solid: 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100',
};

export function FavoriteButton({ type, id, title, slug, image, subtitle, price, className = '', variant = 'overlay' }: FavoriteButtonProps) {
  const { favorited, toggle } = useFavorite(type, id);

  return (
    <button
      type="button"
      aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
      aria-pressed={favorited}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ title, slug, image, subtitle, price });
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
    >
      <Heart className={`h-4 w-4 transition-all ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
    </button>
  );
}
