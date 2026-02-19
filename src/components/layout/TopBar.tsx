'use client';

import { useState } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  return (
    <header className="h-14 bg-dark-card border-b border-dark-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-dark-muted">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 pl-9 text-sm text-white placeholder-dark-muted focus:outline-none focus:border-accent-blue"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted">🔍</span>
        </div>
        
        {/* Pause Button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isPaused
              ? 'bg-accent-yellow/20 text-accent-yellow'
              : 'bg-dark-bg border border-dark-border text-dark-muted hover:text-white'
          }`}
        >
          {isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </button>
        
        {/* User */}
        <div className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center text-white text-sm font-medium">
          D
        </div>
      </div>
    </header>
  );
}
