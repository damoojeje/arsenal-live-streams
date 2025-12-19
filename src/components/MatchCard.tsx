import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FilteredMatch } from '../types';
import { getTeamLogo, getTeamInitials } from '../services/teamLogos';
import { toggleFavoriteTeam, isFavoriteTeam } from '../services/favorites';
import { parseMatchTime } from '../utils/matchTime';

interface MatchCardProps {
  match: FilteredMatch;
  onFavoriteChange?: () => void;
}

/**
 * Team Badge Component
 * Shows team logo with graceful fallback to initials
 */
const TeamBadge: React.FC<{ teamName: string; size?: 'sm' | 'md' | 'lg' }> = ({ teamName, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl = getTeamLogo(teamName);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const textSizes = {
    sm: 'text-[8px]',
    md: 'text-xs',
    lg: 'text-sm'
  };

  if (logoUrl && !imgError) {
    return (
      <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-white/5 flex-shrink-0 ring-1 ring-white/10`}>
        <Image
          src={logoUrl}
          alt={teamName}
          fill
          className="object-contain p-1"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center flex-shrink-0 ring-1 ring-white/10`}>
      <span className={`${textSizes[size]} font-semibold text-white/60`}>
        {getTeamInitials(teamName)}
      </span>
    </div>
  );
};

const MatchCard: React.FC<MatchCardProps> = ({ match, onFavoriteChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsFavorite(isFavoriteTeam(match.homeTeam) || isFavoriteTeam(match.awayTeam));
  }, [match.homeTeam, match.awayTeam]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteTeam(match.homeTeam);
    setIsFavorite(!isFavorite);
    onFavoriteChange?.();
  };

  const timeInfo = parseMatchTime(match.time);
  const isLive = timeInfo.isLive || match.time?.toLowerCase().includes('live');
  
  const formatTime = () => {
    if (isLive) return null; // We'll show a special badge
    if (timeInfo.isTBD) return 'TBD';
    
    const time = match.time;
    if (!time) return 'TBD';
    
    const timeMatch = time.match(/^(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const h = parseInt(timeMatch[1]);
      const m = timeMatch[2];
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    }
    return time;
  };

  const streamLinks = match.links || match.streamLinks || [];
  const isDaddyLive = match.source === 'daddylive' || match.source === 'magnetic';
  const primaryLink = streamLinks[0];

  const getStreamUrl = (link: { url: string }) => {
    if (isDaddyLive) {
      return `/player/${link.url}`;
    }
    return link.url;
  };

  return (
    <div 
      className="group relative bg-[#161616] hover:bg-[#1a1a1a] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Live Indicator Bar */}
      {isLive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-red-500 animate-pulse" />
      )}

      <div className="p-5">
        {/* Header: Competition & Time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/15 text-red-400 rounded-full text-xs font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="text-white/40 text-xs font-medium tracking-wide">{formatTime()}</span>
            )}
            <span className="text-white/20">•</span>
            <span className="text-white/40 text-xs truncate" title={match.competition}>
              {match.competition}
            </span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className={`p-1.5 -mr-1 rounded-full transition-all duration-200 ${
              isFavorite 
                ? 'text-amber-400 bg-amber-400/10' 
                : 'text-white/20 hover:text-white/40 hover:bg-white/5'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>

        {/* Teams Section */}
        <div className="flex items-center justify-between gap-4 mb-5">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0">
            <TeamBadge teamName={match.homeTeam} size="md" />
            <span className="mt-2 text-sm font-medium text-white/90 line-clamp-2 leading-tight">
              {match.homeTeam}
            </span>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center px-2">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white/30 tracking-wider">VS</span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center text-center min-w-0">
            <TeamBadge teamName={match.awayTeam} size="md" />
            <span className="mt-2 text-sm font-medium text-white/90 line-clamp-2 leading-tight">
              {match.awayTeam}
            </span>
          </div>
        </div>

        {/* Watch Button */}
        {streamLinks.length > 0 ? (
          <div className="relative" ref={dropdownRef}>
            <div className="flex rounded-xl overflow-hidden">
              {/* Main Button */}
              <a
                href={getStreamUrl(primaryLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-semibold py-3 px-4 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Watch Now
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* Dropdown Toggle */}
              {streamLinks.length > 1 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="px-3 bg-red-700 hover:bg-red-600 text-white transition-colors border-l border-red-600/50"
                  aria-label={`${streamLinks.length - 1} more streams`}
                >
                  <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Stream Count Badge */}
            {streamLinks.length > 1 && !isDropdownOpen && (
              <span className="absolute -top-2 -right-2 bg-white/10 backdrop-blur-sm text-white/70 text-[10px] font-medium px-1.5 py-0.5 rounded-full ring-1 ring-white/10">
                +{streamLinks.length - 1}
              </span>
            )}

            {/* Dropdown Menu */}
            {isDropdownOpen && streamLinks.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
                <div className="max-h-48 overflow-y-auto">
                  {streamLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={getStreamUrl(link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white/40">{idx + 1}</span>
                        </div>
                        <span className="text-white/80 text-sm font-medium">
                          {link.channelName || `Stream ${idx + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/30 text-xs">{link.quality || 'HD'}</span>
                        <svg className="w-3 h-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-white/30 text-xs py-3 bg-white/[0.02] rounded-xl">
            No streams available yet
          </div>
        )}
      </div>

      {/* Source Indicator (subtle) */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-[9px] font-medium text-white/20 uppercase tracking-wider">{match.source}</span>
      </div>
    </div>
  );
};

export default MatchCard;
