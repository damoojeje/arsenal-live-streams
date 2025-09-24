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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-arsenalRed"></div>
        <span className="ml-3 text-lg text-gray-600">Loading matches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium mb-2">
          Error loading matches
        </div>
        <div className="text-gray-600">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-arsenalRed text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-lg mb-2">
          No matches found
        </div>
        <div className="text-gray-500">
          Check back later for live streaming links
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
