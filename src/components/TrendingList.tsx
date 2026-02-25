'use client';

import { useEffect, useState } from 'react';
import Card from './Card';
import { getUserLocation, calculateDistance, formatDistance, Coordinates } from '../lib/utils/gpsUtils';
import { useAppContext } from '../context/AppContext';

interface Review {
  author: string;
  rating: number;
  text: string;
  time: number;
}

interface TrendingItem {
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

interface TrendingListProps {
  city: string;
  country: string;
}

export default function TrendingList({ city, country }: TrendingListProps) {
  const { getCachedData, setCachedData } = useAppContext();
  const FETCH_MAX_PER_CATEGORY = 30;
  const INITIAL_VISIBLE_PER_CATEGORY = 10;
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [error, setError] = useState('');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [reviewSortOrder, setReviewSortOrder] = useState<Record<string, 'rating-desc' | 'rating-asc' | 'date-new'>>({});
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [distances, setDistances] = useState<Record<string, string>>({});
  const [distanceKmById, setDistanceKmById] = useState<Record<string, number>>({});
  const [gpsError, setGpsError] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePerCategoryLimit, setVisiblePerCategoryLimit] = useState(INITIAL_VISIBLE_PER_CATEGORY);
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'score' | 'closest' | 'farthest'>('default');
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (!city || !country) {
      setItems([]);
      setLoading(false);
      return;
    }

    const cacheKey = `trending_${country}_${city}`;
    const cachedItems = getCachedData(cacheKey);
    
    if (cachedItems) {
      console.log(`[TrendingList] Loading cached trending for ${country} - ${city}`);
      setItems(cachedItems);
      setLoading(false);
      return;
    }

