"use client";

import React, { useEffect, useState } from 'react';
import { getTravelGuide, TravelGuideData } from '../lib/data/travelGuideData';
import { useAppContext } from '../context/AppContext';

export interface TravelStory {
  id: string;
  title: string;
  subreddit: string;
  upvotes: number;
  comments: number;
  created: number;
  url: string;
}

export default function GuideSection({ city, country }: { city: string; country: string }) {
  const { getCachedData, setCachedData } = useAppContext();
  const [travelGuide, setTravelGuide] = useState<TravelGuideData | null>(null);
  const [stories, setStories] = useState<TravelStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<'summer' | 'rainy' | 'winter'>('summer');
  const [storyPage, setStoryPage] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [successfulResponse, setSuccessfulResponse] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Load travel guide data and stories
  useEffect(() => {
    if (!city || !country) {
      setTravelGuide(null);
      setStories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setStoryPage(0);
    setSuccessfulResponse(false);
    setIsFetching(false);

    // Get static travel guide data
    const guide = getTravelGuide(country);
    setTravelGuide(guide);

    // Check if we have cached stories for this country+city
    const cacheKey = `${country}__${city}`;
    const cachedStories = getCachedData(cacheKey);
    if (cachedStories) {
      console.log(`[GuideSection] Loading cached stories for ${country} - ${city}`);
      setStories(cachedStories);
      setSuccessfulResponse(true);
      setLoading(false);
    } else {
      // No cache, show empty state while loading
      setStories([]);
    }

    // Fetch fresh traveler stories progressively from each subreddit
    const fetchStoriesProgressively = async () => {
      setIsFetching(true);
      const subredditsByCountry: Record<string, string[]> = {
        Japan: ['JapanTravel', 'JapanTravelTips', 'solotravel', 'travelhacks', 'travel'],
        'Hong Kong': ['HongKong', 'solotravel', 'travelhacks', 'travel'],
        Thailand: ['Thailand', 'ThailandTourism', 'solotravel', 'travelhacks', 'travel'],
        Malaysia: ['Malaysia', 'MalaysiaTravel', 'solotravel', 'travelhacks', 'travel'],
      };
      const subreddits = subredditsByCountry[country] || ['travel', 'solotravel', 'travelhacks'];
      const allStories: TravelStory[] = [];
      let delayMs = 1000; // Start with 1 second delay

      for (const subreddit of subreddits) {
        // Add delay before each subreddit fetch to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs = Math.min(delayMs + 500, 3000); // Increase by 500ms each, cap at 3s

        try {
          const res = await fetch(
            `/api/subreddit-stories?subreddit=${encodeURIComponent(subreddit)}&country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}`
          );
          
          if (!res.ok) {
            console.error(`[GuideSection] Failed to fetch ${subreddit}: ${res.status}`);
            continue;
          }

          setSuccessfulResponse(true); // Mark as successful on first response
          const data = await res.json();
          const stories = data.stories || [];
          
          if (stories.length > 0) {
            console.log(`[GuideSection] Got ${stories.length} stories from ${subreddit}`);
            // Add new stories to existing ones
            allStories.push(...stories);
            // Update state immediately with accumulated stories
            setCachedData(cacheKey, allStories);
            setStories([...allStories]);
          }
        } catch (err) {
          console.error(`[GuideSection] Error fetching from ${subreddit}:`, err);
        }
      }

      setIsFetching(false);
      setLoading(false);
    };

    fetchStoriesProgressively();
  }, [city, country]);

  // Load checklist from localStorage
  useEffect(() => {
    setStorageReady(false);
    const storageKey = `checklist_${country}_${selectedSeason}`;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      } else {
        setCheckedItems({});
      }
    } catch {
      setCheckedItems({});
    }
    
    setStorageReady(true);
  }, [country, selectedSeason]);

  // Save checklist to localStorage
  useEffect(() => {
    if (!storageReady) return;
    const storageKey = `checklist_${country}_${selectedSeason}`;
    localStorage.setItem(storageKey, JSON.stringify(checkedItems));
  }, [checkedItems, country, selectedSeason, storageReady]);

  if (!country) {
    return <div className="text-center py-12 app-text-muted">Select a country to view travel guide</div>;
  }

  if (loading && !travelGuide) {
    return <div className="text-center py-8">Loading guide...</div>;
  }

  if (!travelGuide) {
    return <div className="text-center py-8 app-text-secondary">No guide available for {country}</div>;
  }

  const checklistItems = travelGuide.checklist[selectedSeason] || [];
  const checkedCount = checklistItems.filter(item => checkedItems[item]).length;

  const toggleChecklistItem = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() / 1000) - timestamp);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  const STORIES_PER_PAGE = 6;
  const paginatedStories = stories.slice(
    storyPage * STORIES_PER_PAGE,
    (storyPage + 1) * STORIES_PER_PAGE
  );
  const totalStoryPages = Math.ceil(stories.length / STORIES_PER_PAGE);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
      {/* LEFT COLUMN: Traveler Stories */}
      <div>
        <section className="app-card rounded-lg p-3 md:p-5 sticky top-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-xl app-text-primary">💬 Traveler Stories</h2>
            {stories.length > 0 && totalStoryPages > 1 && (
              <div className="text-xs app-text-muted">
                Page {storyPage + 1} of {totalStoryPages}
              </div>
            )}
          </div>

          {stories.length === 0 ? (
            <div className="app-inner rounded-lg p-4 text-center">
              <p className={`app-text-muted text-sm ${successfulResponse || isFetching ? 'loading-jiggly' : ''}`}>
                {successfulResponse || isFetching
                  ? "Loading Traveler Stories!..." 
                  : "No traveler stories found this week. Check back soon!"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {paginatedStories.map((story) => (
                  <a
                    key={story.id}
                    href={story.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block app-inner rounded-lg p-3 border border-gray-200 hover:opacity-90 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm app-text-primary font-semibold">{story.title}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs app-text-muted">
                          <span>r/{story.subreddit}</span>
                          <span>⬆️ {story.upvotes}</span>
                          <span>💬 {story.comments}</span>
                          <span>{formatTimeAgo(story.created)}</span>
                        </div>
                      </div>
                      <span className="text-xs app-text-muted">Open →</span>
                    </div>
                  </a>
                ))}
                {isFetching && (
                  <div className="app-inner rounded-lg p-3 text-center">
                    <p className="app-text-muted text-sm loading-jiggly">Loading more stories!...</p>
                  </div>
                )}
              </div>

              {totalStoryPages > 1 && (
                <div className="flex gap-2 justify-center mt-4 flex-wrap">
                  <button
                    onClick={() => setStoryPage(Math.max(0, storyPage - 1))}
                    disabled={storyPage === 0}
                    className="app-btn-primary px-3 py-1 rounded disabled:opacity-50 text-sm"
                  >
                    ← Previous
                  </button>
                  {Array.from({ length: Math.min(totalStoryPages, 5) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStoryPage(i)}
                      className={`px-2 py-1 rounded text-sm ${
                        i === storyPage
                          ? 'app-btn-primary'
                          : 'app-btn-neutral hover:opacity-90'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setStoryPage(Math.min(totalStoryPages - 1, storyPage + 1))}
                    disabled={storyPage === totalStoryPages - 1}
                    className="app-btn-primary px-3 py-1 rounded disabled:opacity-50 text-sm"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* RIGHT COLUMN: All other sections */}
      <div className="space-y-4">
        {/* Best Time to Visit */}
        <section className="app-card rounded-lg p-3 md:p-5">
          <h2 className="font-bold text-xl app-text-primary mb-3">🌍 Best Time to Visit</h2>
          <ul className="space-y-2">
            {travelGuide.best_time.map((tip, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-lg">📅</span>
                <span className="app-text-secondary text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Transportation Tips */}
        <section className="app-card rounded-lg p-3 md:p-5">
          <h2 className="font-bold text-xl app-text-primary mb-3">🚌 Transportation Tips</h2>
          <ul className="space-y-2">
            {travelGuide.transportation_tips.map((tip, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-lg">🗺️</span>
                <span className="app-text-secondary text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Packing Checklist */}
        <section className="app-card rounded-lg p-3 md:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="font-bold text-xl app-text-primary">✅ Checklist</h2>
            <div className="text-sm font-semibold bg-gray-700 text-gray-100 px-3 py-1 rounded-full">
              {checkedCount}/{checklistItems.length} packed
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold app-text-secondary">Season:</label>
            <div className="flex gap-2 mt-2">
              {(['summer', 'rainy', 'winter'] as const).map(season => (
                <button
                  key={season}
                  onClick={() => setSelectedSeason(season)}
                  className={`px-3 py-1 rounded text-sm font-semibold transition ${
                    selectedSeason === season
                      ? 'app-btn-primary'
                      : 'app-btn-neutral hover:opacity-90'
                  }`}
                >
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {checklistItems.map(item => (
              <label
                key={item}
                className="flex items-center gap-3 p-3 app-inner rounded-lg cursor-pointer hover:opacity-90 transition"
              >
                <input
                  type="checkbox"
                  checked={checkedItems[item] || false}
                  onChange={() => toggleChecklistItem(item)}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className={`text-sm ${checkedItems[item] ? 'line-through app-text-muted' : 'app-text-secondary'}`}>
                  {item}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="app-card rounded-lg p-3 md:p-5">
          <h2 className="font-bold text-xl app-text-primary mb-3">⚠️ Common Mistakes</h2>
          <ul className="space-y-2">
            {travelGuide.mistakes.map((mistake, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-lg">🚫</span>
                <span className="app-text-secondary text-sm">{mistake}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Do Not Bring */}
        <section className="app-card rounded-lg p-3 md:p-5">
          <h2 className="font-bold text-xl app-text-primary mb-3">📦 Do Not Bring</h2>
          <ul className="space-y-2">
            {travelGuide.doNotBring.map((item, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-lg">💡</span>
                <span className="app-text-secondary text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
