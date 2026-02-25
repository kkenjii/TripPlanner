"use client";

import React from 'react';

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-card rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 transition-colors duration-200">
      {children}
    </div>
  );
}
