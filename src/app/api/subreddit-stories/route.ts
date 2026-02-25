import { fetchStoriesFromSubreddit } from '@/lib/services/guideScraperService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get('subreddit');
  const country = searchParams.get('country');
  const city = searchParams.get('city');

  if (!subreddit || !country || !city) {
    return Response.json(
      { error: 'Missing subreddit, country, or city parameter' },
      { status: 400 }
    );
  }

  try {
    const stories = await fetchStoriesFromSubreddit(subreddit, country, city);
    return Response.json({ stories, subreddit }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/subreddit-stories:', error);
    return Response.json(
      { error: 'Failed to fetch stories' },
      { status: 500 }
    );
  }
}
