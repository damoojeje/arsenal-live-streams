import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface EnhancedPlayerProps {
  channelId: string;
}

/**
 * Enhanced Player with Stream Extraction
 * Attempts ad-free HLS playback with iframe fallback
 *
 * Flow:
 * 1. Call /api/stream/extract/[channelId]
 * 2. If m3u8 URL extracted → Play with HLS.js (AD-FREE!)
 * 3. If extraction fails → Fallback to iframe embed
 *
 * Key Features:
 * - Direct m3u8 playback (no ads, no popups)
 * - Automatic fallback for reliability
 * - HLS.js with error recovery
 * - Native HLS support for Safari
 */
const EnhancedPlayer: React.FC<EnhancedPlayerProps> = ({ channelId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playerMode, setPlayerMode] = useState<'loading' | 'hls' | 'iframe'>('loading');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Attempt to extract stream URL
  useEffect(() => {
    let mounted = true;

    const extractStream = async () => {
      try {
        setPlayerMode('loading');
        setError(null);

        console.log(`Attempting stream extraction for channel ${channelId}...`);

        const response = await fetch(`/api/stream/extract/${channelId}`);
        const data = await response.json();

        if (!mounted) return;

        if (data.success && data.streamUrl) {
          console.log(`✅ Stream URL extracted: ${data.streamUrl}`);
          setStreamUrl(data.streamUrl);
          setPlayerMode('hls');
        } else {
          console.log(`⚠️ Stream extraction failed: ${data.error}`);
          setError(data.error || 'Extraction failed');
          setPlayerMode('iframe');
        }
      } catch (err) {
        if (!mounted) return;

        console.error(`❌ Error during extraction:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPlayerMode('iframe');
      }
    };

    extractStream();

    return () => {
      mounted = false;
    };
  }, [channelId]);

  // Initialize HLS player
  useEffect(() => {
    if (playerMode !== 'hls' || !streamUrl || !videoRef.current) {
      return;
    }

    const video = videoRef.current;

    if (Hls.isSupported()) {
      console.log('Initializing HLS.js player...');

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest parsed, starting playback...');
        video.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => {
            console.warn('Autoplay prevented (user interaction required):', err);
          });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data.type, data.details, data);

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Network error, attempting recovery...');
              hls.startLoad();
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Media error, attempting recovery...');
              hls.recoverMediaError();
              break;

            default:
              console.error('Fatal error, falling back to iframe...');
              setError('HLS playback failed');
              setPlayerMode('iframe');
              break;
          }
        }
      });

      return () => {
        console.log('Destroying HLS player');
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      console.log('Using native HLS support (Safari)...');

      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.warn('Autoplay prevented:', err));
      });

      video.addEventListener('error', () => {
        console.error('Native HLS error, falling back to iframe...');
        setError('Native HLS playback failed');
        setPlayerMode('iframe');
      });
    } else {
      console.warn('HLS not supported, falling back to iframe...');
      setError('HLS not supported in this browser');
      setPlayerMode('iframe');
    }
  }, [playerMode, streamUrl]);

  const iframeUrl = `https://dlhd.dad/stream/stream-${channelId}.php`;

  return (
    <div className="relative w-full h-full bg-black">
      {/* Loading State */}
      {playerMode === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-arsenalRed border-t-transparent mx-auto mb-4"></div>
            <p className="text-white text-xl font-medium mb-2">Extracting ad-free stream...</p>
            <p className="text-gray-400 text-sm">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Success Badge - HLS Mode */}
      {playerMode === 'hls' && isPlaying && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-30 flex items-center space-x-2 animate-fade-in">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">Ad-Free Stream</span>
        </div>
      )}

      {/* Warning Badge - Iframe Fallback */}
      {playerMode === 'iframe' && (
        <div className="absolute top-4 right-4 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg z-30 max-w-xs">
          <p className="font-semibold text-sm mb-1">Using Fallback Player</p>
          <p className="text-xs opacity-90">
            {error || 'Could not extract direct stream'}
          </p>
          <p className="text-xs mt-1 opacity-75">
            💡 Tip: Use an ad blocker for best experience
          </p>
        </div>
      )}

      {/* HLS Video Player (Ad-Free!) */}
      {playerMode === 'hls' && streamUrl && (
        <video
          ref={videoRef}
          className="w-full h-full bg-black"
          controls
          playsInline
          autoPlay
          controlsList="nodownload"
        />
      )}

      {/* Iframe Fallback (With Ads) */}
      {playerMode === 'iframe' && (
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          title={`Stream Channel ${channelId}`}
        />
      )}
    </div>
  );
};

export default EnhancedPlayer;