    const fetchTrending = async () => {
      setItems([]);
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/trending?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&limitPerCategory=${FETCH_MAX_PER_CATEGORY}`);
        if (!response.ok) throw new Error('Failed to fetch trending data');
        const data = await response.json();
        setCachedData(cacheKey, data);
        setItems(data);
      } catch (err) {
        setError('Failed to load trending items');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [city, country, getCachedData, setCachedData]);

  useEffect(() => {
    setVisiblePerCategoryLimit(INITIAL_VISIBLE_PER_CATEGORY);
  }, [city, country]);

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery]);

  // Get user's GPS location on component mount
  useEffect(() => {
    getUserLocation()
      .then(coords => {
        setUserLocation(coords);
        setGpsError('');
      })
      .catch(err => {
        console.log('GPS not available:', err.message);
        setGpsError('Enable location access to sort by distance (Closest/Farthest).');
      });
  }, []);

  // Calculate distances when location or items change
  useEffect(() => {
    if (!userLocation) return;

    const newDistances: Record<string, string> = {};
    const newDistanceKmById: Record<string, number> = {};
    items.forEach(item => {
      // Parse coordinates from the map URL
      const mapUrlMatch = item.googleMapsUrl?.match(/q=([-\d.]+),([-\d.]+)/);
      if (mapUrlMatch) {
        const itemCoords: Coordinates = {
          lat: parseFloat(mapUrlMatch[1]),
          lng: parseFloat(mapUrlMatch[2]),
        };
        const km = calculateDistance(userLocation, itemCoords);
        newDistances[item.id] = formatDistance(km);
        newDistanceKmById[item.id] = km;
      }
    });
    setDistances(newDistances);
    setDistanceKmById(newDistanceKmById);
  }, [userLocation, items]);

  // Get unique categories, excluding 'Trending'
  const categories = ['All', ...new Set(items.filter(item => item.category !== 'Trending').map(item => item.category))];
  const categoryFilteredItems =
    selectedCategory === 'All'
      ? items
      : items.filter(item => item.category === selectedCategory);

  const searchNormalized = searchQuery.trim().toLowerCase();
  const allFilteredItems = searchNormalized
    ? categoryFilteredItems.filter(item =>
        item.title.toLowerCase().includes(searchNormalized) ||
        item.category.toLowerCase().includes(searchNormalized) ||
        (item.address || '').toLowerCase().includes(searchNormalized) ||
        (item.source || '').toLowerCase().includes(searchNormalized)
      )
    : categoryFilteredItems;

  // Sort trending items
  const getSortedItems = (): TrendingItem[] => {
    const itemsCopy = [...allFilteredItems];
    switch (sortBy) {
      case 'rating':
        return itemsCopy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'score':
        return itemsCopy.sort((a, b) => b.trendingScore - a.trendingScore);
      case 'closest':
        return itemsCopy.sort((a, b) => (distanceKmById[a.id] || Infinity) - (distanceKmById[b.id] || Infinity));
      case 'farthest':
        return itemsCopy.sort((a, b) => (distanceKmById[b.id] || 0) - (distanceKmById[a.id] || 0));
      default:
        return itemsCopy;
    }
  };

  const sortedItems = getSortedItems();

  const applyPerCategoryVisibleLimit = (source: TrendingItem[]): TrendingItem[] => {
    if (selectedCategory !== 'All') {
      return source.slice(0, visiblePerCategoryLimit);
    }

    const grouped = new Map<string, TrendingItem[]>();
    source.forEach(item => {
      if (!grouped.has(item.category)) {
        grouped.set(item.category, []);
      }
      grouped.get(item.category)!.push(item);
    });

    const limited: TrendingItem[] = [];
    grouped.forEach(categoryItems => {
      limited.push(...categoryItems.slice(0, visiblePerCategoryLimit));
    });

    return limited;
  };

  const visibleItems = applyPerCategoryVisibleLimit(sortedItems);

  // Pagination
  const totalPages = Math.ceil(visibleItems.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const filteredItems = visibleItems.slice(startIndex, endIndex);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Food': 'bg-orange-100 text-orange-800',
      'Nightlife': 'bg-purple-100 text-purple-800',
      'Attractions': 'bg-blue-100 text-blue-800',
      'Landmarks': 'bg-amber-100 text-amber-800',
      'Popular Destinations': 'bg-indigo-100 text-indigo-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Trending': 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string): string => {
    return type === 'place' ? '📍' : '📱';
  };

  const toggleReviews = (id: string) => {
    const newSet = new Set(expandedReviews);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedReviews(newSet);
  };

  const getSortedReviews = (id: string, reviews: Review[]): Review[] => {
    const sortOrder = reviewSortOrder[id] || 'rating-desc';
    const sorted = [...reviews];

    if (sortOrder === 'rating-desc') {
      return sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortOrder === 'rating-asc') {
      return sorted.sort((a, b) => a.rating - b.rating);
    } else if (sortOrder === 'date-new') {
      return sorted.sort((a, b) => b.time - a.time);
    }
    return sorted;
  };

  const cycleSortOrder = (id: string) => {
    const current = reviewSortOrder[id] || 'rating-desc';
    const next: Record<string, 'rating-desc' | 'rating-asc' | 'date-new'> = {
      'rating-desc': 'rating-asc',
      'rating-asc': 'date-new',
      'date-new': 'rating-desc',
    };
    setReviewSortOrder({
      ...reviewSortOrder,
      [id]: next[current],
    });
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() / 1000) - timestamp);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">🔥 What's Hot Right Now</h2>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, category, address, or source"
            className="app-input w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-semibold transition-all ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setVisiblePerCategoryLimit((prev) => Math.min(prev + 10, FETCH_MAX_PER_CATEGORY))}
            disabled={visiblePerCategoryLimit >= FETCH_MAX_PER_CATEGORY || loading}
            className="app-btn-primary px-3 py-2 rounded text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search More
          </button>
          <span className="text-xs text-gray-500">
            Showing top {visiblePerCategoryLimit} per category
          </span>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mb-4 mt-4 px-2">
        <div className="text-sm font-semibold text-gray-700 mb-2">Sort by:</div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'default', label: 'Default' },
            { value: 'rating', label: '⭐ Rating' },
            { value: 'score', label: '🔥 Trending Score' },
            { value: 'closest', label: '📍 Closest' },
            { value: 'farthest', label: '📍 Farthest' },
          ].map(sort => (
            <button
              key={sort.value}
              onClick={async () => {
                const isDistanceSort = sort.value === 'closest' || sort.value === 'farthest';
                if (isDistanceSort && !userLocation) {
                  try {
                    const coords = await getUserLocation();
                    setUserLocation(coords);
                    setGpsError('');
                    setSortBy(sort.value as any);
                    setPage(1);
                  } catch {
                    setGpsError('Please enable location access in your browser to use distance sorting.');
                  }
                  return;
                }

                setSortBy(sort.value as any);
                setPage(1);
              }}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                sortBy === sort.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>
        {!userLocation && (
          <p className="text-xs text-amber-700 mt-2">
            Allow location access to enable distance sorting.
          </p>
        )}
        {gpsError && (
          <p className="text-xs text-red-600 mt-1">
            {gpsError}
          </p>
        )}
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600 animate-pulse">Loading trending items...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {!loading && filteredItems.length === 0 && !error && (
        <div className="text-center py-12 text-gray-600">
          <p>No trending items found for this city yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {filteredItems.map(item => (
          <Card key={item.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{getTypeIcon(item.type)}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                {item.description && (
                  <p className="text-sm app-text-secondary line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Rating/Upvotes */}
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
              {item.type === 'place' && item.rating && (
                <div className="flex items-center gap-1">
                  <span>⭐</span>
                  <span>{item.rating.toFixed(1)}</span>
                  {item.reviewsCount && (
                    <span className="text-xs">({item.reviewsCount} reviews)</span>
                  )}
                </div>
              )}
              {item.type === 'reddit' && item.upvotes && (
                <div className="flex items-center gap-1">
                  <span>👍</span>
                  <span>{(item.upvotes / 1000).toFixed(1)}k upvotes</span>
                </div>
              )}
              {item.source && (
                <div className="text-xs font-semibold">{item.source}</div>
              )}
            </div>

            {/* Trending Score Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">Trending Score</span>
                <span className="text-xs font-bold text-orange-600">
                  {Math.round(item.trendingScore)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min((item.trendingScore / 150) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Links and Actions */}
            <div className="flex gap-2 mb-3 mt-4">
              {item.googleMapsUrl && item.type === 'place' && (
                <>
                  <a
                    href={
                      userLocation
                        ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${item.googleMapsUrl.match(/q=([-\d.]+),([-\d.]+)/)?.[1]},${item.googleMapsUrl.match(/q=([-\d.]+),([-\d.]+)/)?.[2]}`
                        : item.googleMapsUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="app-btn-primary flex-1 px-3 py-1 text-sm font-semibold rounded transition text-center"
                  >
                    {userLocation ? '🧭 Directions' : 'View on Maps'} →
                  </a>
                  {distances[item.id] && (
                    <div className="px-3 py-1 app-inner app-text-secondary text-sm font-semibold rounded text-center border border-gray-200">
                      📍 {distances[item.id]}
                    </div>
                  )}
                </>
              )}
              {item.url && item.type === 'reddit' && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="app-btn-primary flex-1 px-3 py-1 text-sm font-semibold rounded transition text-center"
                >
                  View on Reddit →
                </a>
              )}
            </div>

            {/* Collapsible Reviews */}
            {item.reviews && item.reviews.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <button
                  onClick={() => toggleReviews(item.id)}
                  className="w-full flex items-center justify-between app-inner p-3 rounded font-semibold text-sm transition border border-gray-200"
                >
                  <span>📝 Top Reviews ({item.reviews.length})</span>
                  <span className={`transform transition-transform ${expandedReviews.has(item.id) ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {expandedReviews.has(item.id) && (
                  <div className="mt-3 max-h-96 overflow-y-auto">
                    {/* Sort Controls */}
                    <div className="mb-3 flex gap-2">
                      <button
                        onClick={() => cycleSortOrder(item.id)}
                        className="text-xs px-2 py-1 app-btn-neutral rounded font-semibold transition"
                      >
                        Sort: {reviewSortOrder[item.id]?.replace('-', ' ').replace('desc', '↓').replace('asc', '↑').replace('new', '🕐') || 'Rating ↓'}
                      </button>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-3">
                      {getSortedReviews(item.id, item.reviews).map((review, idx) => (
                        <div key={idx} className="app-inner p-3 rounded border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-bold text-sm app-text-primary">{review.author}</p>
                              <p className="text-xs app-text-muted">{formatTimeAgo(review.time)}</p>
                            </div>
                            <span className="text-sm font-bold">{'⭐'.repeat(review.rating)}</span>
                          </div>
                          <p className="text-sm app-text-secondary line-clamp-3">{review.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && !loading && !error && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded font-semibold transition ${
              page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-10 h-10 rounded font-semibold transition ${
                  page === pageNum
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded font-semibold transition ${
              page === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
