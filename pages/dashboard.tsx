import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../src/components/Header';
import MatchList from '../src/components/MatchList';
import { FilteredMatch } from '../src/types';

interface HomePageProps {
  initialMatches?: FilteredMatch[];
}

const HomePage: React.FC<HomePageProps> = ({ initialMatches = [] }) => {
  const router = useRouter();
  const [matches, setMatches] = useState<FilteredMatch[]>(initialMatches);
  const [filteredMatches, setFilteredMatches] = useState<FilteredMatch[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('All Clubs');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('All Competitions');
  const [selectedCountry, setSelectedCountry] = useState<string>('All Countries');
  const [hasPassedLanding, setHasPassedLanding] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/magnetic-games');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMatches(data);
      setFilteredMatches(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort matches based on selected team, competition, and country
  useEffect(() => {
    let filtered = matches;

    // Filter by team
    if (selectedTeam !== 'All Clubs') {
      filtered = filtered.filter(match =>
        match.homeTeam.toLowerCase().includes(selectedTeam.toLowerCase()) ||
        match.awayTeam.toLowerCase().includes(selectedTeam.toLowerCase())
      );
    }

    // Filter by competition
    if (selectedCompetition !== 'All Competitions') {
      filtered = filtered.filter(match =>
        match.competition.toLowerCase().includes(selectedCompetition.toLowerCase())
      );
    }

    // Filter by country
    if (selectedCountry !== 'All Countries') {
      filtered = filtered.filter(match => {
        const comp = match.competition.toLowerCase();
        const country = selectedCountry.toLowerCase();

        // Match country prefix in competition name
        if (country === 'england') return comp.includes('england') || comp.includes('premier') || comp.includes('championship') || comp.includes('efl');
        if (country === 'spain') return comp.includes('spain') || comp.includes('la liga');
        if (country === 'italy') return comp.includes('italy') || comp.includes('serie');
        if (country === 'germany') return comp.includes('germany') || comp.includes('bundesliga');
        if (country === 'france') return comp.includes('france') || comp.includes('ligue');
        if (country === 'brazil') return comp.includes('brazil') || comp.includes('brasileir');
        if (country === 'usa') return comp.includes('major league soccer') || comp.includes('mls');
        if (country === 'europe') return comp.includes('uefa') || comp.includes('champions') || comp.includes('europa');
        if (country === 'asia') return comp.includes('asia') || comp.includes('afc');

        return true;
      });
    }

    // Remove matches that started more than 2 hours 30 minutes ago
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - (2 * 60 * 60 * 1000 + 30 * 60 * 1000)); // 2h 30min

    filtered = filtered.filter(match => {
      // Keep live matches
      if (match.time?.toLowerCase() === 'live') {
        return true;
      }

      // Keep TBD matches
      if (!match.time || match.time.toLowerCase() === 'tbd') {
        return true;
      }

      // Check if match time is in the past
      const timeMatch = match.time.match(/^(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);

        // Create date object for match time (today)
        const matchTime = new Date(now);
        matchTime.setHours(hours, minutes, 0, 0);

        // If match time is in the future (later today), keep it
        if (matchTime > now) {
          return true;
        }

        // If match was more than 2h 30min ago, remove it
        if (matchTime < cutoffTime) {
          return false;
        }
      }

      return true; // Keep if we can't determine time
    });

    // Sort matches by time
    filtered = filtered.sort((a, b) => {
      // Live matches always come first
      const aIsLive = a.time?.toLowerCase() === 'live';
      const bIsLive = b.time?.toLowerCase() === 'live';

      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;
      if (aIsLive && bIsLive) return 0;

      // TBD matches go to the end
      const aIsTBD = !a.time || a.time.toLowerCase() === 'tbd';
      const bIsTBD = !b.time || b.time.toLowerCase() === 'tbd';

      if (aIsTBD && !bIsTBD) return 1;
      if (!aIsTBD && bIsTBD) return -1;
      if (aIsTBD && bIsTBD) return 0;

      // Parse time strings for comparison (HH:mm format)
      const parseTime = (timeStr: string): number => {
        const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
        if (match) {
          const hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          return hours * 60 + minutes; // Convert to total minutes
        }
        return 9999; // Invalid time goes to the end
      };

      const aMinutes = parseTime(a.time || '');
      const bMinutes = parseTime(b.time || '');

      return aMinutes - bMinutes; // Ascending order (earliest first)
    });

    setFilteredMatches(filtered);
  }, [selectedTeam, selectedCompetition, selectedCountry, matches]);

  // Check if user has passed landing page verification (client-side only)
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
    // Fetch live games from magnetic.website
    if (hasPassedLanding) {
      fetchMatches();
    }
  }, [hasPassedLanding]);

  // Auto-refresh every 10 minutes (reduced frequency for better performance)
  useEffect(() => {
    const interval = setInterval(fetchMatches, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Show loading while checking verification
  if (!hasPassedLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-red-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <div className="animate-bounce">
              <div className="w-20 h-20 mx-auto mb-4">
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-600 rounded-lg shadow-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Arsenal</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-700 font-semibold text-lg">Verifying Gooner status...</p>
          <p className="text-sm text-gray-500 mt-2">🔴 Checking your Arsenal allegiance</p>
          <div className="mt-4">
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-arsenalRed rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-arsenalRed rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-arsenalRed rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>lolli - Live Stream Links for Top Football Clubs</title>
        <meta
          name="description"
          content="Instant live-stream links for top Premier & Champions League clubs—no ads, no clutter. Arsenal, Chelsea, Manchester City, Liverpool, Barcelona, Real Madrid and more."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#DB0007" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 font-sf-pro">
        <Header
          selectedTeam={selectedTeam}
          onTeamChange={setSelectedTeam}
          selectedCompetition={selectedCompetition}
          onCompetitionChange={setSelectedCompetition}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
        />

        <main className="max-w-7xl mx-auto px-4 py-8">

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <h2 className="text-3xl font-bold text-gray-900">
                  Live Matches
                  {selectedTeam !== 'All Clubs' && (
                    <span className="text-xl font-normal text-gray-600 ml-2">
                      - {selectedTeam}
                    </span>
                  )}
                </h2>
                {filteredMatches.length > 0 && (
                  <span className="bg-gradient-to-r from-arsenalRed to-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                    {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''} available
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {lastUpdated && (
                  <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-md">
                    ⏰ Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
                <button
                  onClick={fetchMatches}
                  disabled={loading}
                  className="bg-gradient-to-r from-arsenalRed to-red-600 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-arsenalRed focus:ring-offset-2 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing...
                    </span>
                  ) : (
                    '🔄 Refresh Matches'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Match List */}
          <MatchList
            matches={filteredMatches}
            loading={loading}
            error={error || undefined}
          />

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-gray-200">
            <div className="text-center text-gray-600 space-y-4">
              <p className="text-lg font-medium text-gray-800">
                Live streaming links aggregated from multiple sources
              </p>

              {/* Premier League Fantasy Link */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-4 mx-auto max-w-md">
                <p className="text-sm font-medium mb-2">⚽ Play Fantasy Football</p>
                <a
                  href="https://www.premierleague.com/en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-white text-purple-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors duration-200"
                >
                  🏆 Premier League Fantasy
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* Developer Credit */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm">
                  Designed and developed by{' '}
                  <a
                    href="https://github.com/damoojeje/arsenal-live-streams"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-arsenalRed hover:text-red-700 font-medium underline"
                  >
                    damoojeje
                  </a>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  🔴 Arsenal till I die!
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default HomePage;
