import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCached } from '../../../lib/services/cacheService';
import { searchFoodPlaces, getPlaceDetails } from '../../../lib/services/googlePlacesService';
import { mapGooglePlaceToFood } from '../../../lib/mappers/foodMapper';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || 'Tokyo';
  const country = searchParams.get('country') || 'Japan';
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  const userLat = lat ? parseFloat(lat) : undefined;
  const userLng = lng ? parseFloat(lng) : undefined;

  // Round coordinates to 4 decimals for consistent caching (~11m precision)
  const roundedLat = userLat ? userLat.toFixed(4) : undefined;
  const roundedLng = userLng ? userLng.toFixed(4) : undefined;

  const cacheKey = `food_v6_${country}_${city}${roundedLat ? `_${roundedLat}_${roundedLng}` : '_no_gps'}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ food: cached });
  }
  try {
    const places = await searchFoodPlaces(city, country, 50, userLat, userLng);
    const detailedRaw = await Promise.all(
      places.slice(0, 50).map(async (place: any) => {
        const details = await getPlaceDetails(place.place_id);
        return mapGooglePlaceToFood(details, GOOGLE_PLACES_API_KEY);
      })
    );

    const cityMatchers: Record<string, RegExp[]> = {
      Tokyo: [/\bTokyo\b/i, /東京都/],
      Osaka: [/\bOsaka\b/i, /大阪/],
      Kyoto: [/\bKyoto\b/i, /京都/],
      Sapporo: [/\bSapporo\b/i, /札幌/],
      Fukuoka: [/\bFukuoka\b/i, /福岡/],
    };

    const cityRegexes = cityMatchers[city] || [];
    const withAddress = detailedRaw.filter((place: any) => place && place.address);

    const inJapan = withAddress.filter((place: any) => {
      const address = String(place.address);
      return /\bJapan\b/i.test(address) || /日本/.test(address);
    });

    const inCity = inJapan.filter((place: any) => {
      if (cityRegexes.length === 0) return true;
      const address = String(place.address);
      return cityRegexes.some((regex) => regex.test(address));
    });

    const selectedPool =
      inCity.length > 0
        ? inCity
        : inJapan.length > 0
        ? inJapan
        : withAddress;

    const detailed = selectedPool
      .sort((a: any, b: any) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.reviews?.length || 0) - (a.reviews?.length || 0);
      })
      .slice(0, 50);

    if (detailed.length === 0 && places.length > 0) {
      const fallbackFromSearch = places.slice(0, 50).map((place: any, index: number) => ({
        id: place.place_id || `fallback-${index}`,
        name: place.name || `Restaurant in ${city}`,
        rating: place.rating || 0,
        address: place.formatted_address || city,
        isOpen: place.opening_hours?.open_now ?? false,
        priceLevel: place.price_level ?? 0,
        lat: place.geometry?.location?.lat ?? 0,
        lng: place.geometry?.location?.lng ?? 0,
        website: undefined,
        photos: [],
        reviews: [],
      }));
      setCached(cacheKey, fallbackFromSearch, 1000 * 60 * 10);
      return NextResponse.json({ food: fallbackFromSearch });
    }

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
        photos: [],
        reviews: [],
      },
    ];
    setCached(cacheKey, fallbackFood, 1000 * 60 * 10);
    return NextResponse.json({ food: fallbackFood });
  }
}
