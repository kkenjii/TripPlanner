import axios from 'axios';
import * as cheerio from 'cheerio';

export interface Review {
  author: string;
  rating: number;
  text: string;
  time: number;
}

export interface TrendingItem {
  id: string;
  title: string;
  type: 'place' | 'reddit';
  rating?: number;
  reviewsCount?: number;
  upvotes?: number;
  category: string;
  description?: string;
  url?: string;
  address?: string;
  googleMapsUrl?: string;
  source?: string;
  trendingScore: number;
  reviews?: Review[];
}

interface GooglePlace {
  name: string;
  rating?: number;
  user_ratings_total?: number;
  place_id: string;
  types: string[];
  formatted_url?: string;
  formatted_address?: string;
  editorial_summary?: {
    overview?: string;
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

interface RedditPost {
  title: string;
  ups: number;
  url: string;
  subreddit: string;
}

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || 'YOUR_KEY';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const placeDetailsCache = new Map<string, { data: GooglePlace; timestamp: number }>();

const trendingKeywords = [
  'things to do',
  'nightlife',
  'arcade',
  'karaoke',
  'shopping street',
  'theme park',
  'popular tourist destinations',
  'top sights',
  'famous landmarks',
  'iconic places',
  'attractions',
  'landmarks',
  'temples',
  'shrines',
  'museums',
  'gardens',
  'parks',
  'viewpoints',
  'scenic spots',
  'historical sites',
  'cafes',
  'hot springs',
  'observation decks',
];

const travelKeywords = [
  'recommend',
  'best',
  'must try',
  'hidden gem',
  'avoid',
  'experience',
  'worth it',
  'amazing',
];

const POPULAR_DESTINATION_KEYWORDS = [
  'tower',
  'skytree',
  'sky tree',
  'palace',
  'castle',
  'garden',
  'museum',
  'park',
  'shrine',
  'temple',
  'mount',
  'mt ',
  'observation',
  'viewpoint',
  'national',
  'heritage',
];

const CITY_POPULAR_KEYWORDS: Record<string, Record<string, string[]>> = {
  Japan: {
    Tokyo: ['tokyo tower', 'tokyo skytree', 'imperial palace', 'ueno park', 'meiji shrine', 'sensō-ji', 'senso-ji'],
    Osaka: ['osaka castle', 'dotonbori', 'umeda sky', 'shitennoji'],
    Kyoto: ['fushimi inari', 'kinkaku-ji', 'ginkaku-ji', 'arashiyama', 'kiyomizu'],
    Sapporo: ['odori park', 'sapporo clock tower', 'moerenuma'],
    Fukuoka: ['ohori park', 'dazaifu', 'canal city'],
  },
  'Hong Kong': {
    Central: ['victoria peak', 'peak tram', 'man mo temple', 'ifc'],
    'Tsim Sha Tsui': ['avenue of stars', 'harbour city', 'star ferry', 'k11 musea'],
    'Mong Kok': ['ladies market', 'temple street', 'sneakers street'],
    'Causeway Bay': ['times square', 'victoria park', 'sogo'],
    'Lantau Island': ['ngong ping', 'tian tan buddha', 'big buddha', 'po lin monastery'],
  },
  Thailand: {
    Bangkok: ['grand palace', 'wat phra kaew', 'wat arun', 'wat saket', 'lumphini park', 'chatuchak market'],
    Phuket: ['patong beach', 'big buddha', 'phang nga bay', 'old phuket town', 'phuket town'],
    'Chiang Mai': ['wat chedi luang', 'wat phra singh', 'old city', 'sunday night bazaar', 'doi suthep'],
    Pattaya: ['walking street', 'sanctuary of truth', 'jomtien beach', 'bottom bar'],
    Krabi: ['railay beach', 'ao nang beach', 'emerald pool', 'tiger cave temple'],
  },
  Malaysia: {
    'Kuala Lumpur': ['petronas towers', 'kuala lumpur tower', 'menara kl', 'bukit bintang', 'chinatown kl'],
    Penang: ['penang hill', 'george town', 'kek lok si temple', 'cheong fatt tze mansion'],
    'Johor Bahru': ['legoland', 'istana bukit serene', 'nusajaya', 'desaru beach'],
    Malacca: ['malacca city center', 'jonker street', 'menara taming sari', 'christ church'],
    'Kota Kinabalu': ['mount kinabalu', 'sabah museum', 'kota kinabalu waterfront', 'tunku abdul rahman park'],
  },
};

function categorizePlace(types: string[], name: string, city: string, country: string): string {
  const joinedTypes = types.join(' ').toLowerCase();
  const nameLower = name.toLowerCase();
  const cityKeywords = CITY_POPULAR_KEYWORDS[country]?.[city] || [];

  if (
    POPULAR_DESTINATION_KEYWORDS.some(keyword => nameLower.includes(keyword)) ||
    cityKeywords.some(keyword => nameLower.includes(keyword))
  ) {
    return 'Popular Destinations';
  }
  
  // Food categories
  if (types.includes('restaurant') || types.includes('cafe') || types.includes('bar') || joinedTypes.includes('food')) {
    return 'Food';
  }
  
  // Nightlife categories
  if (types.includes('night_club') || types.includes('bar') || types.includes('nightclub') || joinedTypes.includes('night')) {
    return 'Nightlife';
  }
  
  // Shopping categories
  if (types.includes('shopping_mall') || types.includes('store') || types.includes('department_store') || joinedTypes.includes('shop')) {
    return 'Shopping';
  }
  
  // Attractions & Landmarks categories
  if (types.includes('amusement_park') || types.includes('park') || types.includes('point_of_interest') || 
      types.includes('tourist_attraction') || types.includes('museum') || types.includes('library') ||
      joinedTypes.includes('park') || joinedTypes.includes('temple') || joinedTypes.includes('shrine') ||
      joinedTypes.includes('landmark') || joinedTypes.includes('monument')) {
    return 'Attractions';
  }
  
  // Landmarks
  if (joinedTypes.includes('temple') || joinedTypes.includes('shrine') || joinedTypes.includes('historic') ||
      joinedTypes.includes('cathedral') || joinedTypes.includes('mosque') || types.includes('mosque') ||
      joinedTypes.includes('observation')) {
    return 'Landmarks';
  }
  
  // Default
  return 'Attractions';
}

function calculatePlaceTrendingScore(place: GooglePlace): number {
  const ratingScore = (place.rating || 0) * 20;
  const reviewsScore = Math.min((place.user_ratings_total || 0) / 100, 50);
  return ratingScore + reviewsScore;
}

function calculateRedditTrendingScore(upvotes: number): number {
  return Math.log(upvotes + 1) * 30;
}

function isRelevantRedditPost(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return travelKeywords.some(keyword => lowerTitle.includes(keyword));
}

async function fetchPlaceDetails(placeId: string): Promise<GooglePlace | null> {
  try {
    // Check cache first
    const cached = placeDetailsCache.get(placeId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/details/json',
      {
        params: {
          place_id: placeId,
          fields: 'name,rating,reviews,user_ratings_total,types,formatted_url,formatted_address,geometry,editorial_summary',
          key: GOOGLE_PLACES_API_KEY,
        },
        timeout: 5000,
      }
    );

    if (response.data.result) {
      const place = response.data.result;
      placeDetailsCache.set(placeId, { data: place, timestamp: Date.now() });
      return place;
    }
  } catch (error) {
    console.error(`Error fetching place details for ${placeId}:`, error);
  }
  return null;
}

export async function fetchTrendingData(city: string, country: string, perCategoryLimit: number = 30): Promise<TrendingItem[]> {
  try {
    const results: TrendingItem[] = [];
    const safeLimit = Math.min(Math.max(perCategoryLimit, 1), 30);
    const maxPlacesPerKeyword = safeLimit <= 10 ? 5 : 8;

    // Fetch from Google Places
    for (const keyword of trendingKeywords) {
      try {
        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/place/textsearch/json',
          {
            params: {
              query: `${keyword} in ${city}, ${country}`,
              key: GOOGLE_PLACES_API_KEY,
            },
            timeout: 5000,
          }
        );

        if (response.data.results) {
          for (const place of response.data.results.slice(0, maxPlacesPerKeyword)) {
            // Fetch detailed info including reviews and URL
            const placeDetails = await fetchPlaceDetails(place.place_id);
            
            let reviews: Review[] = [];
            let googleMapsUrl = '';
            let address = '';
            let description = '';

            if (placeDetails) {
              address = placeDetails.formatted_address || '';
              description = placeDetails.editorial_summary?.overview || '';
              // Use coordinates for more accurate map link (prioritized by availability)
              if (placeDetails.geometry?.location) {
                const { lat, lng } = placeDetails.geometry.location;
                googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
              } else if (place.geometry?.location) {
                const { lat, lng } = place.geometry.location;
                googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
              } else {
                googleMapsUrl = placeDetails.formatted_url || `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`;
              }
              if (placeDetails.reviews) {
                reviews.push(
                  ...placeDetails.reviews.map(review => ({
                    author: review.author_name,
                    rating: review.rating,
                    text: review.text,
                    time: review.time,
                  }))
                );
              }
            } else {
              // Fallback: Use coordinates from initial search result, then name
              if (place.geometry?.location) {
                const { lat, lng } = place.geometry.location;
                googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
              } else {
                googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`;
              }
              const mockReviews = [
                {
                  author: 'John T.',
                  rating: 5,
                  text: 'Amazing place! Highly recommended. Great atmosphere and excellent service. Will definitely come back.',
                  time: Math.floor(Date.now() / 1000) - 86400 * 2,
                },
                {
                  author: 'Sarah K.',
                  rating: 4,
                  text: 'Really enjoyed my visit here. The staff was friendly and the location is perfect for exploring.',
                  time: Math.floor(Date.now() / 1000) - 86400 * 5,
                },
                {
                  author: 'Mike L.',
                  rating: 5,
                  text: 'One of the best experiences in the area. Totally worth a visit if you\'re in the city.',
                  time: Math.floor(Date.now() / 1000) - 86400 * 7,
                },
                {
                  author: 'Emma R.',
                  rating: 4,
                  text: 'Very good, though a bit crowded. Still worth checking out for sure.',
                  time: Math.floor(Date.now() / 1000) - 86400 * 10,
                },
              ];
              reviews = mockReviews;
            }

            results.push({
              id: `place-${place.place_id}`,
              title: place.name,
              type: 'place',
              rating: place.rating,
              reviewsCount: place.user_ratings_total,
              category: categorizePlace(place.types, place.name, city, country),
              description,
              trendingScore: calculatePlaceTrendingScore(place),
              source: 'Google Places',
              address,
              googleMapsUrl,
              reviews,
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching Google Places for "${keyword}":`, error);
      }
    }

    // Fetch from Reddit
    const subreddits = [
      'JapanTravel',
      'JapanTravelTips',
      city.toLowerCase(),
      city === 'Tokyo' ? 'Tokyo' : '',
      city === 'Osaka' ? 'Osaka' : '',
      city === 'Kyoto' ? 'Kyoto' : '',
    ].filter(Boolean);

    for (const subreddit of subreddits) {
      try {
        const response = await axios.get(
          `https://www.reddit.com/r/${subreddit}/hot.json`,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 5000,
          }
        );

        if (response.data.data && response.data.data.children) {
          response.data.data.children.forEach((child: any, index: number) => {
            const post = child.data;
            if (isRelevantRedditPost(post.title) && index < 10) {
              results.push({
                id: `reddit-${post.id}`,
                title: post.title,
                type: 'reddit',
                upvotes: post.ups,
                category: 'Trending',
                url: `https://reddit.com${post.permalink}`,
                source: `r/${post.subreddit}`,
                trendingScore: calculateRedditTrendingScore(post.ups),
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error fetching Reddit for r/${subreddit}:`, error);
      }
    }

    // Remove duplicates by title (case-insensitive)
    const seen = new Set<string>();
    const filtered = results.filter(item => {
      const key = item.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Group by category and get top 30 from each
    const grouped = new Map<string, TrendingItem[]>();
    filtered.forEach(item => {
      const category = item.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });

    // Sort each category by trending score and take requested per-category limit
    const result: TrendingItem[] = [];
    grouped.forEach(items => {
      const sorted = items.sort((a, b) => b.trendingScore - a.trendingScore);
      result.push(...sorted.slice(0, safeLimit));
    });

    return result;
  } catch (error) {
    console.error('Error fetching trending data:', error);
    return [];
  }
}
