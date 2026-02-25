"use client";

import React, { useEffect, useState } from 'react';
import { Event } from '../lib/mappers/eventMapper';
import Card from './Card';
import { sanitizeDescription, translateToEnglish } from '../lib/utils/textFormatter';

export default function EventsList({ city }: { city: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    fetch(`/api/events?city=${encodeURIComponent(city)}`)
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load events');
        setLoading(false);
      });
  }, [city]);

  if (loading) return <div className="text-center py-8">Loading events...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
  if (!events.length) return <div className="text-center py-8">No events found.</div>;

  // Pagination logic
  const totalPages = Math.ceil(events.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedEvents = events.slice(startIdx, endIdx);

  return (
    <div>
      {/* Pagination top */}
      <div className="mb-4 px-2">
        <div className="text-sm text-gray-600 mb-3">
          Showing <span className="font-bold">{startIdx + 1}</span> - <span className="font-bold">{Math.min(endIdx, events.length)}</span> of <span className="font-bold">{events.length}</span> events
        </div>
        {totalPages > 1 && (
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
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Events */}
      {paginatedEvents.map(event => (
        <Card key={event.id}>
          <div className="font-bold text-lg mb-1 text-gray-800">
            {translateToEnglish(event.title)}
          </div>
          <div className="text-sm text-gray-500 mb-3">
            {new Date(event.date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })} • {event.city}
          </div>
          <div className="text-sm text-gray-700 mb-3 leading-relaxed">
            {sanitizeDescription(translateToEnglish(event.description))}
          </div>
          <div className="flex flex-col gap-1 text-xs text-gray-500">
            <div>📍 Location: {translateToEnglish(event.location)}</div>
            <div className="text-gray-400">Source: {event.source}</div>
          </div>
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
                    ? 'bg-blue-500 text-white'
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
    </div>
  );
}
