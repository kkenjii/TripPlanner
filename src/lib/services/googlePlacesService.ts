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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const REGION_BY_COUNTRY: Record<string, string> = {
  Japan: 'jp',
  'Hong Kong': 'hk',
  Thailand: 'th',
  Malaysia: 'my',
  Philippines: 'ph',
};

export async function searchFoodPlaces(
  city: string,
  country: string,
  maxResults: number = 50,
  userLat?: number,
  userLng?: number
) {
  if (!API_KEY) throw new Error('Missing Google Places API key');
  const center = CITY_CENTER_BY_NAME[city];
  const region = REGION_BY_COUNTRY[country] || 'jp';

  // Prioritize user location over city center
  const searchLat = userLat !== undefined ? userLat : center?.lat;
  const searchLng = userLng !== undefined ? userLng : center?.lng;

  const params: Record<string, string | number> = {
    query: `top rated restaurants in ${city}, ${country}`,
    key: API_KEY,
    type: 'restaurant',
    region,
    language: 'en',
  };

  if (searchLat !== undefined && searchLng !== undefined) {
    params.location = `${searchLat},${searchLng}`;
    params.radius = 25000;
  }

  const results: any[] = [];
  let pageToken: string | undefined;
  const pageLimit = Math.min(Math.max(maxResults, 1), 60);

  // Use Text Search with strong location bias for selected city in Japan
  while (results.length < pageLimit) {
    const res = await axios.get(`${BASE_URL}/textsearch/json`, {
      params: {
        ...params,
        ...(pageToken ? { pagetoken: pageToken } : {}),
      },
    });

    if (res.data?.results?.length) {
      results.push(...res.data.results);
    }

    pageToken = res.data?.next_page_token;
    if (!pageToken) break;

    // Google requires a short delay before the next page token becomes valid.
    await sleep(2000);
  }

  return results.slice(0, pageLimit);
}

export async function getPlaceDetails(placeId: string) {
  if (!API_KEY) throw new Error('Missing Google Places API key');
  const res = await axios.get(`${BASE_URL}/details/json`, {
    params: {
      place_id: placeId,
      key: API_KEY,
      fields: 'name,rating,formatted_address,geometry,opening_hours,price_level,photos,reviews,website',
    },
  });
  return res.data.result;
}
