"use client";

import React, { useEffect, useState } from 'react';
import Card from './Card';
import { useAppContext } from '../context/AppContext';

export type Suggestion = {
  id: string;
  type: 'event' | 'food' | 'place';
  title: string;
  subtitle: string;
  rating?: number;
  date?: string;
  reviews?: any[];
};

export default function SuggestionsList({ city, country }: { city: string; country: string }) {
  const { getCachedData, setCachedData } = useAppContext();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city || !country) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const cacheKey = `suggestions_${country}_${city}`;
    const cachedSuggestions = getCachedData(cacheKey);
    
    if (cachedSuggestions) {
      setSuggestions(cachedSuggestions);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/suggestions?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`)
      .then(res => res.json())
      .then(data => {
        const suggestionData = data.suggestions || [];
        setCachedData(cacheKey, suggestionData);
        setSuggestions(suggestionData);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load suggestions');
        setLoading(false);
      });
  }, [city, country, getCachedData, setCachedData]);

  if (loading) return <div className="text-center py-8">Loading suggestions...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!suggestions.length) return <div className="text-center py-8">No suggestions found.</div>;

  return (
    <div>
      {suggestions.map(s => (
        <Card key={s.id}>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-semibold mb-2">
                {s.type === 'event' ? '📅 Event' : '🍽️ Restaurant'}
              </div>
              <div className="font-bold text-lg mb-1">{s.title}</div>
              <div className="text-sm text-gray-600 mb-2">{s.subtitle}</div>
              {s.date && (
                <div className="text-xs text-gray-500">
                  📅 {new Date(s.date).toLocaleDateString('en-US')}
                </div>
              )}
            </div>
            {s.rating && (
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-500">★</div>
                <div className="text-sm font-bold">{s.rating.toFixed(1)}</div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
