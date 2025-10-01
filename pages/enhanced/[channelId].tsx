import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import multi-source player (client-side only)
const MultiSourcePlayer = dynamic(() => import('../../src/components/MultiSourcePlayer'), {
  ssr: false,
});

interface StreamSource {
  name: string;
  url: string;
  type: string;
  priority: number;
}

/**
 * Enhanced Multi-Source Stream Player
 * Supports automatic fallback between multiple aggregated sources
 * Built-in ad blocking without sandbox restrictions
 */

export default function EnhancedPlayerPage() {
  const router = useRouter();
  const { channelId } = router.query;
  const [sources, setSources] = useState<StreamSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channelId) return;

    // Fetch aggregated sources
    const fetchSources = async () => {
      try {
        const response = await fetch(`/api/aggregated-sources?channelId=${channelId}`);
        const data = await response.json();

        if (data.sources && data.sources.length > 0) {
          setSources(data.sources);
        } else {
          setError('No sources available');
        }
      } catch (err) {
        console.error('Error fetching sources:', err);
        setError('Failed to load stream sources');
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, [channelId]);

  if (!channelId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Channel</h1>
          <Link href="/dashboard" className="text-arsenalRed hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Head>
        <title>Enhanced Player - Arsenal Streams</title>
        <meta name="description" content="Multi-source stream player with ad blocking" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Header Bar */}
      <div className="bg-gradient-to-r from-arsenalRed to-red-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 hover:text-red-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Matches</span>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-red-100">
            Enhanced Player • {sources.length} source{sources.length !== 1 ? 's' : ''}
          </span>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-xs">LIVE</span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href={`/player/${channelId}`}
            className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded transition-colors"
          >
            Standard Player
          </Link>
        </div>
      </div>

      {/* Player Container */}
      <div
        className="relative w-full bg-black"
        style={{ height: 'calc(100vh - 60px)' }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-arsenalRed border-t-transparent mx-auto mb-4"></div>
              <p className="text-white text-xl">Loading sources...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xl mb-4">{error}</p>
              <Link
                href={`/player/${channelId}`}
                className="inline-block bg-arsenalRed hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Try Standard Player
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && sources.length > 0 && (
          <MultiSourcePlayer
            channelId={channelId as string}
            sources={sources}
          />
        )}
      </div>

      {/* Feature Info */}
      <div className="bg-gray-800 text-gray-300 px-4 py-4 text-sm">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl mb-1">🛡️</div>
            <div className="font-semibold">Ad Blocking</div>
            <div className="text-xs text-gray-400">Popups & redirects blocked</div>
          </div>
          <div>
            <div className="text-2xl mb-1">🔄</div>
            <div className="font-semibold">Multi-Source</div>
            <div className="text-xs text-gray-400">{sources.length} fallback option{sources.length !== 1 ? 's' : ''}</div>
          </div>
          <div>
            <div className="text-2xl mb-1">📱</div>
            <div className="font-semibold">Mobile Optimized</div>
            <div className="text-xs text-gray-400">Works on all devices</div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-900 text-gray-400 px-4 py-6 text-center text-xs space-y-3">
        <p className="text-sm">
          <strong className="text-gray-300">⚡ Enhanced Player</strong>
        </p>
        <p className="leading-relaxed max-w-2xl mx-auto">
          This enhanced player automatically tries multiple stream sources for reliability.
          Ad blocking is active to prevent popups and redirects. If one source fails,
          click the source switcher button to try alternatives.
        </p>
        <p className="text-gray-600 text-[10px] mt-4">
          Multi-source aggregation • Ad-blocked viewing • Mobile-ready
        </p>
      </div>
    </div>
  );
}
