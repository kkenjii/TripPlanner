// Utility to clean and format event descriptions
export function sanitizeDescription(html: string): string {
  if (!html) return '';
  // Decode HTML entities
  const decoded = html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Remove HTML tags
  const stripped = decoded.replace(/<[^>]*>/g, '');
  // Clean up extra whitespace
  return stripped
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300); // Limit to 300 chars
}

// Simple translation from Japanese to English
export function translateToEnglish(text: string): string {
  if (!text) return '';
  
  // Basic Japanese to English translations
  const translations: Record<string, string> = {
    '東京': 'Tokyo',
    '大阪': 'Osaka',
    '京都': 'Kyoto',
    '札幌': 'Sapporo',
    '福岡': 'Fukuoka',
    '横浜': 'Yokohama',
    '神戸': 'Kobe',
    '広島': 'Hiroshima',
    '名古屋': 'Nagoya',
    'イベント': 'Event',
    'ワークショップ': 'Workshop',
    'セミナー': 'Seminar',
    'カンファレンス': 'Conference',
    'トーク': 'Talk',
    '参加': 'Participation',
    '申し込み': 'Application',
    '無料': 'Free',
    '有料': 'Paid',
    '開始': 'Start',
    '終了': 'End',
    '開催': 'Held',
    '開催日': 'Event Date',
    '会場': 'Venue',
    'オンライン': 'Online',
    'ハイブリッド': 'Hybrid',
    'プログラミング': 'Programming',
    '開発': 'Development',
    'JavaScript': 'JavaScript',
    'Python': 'Python',
    'TypeScript': 'TypeScript',
    'Java': 'Java',
    'Ruby': 'Ruby',
    'GitHub': 'GitHub',
    '主催': 'Organized by',
    'コミュニティ': 'Community',
    '詳細': 'Details',
  };

  let result = text;
  // Sort by length (longest first) to avoid partial replacements
  const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);
  
  sortedKeys.forEach(jp => {
    // Escape special regex characters
    const escaped = jp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    result = result.replace(regex, translations[jp]);
  });

  return result;
}
