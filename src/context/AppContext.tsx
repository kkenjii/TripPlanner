"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

const citiesByCountry: Record<string, string[]> = {
  Japan: ['Tokyo', 'Osaka', 'Kyoto', 'Sapporo', 'Fukuoka'],
  'Hong Kong': ['Central', 'Tsim Sha Tsui', 'Mong Kok', 'Causeway Bay', 'Lantau Island'],
  Thailand: ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi'],
  Malaysia: ['Kuala Lumpur', 'Penang', 'Johor Bahru', 'Malacca', 'Kota Kinabalu'],
};
const tabs = ['trending', 'food', 'guide'];

interface AppContextType {
  country: string;
  setCountry: (country: string) => void;
  city: string;
  setCity: (city: string) => void;
  cities: string[];
  tab: string;
  setTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [tab, setTab] = useState(tabs[0]);

  useEffect(() => {
    if (country) {
      const nextCities = citiesByCountry[country] || [];
      setCities(nextCities);
      setCity(nextCities[0] || '');
    } else {
      setCities([]);
      setCity('');
    }
  }, [country]);

  return (
    <AppContext.Provider value={{ country, setCountry, city, setCity, cities, tab, setTab }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
