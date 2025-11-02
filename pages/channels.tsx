import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Channel } from '../src/services/daddylive/channelsService';

const ChannelsPage: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    filterChannels();
  }, [channels, searchQuery, selectedCategory]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/channels');
      const data = await response.json();
      setChannels(data);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(data.map((ch: Channel) => ch.category).filter(Boolean))
      ).sort();
      setCategories(['All', ...uniqueCategories] as string[]);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterChannels = () => {
    let filtered = channels;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ch =>
        ch.name.toLowerCase().includes(query) ||
        ch.category?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(ch => ch.category === selectedCategory);
    }

    setFilteredChannels(filtered);
  };

  return (
    <>
      <Head>
        <title>24/7 Live Channels - Lolli Live Streams</title>
        <meta name="description" content="Browse 800+ 24/7 live sports channels including Sky Sports, ESPN, beIN Sports, and more" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header */}
        <div className="bg-black bg-opacity-50 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">📺 24/7 Live Channels</h1>
                <p className="text-gray-400 mt-1">{channels.length} channels available</p>
              </div>
              <Link href="/dashboard" className="px-4 py-2 bg-arsenalRed hover:bg-red-700 text-white rounded-lg transition-colors">
                ← Back to Matches
              </Link>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search channels (e.g., Sky Sports, ESPN, beIN)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-gray-800 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-arsenalRed focus:border-transparent"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-arsenalRed text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-gray-400">
            {loading ? 'Loading...' : `Showing ${filteredChannels.length} of ${channels.length} channels`}
          </div>

          {/* Channels Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-arsenalRed"></div>
              <p className="text-gray-400 mt-4">Loading channels...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredChannels.map(channel => (
                <Link
                  key={channel.id}
                  href={`/player/${channel.id}`}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-arsenalRed hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm group-hover:text-arsenalRed transition-colors capitalize">
                        {channel.name}
                      </h3>
                      {channel.category && (
                        <p className="text-xs text-gray-400 mt-1">{channel.category}</p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-arsenalRed transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && filteredChannels.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No channels found matching your search.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-4 px-6 py-2 bg-arsenalRed hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ChannelsPage;
