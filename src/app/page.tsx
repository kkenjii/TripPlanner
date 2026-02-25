"use client";

import { useAppContext } from "../context/AppContext";
import FoodList from "../components/FoodList";
import GuideSection from "../components/GuideSection";
import TrendingList from "../components/TrendingList";

export default function Home() {
  const { tab, city, country } = useAppContext();
  if (tab === 'trending') {
    return <TrendingList city={city} country={country} />;
  }
  if (tab === 'food') {
    return <FoodList city={city} country={country} />;
  }
  if (tab === 'guide') {
    return <GuideSection city={city} country={country} />;
  }
  return null;
}
