import React, { useState } from 'react';
import { FilteredMatch } from '../types';
import { calculateQualityScore } from '../utils/linkQuality';

interface MatchCardProps {
  match: FilteredMatch;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const [showAllLinks, setShowAllLinks] = useState(false);

  const formatTime = (time: string, date?: string) => {
    if (time === 'TBD' || !time) return 'TBD';
    if (time === 'Live' || time === 'LIVE') return 'LIVE';

    try {
      // Parse time in 24-hour format (HH:mm)
      const timeMatch = time.match(/^(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2];

        // Create a date object with today's date and the match time (assuming UTC)
        const matchDate = date ? new Date(date) : new Date();
        const utcDate = new Date(Date.UTC(
          matchDate.getFullYear(),
          matchDate.getMonth(),
          matchDate.getDate(),
          hours,
          parseInt(minutes, 10)
        ));

        // Convert to user's local time and format as 12-hour
        const localTime = utcDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        // Get timezone abbreviation
        const timezone = utcDate.toLocaleTimeString('en-US', {
          timeZoneName: 'short'
        }).split(' ').pop();

        return `${localTime} ${timezone}`;
      }

      return time;
    } catch {
      return time;
    }
  };

  const getCompetitionColor = (competition: string) => {
    const comp = competition.toLowerCase();
    if (comp.includes('premier league')) return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md';
    if (comp.includes('champions league')) return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md';
    if (comp.includes('europa league')) return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md';
    if (comp.includes('la liga')) return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md';
    if (comp.includes('serie a')) return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md';
    if (comp.includes('bundesliga')) return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md';
    if (comp.includes('ligue 1')) return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md';
    return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md';
  };

  const getCompetitionIcon = (competition: string) => {
    const comp = competition.toLowerCase();
    if (comp.includes('premier league')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    if (comp.includes('champions league')) return '🏆';
    if (comp.includes('europa league')) return '🥈';
    if (comp.includes('la liga')) return '🇪🇸';
    if (comp.includes('serie a')) return '🇮🇹';
    if (comp.includes('bundesliga')) return '🇩🇪';
    if (comp.includes('ligue 1')) return '🇫🇷';
    return '⚽';
  };

  const getStreamTypeIcon = (type: string) => {
    switch (type) {
      case 'acestream':
        return <span className="text-sm">🚀</span>;
      case 'sopcast':
        return <span className="text-sm">📡</span>;
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
        );
    }
  };

  const getQualityScore = (link: any) => {
    try {
      const metrics = calculateQualityScore(link);
      return Math.round(metrics.score);
    } catch {
      return 5; // Default score
    }
  };

  // Handle both new 'links' format and legacy 'streamLinks' format
  const streamLinks = match.links || match.streamLinks || [];
  const displayLinks = streamLinks.map((link: any) => {
    // For DaddyLive channel IDs, route through our stream page
    const url = match.source === 'daddylive' || match.source === 'magnetic'
      ? `/player/${link.url}`
      : link.url;

    return {
      url,
      quality: link.quality || 'HD',
      type: link.type || 'stream',
      language: link.channelName || link.language || 'English'
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 overflow-hidden">
      {/* Match Header */}
      <div className="bg-gradient-to-r from-arsenalBeige to-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 ${getCompetitionColor(match.competition)}`}>
              <span>{getCompetitionIcon(match.competition)}</span>
              <span>{match.competition}</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium text-gray-700">
              {formatTime(match.time, match.date)}
            </div>
            {(match.time === 'Live' || match.time === 'LIVE') && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
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
          {displayLinks.slice(0, 3).map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full text-white text-center py-3 px-4 rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-arsenalRed focus:ring-offset-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                index === 0
                  ? 'bg-gradient-to-r from-arsenalRed to-red-600 hover:from-red-700 hover:to-red-800'
                  : index === 1
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              }`}
              aria-label={`Watch ${match.homeTeam} vs ${match.awayTeam} live stream ${index + 1}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStreamTypeIcon(link.type)}
                  <span>
                    {index === 0 ? 'Primary Stream' : `Alt Stream ${index}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {link.quality && (
                    <span className="text-xs bg-white bg-opacity-25 px-2 py-1 rounded font-semibold">
                      {link.quality}
                    </span>
                  )}
                  {link.language && link.language !== 'English' && (
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                      {link.language}
                    </span>
                  )}
                  <span className="text-xs opacity-75">
                    {getQualityScore(link)}⭐
                  </span>
                </div>
              </div>
            </a>
          ))}

          {displayLinks.length > 3 && (
            <button
              onClick={() => setShowAllLinks(!showAllLinks)}
              className="w-full text-gray-600 text-center py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              {showAllLinks ? 'Show Less' : `+${displayLinks.length - 3} More Links`}
            </button>
          )}

          {showAllLinks && displayLinks.slice(3).map((link, index) => (
            <a
              key={index + 3}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-center py-2 px-4 rounded-lg transition-colors duration-200"
              aria-label={`Watch ${match.homeTeam} vs ${match.awayTeam} alternative stream ${index + 4}`}
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {getStreamTypeIcon(link.type)}
                  <span>Stream {index + 4}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {link.quality && (
                    <span className="text-xs bg-gray-300 px-2 py-1 rounded">
                      {link.quality}
                    </span>
                  )}
                  <span className="text-xs">
                    {getQualityScore(link)}⭐
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-3 text-xs text-gray-500 text-center">
          Source: {match.source} • {match.date} • {displayLinks.length} stream{displayLinks.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
