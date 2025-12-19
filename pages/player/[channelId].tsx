import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import player (client-side only)
const EnhancedPlayer = dynamic(() => import('../../src/components/EnhancedPlayer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
});

export default function PlayerPage() {
  const router = useRouter();
  const { channelId } = router.query;
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const el = document.getElementById('player-container');
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (!channelId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Invalid channel</p>
          <Link href="/dashboard" className="text-red-500 hover:text-red-400">
            ← Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      <Head>
        <title>Stream • lolli</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
      </Head>

      {/* Minimal Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <header className="flex items-center justify-between px-4 py-2 bg-black/90 border-b border-white/5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-white/50">Channel {channelId}</span>
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              title="Fullscreen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </header>
      )}

      {/* Player Container */}
      <div id="player-container" className="flex-1 relative bg-black">
        {channelId && <EnhancedPlayer channelId={channelId as string} />}
      </div>
    </div>
  );
}
