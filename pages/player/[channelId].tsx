import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import enhanced player with stream extraction (client-side only)
const EnhancedPlayer = dynamic(() => import('../../src/components/EnhancedPlayer'), {
  ssr: false,
});

/**
 * Stream Player Page with Ad-Free Direct Playback
 * Attempts to extract direct m3u8 URLs for ad-free streaming
 * Falls back to iframe if extraction fails
 * Mobile-optimized viewing experience
 */

export default function PlayerPage() {
  const router = useRouter();
  const { channelId } = router.query;
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Construct the iframe URL for DaddyLive
  const iframeUrl = channelId ? `https://dlhd.dad/stream/stream-${channelId}.php` : '';

  useEffect(() => {
    // Handle fullscreen events
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const playerContainer = document.getElementById('player-container');
    if (!playerContainer) return;

    if (!document.fullscreenElement) {
      playerContainer.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

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
        <title>Stream Player - Arsenal Streams</title>
        <meta name="description" content="Watch live stream" />
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
            DaddyLive • Channel {channelId}
          </span>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-xs">LIVE</span>
        </div>

        <button
          onClick={toggleFullscreen}
          className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span className="hidden sm:inline">Fullscreen</span>
        </button>
      </div>

      {/* Player Container with Ad Blocking */}
      <div
        id="player-container"
        className="relative w-full bg-black"
        style={{ height: 'calc(100vh - 60px)' }}
      >
        {channelId && (
          <EnhancedPlayer
            channelId={channelId as string}
          />
        )}
      </div>

      {/* Instructions/Info Bar */}
      {!isFullscreen && (
        <div className="bg-gray-800 text-gray-300 px-4 py-3 text-center text-sm">
          <p>
            🛡️ <strong>Built-in Ad Blocker Active:</strong> Popups blocked • New tabs prevented • Mobile optimized
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Click the Fullscreen button in the player for the best viewing experience.
          </p>
        </div>
      )}

      {/* Footer - Disclaimer */}
      {!isFullscreen && (
        <div className="bg-gray-900 text-gray-400 px-4 py-6 text-center text-xs space-y-3">
          <p className="text-sm">
            <strong className="text-gray-300">⚠️ Disclaimer</strong>
          </p>
          <p className="leading-relaxed">
            Streams are <strong>not hosted on our servers</strong>. This is a fork of DaddyLive streaming service.
            All content is provided by third-party sources and we do not host, upload, or control any of the streams.
          </p>
          <p className="leading-relaxed">
            <strong className="text-gray-300">🛡️ Built-in Protection:</strong><br />
            This player includes automatic ad blocking to prevent popups, new tabs, and overlay ads.
            Optimized for mobile devices - no external ad blocker needed.
          </p>
          <p className="text-gray-600 text-[10px] mt-4">
            Stream source: DaddyLive via Mad Titan Sports • Interface by lolli
          </p>
        </div>
      )}
    </div>
  );
}
