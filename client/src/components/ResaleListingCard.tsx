import { Link } from 'react-router-dom';
import { MapPin, Bed, Maximize2 } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';
import { FALLBACK_IMAGE_URL, cloudinaryOptimizedUrl, resolveImageUrl, withFallbackImage } from '../utils/image';
import { formatSize } from '../utils/size';
import { formatPrice } from '../utils/price';
import { ResaleListing } from '../types';

interface ResaleListingCardProps {
  listing: ResaleListing;
  /** Home's version omits the beds/size row and uses slightly tighter type scale. */
  compact?: boolean;
}

export function ResaleListingCard({ listing, compact = false }: ResaleListingCardProps) {
  const listingUrl = `/resale/${listing.slug || listing.id}`;

  return (
    <Link
      to={listingUrl}
      className="group overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-lg transition-all hover:shadow-2xl"
    >
      <div className="relative aspect-16/11 overflow-hidden">
        <img
          src={cloudinaryOptimizedUrl(resolveImageUrl(listing.main_image), { width: 900, height: 620 }) || FALLBACK_IMAGE_URL}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={withFallbackImage}
        />
        <div className="absolute left-4 top-4 rounded-full border border-white/35 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-xl">
          {formatPrice(listing.price, listing.price_display)}
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <ShareButton url={listingUrl} title={listing.title} />
          <FavoriteButton
            type="resale"
            id={listing.id}
            title={listing.title}
            slug={listing.slug}
            image={listing.main_image}
            subtitle={listing.location}
            price={formatPrice(listing.price, listing.price_display)}
          />
        </div>
      </div>
      <div className={compact ? 'space-y-2 p-5 sm:p-6' : 'space-y-3 p-6'}>
        <h3 className={compact ? 'line-clamp-1 text-lg font-semibold text-zinc-900 sm:text-xl' : 'line-clamp-1 text-xl font-semibold text-zinc-900'}>
          {listing.title}
        </h3>
        <div className="flex items-center text-sm text-zinc-500">
          <MapPin className="mr-2 h-4 w-4" />
          <span className="line-clamp-1">{listing.location}</span>
        </div>
        {!compact && (
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {listing.beds || 'N/A'}</span>
            <span className="flex items-center gap-1"><Maximize2 className="h-4 w-4" /> {formatSize(listing.size)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
