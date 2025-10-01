import React from 'react';
import { FilteredMatch } from '../types';
import MatchCard from './MatchCard';

interface MatchListProps {
  matches: FilteredMatch[];
  loading?: boolean;
  error?: string;
}

const MatchList: React.FC<MatchListProps> = ({ matches, loading, error }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading header */}
        <div className="flex justify-center items-center py-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-arsenalRed border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-arsenalRed rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Fetching Live Matches</h3>
          <p className="text-gray-500">Aggregating streams from multiple sources...</p>
        </div>

        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-arsenalRed opacity-20 rounded w-8"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-10 bg-arsenalRed opacity-20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          {/* Error icon */}
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Matches
          </h3>
          <p className="text-gray-600 mb-6">
            We're having trouble fetching live streams right now. This could be due to network issues or source availability.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-arsenalRed hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-arsenalRed focus:ring-offset-2"
            >
              🔄 Try Again
            </button>

            <details className="text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600 font-mono">
                {error}
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          {/* Empty state icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-arsenalBeige rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-arsenalRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Live Matches Right Now
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any live matches for your selected teams. Check back soon or try selecting "All Clubs" to see more matches.
          </p>

          <div className="space-y-3">
            <div className="text-sm text-gray-500">
              <p>✅ Checking Sportsurge</p>
              <p>✅ Checking TotalSportek</p>
              <p>✅ Checking Streamed.pk</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
};

export default MatchList;
