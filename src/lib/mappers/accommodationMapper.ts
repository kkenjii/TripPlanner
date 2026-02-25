import { calculateDistance } from '../services/accommodationService';

export type Review = {
  author: string;
  rating: number;
  text: string;
  relativeTime?: string;
  timestamp?: number;
};

export type Accommodation = {
  id: string;
  name: string;
  type: 'hotel' | 'hostel' | 'apartment' | 'guesthouse' | 'motel' | 'lodging' | 'other';
  price: string;
  rating: number;
  reviewsCount: number;
  distance: number;
  location: string;
  image: string;
  url: string;
  lat: number;
  lng: number;
  address: string;
  reviews: Review[];
};

export function mapGooglePlaceToAccommodation(
  place: any,
  userLat?: number,
  userLng?: number,
  apiKey: string = ''
): Accommodation {
  // Determine accommodation type from place types
  const types = (place.types || []).map((t: string) => t.toLowerCase());
  let accommodationType: Accommodation['type'] = 'other';

  if (types.includes('lodging')) accommodationType = 'lodging';
  if (types.includes('hotel')) accommodationType = 'hotel';
  if (types.includes('hostel')) accommodationType = 'hostel';
  else if (types.some((t: string) => t.includes('apartment'))) accommodationType = 'apartment';
  else if (types.some((t: string) => t.includes('guest_house'))) accommodationType = 'guesthouse';
  else if (types.some((t: string) => t.includes('motel'))) accommodationType = 'motel';

  // Get primary image
  const photos = place.photos || [];
  let image = '';
  if (photos.length > 0) {
    const photo = photos[0];
    image = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}`;
    if (apiKey) {
      image += `&key=${apiKey}`;
    }
  } else {
    // Fallback image
    image = 'https://via.placeholder.com/400x300?text=No+Image';
  }

  // Calculate distance if user location provided
  let distance = 0;
  if (userLat !== undefined && userLng !== undefined && place.geometry?.location) {
    distance = calculateDistance(
      userLat,
      userLng,
      place.geometry.location.lat,
      place.geometry.location.lng
    );
  }

  // Determine price range display
  const priceLevel = place.price_level || 0;
  const priceDisplay = priceLevel > 0 ? '$'.repeat(priceLevel) : 'N/A';

  const lat = place.geometry?.location?.lat ?? 0;
  const lng = place.geometry?.location?.lng ?? 0;
  const address = place.formatted_address || '';

  // Extract city/area from address
  const addressParts = address.split(',');
  const location = addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : address;

  return {
    id: place.place_id || `acc_${Math.random()}`,
    name: place.name || 'Unknown Accommodation',
    type: accommodationType,
    price: priceDisplay,
    rating: place.rating || 0,
    reviewsCount: place.review_count || place.user_ratings_total || 0,
    distance,
    location,
    image,
    url: place.url || place.website || '',
    lat,
    lng,
    address,
    reviews: (place.reviews || []).slice(0, 10).map((r: any) => ({
      author: r.author_name || 'Anonymous',
      rating: r.rating || 0,
      text: r.text || '',
      relativeTime: r.relative_time_description || '',
      timestamp: r.time || 0,
    })),
  };
}

// Get type badge color
export function getTypeColor(type: Accommodation['type']): string {
  const colors: Record<Accommodation['type'], string> = {
    hotel: 'bg-blue-600',
    hostel: 'bg-green-600',
    apartment: 'bg-purple-600',
    guesthouse: 'bg-pink-600',
    motel: 'bg-yellow-600',
    lodging: 'bg-indigo-600',
    other: 'bg-gray-600',
  };
  return colors[type] || colors.other;
}

// Format accommodation type for display
export function formatAccommodationType(type: Accommodation['type']): string {
  const formats: Record<Accommodation['type'], string> = {
    hotel: '🏨 Hotel',
    hostel: '🏛️ Hostel',
    apartment: '🏠 Apartment',
    guesthouse: '🏡 Guesthouse',
    motel: '🛣️ Motel',
    lodging: '🛏️ Lodging',
    other: '🏢 Other',
  };
  return formats[type] || formats.other;
}
