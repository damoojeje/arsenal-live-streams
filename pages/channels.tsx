import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Channel } from '../src/services/daddylive/channelsService';

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'Sky Sports': '☁️',
  'TNT/BT Sports': '🔴',
  'ESPN': '📺',
  'beIN Sports': '🟢',
  'DAZN': '⚡',
  'SuperSport': '🌍',
  'Canal+': '➕',
  'Movistar': '📱',
  'Arena Sport': '🏟️',
  'Astro': '⭐',
  'Fox Sports': '🦊',
  'Eurosport': '🇪🇺',
  'NBA': '🏀',
  'NFL': '🏈',
  'MLB': '⚾',
  'Premier Sports': '👑',
  'Sports': '⚽',
  'News': '📰',
  'Movies': '🎬',
  'Premium': '💎',
  'PPV': '🎫',
  'General': '📡'
};

const ChannelsPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  // Scroll button visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      setShowScrollButton(scrollTop + clientHeight < scrollHeight - 200);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/channels');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch channels: ${response.status}`);
      }
      
      const data = await response.json();
      setChannels(data);
    } catch (err) {
      console.error('Error fetching channels:', err);
      setError(err instanceof Error ? err.message : 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(channels.map(ch => ch.category).filter(Boolean))
    ).sort();
    return ['All', ...uniqueCategories] as string[];
  }, [channels]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    let filtered = channels;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ch =>
        ch.name.toLowerCase().includes(query) ||
        ch.category?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(ch => ch.category === selectedCategory);
    }

    return filtered;
  }, [channels, searchQuery, selectedCategory]);

  // Group channels by category
  const groupedChannels = useMemo(() => {
    if (selectedCategory !== 'All') {
      return { [selectedCategory]: filteredChannels };
    }
    
    const grouped: Record<string, Channel[]> = {};
    filteredChannels.forEach(ch => {
      const cat = ch.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(ch);
    });
    return grouped;
  }, [filteredChannels, selectedCategory]);

  return (
    <>
      <Head>
        <title>24/7 Channels - lolli</title>
        <meta name="description" content="Browse 800+ 24/7 live sports channels" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Header - Apple frosted glass */}
        <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              {/* Back + Title */}
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard" 
                  className="p-2 -ml-2 hover:bg-white/5 rounded-xl transition-all text-white/60 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-lg font-semibold">24/7 Channels</h1>
                  <p className="text-xs text-white/40">
                    {loading ? 'Loading...' : `${channels.length} channels`}
                  </p>
                </div>
              </div>

              {/* Refresh */}
              <button
                onClick={fetchChannels}
                disabled={loading}
                className="p-2.5 hover:bg-white/5 rounded-xl transition-all disabled:opacity-50"
              >
                <svg className={`w-5 h-5 text-white/60 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Search & Filters */}
          <div className="space-y-4 mb-8">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161616] border border-white/[0.08] rounded-2xl px-5 py-3.5 pl-12 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Category Pills - Horizontal scroll */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                      : 'bg-[#1a1a1a] border border-white/[0.08] text-white/60 hover:border-white/20'
                  }`}
                >
                  {category !== 'All' && categoryIcons[category] && (
                    <span className="text-base">{categoryIcons[category]}</span>
                  )}
                  {category}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="text-xs text-white/40 px-1">
              {filteredChannels.length === channels.length 
                ? `${channels.length} channels` 
                : `${filteredChannels.length} of ${channels.length} channels`
              }
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-white/70 mb-6">{error}</p>
              <button
                onClick={fetchChannels}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-500/25"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && !error && (
            <div className="text-center py-20">
              <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white/40 mt-4 text-sm">Loading channels...</p>
            </div>
          )}

          {/* Channels Grid */}
          {!loading && !error && (
            <div className="space-y-10">
              {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
                <section key={category}>
                  {/* Category Header */}
                  {selectedCategory === 'All' && (
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xl">{categoryIcons[category] || '📡'}</span>
                      <h2 className="text-lg font-semibold text-white">{category}</h2>
                      <span className="text-white/30 text-sm">({categoryChannels.length})</span>
                    </div>
                  )}

                  {/* Channel Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {categoryChannels.map(channel => (
                      <a
                        key={channel.id}
                        href={`/player/${channel.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative bg-[#161616] hover:bg-[#1a1a1a] rounded-2xl p-4 transition-all duration-200 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5"
                      >
                        {/* Channel Number */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] text-white/30 font-medium">
                          #{channel.id}
                          <svg className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>

                        {/* Play Icon */}
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 flex items-center justify-center group-hover:from-red-500 group-hover:to-red-600 transition-all duration-300">
                          <svg 
                            className="w-5 h-5 text-red-500 group-hover:text-white transition-colors duration-300" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          </svg>
                        </div>

                        {/* Channel Name */}
                        <h3 className="text-white/90 text-sm font-medium text-center leading-tight line-clamp-2 group-hover:text-white transition-colors">
                          {channel.name}
                        </h3>

                        {/* Category Tag */}
                        {channel.category && selectedCategory === 'All' && (
                          <p className="text-center mt-2 text-[10px] text-white/30">
                            {channel.category}
                          </p>
                        )}
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredChannels.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/5 flex items-center justify-center">
                <span className="text-4xl">🔍</span>
              </div>
              <p className="text-white/70 text-lg font-medium mb-2">No channels found</p>
              <p className="text-white/40 text-sm mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-sm text-white/40">
                <Link href="/dashboard" className="hover:text-white/60 transition-colors">Matches</Link>
                <Link href="/help" className="hover:text-white/60 transition-colors">Help</Link>
              </div>
              <p className="text-white/30 text-xs">
                Streams provided by DaddyLive
              </p>
            </div>
          </div>
        </footer>

        {/* Scroll to Bottom Button */}
        {showScrollButton && filteredChannels.length > 12 && (
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

export default ChannelsPage;
