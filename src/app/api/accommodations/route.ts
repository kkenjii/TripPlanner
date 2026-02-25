import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCached } from '../../../lib/services/cacheService';
import { searchAccommodations, getPlaceDetails } from '../../../lib/services/accommodationService';
import { mapGooglePlaceToAccommodation } from '../../../lib/mappers/accommodationMapper';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || 'Tokyo';
  const country = searchParams.get('country') || 'Japan';
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  const userLat = lat ? parseFloat(lat) : undefined;
  const userLng = lng ? parseFloat(lng) : undefined;

  const cacheKey = `accommodations_v1_${country}_${city}${userLat ? `_${userLat}_${userLng}` : ''}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return NextResponse.json({ accommodations: cached });
  }

  try {
    const places = await searchAccommodations(city, country, userLat, userLng, 100);

    const detailedRaw = await Promise.all(
      places.slice(0, 100).map(async (place: any) => {
        try {
          const details = await getPlaceDetails(place.place_id);
          return mapGooglePlaceToAccommodation(details, userLat, userLng, GOOGLE_PLACES_API_KEY);
        } catch (err) {
          console.error(`Error getting details for ${place.name}:`, err);
          // Fallback mapping without details
          return mapGooglePlaceToAccommodation(place, userLat, userLng, GOOGLE_PLACES_API_KEY);
        }
      })
    );

    // Filter out null/undefined entries
    const detailed = detailedRaw.filter((acc: any) => acc && acc.name);

    // Sort by distance (if available), then rating, then review count
    const sorted = detailed.sort((a: any, b: any) => {
      // If both have distance, sort by distance first
      if (userLat !== undefined && a.distance !== undefined && b.distance !== undefined) {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
      }
      // Then by rating
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      // Then by review count
      return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    });

    const final = sorted.slice(0, 100);

    // Cache for 1 hour
    setCached(cacheKey, final, 1000 * 60 * 60);

    return NextResponse.json({ accommodations: final });
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accommodations', accommodations: [] },
      { status: 500 }
    );
  }
}
