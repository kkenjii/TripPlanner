import axios from 'axios';
import * as cheerio from 'cheerio';

export interface TravelTip {
  text: string;
  category: 'food' | 'transport' | 'itinerary' | 'budget' | 'mistakes' | 'general';
  source: 'reddit' | 'static';
  upvotes: number;
}

export interface TravelStory {
  id: string;
  title: string;
  subreddit: string;
  upvotes: number;
  comments: number;
  created: number;
  url: string;
}

// Keyword lists for filtering and categorization
const TRAVEL_INCLUDE_KEYWORDS = [
  'tip', 'advice', 'recommend', 'avoid', 'mistake', 'don\'t',
  'itinerary', 'budget', 'food', 'transport', 'hotel', 'accommodation',
  'first time', 'guide', 'experience', 'visit', 'best', 'better',
  'trick', 'secret', 'hidden', 'worth', 'must', 'essential'
];

const TRAVEL_EXCLUDE_KEYWORDS = [
  'photo', 'picture', 'image', 'meme', 'joke',
  'politics', 'news', 'caught', 'affair', 'scandal',
  'relationship', 'dating', 'reddit meetup'
];

const STORY_INCLUDE_KEYWORDS = [
  'trip',
  'itinerary',
  'experience',
  'recommend',
  'first time',
  'travel',
];

const STORY_EXCLUDE_KEYWORDS = [
  'moving to japan',
  'job',
  'visa question',
  'anime',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['food', 'eat', 'restaurant', 'ramen', 'sushi', 'meal', 'cuisine', 'café', 'coffee', 'drink', 'taste', 'flavor'],
  transport: ['train', 'bus', 'transport', 'taxi', 'subway', 'metro', 'rail', 'ticket', 'suica', 'ic card', 'walk', 'bike'],
  itinerary: ['itinerary', 'day trip', 'planning', 'schedule', 'visit', 'explore', 'route', 'circuit', 'order', 'when'],
  budget: ['budget', 'cost', 'expensive', 'cheap', 'price', 'money', 'save', 'value', 'discount', 'pass', 'free'],
  mistakes: ['avoid', 'don\'t', 'mistake', 'wrong', 'learned', 'regret', 'wish', 'not', 'don\'t waste', 'trap'],
  general: []
};

// Check if post is travel-related with strict quality rules
function isRelevantTravelPost(title: string, selftext?: string): boolean {
  const fullText = `${title} ${selftext || ''}`.toLowerCase();
  
  // Reject questions (ends with ?)
  if (title.trim().endsWith('?')) {
    return false;
  }
  
  // Reject too short posts (< 8 words)
  const wordCount = title.split(/\s+/).length;
  if (wordCount < 8) {
    return false;
  }
  
  // Reject posts without verbs (basic check)
  const commonVerbs = [
    'is', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did',
    'avoid', 'try', 'visit', 'go', 'take', 'use', 'get', 'book', 'stay',
    'eat', 'visit', 'explore', 'skip', 'miss', 'recommend', 'suggest',
    'don\'t', 'shouldn\'t', 'must', 'should', 'consider', 'check', 'bring'
  ];
  const hasVerb = commonVerbs.some(v => fullText.includes(` ${v} `) || fullText.includes(` ${v} `));
  if (!hasVerb) {
    return false;
  }
  
  // Reject common non-tips
  const excludePatterns = ['rate my', 'photo', 'picture', 'image', 'meme', 'story of', 'experience of'];
  if (excludePatterns.some(p => fullText.includes(p))) {
    return false;
  }
  
  // Must contain at least one inclusion keyword
  const hasInclusionKeyword = TRAVEL_INCLUDE_KEYWORDS.some(kw => fullText.includes(kw));
  
  // Must not contain exclusion keywords
  const hasExclusionKeyword = TRAVEL_EXCLUDE_KEYWORDS.some(kw => fullText.includes(kw));
  
  return hasInclusionKeyword && !hasExclusionKeyword;
}

// Categorize a tip based on its content
function categorizeTip(text: string): 'food' | 'transport' | 'itinerary' | 'budget' | 'mistakes' | 'general' {
  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return category as any;
    }
  }
  
  return 'general';
}

