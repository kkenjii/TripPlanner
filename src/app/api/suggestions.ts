import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCached } from '../../lib/services/cacheService';
import { fetchDoorkeeperEvents } from '../../lib/services/doorkeeperService';
import { mapDoorkeeperEvent, Event } from '../../lib/mappers/eventMapper';
import { searchFoodPlaces, getPlaceDetails } from '../../lib/services/googlePlacesService';
import { mapGooglePlaceToFood } from '../../lib/mappers/foodMapper';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || 'Tokyo';
  const country = searchParams.get('country') || 'Japan';
  const cacheKey = `suggestions_${country}_${city}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ suggestions: cached });
  }
  try {
    // Fetch events and filter for today
    const doorkeeperRaw = await fetchDoorkeeperEvents(city);
    const events = doorkeeperRaw.map(mapDoorkeeperEvent);
    const today = new Date().toISOString().slice(0, 10);
    const todaysEvents = events.filter((e: Event) => e.date.startsWith(today));

    // Fetch top-rated food places
    const places = await searchFoodPlaces(city, country);
    const detailed = await Promise.all(
      places.slice(0, 5).map(async (place: any) => {
        const details = await getPlaceDetails(place.place_id);
        return mapGooglePlaceToFood(details);
      })
    );
    const topFood = detailed.sort((a, b) => b.rating - a.rating).slice(0, 3);

    // Normalize to Suggestion objects
    const suggestions = [
      ...todaysEvents.map((e: Event) => ({
        id: e.id,
        type: 'event',
        title: e.title,
        subtitle: e.location,
        date: e.date,
        reviews: e.reviews,
      })),
      ...topFood.map(f => ({
        id: f.id,
        type: 'food',
        title: f.name,
        subtitle: f.address,
        rating: f.rating,
        reviews: f.reviews,
      })),
    ];
    // Sort by rating or date
    suggestions.sort((a, b) => {
      if (a.rating && b.rating) return b.rating - a.rating;
      if (a.date && b.date) return b.date.localeCompare(a.date);
      return 0;
    });
    setCached(cacheKey, suggestions, 1000 * 60 * 10); // 10 minutes
    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Suggestions API error:', error.message);
    const fallbackSuggestions = [
      {
        id: '1',
        type: 'event' as const,
        title: 'Check out local events in ' + city,
        subtitle: 'Sample event',
      },
      {
        id: '2',
        type: 'food' as const,
        title: 'Try local cuisine',
        subtitle: 'Sample restaurant',
        rating: 4.5,
      },
    ];
    setCached(cacheKey, fallbackSuggestions, 1000 * 60 * 10);
    return NextResponse.json({ suggestions: fallbackSuggestions });
  }
}
