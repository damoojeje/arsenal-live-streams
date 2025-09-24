import React from 'react';
import { FilteredMatch } from '../types';

interface MatchCardProps {
  match: FilteredMatch;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const formatTime = (time: string) => {
    if (time === 'TBD' || !time) return 'TBD';
    return time;
  };

  const getCompetitionColor = (competition: string) => {
    const comp = competition.toLowerCase();
    if (comp.includes('premier league')) return 'bg-blue-100 text-blue-800';
    if (comp.includes('champions league')) return 'bg-purple-100 text-purple-800';
    if (comp.includes('europa league')) return 'bg-orange-100 text-orange-800';
    if (comp.includes('la liga')) return 'bg-yellow-100 text-yellow-800';
    if (comp.includes('serie a')) return 'bg-green-100 text-green-800';
    if (comp.includes('bundesliga')) return 'bg-red-100 text-red-800';
    if (comp.includes('ligue 1')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 overflow-hidden">
      {/* Match Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">
              {match.competition}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCompetitionColor(match.competition)}`}>
              {match.competition}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {formatTime(match.time)}
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="text-lg font-semibold text-gray-900 mb-1">
              {match.homeTeam}
            </div>
            <div className="text-sm text-gray-500">Home</div>
          </div>
          
          <div className="mx-4 text-center">
            <div className="text-2xl font-bold text-arsenalRed">VS</div>
            <div className="text-xs text-gray-500 mt-1">vs</div>
          </div>
          
          <div className="text-center flex-1">
            <div className="text-lg font-semibold text-gray-900 mb-1">
              {match.awayTeam}
            </div>
            <div className="text-sm text-gray-500">Away</div>
          </div>
        </div>
      </div>

      {/* Stream Links */}
      <div className="px-6 pb-6">
        <div className="space-y-2">
          {match.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-arsenalRed hover:bg-red-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-arsenalRed focus:ring-offset-2"
              aria-label={`Watch ${match.homeTeam} vs ${match.awayTeam} live stream`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
                <span>Watch Live</span>
                {link.quality && (
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                    {link.quality}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
        
        <div className="mt-3 text-xs text-gray-500 text-center">
          Source: {match.source} • {match.date}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
