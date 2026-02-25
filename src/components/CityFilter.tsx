"use client";

import React from 'react';

export default function CityFilter({ selected, onChange, cities }: { selected: string; onChange: (city: string) => void; cities: string[] }) {
  return (
    <select
      className="app-select rounded px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold"
      value={selected}
      onChange={e => onChange(e.target.value)}
      disabled={cities.length === 0}
    >
      {!selected && <option value="">Select City</option>}
      {cities.map(city => (
        <option key={city} value={city}>{city}</option>
      ))}
    </select>
  );
}
