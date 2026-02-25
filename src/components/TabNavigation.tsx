"use client";

import React from 'react';

const tabs = [
  { key: 'trending', label: '🔥 Trending' },
  { key: 'food', label: '🍜 Food' },
  { key: 'guide', label: '💬 Tips' },
];

export default function TabNavigation({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  return (
    <nav className="app-tabs flex justify-around sticky top-0 z-10 px-2 py-1">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`app-tab-btn py-2 px-2 sm:py-3 sm:px-4 flex-1 text-xs sm:text-sm font-bold transition-all ${selected === tab.key ? 'app-tab-active' : ''}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
