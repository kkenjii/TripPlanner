"use client";

import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import CityFilter from "./CityFilter";
import CountryFilter from "./CountryFilter";
import TabNavigation from "./TabNavigation";

type ThemeMode = 'light' | 'dark';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { country, setCountry, city, setCity, cities, tab, setTab } = useAppContext();

  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode | null;
    const mode = savedTheme || 'light';
    setTheme(mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('themeMode', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <div className="app-page min-h-screen">
      <div className={`app-header flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-end px-3 sm:px-4 py-2 sticky top-0 z-20 gap-2 sm:gap-3`}>
        <button
          onClick={toggleTheme}
          className={`app-theme-toggle px-3 py-2 rounded-lg text-sm font-bold transition ${theme === 'dark' ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
          <CountryFilter selected={country} onChange={setCountry} />
          <CityFilter selected={city} onChange={setCity} cities={cities} />
        </div>
      </div>
      <TabNavigation selected={tab} onSelect={setTab} />
      <main className="max-w-2xl md:max-w-5xl lg:max-w-7xl mx-auto p-2 sm:p-4">
        {children}
      </main>
    </div>
  );
}
