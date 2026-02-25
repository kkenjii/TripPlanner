import axios from 'axios';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api/place';

const CITY_CENTER_BY_NAME: Record<string, { lat: number; lng: number }> = {
  Tokyo: { lat: 35.6762, lng: 139.6503 },
  Osaka: { lat: 34.6937, lng: 135.5023 },
  Kyoto: { lat: 35.0116, lng: 135.7681 },
  Sapporo: { lat: 43.0618, lng: 141.3545 },
  Fukuoka: { lat: 33.5902, lng: 130.4017 },
  Bangkok: { lat: 13.7563, lng: 100.5018 },
  Phuket: { lat: 8.6353, lng: 98.2948 },
  'Chiang Mai': { lat: 18.7883, lng: 98.9853 },
  Pattaya: { lat: 12.9271, lng: 100.8765 },
  Krabi: { lat: 8.3192, lng: 98.9264 },
  'Kuala Lumpur': { lat: 3.1390, lng: 101.6869 },
  Penang: { lat: 5.3520, lng: 100.3330 },
  'Johor Bahru': { lat: 1.4854, lng: 103.7618 },
  Malacca: { lat: 2.1896, lng: 102.2501 },
  'Kota Kinabalu': { lat: 5.9788, lng: 118.0753 },
  Manila: { lat: 14.5995, lng: 120.9842 },
  Cebu: { lat: 10.3157, lng: 123.8854 },
  Boracay: { lat: 11.9674, lng: 121.9248 },
  Palawan: { lat: 9.8349, lng: 118.7384 },
  Davao: { lat: 7.1907, lng: 125.4553 },
};

const REGION_BY_COUNTRY: Record<string, string> = {
  Japan: 'jp',
  'Hong Kong': 'hk',
  Thailand: 'th',
  Malaysia: 'my',
  Philippines: 'ph',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function searchAccommodations(
  city: string,
  country: string,
  userLat?: number,
  userLng?: number,
  maxResults: number = 100
) {
  if (!API_KEY) throw new Error('Missing Google Places API key');
  
  const center = CITY_CENTER_BY_NAME[city];
  const region = REGION_BY_COUNTRY[country] || 'jp';

  // Prioritize user location over city center
  const searchLat = userLat !== undefined ? userLat : center?.lat;
  const searchLng = userLng !== undefined ? userLng : center?.lng;

  // Search for multiple accommodation types
  const accommodationTypes = [
    'hotel',
    'lodging',
    'hostel',
    'apartment',
    'guesthouse',
    'motel',
  ];

  const results: any[] = [];
  const allPlaces: Set<string> = new Set(); // To avoid duplicates

  for (const type of accommodationTypes) {
    const params: Record<string, string | number> = {
      query: `${type} in ${city}, ${country}`,
      key: API_KEY,
      type,
      region,
      language: 'en',
    };

    if (searchLat !== undefined && searchLng !== undefined) {
      params.location = `${searchLat},${searchLng}`;
      params.radius = 25000;
    }

    let pageToken: string | undefined;
    let pageCount = 0;

    while (results.length < maxResults && pageCount < 3) {
      try {
        const res = await axios.get(`${BASE_URL}/textsearch/json`, {
          params: {
            ...params,
            ...(pageToken ? { pagetoken: pageToken } : {}),
          },
        });

        const places = res.data.results || [];
        for (const place of places) {
          if (!allPlaces.has(place.place_id)) {
            allPlaces.add(place.place_id);
            results.push(place);
            if (results.length >= maxResults) break;
          }
        }

        pageToken = res.data.next_page_token;
        pageCount++;

        if (!pageToken) break;

        // Rate limiting
        await sleep(1000);
      } catch (err) {
        console.error(`Error searching ${type}:`, err);
        break;
      }
    }

    // Rate limiting between accommodation type searches
    await sleep(500);
  }

  return results.slice(0, maxResults);
}

export async function getPlaceDetails(placeId: string) {
  if (!API_KEY) throw new Error('Missing Google Places API key');

  const res = await axios.get(`${BASE_URL}/details/json`, {
    params: {
      place_id: placeId,
      key: API_KEY,
      fields: 'place_id,name,rating,review,geometry,formatted_address,website,opening_hours,photos,price_level,types,url',
      reviews_sort: 'most_relevant',
    },
  });

  await sleep(500); // Rate limiting

  return res.data.result;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
