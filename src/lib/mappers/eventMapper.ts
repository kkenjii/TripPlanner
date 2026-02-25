// Normalized Event and Review types
export type Review = {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
  timestamp?: number;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  city: string;
  source: "doorkeeper" | "festival";
  reviews?: Review[];
};

// Utility to clean HTML and extract text
function cleanDescription(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Mapper to normalize Doorkeeper API response to Event
export function mapDoorkeeperEvent(doorkeeper: any): Event {
  return {
    id: String(doorkeeper.event.id),
    title: doorkeeper.event.title,
    description: cleanDescription(doorkeeper.event.description || ''),
    date: doorkeeper.event.starts_at,
    location: doorkeeper.event.address || '',
    city: doorkeeper.event.address?.split(',')[0] || '',
    source: 'doorkeeper',
    reviews: [], // Doorkeeper does not provide reviews
  };
}
