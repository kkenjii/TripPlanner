import { FoodPlace } from '../../components/FoodList';
import { Review } from './eventMapper';

export function mapGooglePlaceToFood(place: any, apiKey: string = ''): FoodPlace {
  const photos = (place.photos || []).slice(0, 4).map((photo: any) => {
    let url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}`;
    if (apiKey) {
      url += `&key=${apiKey}`;
    }
    return url;
  });

  return {
    id: place.place_id,
    name: place.name,
    rating: place.rating || 0,
    address: place.formatted_address || '',
    isOpen: place.opening_hours?.open_now ?? false,
    priceLevel: place.price_level ?? 0,
    lat: place.geometry?.location?.lat ?? 0,
    lng: place.geometry?.location?.lng ?? 0,
    website: place.website || undefined,
    photos: photos,
    reviews: (place.reviews || []).slice(0, 5).map(mapGoogleReviewToReview),
  };
}

export function mapGoogleReviewToReview(r: any): Review {
  return {
    author: r.author_name,
    rating: r.rating,
    text: r.text,
    relativeTime: r.relative_time_description,
    timestamp: r.time,
  };
}
