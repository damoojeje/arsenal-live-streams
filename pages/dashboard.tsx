import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MatchList from '../src/components/MatchList';
import { FilteredMatch } from '../src/types';
import { isMatchFavorited, getFavoritesCount } from '../src/services/favorites';
import { filterExpiredMatches, sortMatchesByTime } from '../src/utils/matchTime';

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [matches, setMatches] = useState<FilteredMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const [hasPassedLanding, setHasPassedLanding] = useState(false);

  // Extract unique competitions
  const competitions = useMemo(() => {
    const comps = new Set(matches.map(m => m.competition));
    return ['all', ...Array.from(comps).sort()];
  }, [matches]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    let filtered = [...matches];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.homeTeam.toLowerCase().includes(query) ||
        m.awayTeam.toLowerCase().includes(query) ||
        m.competition.toLowerCase().includes(query)
      );
    }

    if (selectedCompetition !== 'all') {
      filtered = filtered.filter(m => m.competition === selectedCompetition);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(m => isMatchFavorited(m.homeTeam, m.awayTeam));
    }

    if (showLiveOnly) {
      filtered = filtered.filter(m => 
        m.time?.toLowerCase() === 'live' || m.time?.toLowerCase() === 'live now'
      );
    }

    filtered = filterExpiredMatches(filtered);
    filtered = sortMatchesByTime(filtered);

    return filtered;
  }, [matches, searchQuery, selectedCompetition, showFavoritesOnly, showLiveOnly]);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/all-matches');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMatches(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasVerified = localStorage.getItem('lolli-gooner-verified');
      if (!hasVerified) {
        router.push('/');
      } else {
        setHasPassedLanding(true);
      }
    }
  }, [router]);

  useEffect(() => {
    if (hasPassedLanding) fetchMatches();
  }, [hasPassedLanding]);

  useEffect(() => {
    const interval = setInterval(fetchMatches, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll button visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      // Hide button when near bottom (within 200px)
      setShowScrollButton(scrollTop + clientHeight < scrollHeight - 200);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  const liveCount = matches.filter(m => m.time?.toLowerCase().includes('live')).length;
  const favCount = getFavoritesCount();

  if (!hasPassedLanding) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/50 mt-4 text-sm">Verifying...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>lolli • Live Football Streams</title>
        <meta name="description" content="Watch live football streams" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Header - Apple-style frosted glass */}
        <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-lg font-semibold tracking-tight hidden sm:block">lolli</span>
              </div>

              {/* Center Stats - Desktop */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                {liveCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-red-400 font-medium">{liveCount} Live</span>
                  </div>
                )}
                <span className="text-white/40">{matches.length} matches available</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Link
                  href="/channels"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  24/7 Channels
                </Link>

                <button
                  onClick={fetchMatches}
                  disabled={loading}
                  className="p-2.5 hover:bg-white/5 rounded-xl transition-all duration-200 disabled:opacity-50"
                  title="Refresh matches"
                >
                  <svg className={`w-5 h-5 text-white/60 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="sm:hidden p-2.5 hover:bg-white/5 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="sm:hidden border-t border-white/[0.06] py-3 space-y-1">
                <Link
                  href="/channels"
                  className="flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  24/7 Channels
                </Link>
                <Link
                  href="/help"
                  className="flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Help & FAQ
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/5 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Search & Filters - Apple style */}
          <div className="space-y-4 mb-8">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search teams or competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161616] border border-white/[0.08] rounded-2xl px-5 py-3.5 pl-12 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 transition-all duration-200"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/70 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Pills - Horizontal scroll on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {/* Competition Dropdown */}
              <div className="relative flex-shrink-0">
                <select
                  value={selectedCompetition}
                  onChange={(e) => setSelectedCompetition(e.target.value)}
                  className="appearance-none bg-[#1a1a1a] border border-white/[0.08] rounded-xl px-4 py-2.5 pr-10 text-sm text-white/70 focus:outline-none focus:ring-2 focus:ring-red-500/30 cursor-pointer transition-all"
                >
                  <option value="all">All Competitions</option>
                  {competitions.filter(c => c !== 'all').map(comp => (
                    <option key={comp} value={comp}>{comp}</option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Live Toggle */}
              <button
                onClick={() => setShowLiveOnly(!showLiveOnly)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  showLiveOnly 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' 
                    : 'bg-[#1a1a1a] border border-white/[0.08] text-white/60 hover:border-white/20'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${showLiveOnly ? 'bg-white' : 'bg-red-500'}`} />
                Live Only
              </button>

              {/* Favorites Toggle */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  showFavoritesOnly 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25' 
                    : 'bg-[#1a1a1a] border border-white/[0.08] text-white/60 hover:border-white/20'
                }`}
              >
                <svg className="w-4 h-4" fill={showFavoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Favorites
                {favCount > 0 && <span className="opacity-70">({favCount})</span>}
              </button>

              {/* Clear Filters */}
              {(searchQuery || selectedCompetition !== 'all' || showLiveOnly || showFavoritesOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCompetition('all');
                    setShowLiveOnly(false);
                    setShowFavoritesOnly(false);
                  }}
                  className="flex-shrink-0 text-sm text-white/40 hover:text-white/60 transition-colors underline underline-offset-2"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between text-xs text-white/40 px-1">
              <span>
                {filteredMatches.length === matches.length 
                  ? `${matches.length} matches` 
                  : `${filteredMatches.length} of ${matches.length} matches`
                }
              </span>
              {lastUpdated && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-white/70 mb-2">Unable to load matches</p>
              <p className="text-white/40 text-sm mb-6">{error}</p>
              <button
                onClick={fetchMatches}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-red-500/25"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Match List */}
          {!error && (
            <MatchList
              matches={filteredMatches}
              loading={loading}
              onFavoriteChange={() => {}}
            />
          )}

          {/* Empty State */}
          {!loading && !error && filteredMatches.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/5 flex items-center justify-center">
                <span className="text-4xl">⚽</span>
              </div>
              <p className="text-white/70 text-lg font-medium mb-2">No matches found</p>
              <p className="text-white/40 text-sm">Try adjusting your filters or search query</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-sm text-white/40">
                <Link href="/help" className="hover:text-white/60 transition-colors">Help</Link>
                <Link href="/channels" className="hover:text-white/60 transition-colors">Channels</Link>
                <Link href="/admin" className="hover:text-white/60 transition-colors">Admin</Link>
              </div>
              <p className="text-white/30 text-xs text-center sm:text-right">
                Streams aggregated from DaddyLive • Not affiliated with any broadcaster
              </p>
            </div>
          </div>
        </footer>

        {/* Scroll to Bottom Button */}
        {showScrollButton && filteredMatches.length > 6 && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-6 right-6 w-12 h-12 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 hover:border-white/20 rounded-full shadow-2xl shadow-black/50 flex items-center justify-center transition-all duration-200 hover:scale-105 z-40"
            title="Scroll to bottom"
          >
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
};

export default Dashboard;
