import React from 'react';
import { FilteredMatch } from '../types';
import MatchCard from './MatchCard';

interface MatchListProps {
  matches: FilteredMatch[];
  loading?: boolean;
  error?: string;
  onFavoriteChange?: () => void;
}

const MatchList: React.FC<MatchListProps> = ({ matches, loading, error, onFavoriteChange }) => {
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading indicator */}
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm mt-4">Loading matches...</p>
        </div>

        {/* Skeleton cards - Apple style with subtle shimmer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="bg-[#161616] rounded-2xl p-5 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Header skeleton */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-14 bg-white/[0.06] rounded-full" />
                  <div className="h-3 w-20 bg-white/[0.04] rounded" />
                </div>
                <div className="w-6 h-6 bg-white/[0.04] rounded-full" />
              </div>

              {/* Teams skeleton */}
              <div className="flex items-center justify-between gap-4 mb-5">
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-white/[0.06] rounded-full" />
                  <div className="h-4 w-16 bg-white/[0.04] rounded" />
                </div>
                <div className="w-8 h-8 bg-white/[0.04] rounded-full" />
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-white/[0.06] rounded-full" />
                  <div className="h-4 w-16 bg-white/[0.04] rounded" />
                </div>
              </div>

              {/* Button skeleton */}
              <div className="h-12 bg-white/[0.06] rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-white/70 mb-2">Failed to load matches</p>
        <p className="text-white/40 text-sm mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-500/25"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return null; // Parent handles empty state
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match, index) => (
        <div
          key={match.id}
          style={{ 
            animationDelay: `${index * 50}ms`,
            animation: 'fadeInUp 0.4s ease-out forwards',
            opacity: 0
          }}
        >
          <MatchCard match={match} onFavoriteChange={onFavoriteChange} />
        </div>
      ))}
      
      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MatchList;