// Transform raw Reddit title into actionable tip with quality validation
function transformToActionableTip(title: string, category: string): string | null {
  // Remove common Reddit artifacts
  let tip = title
    .replace(/^(LPT|PSA|TIL|TRAVEL TIP|GUIDE|ADVICE|QUESTION|DAILY THREAD):\s*/, '')
    .replace(/\[.*?\]\s*/g, '')
    .replace(/^JP\s*/, '')
    .trim();
  
  // Reject incomplete/nonsensical phrases
  if (tip.match(/^(for those.*|if you.*|anyone who.*|does anyone know|has anyone|can someone)/i)) {
    return null;
  }
  
  // Transform common patterns into actionable advice
  const patterns: Array<[RegExp, string]> = [
    // "Don't X" → "Avoid X"
    [/^don't\s+(.+)$/i, 'Avoid $1'],
    [/^do not\s+(.+)$/i, 'Do not $1'],
    
    // "X is not Y" → "Do not treat X as Y"
    [/^(.+?)\s+is\s+not\s+(.+)$/i, 'Do not treat $1 as $2; plan accordingly'],
    
    // "X is a trap" → Clear warning
    [/^(.+?)\s+is\s+(a|the).*trap/i, '$1 is a common tourist trap; consider alternatives instead'],
    
    // "X is overrated" → "X may not be necessary"
    [/^(.+?)\s+is\s+overrated$/i, '$1 may not be worth the hype; consider your preferences'],
    
    // "Best X" → Clear recommendation
    [/^best\s+(.+?)(?:\s+in\s+.+)?$/i, 'For the best $1, explore less touristy neighborhoods'],
    
    // "Try X" → Recommendation
    [/^(?:must\s+)?try\s+(.+)$/i, 'Try $1 if you have the opportunity; it is worth experiencing'],
    
    // "X worth/worth Y" → Value proposition
    [/^(.+?)\s+is\s+worth\s+(.+)$/i, '$1 is worth $2; budget accordingly'],
    
    // "Cheap/Budget X" → Budget tip
    [/^(?:cheap|budget)\s+(.+)$/i, 'For budget options on $1, research local alternatives first'],
    
    // Conditional statements
    [/^if\s+(.+?),\s+(.+)$/i, '$2, especially if $1'],
    
    // "X is better than Y"
    [/^(.+?)\s+is\s+better\s+than\s+(.+)$/i, 'Prefer $1 over $2 for a better experience and value'],
  ];
  
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(tip)) {
      tip = tip.replace(pattern, replacement);
      break;
    }
  }
  
  // If no pattern matched, capitalize and add period
  tip = tip.charAt(0).toUpperCase() + tip.slice(1);
  
  // Ensure it's a full sentence
  if (!tip.endsWith('.') && !tip.endsWith('!')) {
    tip += '.';
  }
  
  // Verify quality: complete sentence, has value
  const sentences = tip.split(/[.!?]/);
  const mainSentence = sentences[0].trim();
  
  if (mainSentence.length < 15 || mainSentence.length > 250) {
    return null; // Invalid length
  }
  
  // Must contain actionable words
  const actionWords = ['avoid', 'try', 'use', 'visit', 'book', 'stay', 'eat', 'consider', 'prefer', 'do', 'go', 'take', 'explore', 'skip', 'bring', 'must', 'should', 'don\'t', 'not'];
  const hasAction = actionWords.some(w => mainSentence.toLowerCase().includes(w));
  if (!hasAction) {
    return null;
  }
  
  return tip.substring(0, 220); // Max 220 chars
}

