import { NextRequest, NextResponse } from 'next/server';
import { fetchTrendingData } from '@/lib/services/trendingService';

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city') || 'Tokyo';
  const country = request.nextUrl.searchParams.get('country') || 'Japan';
  const limitParam = Number(request.nextUrl.searchParams.get('limitPerCategory') || '30');
  const limitPerCategory = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 30) : 30;

  if (!city) {
    return NextResponse.json(
      { error: 'City parameter is required' },
      { status: 400 }
    );
  }

  try {
    const trendingItems = await fetchTrendingData(city, country, limitPerCategory);
    return NextResponse.json(trendingItems);
  } catch (error) {
    console.error('Error in /api/trending:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending data' },
      { status: 500 }
    );
  }
}
