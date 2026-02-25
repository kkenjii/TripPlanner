"use client";

import React, { useEffect, useState } from 'react';
import Card from './Card';
import { getUserLocation, calculateDistance, formatDistance, Coordinates } from '../lib/utils/gpsUtils';
import { useAppContext } from '../context/AppContext';
import LoadingBar from './LoadingBar';
import SkeletonCard from './SkeletonCard';
import { Accommodation, formatAccommodationType, getTypeColor } from '../lib/mappers/accommodationMapper';

export default function AccommodationList({ city, country }: { city: string; country: string }) {
  const { getCachedData, setCachedData } = useAppContext();
  const FETCH_MAX = 100;
  const INITIAL_VISIBLE = 20;

  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'closest' | 'rating' | 'reviews' | 'with-reviews'>('closest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_VISIBLE);
  const [expandedReviews, setExpandedReviews] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Get user's GPS location on component mount
  useEffect(() => {
    getUserLocation()
      .then(coords => setUserLocation(coords))
      .catch((err: any) => {
        console.log('GPS not available:', err);
        setUserLocation(null);
      });
  }, []);

  // Fetch accommodations data
  useEffect(() => {
    if (!city || !country) {
      setAccommodations([]);
      setLoading(false);
      return;
    }

    // Include user location in cache key to avoid serving city-center results when GPS is available
    const locationKey = userLocation ? `${userLocation.lat.toFixed(4)}_${userLocation.lng.toFixed(4)}` : 'no_gps';
    const cacheKey = `accommodations_${country}_${city}_${locationKey}`;
    const cachedAccommodations = getCachedData(cacheKey);

    if (cachedAccommodations) {
      console.log(`[AccommodationList] Loading cached accommodations for ${country} - ${city} (${locationKey})`);
      setAccommodations(cachedAccommodations);
      setLoading(false);
      return;
    }

    setAccommodations([]);
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setVisibleLimit(INITIAL_VISIBLE);

    const queryParams = new URLSearchParams({
      city: city,
      country: country,
      ...(userLocation && { lat: userLocation.lat.toString(), lng: userLocation.lng.toString() }),
    });

    fetch(`/api/accommodations?${queryParams}`)
      .then(res => res.json())
      .then(data => {
        const accommodationData = data.accommodations || [];
        setCachedData(cacheKey, accommodationData);
        setAccommodations(accommodationData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching accommodations:', err);
        setError('Failed to load accommodations');
        setLoading(false);
      });
  }, [city, country, userLocation, getCachedData, setCachedData]);

  // Calculate distances from user
  useEffect(() => {
    if (!userLocation || accommodations.length === 0) return;

    const newDistances: Record<string, number> = {};
    accommodations.forEach(acc => {
      const distance = calculateDistance(
        userLocation,
        { lat: acc.lat, lng: acc.lng }
      );
      newDistances[acc.id] = distance;
    });
    setDistances(newDistances);
  }, [userLocation, accommodations]);

  // Filter and sort accommodations
  let filtered = accommodations
    .filter(acc => {
      if (searchQuery && !acc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType !== 'all' && acc.type !== filterType) return false;
      if (filterRating > 0 && acc.rating < filterRating) return false;
      return true;
    });

  let sorted = [...filtered];
  if (sortBy === 'closest' && userLocation) {
    sorted.sort((a, b) => (distances[a.id] || Infinity) - (distances[b.id] || Infinity));
  } else if (sortBy === 'rating') {
    sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === 'reviews') {
    sorted.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
  } else if (sortBy === 'with-reviews') {
    sorted.sort((a, b) => {
      const aHasReviews = (a.reviews && a.reviews.length > 0) ? 1 : 0;
      const bHasReviews = (b.reviews && b.reviews.length > 0) ? 1 : 0;
      if (bHasReviews !== aHasReviews) return bHasReviews - aHasReviews;
      return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    });
  }

  const visibleItems = sorted.slice(0, visibleLimit);

  const accommodationTypes = ['all', 'hotel', 'hostel', 'apartment', 'guesthouse', 'motel', 'lodging', 'other'];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search accommodations..."
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
            setVisibleLimit(INITIAL_VISIBLE);
          }}
          className="app-input w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              Type
            </label>
            <select
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value);
                setCurrentPage(1);
                setVisibleLimit(INITIAL_VISIBLE);
              }}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm"
            >
              {accommodationTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : formatAccommodationType(type as any).split(' ')[1]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              Rating
            </label>
            <select
              value={filterRating}
              onChange={e => {
                setFilterRating(parseFloat(e.target.value));
                setCurrentPage(1);
                setVisibleLimit(INITIAL_VISIBLE);
              }}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm"
            >
              <option value={0}>All Ratings</option>
              <option value={4}>4.0★ and above</option>
              <option value={4.5}>4.5★ and above</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={e => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
                setVisibleLimit(INITIAL_VISIBLE);
              }}
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm"
            >
              <option value="closest">Nearest</option>
              <option value="rating">Highest Rated</option>
              <option value="reviews">Most Reviews</option>
              <option value="with-reviews">With Reviews</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-6">
          <LoadingBar current={1} total={3} label="Searching for accommodations" isVisible={true} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-lg">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && accommodations.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No accommodations found for {city}, {country}
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && accommodations.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Found {filtered.length} accommodation{filtered.length !== 1 ? 's' : ''} (showing {visibleItems.length} of {filtered.length})
        </div>
      )}

      {/* Accommodations Grid */}
      {!loading && !error && visibleItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleItems.map(acc => (
            <div
              key={acc.id}
              className="app-card bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Image */}
              {acc.image && (
                <div className="relative h-40 overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <img
                    src={acc.image}
                    alt={acc.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    onError={(e: any) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                </div>
              )}

              <div className="p-4 space-y-2">
                {/* Type Badge and Name */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white flex-1 line-clamp-2">
                    {acc.name}
                  </h3>
                  <span
                    className={`${getTypeColor(acc.type)} text-white text-xs font-semibold px-2 py-1 rounded whitespace-nowrap`}
                  >
                    {acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}
                  </span>
                </div>

                {/* Rating and Reviews */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {acc.rating.toFixed(1)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      ({acc.reviewsCount})
                    </span>
                  </div>
                  {acc.price && acc.price !== 'N/A' && (
                    <div className="text-gray-700 dark:text-gray-300 font-semibold">
                      {acc.price}
                    </div>
                  )}
                </div>

                {/* Location */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                  📍 {acc.location}
                </p>

                {/* Distance */}
                {userLocation && distances[acc.id] !== undefined && (
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {formatDistance(distances[acc.id])} away
                  </p>
                )}

                {/* Address */}
                <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1">
                  {acc.address}
                </p>

                {/* View Details and Reviews Buttons */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <a
                    href={
                      userLocation
                        ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${acc.lat},${acc.lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${acc.lat},${acc.lng}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-semibold rounded transition-colors"
                  >
                    {userLocation ? '🧭 Directions' : '📍 View Map'}
                  </a>
                  <button
                    onClick={() => setExpandedReviews(expandedReviews === acc.id ? null : acc.id)}
                    className={`px-3 py-2 text-white text-center text-sm font-semibold rounded transition-colors ${
                      expandedReviews === acc.id
                        ? 'bg-purple-700 hover:bg-purple-800'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {expandedReviews === acc.id ? '✕ Reviews' : '✓ Reviews'}
                  </button>
                </div>

                {/* Reviews Section */}
                {expandedReviews === acc.id && acc.reviews && acc.reviews.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700 space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Reviews ({acc.reviews.length})</h4>
                    {acc.reviews.map((review, idx) => (
                      <div key={idx} className="bg-gray-100 dark:bg-gray-700 rounded p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white truncate">
                            {review.author}
                          </span>
                          <span className="text-yellow-500 font-semibold whitespace-nowrap">
                            ⭐ {review.rating}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                          {review.text}
                        </p>
                        {review.relativeTime && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {review.relativeTime}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {expandedReviews === acc.id && (!acc.reviews || acc.reviews.length === 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      No reviews available
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {!loading && !error && visibleItems.length < filtered.length && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleLimit(prev => prev + itemsPerPage)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
