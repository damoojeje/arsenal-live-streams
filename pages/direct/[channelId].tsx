import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Dynamically import HLS player to avoid SSR issues
const HLSPlayer = dynamic(() => import('../../src/components/HLSPlayer'), {
  ssr: false,
});

const DirectStreamPage: React.FC = () => {
  const router = useRouter();
  const { channelId } = router.query;
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackToIframe, setFallbackToIframe] = useState(false);

  useEffect(() => {
    if (!channelId || typeof channelId !== 'string') return;

    const extractStream = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call our extraction API
        const response = await fetch(`/api/direct/${channelId}`);
        const data = await response.json();

        if (data.error || data.fallback) {
          throw new Error(data.error || 'Extraction failed');
        }

        setStreamUrl(data.url);
        setHeaders(data.headers || {});
        setLoading(false);
      } catch (err) {
        console.error('Stream extraction failed:', err);
        setError('Failed to extract direct stream');
        setLoading(false);
        // Fallback to iframe after 3 seconds
        setTimeout(() => {
          setFallbackToIframe(true);
        }, 3000);
      }
    };

    extractStream();
  }, [channelId]);

  const handlePlayerError = () => {
    // If HLS player fails, fallback to iframe
    setFallbackToIframe(true);
  };

  if (!channelId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Invalid channel ID</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Direct Stream - Arsenal Live Streams</title>
        <meta name="description" content="Ad-free direct stream playback" />
      </Head>

      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="bg-gradient-to-r from-arsenalRed to-red-700 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold">
                Direct Stream (No Ads)
              </h1>
              <p className="text-red-100 text-sm mt-1">
                Channel ID: {channelId}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-white text-arsenalRed px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Player Area */}
        <div className="w-full h-screen pt-20">
          {loading && !fallbackToIframe && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-arsenalRed border-t-transparent mx-auto mb-4"></div>
                <p className="text-white text-xl mb-2">Extracting direct stream...</p>
                <p className="text-gray-400 text-sm">This may take 10-15 seconds</p>
                <div className="mt-6 text-left inline-block">
                  <p className="text-gray-500 text-xs mb-2">Processing steps:</p>
                  <ul className="text-gray-400 text-xs space-y-1">
                    <li>✓ Resolving DaddyLive domain</li>
                    <li>✓ Fetching stream page</li>
                    <li>⏳ Parsing iframe chain...</li>
                    <li>⏳ Extracting authentication tokens...</li>
                    <li>⏳ Getting server assignment...</li>
                    <li>⏳ Building m3u8 URL...</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && !fallbackToIframe && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-20 h-20 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-white text-xl mb-2">Extraction Failed</p>
                <p className="text-gray-400 mb-4">{error}</p>
                <p className="text-gray-500 text-sm">Falling back to iframe player in 3 seconds...</p>
              </div>
            </div>
          )}

          {streamUrl && !fallbackToIframe && (
            <div className="h-full">
              <HLSPlayer
                src={streamUrl}
                headers={headers}
                onError={handlePlayerError}
              />
            </div>
          )}

          {fallbackToIframe && (
            <div className="h-full flex flex-col">
              <div className="bg-yellow-900 bg-opacity-50 px-6 py-3 text-center">
                <p className="text-yellow-200 text-sm">
                  ⚠️ Direct extraction failed - using iframe fallback (with ads)
                </p>
              </div>
              <iframe
                src={`https://dlhd.dad/stream/stream-${channelId}.php`}
                className="w-full flex-1"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Info Banner */}
        {!loading && streamUrl && !fallbackToIframe && (
          <div className="fixed bottom-4 right-4 bg-green-900 bg-opacity-90 px-6 py-3 rounded-lg shadow-lg">
            <p className="text-green-200 text-sm font-semibold">
              ✅ Direct Stream Active - No Ads!
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default DirectStreamPage;