// Deduplicate similar tips using advanced similarity check
function deduplicateTips(tips: TravelTip[]): TravelTip[] {
  const seen: Set<string> = new Set();
  const deduped: TravelTip[] = [];
  
  for (const tip of tips) {
    // Create a normalized version for comparison
    const normalized = tip.text
      .toLowerCase()
      .replace(/[.,!?;:]/g, '')
      .replace(/[don't don\'t]/g, 'dont')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract key phrases (first meaningful words)
    const keyPhrase = normalized.split(' ').slice(0, 8).join(' ');
    
    // Check if similar tip already exists
    let isDuplicate = false;
    for (const seenPhrase of seen) {
      // Calculate simple similarity (Levenshtein-ish)
      if (calculateSimilarity(keyPhrase, seenPhrase) > 0.75) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.add(keyPhrase);
      deduped.push(tip);
    }
  }
  
  return deduped;
}

// Calculate string similarity (simple Levenshtein distance)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Calculate edit distance between two strings
function getEditDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[.,!?;:()\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isStoryCandidate(title: string, over18: boolean, subreddit: string, country?: string): boolean {
  const lowerTitle = title.toLowerCase();
  if (over18) return false;
  if (title.trim().endsWith('?')) return false;
  if (STORY_EXCLUDE_KEYWORDS.some(kw => lowerTitle.includes(kw))) return false;
  if (TRAVEL_EXCLUDE_KEYWORDS.some(kw => lowerTitle.includes(kw))) return false;
  
  // Country keywords for validation
  const countryKeywords: Record<string, string[]> = {
    Japan: ['japan', 'tokyo', 'osaka', 'kyoto', 'sapporo', 'hiroshima'],
    'Hong Kong': ['hong kong', 'hk'],
    Thailand: ['thailand', 'bangkok', 'phuket', 'chiang mai', 'pattaya', 'krabi'],
    Malaysia: ['malaysia', 'kuala lumpur', 'kl', 'penang', 'johor bahru', 'malacca'],
  };
  
  // Generic subreddit list
  const genericSubreddits = ['travel', 'solotravel', 'travelhacks', 'traveladvice'];
  const isGenericSubreddit = genericSubreddits.includes(subreddit.toLowerCase());
  
  if (!country) {
    // Fallback: just require travel keywords if no country specified
    return STORY_INCLUDE_KEYWORDS.some(kw => lowerTitle.includes(kw));
  }
  
  // For ALL subreddits (both generic and country-specific), check country keywords
  const countryKeywordList = countryKeywords[country] || [];
  const hasCountryKeyword = countryKeywordList.some(kw => lowerTitle.includes(kw));
  
  if (isGenericSubreddit) {
    // For generic subreddits, require BOTH country keywords AND travel keywords
    const hasTravelKeyword = STORY_INCLUDE_KEYWORDS.some(kw => lowerTitle.includes(kw));
    return hasCountryKeyword && hasTravelKeyword;
  } else {
    // For country-specific subreddits, just require country keywords (more lenient)
    return hasCountryKeyword;
  }
}

export async function fetchTravelStories(country: string, city: string): Promise<TravelStory[]> {
  const subredditsByCountry: Record<string, string[]> = {
    Japan: ['JapanTravel', 'JapanTravelTips', 'solotravel', 'travelhacks', 'travel'],
    'Hong Kong': ['HongKong', 'solotravel', 'travelhacks', 'travel'],
    Thailand: ['Thailand', 'ThailandTourism', 'solotravel', 'travelhacks', 'travel'],
    Malaysia: ['Malaysia', 'MalaysiaTravel', 'solotravel', 'travelhacks', 'travel'],
  };
  const subreddits = subredditsByCountry[country] || ['travel', 'solotravel', 'travelhacks'];
  const stories: TravelStory[] = [];

  console.log(`[fetchTravelStories] Country: ${country}, Subreddits: ${subreddits.join(', ')}`);

  // Variable delay between requests (starts at 1 second, increases)
  let delayMs = 1000;

  for (const subreddit of subreddits) {
    // Add delay before each subreddit fetch to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, delayMs));
    delayMs = Math.min(delayMs + 500, 3000); // Gradually increase delay, max 3s

    // Fetch only top posts to reduce requests (single endpoint instead of 2)
    const endpoint = `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=5`;

    try {
      console.log(`[fetchTravelStories] Fetching from: ${endpoint}`);
      const { data } = await axios.get(endpoint, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000,
      });
      console.log(`[fetchTravelStories] SUCCESS - Got response from ${endpoint}`);

      if (data?.data?.children) {
        console.log(`[fetchTravelStories] Found ${data.data.children.length} posts from ${subreddit}`);
        data.data.children.forEach((child: any) => {
          const post = child.data;
          const title = post.title || '';
          if (!title) return;

          if (!isStoryCandidate(title, Boolean(post.over_18), subreddit, country)) {
            console.log(`[fetchTravelStories] Rejected: "${title.substring(0, 50)}..."`);
            return;
          }
          if ((post.score || 0) < 10) {
            console.log(`[fetchTravelStories] Low score (${post.score}): "${title.substring(0, 50)}..."`);
            return;
          }

          console.log(`[fetchTravelStories] Added story: "${title.substring(0, 50)}..."`);
          stories.push({
            id: post.id,
            title: post.title,
            subreddit: post.subreddit,
            upvotes: post.score || 0,
            comments: post.num_comments || 0,
            created: post.created_utc || 0,
            url: `https://reddit.com${post.permalink}`,
          });
        });
      } else {
        console.error(`[fetchTravelStories] Unexpected response structure from ${endpoint}`);
        console.error(`[fetchTravelStories] Response keys:`, Object.keys(data || {}));
        console.error(`[fetchTravelStories] Full response:`, JSON.stringify(data).substring(0, 500));
      }
    } catch (err: any) {
      console.error(`\n========== [fetchTravelStories] FULL ERROR START ==========`);
      console.error(`[fetchTravelStories] Endpoint: ${endpoint}`);
      console.error(`[fetchTravelStories] Error Type: ${err?.name}`);
      console.error(`[fetchTravelStories] Error Message: ${err?.message}`);
      console.error(`[fetchTravelStories] Error Code: ${err?.code}`);
      
      if (err?.response) {
        console.error(`[fetchTravelStories] ==== RESPONSE ERROR ====`);
        console.error(`[fetchTravelStories] Response Status: ${err.response.status}`);
        console.error(`[fetchTravelStories] Response Status Text: ${err.response.statusText}`);
        console.error(`[fetchTravelStories] Response Headers:`, JSON.stringify(err.response.headers));
        console.error(`[fetchTravelStories] Response Data:`, JSON.stringify(err.response.data).substring(0, 500));
      } else if (err?.request) {
        console.error(`[fetchTravelStories] ==== REQUEST ERROR ====`);
        console.error(`[fetchTravelStories] No response received from server`);
        console.error(`[fetchTravelStories] Request:`, err.request);
      } else {
        console.error(`[fetchTravelStories] ==== UNKNOWN ERROR ====`);
        console.error(`[fetchTravelStories] Full Error Object:`, err);
        console.error(`[fetchTravelStories] Stack Trace:`, err?.stack);
      }
      console.error(`========== [fetchTravelStories] FULL ERROR END ==========\n`);
      continue;
    }
  }

  console.log(`[fetchTravelStories] Total stories found: ${stories.length}`);
  return stories;
}

// Build search query based on country and city
function buildSearchQuery(country: string, city: string): string {
  const cityKeywordMap: Record<string, Record<string, string[]>> = {
    Japan: {
      Tokyo: ['tokyo', 'shibuya', 'shinjuku', 'asakusa'],
      Osaka: ['osaka', 'dotonbori', 'umeda'],
      Kyoto: ['kyoto', 'arashiyama', 'fushimi'],
      Sapporo: ['sapporo', 'hokkaido'],
      Hiroshima: ['hiroshima'],
    },
    'Hong Kong': {
      'Victoria Peak': ['victoria peak', 'hong kong'],
      'Central': ['central', 'hong kong'],
      'Mong Kok': ['mong kok', 'hong kong'],
      'Tsim Sha Tsui': ['tsim sha tsui', 'hong kong'],
      'Stanley': ['stanley', 'hong kong'],
    },
    Thailand: {
      Bangkok: ['bangkok', 'sukhumvit', 'silom'],
      Phuket: ['phuket', 'patong'],
      'Chiang Mai': ['chiang mai', 'old city'],
      Pattaya: ['pattaya'],
      Krabi: ['krabi', 'phi phi'],
    },
    Malaysia: {
      'Kuala Lumpur': ['kuala lumpur', 'kl', 'petronas'],
      Penang: ['penang', 'georgetown'],
      'Johor Bahru': ['johor bahru', 'jb'],
      Malacca: ['malacca', 'melaka'],
    },
  };

  const cityKeywords = cityKeywordMap[country]?.[city] || [city.toLowerCase()];
  return cityKeywords.join(' OR ');
}

// Fetch stories from a single subreddit (for progressive/streaming display)
export async function fetchStoriesFromSubreddit(subreddit: string, country: string, city: string): Promise<TravelStory[]> {
  const searchQuery = buildSearchQuery(country, city);
  const endpoint = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchQuery)}&restrict_sr=1&sort=top&t=week&limit=5`;
  const stories: TravelStory[] = [];

  try {
    console.log(`[fetchStoriesFromSubreddit] Fetching from: ${endpoint}`);
    const { data } = await axios.get(endpoint, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000,
    });
    console.log(`[fetchStoriesFromSubreddit] SUCCESS - Got response from ${endpoint}`);

    if (data?.data?.children) {
      console.log(`[fetchStoriesFromSubreddit] Found ${data.data.children.length} posts from ${subreddit}`);
      data.data.children.forEach((child: any) => {
        const post = child.data;
        const title = post.title || '';
        if (!title) return;

        if (!isStoryCandidate(title, Boolean(post.over_18), subreddit, country)) {
          console.log(`[fetchStoriesFromSubreddit] Rejected: "${title.substring(0, 50)}..."`);
          return;
        }
        if ((post.score || 0) < 10) {
          console.log(`[fetchStoriesFromSubreddit] Low score (${post.score}): "${title.substring(0, 50)}..."`);
          return;
        }

        console.log(`[fetchStoriesFromSubreddit] Added story: "${title.substring(0, 50)}..."`);
        stories.push({
          id: post.id,
          title: post.title,
          subreddit: post.subreddit,
          upvotes: post.score || 0,
          comments: post.num_comments || 0,
          created: post.created_utc || 0,
          url: `https://reddit.com${post.permalink}`,
        });
      });
    }
  } catch (err: any) {
    console.error(`[fetchStoriesFromSubreddit] Error from ${subreddit}:`, err?.message);
  }

  return stories;
}

