import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCached } from '../../lib/services/cacheService';
import { scrapeRedditTips, scrapeJapanGuideChecklist } from '../../lib/services/guideScraperService';

const guideData: Record<string, { tips: string[]; checklist: string[]; mistakes: string[] }> = {
  Tokyo: {
    tips: [
      'Get a Suica/Pasmo card for easy transit.',
      'Visit Tsukiji Outer Market for fresh food.',
      'Explore neighborhoods like Shibuya, Shinjuku, and Asakusa.',
    ],
    checklist: [
      'Passport',
      'Cash (many places are cash-only)',
      'Transit card (Suica/Pasmo)',
      'Portable WiFi or SIM',
    ],
    mistakes: [
      'Not checking train schedules for last trains.',
      'Eating while walking (not common in Japan).',
      'Ignoring etiquette in shrines and temples.',
    ],
  },
  Osaka: {
    tips: [
      'Try street food in Dotonbori.',
      'Visit Osaka Castle and Universal Studios.',
      'Use Osaka Amazing Pass for attractions.',
    ],
    checklist: [
      'Comfortable walking shoes',
      'Cash and transit card',
      'Map of local food spots',
    ],
    mistakes: [
      'Missing out on local specialties like takoyaki.',
      'Not reserving tickets for popular attractions.',
      'Assuming all shops accept credit cards.',
    ],
  },
  Kyoto: {
    tips: [
      'Visit early to avoid crowds at temples.',
      'Rent a bike for easy sightseeing.',
      'Try matcha and local sweets.',
    ],
    checklist: [
      'Respectful clothing for temples',
      'Cash for entry fees',
      'Camera for scenic spots',
    ],
    mistakes: [
      'Rushing through historic sites.',
      'Not booking accommodation in advance.',
      'Ignoring local etiquette in tea houses.',
    ],
  },
  Sapporo: {
    tips: [
      'Try Sapporo ramen and local beer.',
      'Visit during the Snow Festival for unique sights.',
      'Explore nearby nature spots.',
    ],
    checklist: [
      'Warm clothing (especially in winter)',
      'Snow boots',
      'Travel insurance',
    ],
    mistakes: [
      'Underestimating cold weather.',
      'Not planning for snow delays.',
      'Missing out on local food.',
    ],
  },
  Fukuoka: {
    tips: [
      'Try Hakata ramen.',
      'Visit Ohori Park and local shrines.',
      'Explore yatai (street food stalls) at night.',
    ],
    checklist: [
      'Cash for food stalls',
      'Transit card',
      'List of local events',
    ],
    mistakes: [
      'Missing yatai experience.',
      'Not checking local event schedules.',
      'Assuming English is widely spoken.',
    ],
  },
};

  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || 'Tokyo';
  const cacheKey = `guide_${city}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }
  // Scrape tips and checklist, fallback to static
  let tips = await scrapeRedditTips(city);
  let checklist = await scrapeJapanGuideChecklist(city);
  const static = guideData[city] || guideData['Tokyo'];
  if (!tips.length) tips = static.tips;
  if (!checklist.length) checklist = static.checklist;
  const mistakes = static.mistakes;
  const data = { tips, checklist, mistakes };
  setCached(cacheKey, data, 1000 * 60 * 60); // 1 hour
  return NextResponse.json(data);
}
