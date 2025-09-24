import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../src/components/Header';
import MatchList from '../src/components/MatchList';
import { FilteredMatch } from '../src/types';

interface HomePageProps {
  initialMatches?: FilteredMatch[];
}

const HomePage: React.FC<HomePageProps> = ({ initialMatches = [] }) => {
  const [matches, setMatches] = useState<FilteredMatch[]>(initialMatches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/matches');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMatches(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If no initial matches, fetch them
    if (initialMatches.length === 0) {
      fetchMatches();
    } else {
      setLastUpdated(new Date());
    }
  }, [initialMatches.length]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchMatches, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        <title>Arsenal Live Streams - Top European Football Clubs</title>
        <meta 
          name="description" 
          content="Live streaming links for Arsenal, Chelsea, Manchester City, Manchester United, Liverpool, Barcelona, Real Madrid, and other top European football clubs." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 font-sf-pro">
        <Header 
          title="Live Links for Top Clubs" 
          subtitle="Arsenal, Chelsea, Manchester City, Manchester United, Liverpool, Barcelona, Real Madrid & More"
        />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Live Matches
              </h2>
              {matches.length > 0 && (
                <span className="bg-arsenalRed text-white px-3 py-1 rounded-full text-sm font-medium">
                  {matches.length} match{matches.length !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <div className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={fetchMatches}
                disabled={loading}
                className="bg-arsenalRed hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-arsenalRed focus:ring-offset-2"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Match List */}
          <MatchList 
            matches={matches} 
            loading={loading} 
            error={error || undefined} 
          />

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-gray-200">
            <div className="text-center text-gray-600">
              <p className="mb-2">
                Live streaming links aggregated from multiple sources
              </p>
              <p className="text-sm">
                Designed and developed by{' '}
                <a 
                  href="https://github.com/damoojeje" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-arsenalRed hover:text-red-700 font-medium"
                >
                  damoojeje
                </a>
              </p>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default HomePage;
