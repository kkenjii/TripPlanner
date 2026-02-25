import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCached } from '../../../lib/services/cacheService';
import { scrapeRedditTips, scrapeJapanGuideChecklist, fetchTravelStories, TravelTip, TravelStory } from '../../../lib/services/guideScraperService';

// Static travel tips with categories for fallback
const staticTips: Record<string, TravelTip[]> = {
  Tokyo: [
    { text: 'Get a Suica/Pasmo card for seamless transit - works nationwide', category: 'transport', source: 'static', upvotes: 0 },
    { text: 'Visit early morning (6-8 AM) to beat crowds at Senso-ji Temple', category: 'itinerary', source: 'static', upvotes: 0 },
    { text: 'Buy from konbini (convenience stores) - high quality products at 24/7 locations', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Visit teamLab Borderless for immersive digital art experience', category: 'itinerary', source: 'static', upvotes: 0 },
    { text: 'Enjoy karaoke culture - a must-do experience, cheap and fun', category: 'general', source: 'static', upvotes: 0 },
    { text: 'Do not tip aggressively - tipping is not expected and may be insulting', category: 'mistakes', source: 'static', upvotes: 0 },
    { text: 'Avoid eating while walking - considered rude in public spaces', category: 'mistakes', source: 'static', upvotes: 0 },
    { text: 'Suica/Pasmo card works nationwide on trains and at convenience stores', category: 'budget', source: 'static', upvotes: 0 },
    { text: 'Last trains run 11 PM-12 AM; plan evening transit accordingly', category: 'transport', source: 'static', upvotes: 0 },
    { text: 'Rush hours (7-9 AM, 5-7 PM) mean extremely crowded trains', category: 'transport', source: 'static', upvotes: 0 },
  ],
  Osaka: [
    { text: 'Dotonbori is food paradise - try takoyaki, okonomiyaki, and kushikatsu', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Use Osaka Amazing Pass for unlimited train rides + attraction discounts', category: 'budget', source: 'static', upvotes: 0 },
    { text: 'Visit at night when neon lights and food stalls come alive', category: 'itinerary', source: 'static', upvotes: 0 },
    { text: 'Avoid assuming all shops accept credit cards - many are cash only', category: 'mistakes', source: 'static', upvotes: 0 },
    { text: 'Explore Kuromon Market for fresh seafood and produce', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Consider Osaka Amazing Pass for better value on transport and attractions', category: 'budget', source: 'static', upvotes: 0 },
    { text: 'Do not miss Dotonbori - it\'s essential to the Osaka experience', category: 'general', source: 'static', upvotes: 0 },
    { text: 'Book Universal Studios Japan tickets in advance for better pricing', category: 'budget', source: 'static', upvotes: 0 },
    { text: 'Try kakigori (shaved ice) and takoyaki at street stalls', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Osaka people are more casual and friendly than Tokyo residents', category: 'general', source: 'static', upvotes: 0 },
  ],
  Kyoto: [
    { text: 'Arrive early (7-8 AM) to avoid crowds at famous temples', category: 'itinerary', source: 'static', upvotes: 0 },
    { text: 'Rent a bicycle for best way to explore - cheap and flexible', category: 'transport', source: 'static', upvotes: 0 },
    { text: 'Visit Fushimi Inari at dawn for thousands of red torii gates mostly alone', category: 'itinerary', source: 'static', upvotes: 0 },
    { text: 'Do not treat Arashiyama bamboo grove as quick stop - go very early or late', category: 'mistakes', source: 'static', upvotes: 0 },
    { text: 'Try Kyoto vegetarian Buddhist cuisine (shojin ryori) for unique experience', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Avoid rushing through temples - take time to appreciate the craftsmanship', category: 'mistakes', source: 'static', upvotes: 0 },
    { text: 'Book ryokan accommodation 2+ months in advance, especially in spring', category: 'budget', source: 'static', upvotes: 0 },
    { text: 'Bicycle rental is perfect - cheap ¥1000/day and city is flat', category: 'transport', source: 'static', upvotes: 0 },
    { text: 'Philosopher\'s Path is peaceful canal walk with food stalls and scenic views', category: 'itinerary', source: 'static', upvotes: 0 },
    { text: 'Take tea ceremony class to learn traditional culture authentically', category: 'general', source: 'static', upvotes: 0 },
  ],
  Sapporo: [
    { text: 'Sapporo Ramen alley has 17 small ramen shops - try multiple for comparison', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Visit Sapporo Snow Festival (early Feb) for unique winter experience', category: 'itinerary', source: 'static', upvotes: 0 },
    { text: 'Avoid underestimating cold weather - winter can be -5 to -10°C', category: 'mistakes', source: 'static', upvotes: 0 },
    { text: 'Enjoy fresh seafood from Hokkaido: scallops, sea urchin, crab', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Do not plan for snow delays and road closures in winter', category: 'mistakes', source: 'static', upvotes: 0 },
    { text: 'Wear insulated boots and waterproof gloves in winter months', category: 'mistakes', source: 'static', upvotes: 0 },
    { text: 'Book Snow Festival accommodations months ahead - gets fully booked', category: 'budget', source: 'static', upvotes: 0 },
    { text: 'Try miso butter corn and Jaga pokkuru (fried potatoes) - local specialties', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Hot springs nearby in Noboribetsu and Jigokudani offer winter relaxation', category: 'general', source: 'static', upvotes: 0 },
    { text: 'Odori Park is beautiful year-round for walking and seasonal activities', category: 'itinerary', source: 'static', upvotes: 0 },
  ],
  Fukuoka: [
    { text: 'Yatai (street food stalls) are the soul of Fukuoka - go at night', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Hakata ramen famous for thin noodles and rich tonkotsu broth', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Try Mentaiko (spicy cod roe) - local specialty worth experiencing', category: 'food', source: 'static', upvotes: 0 },
    { text: 'Do not miss yatai experience - it\'s essential to Fukuoka identity', category: 'mistakes', source: 'static', upvotes: 0 },
    { text: 'Explore Nakasu Island now trendy area with modern restaurants', category: 'itinerary', source: 'static', upvotes: 0 },
    { text: 'Take day trip to Dazaifu for Tenjin Shrine (30 min by train)', category: 'itinerary', source: 'static', upvotes: 0 },
    { text: 'Cash required for yatai stalls - they don\'t accept credit cards', category: 'budget', source: 'static', upvotes: 0 },
    { text: 'Sugoca IC card works across Fukuoka buses/trains', category: 'transport', source: 'static', upvotes: 0 },
    { text: 'Avoid assuming English is widely spoken - less common than major cities', category: 'mistakes', source: 'static', upvotes: 0 },
    { text: 'Fukuoka is gateway to Kyushu - explore other regional cities nearby', category: 'general', source: 'static', upvotes: 0 },
  ],
};

const guideData: Record<string, { checklist: string[]; mistakes: string[]; transportation: string[]; bestTime: string[] }> = {
  Tokyo: {
    checklist: [
      'Passport (must be valid for 6+ months)',
      'Mix of Yen cash and credit cards',
      'Suica/Pasmo IC card for transit',
      'Pocket WiFi rental or local SIM card',
      'Comfortable walking shoes',
      'Japan Rail Pass (if visiting multiple cities)',
      'Travel insurance',
      'Portable phone charger',
    ],
    mistakes: [
      'Tipping aggressively (tipping is not expected)',
      'Eating while walking (considered rude)',
      'Ignoring temple and shrine etiquette',
      'Not checking train schedules for last trains',
      'Paying with large denominations at small shops',
    ],
    transportation: [
      'JR Yamanote Loop connects major areas of Tokyo',
      'Tokyo Metro has 13 lines - English signage helpful',
      'Taxis are expensive; prefer trains and buses',
      'IC card (Suica/Pasmo) simplifies all transit',
    ],
    bestTime: [
      'Spring (Mar-May): Cherry blossoms, mild weather',
      'Fall (Sep-Nov): Comfortable temps, clear skies',
      'Avoid: Winter (crowded), Summer (hot/humid)',
    ],
  },
  Osaka: {
    checklist: ['Comfortable walking shoes for food tours', 'Cash for street food and small vendors', 'Osaka Amazing Pass', 'Transit card (ICOCA)'],
    mistakes: ['Assuming all shops accept credit cards', 'Not booking attractions in advance'],
    transportation: ['Shinkansen: 2.5-3 hours from Tokyo', 'Osaka subway is easy with English signage'],
    bestTime: ['Spring (Apr-May): Cherry blossoms', 'Fall (Oct-Nov): Perfect temperatures'],
  },
  Kyoto: {
    checklist: ['Respectful clothing for temples', 'Cash for temple entry fees', 'Comfortable walking shoes'],
    mistakes: ['Rushing through historic sites', 'Not booking 2+ months in advance'],
    transportation: ['Bicycle rental perfect for city', 'Buses cover most attractions'],
    bestTime: ['Spring (late Mar-Apr): Cherry blossoms', 'Fall (Oct-Nov): Autumn leaves'],
  },
  Sapporo: {
    checklist: ['Heavy winter clothing', 'Insulated snow boots', 'Thermal underwear'],
    mistakes: ['Underestimating cold weather', 'Not planning for snow delays'],
    transportation: ['Sapporo Subway (3 lines) primary transit', 'SAPICA card works region-wide'],
    bestTime: ['Winter (Dec-Feb): Snow Festival', 'Summer (Jul-Aug): Perfect weather'],
  },
  Fukuoka: {
    checklist: ['Cash for food stalls', 'Transit card (Sugoca)', 'Comfortable shoes for exploring'],
    mistakes: ['Missing yatai experience', 'Assuming English is widely spoken'],
    transportation: ['Fukuoka Airport close to city center', 'Sugoca card works on buses/trains'],
    bestTime: ['Fall (Sep-Nov): Clear weather', 'Spring (Mar-May): Cherry blossoms'],
  },
};

const COMMON_MISTAKES_TO_AVOID = [
  'Don’t rely only on credit cards — many small restaurants and shops are cash-only',
  'Don’t miss the last train (~midnight) — taxis are extremely expensive late at night',
  'Don’t assume restaurants stay open late — many close early outside major areas',
  'Don’t overpack your itinerary — rushing between places reduces your actual experience',
  'Don’t bring large luggage on trains — it’s difficult to navigate stations and crowds',
  'Don’t expect public trash bins — carry a small bag for your trash',
  'Don’t forget a reusable shopping bag — plastic bags are not always free',
  'Don’t wait too long to book hotels — prices increase and options disappear quickly',
  'Don’t rely 100% on Google Maps — double-check train platforms and exits',
  'Don’t wear uncomfortable clothes — you will walk A LOT every day',
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || 'Tokyo';
  const country = searchParams.get('country') || 'Japan';
  const cacheKey = `guide_v4_${country}_${city}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const staticGuideData = guideData[city] || guideData['Tokyo'];
  const staticTipsList = staticTips[city] || staticTips['Tokyo'];

  // Attempt to scrape fresh tips from Reddit (with fallback to static)
  let redditTips = await scrapeRedditTips(city);
  let scrapedChecklist = await scrapeJapanGuideChecklist(city);
  let stories: TravelStory[] = [];

  try {
    stories = await fetchTravelStories(country, city);
  } catch {
    stories = [];
  }

  // Use Reddit tips if available, otherwise use static tips
  const tips = redditTips && redditTips.length > 0 ? redditTips : staticTipsList;
  const checklist = scrapedChecklist && scrapedChecklist.length > 0 ? scrapedChecklist : staticGuideData.checklist;

  const data = {
    tips,
    checklist,
    stories,
    mistakes: COMMON_MISTAKES_TO_AVOID,
    transportation: staticGuideData.transportation,
    bestTime: staticGuideData.bestTime,
  };

  setCached(cacheKey, data, 1000 * 60 * 60); // 1 hour cache
  return NextResponse.json(data);
}
