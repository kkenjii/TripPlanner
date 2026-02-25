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
  globalCache: Record<string, any>;
  getCachedData: (key: string) => any;
  setCachedData: (key: string, data: any) => void;
  clearCache: (key?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [tab, setTab] = useState(tabs[0]);
  const [globalCache, setGlobalCache] = useState<Record<string, any>>({});

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

  const getCachedData = (key: string) => globalCache[key];
  
  const setCachedData = (key: string, data: any) => {
    setGlobalCache(prev => ({ ...prev, [key]: data }));
  };
  
  const clearCache = (key?: string) => {
    if (key) {
      setGlobalCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    } else {
      setGlobalCache({});
    }
  };

  return (
    <AppContext.Provider value={{ country, setCountry, city, setCity, cities, tab, setTab, globalCache, getCachedData, setCachedData, clearCache }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
