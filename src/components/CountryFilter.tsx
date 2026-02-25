"use client";

import React from 'react';

const countries = ['Japan', 'Hong Kong', 'Thailand', 'Malaysia'];

export default function CountryFilter({ selected, onChange }: { selected: string; onChange: (country: string) => void }) {
  return (
    <select
      className="app-select rounded px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold"
      value={selected}
      onChange={e => onChange(e.target.value)}
    >
      {!selected && <option value="">Select Country</option>}
      {countries.map(country => (
        <option key={country} value={country}>{country}</option>
      ))}
    </select>
  );
}
