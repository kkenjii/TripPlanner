import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCached } from '../../lib/services/cacheService';
import { searchFoodPlaces, getPlaceDetails } from '../../lib/services/googlePlacesService';
import { mapGooglePlaceToFood } from '../../lib/mappers/foodMapper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || 'Tokyo';
  const country = searchParams.get('country') || 'Japan';
  const cacheKey = `food_${city}_${country}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ food: cached });
  }
  try {
    const places = await searchFoodPlaces(city, country);
    const detailed = await Promise.all(
      places.slice(0, 5).map(async (place: any) => {
        const details = await getPlaceDetails(place.place_id);
        return mapGooglePlaceToFood(details);
      })
    );
    setCached(cacheKey, detailed, 1000 * 60 * 10);
    return NextResponse.json({ food: detailed });
  } catch (error: any) {
    console.error('Food API error:', error.message);
    // Return fallback data
    const fallbackFood = [
      {
        id: '1',
        name: 'Sample Restaurant in ' + city,
        rating: 4.5,
        address: city,
        isOpen: true,
        priceLevel: 2,
        lat: 0,
        lng: 0,
        photoUrl: '',
        reviews: [],
      },
    ];
    setCached(cacheKey, fallbackFood, 1000 * 60 * 10);
    return NextResponse.json({ food: fallbackFood });
  }
}