// Fetch and process Reddit tips with full post data and strict quality filtering
export async function scrapeRedditTips(city: string): Promise<TravelTip[]> {
  const subreddits = ['JapanTravel', 'JapanTravelTips', 'Tokyo', 'travel'];
  const allTips: TravelTip[] = [];
  
  for (const subreddit of subreddits) {
    try {
      // Try to fetch full JSON data from Reddit API
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(city)}&restrict_sr=1&sort=top&t=month&limit=100`;
      
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 5000,
      });

      if (data?.data?.children) {
        data.data.children.forEach((post: any) => {
          const postData = post.data;
          const title = postData.title || '';
          const selftext = postData.selftext || '';
          const upvotes = postData.ups || 0;
          
          // Filter for relevant travel posts (strict requirements)
          if (isRelevantTravelPost(title, selftext) && upvotes > 5) {
            // Transform title into actionable tip (returns null if invalid)
            const category = categorizeTip(title);
            const tipText = transformToActionableTip(title, category);
            
            if (tipText) {
              allTips.push({
                text: tipText,
                category,
                source: 'reddit',
                upvotes,
              });
            }
          }
        });
      }
    } catch (err) {
      // Silently continue to next subreddit
      continue;
    }
  }
  
  // Sort by upvotes, deduplicate, and return top tips
  const sorted = allTips
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 50); // Get top 50 before dedup for better filtering
  
  const deduped = deduplicateTips(sorted);
  
  // Return only high-quality tips (top 20)
  return deduped.slice(0, 20);
}

// Scrape checklist items from Japan Guide
export async function scrapeJapanGuideChecklist(city: string): Promise<string[]> {
  const sources = [
    `https://www.japan-guide.com/e/e${city.toLowerCase()}.html`,
    `https://www.japan-guide.com/`,
  ];
  const checklist: string[] = [];

  for (const url of sources) {
    try {
      const { data } = await axios.get(url, {
        timeout: 3000,
      });
      const $ = cheerio.load(data);
      // Extract bullet points
      $('ul li, ol li').each((_, el) => {
        const text = $(el).text()?.trim();
        if (text && text.length > 10 && text.length < 150 && !checklist.includes(text)) {
          checklist.push(text);
        }
      });
      if (checklist.length > 5) break;
    } catch (err) {
      continue;
    }
  }

  return checklist.slice(0, 8);
}
