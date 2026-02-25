"use client";

export default function SkeletonCard() {
  return (
    <div className="app-card p-4 animate-pulse">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="w-12 h-12 bg-gray-300 rounded flex-shrink-0"></div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
  );
}
