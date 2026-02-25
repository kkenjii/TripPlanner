import { NextRequest, NextResponse } from 'next/server';
import { fetchDoorkeeperEvents } from '../../../lib/services/doorkeeperService';
import { mapDoorkeeperEvent, Event } from '../../../lib/mappers/eventMapper';
import { getCached, setCached } from '../../../lib/services/cacheService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || 'Tokyo';
  const cacheKey = `events_${city}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ events: cached });
  }
  try {
    const doorkeeperRaw = await fetchDoorkeeperEvents(city);
    const events: Event[] = (Array.isArray(doorkeeperRaw) ? doorkeeperRaw : doorkeeperRaw.events || []).map(mapDoorkeeperEvent);
    setCached(cacheKey, events, 1000 * 60 * 10);
    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Events API error:', error.message);
    // Return fallback data
    const fallbackEvents: Event[] = [
      {
        id: '1',
        title: 'Sample Event in ' + city,
        description: 'This is a placeholder event',
        date: new Date().toISOString(),
        location: city,
        city,
        source: 'doorkeeper',
      },
    ];
    setCached(cacheKey, fallbackEvents, 1000 * 60 * 10);
    return NextResponse.json({ events: fallbackEvents });
  }
}
