"use client";

import React, { useEffect, useState } from 'react';
import Card from './Card';
import { getUserLocation, calculateDistance, formatDistance, Coordinates } from '../lib/utils/gpsUtils';
import { useAppContext } from '../context/AppContext';
import LoadingBar from './LoadingBar';
import SkeletonCard from './SkeletonCard';

export type FoodPlace = {
  id: string;
  name: string;
  rating: number;
  address: string;
  isOpen: boolean;
  priceLevel: number;
  lat: number;
  lng: number;
  website?: string;
  photos: string[];
  reviews: any[];
};

export default function FoodList({ city, country }: { city: string; country: string }) {
  const { getCachedData, setCachedData } = useAppContext();
  const FETCH_MAX = 50;
  const INITIAL_VISIBLE = 10;
  const [food, setFood] = useState<FoodPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [gpsReady, setGpsReady] = useState(false);
  const [distances, setDistances] = useState<Record<string, string>>({});
  const [distanceKmById, setDistanceKmById] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'default' | 'closest' | 'farthest' | 'rating' | 'price-low' | 'price-high'>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFilter, setOpenFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_VISIBLE);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!city || !country) {
      setFood([]);
      setLoading(false);
      return;
    }

    // Wait for GPS to resolve before fetching
    if (!gpsReady) {
      return;
    }

    // Include user location in cache key to avoid serving city-center results when GPS is available
    const locationKey = userLocation ? `${userLocation.lat.toFixed(4)}_${userLocation.lng.toFixed(4)}` : 'no_gps';
    const cacheKey = `food_v7_${country}_${city}_${locationKey}`;
    
    const cachedFood = getCachedData(cacheKey);
    
    if (cachedFood) {
      setFood(cachedFood);
      setLoading(false);
      return;
    }

    setFood([]);
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setVisibleLimit(INITIAL_VISIBLE);

    const queryParams = new URLSearchParams({
      city: city,
      country: country,
      ...(userLocation && { lat: userLocation.lat.toString(), lng: userLocation.lng.toString() }),
    });

    fetch(`/api/food?${queryParams}`)
      .then(res => res.json())
      .then(data => {
        const foodData = data.food || [];
        setCachedData(cacheKey, foodData);
        setFood(foodData);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load food places');
        setLoading(false);
      });
  }, [city, country, userLocation, gpsReady, getCachedData, setCachedData]);

  // Get user's GPS location BEFORE fetching data
  useEffect(() => {
    getUserLocation()
      .then(coords => {
        setUserLocation(coords);
        setGpsReady(true);
      })
      .catch(err => {
        setUserLocation(null);
        setGpsReady(true); // Mark as ready even if GPS failed
      });
  }, []);

  // Calculate distances when location or food items change
  useEffect(() => {
    if (!userLocation) {
      setDistances({});
      setDistanceKmById({});
      return;
    }

    const newDistances: Record<string, string> = {};
    const newDistanceKmById: Record<string, number> = {};
    food.forEach((place) => {
      if (place.lat === 0 || place.lng === 0) return;
      
      const itemCoords: Coordinates = { lat: place.lat, lng: place.lng };
      const km = calculateDistance(userLocation, itemCoords);
      newDistances[place.id] = formatDistance(km);
      newDistanceKmById[place.id] = km;
    });
    setDistances(newDistances);
    setDistanceKmById(newDistanceKmById);
  }, [userLocation, food]);

  // Sort food places
  const getSortedFood = (source: FoodPlace[]): FoodPlace[] => {
    const foodCopy = [...source];

    switch (sortBy) {
      case 'closest':
        return foodCopy.sort((a, b) => (distanceKmById[a.id] || Infinity) - (distanceKmById[b.id] || Infinity));
      case 'farthest':
        return foodCopy.sort((a, b) => (distanceKmById[b.id] || 0) - (distanceKmById[a.id] || 0));
      case 'rating':
        return foodCopy.sort((a, b) => b.rating - a.rating);
      case 'price-low':
        return foodCopy.sort((a, b) => a.priceLevel - b.priceLevel);
      case 'price-high':
        return foodCopy.sort((a, b) => b.priceLevel - a.priceLevel);
      default:
        return foodCopy;
    }
  };

  const searchNormalized = searchQuery.trim().toLowerCase();
  const searchFilteredFood = searchNormalized
    ? food.filter(place =>
        place.name.toLowerCase().includes(searchNormalized) ||
        place.address.toLowerCase().includes(searchNormalized)
      )
    : food;

  const statusFilteredFood = openFilter === 'all'
    ? searchFilteredFood
    : searchFilteredFood.filter(place => (openFilter === 'open' ? place.isOpen : !place.isOpen));

  const sortedFood = getSortedFood(statusFilteredFood);
  const visibleFood = sortedFood.slice(0, visibleLimit);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, openFilter]);

  const getPriceStyle = (level: number): { label: string; bgColor: string; textColor: string } => {
    const styles: Record<number, { label: string; bgColor: string; textColor: string }> = {
      1: { label: '$ Budget-Friendly', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      2: { label: '$$ Moderate', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      3: { label: '$$$ Expensive', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
      4: { label: '$$$$ Very Expensive', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    };
    return styles[level] || { label: 'Price Unknown', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingBar current={1} total={3} label="Loading food places" isVisible={true} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!food.length) return <div className="text-center py-8">No food places found.</div>;

  // Pagination logic
  const totalPages = Math.ceil(visibleFood.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedFood = visibleFood.slice(startIdx, endIdx);

  return (
    <div>
      {/* Search */}
      <div className="mb-4 px-2">
        <div className="text-sm font-semibold text-gray-700 mb-2">Search restaurants:</div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by restaurant name or address"
          className="app-input w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* Sort Controls */}
      <div className="mb-4 px-2">
        <div className="text-sm font-semibold text-gray-700 mb-2">Sort by:</div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'default', label: 'Default' },
            { value: 'closest', label: '📍 Closest', disabled: !userLocation },
            { value: 'farthest', label: '📍 Farthest', disabled: !userLocation },
            { value: 'rating', label: '⭐ Highest Rated' },
            { value: 'price-low', label: '💰 Price: Low to High' },
            { value: 'price-high', label: '💰 Price: High to Low' },
          ].map(sort => (
            <button
              key={sort.value}
              onClick={() => {
                setSortBy(sort.value as any);
                setCurrentPage(1);
              }}
              disabled={sort.disabled}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                sortBy === sort.value
                  ? 'bg-orange-500 text-white'
                  : sort.disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* Open/Closed Filter */}
      <div className="mb-4 px-2">
        <div className="text-sm font-semibold text-gray-700 mb-2">Status:</div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All' },
            { value: 'open', label: '🟢 Open Now' },
            { value: 'closed', label: '🔴 Closed' },
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setOpenFilter(filter.value as any)}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                openFilter === filter.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pagination top */}
      <div className="mb-4 px-2">
        <div className="text-sm text-gray-600 mb-3">
          Showing <span className="font-bold">{startIdx + 1}</span> - <span className="font-bold">{Math.min(endIdx, visibleFood.length)}</span> of <span className="font-bold">{visibleFood.length}</span> restaurants
        </div>
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentPage(idx + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-3 py-1 rounded font-semibold text-sm transition ${
                currentPage === idx + 1
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 px-2 flex items-center gap-3">
        <button
          onClick={() => setVisibleLimit((prev) => Math.min(prev + 10, FETCH_MAX))}
          disabled={visibleLimit >= FETCH_MAX}
          className="app-btn-primary px-3 py-2 rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Search More
        </button>
        <span className="text-xs text-gray-500">
          Showing top {visibleLimit} results
        </span>
      </div>

      {visibleFood.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          No restaurants match your filters.
        </div>
      )}

      {/* Food items */}
      {paginatedFood.map((place, idx) => (
        <Card key={idx}>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="font-bold text-lg mb-2 app-text-primary">{place.name}</div>
              <a
                href={
                  userLocation
                    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${place.lat},${place.lng}`
                    : `https://www.google.com/maps?q=${place.lat},${place.lng}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline mb-2 flex items-center gap-1"
              >
                📍 {place.address}
              </a>
              <div className="flex gap-2 items-center flex-wrap text-xs mt-1">
                <span className={place.isOpen ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {place.isOpen ? '🟢 Open Now' : '🔴 Closed'}
                </span>
                {(() => {
                  const priceStyle = getPriceStyle(place.priceLevel);
                  return (
                    <span className={`${priceStyle.bgColor} ${priceStyle.textColor} px-2 py-0.5 rounded font-bold`}>
                      {priceStyle.label}
                    </span>
                  );
                })()}
                {distances[place.id] !== undefined && userLocation && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                    🧭 {distances[place.id]}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right min-w-fit">
              <div className="text-3xl font-bold text-yellow-500">★</div>
              <div className="text-sm font-bold text-gray-700">{place.rating.toFixed(1)}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-3 mt-5 flex-wrap">
            <a
              href={
                userLocation
                  ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${place.lat},${place.lng}`
                  : `https://www.google.com/maps?q=${place.lat},${place.lng}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="app-btn-primary flex-1 px-3 py-2 text-sm font-semibold rounded transition text-center"
            >
              🧭 Directions
            </a>
            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="app-btn-secondary flex-1 px-3 py-2 text-sm font-semibold rounded transition text-center"
              >
                🔗 Website
              </a>
            )}
          </div>

          {place.photos && place.photos.length > 0 && (
            <div className="my-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {place.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`${place.name} ${idx + 1}`}
                    onClick={() => setSelectedPhoto(photo)}
                    className="w-full h-20 rounded object-cover cursor-pointer hover:opacity-80 transition"
                  />
                ))}
              </div>
            </div>
          )}

          {place.reviews && place.reviews.length > 0 && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="text-sm font-bold text-gray-700">📝 Customer Reviews</div>
              {place.reviews.slice(0, 3).map((review, idx) => (
                <div key={idx} className="text-xs app-inner p-3 rounded border border-gray-200">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="font-semibold app-text-primary">{review.author}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★ {review.rating}</span>
                      <span className="app-text-muted">{review.relativeTime}</span>
                    </div>
                  </div>
                  <div className="app-text-secondary line-clamp-3">{review.text}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      {/* Pagination bottom */}
      {totalPages > 1 && (
        <div className="mt-6 px-2 flex flex-col items-center gap-4">
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentPage(idx + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1 rounded font-semibold text-sm transition ${
                  currentPage === idx + 1
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={selectedPhoto} alt="Full size" className="w-full rounded-lg" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-gray-100 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
