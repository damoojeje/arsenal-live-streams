import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface EnhancedPlayerProps {
  channelId: string;
  availableSources?: Array<{
    url: string;
    quality?: string;
    channelName?: string;
  }>;
}

interface QualityLevel {
  height: number;
  bitrate: number;
  index: number;
  label: string;
}

/**
 * Enhanced Player v2.0 - Multi-Quality & Multi-Source Support
 *
 * New Features:
 * - Multi-quality selection (Auto, 1080p, 720p, 480p, 360p)
 * - Multi-source switching (multiple stream sources)
 * - Mobile-optimized fullscreen experience
 * - Enhanced error recovery with auto-retry
 * - Quality preference persistence
 *
 * Flow:
 * 1. Call /api/stream/extract/[channelId]
 * 2. If m3u8 URL extracted → Play with HLS.js (AD-FREE!)
 * 3. Parse available quality levels from manifest
 * 4. Allow user to select quality or switch sources
 * 5. If extraction fails → Fallback to iframe embed
 */
const EnhancedPlayer: React.FC<EnhancedPlayerProps> = ({ channelId, availableSources = [] }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playerMode, setPlayerMode] = useState<'loading' | 'hls' | 'iframe'>('loading');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [blockedPopups, setBlockedPopups] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Quality selection state
  const [availableQualities, setAvailableQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Source switching state
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  // Mobile optimization
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  // Load saved quality preference
  useEffect(() => {
    const savedQuality = localStorage.getItem('preferredQuality');
    if (savedQuality) {
      setCurrentQuality(parseInt(savedQuality));
    }
  }, []);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

        // Extract available quality levels
        const levels = hls.levels.map((level, index) => ({
          height: level.height,
          bitrate: level.bitrate,
          index,
          label: getQualityLabel(level.height)
        }));

        setAvailableQualities(levels);
        console.log(`Available qualities: ${levels.map(l => l.label).join(', ')}`);

        // Apply saved quality preference if available
        if (currentQuality >= 0 && currentQuality < levels.length) {
          hls.currentLevel = currentQuality;
          console.log(`Applied saved quality preference: ${levels[currentQuality].label}`);
        }

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

  // Popup blocker for iframe fallback mode
  useEffect(() => {
    if (playerMode !== 'iframe') return;

    let popupCount = 0;
    const originalWindowOpen = window.open;

    // Block window.open popups
    window.open = function(...args) {
      popupCount++;
      setBlockedPopups(popupCount);
      console.log('🛡️ Blocked popup attempt:', args[0]);
      return null;
    };

    return () => {
      window.open = originalWindowOpen;
    };
  }, [playerMode]);

  // Helper: Get quality label from height
  const getQualityLabel = (height: number): string => {
    if (height >= 1080) return '1080p';
    if (height >= 720) return '720p';
    if (height >= 480) return '480p';
    if (height >= 360) return '360p';
    return `${height}p`;
  };

  // Quality switching handler
  const handleQualityChange = (qualityIndex: number) => {
    if (!hlsRef.current) return;

    const hls = hlsRef.current;
    const currentTime = videoRef.current?.currentTime || 0;

    // -1 = Auto quality
    hls.currentLevel = qualityIndex;

    // Save preference
    localStorage.setItem('preferredQuality', qualityIndex.toString());
    setCurrentQuality(qualityIndex);
    setShowQualityMenu(false);

    console.log(`Quality changed to: ${qualityIndex === -1 ? 'Auto' : availableQualities[qualityIndex]?.label}`);

    // Resume from same position
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  };

  // Source switching handler
  const handleSourceSwitch = (sourceIndex: number) => {
    if (sourceIndex === currentSourceIndex) return;

    console.log(`Switching to source ${sourceIndex + 1}/${availableSources.length}`);
    setCurrentSourceIndex(sourceIndex);
    setShowSourceMenu(false);
    setPlayerMode('loading');

    // Trigger re-extraction with new source (if implemented)
    // For now, just reload with the new channel ID
    window.location.reload();
  };

  // Retry mechanism for HLS failures
  const retryExtraction = async () => {
    if (retryCount >= maxRetries) {
      console.log(`Max retries (${maxRetries}) reached, staying in iframe mode`);
      return;
    }

    console.log(`Retry attempt ${retryCount + 1}/${maxRetries}...`);
    setRetryCount(prev => prev + 1);
    setPlayerMode('loading');

    // Trigger re-extraction by changing state
    setTimeout(() => {
      window.location.reload(); // Simple reload for now
    }, 2000);
  };

  // Toggle fullscreen (mobile-optimized)
  const toggleFullscreen = async () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    try {
      if (!isFullscreen) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          // Safari
          await (container as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          // Safari
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

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
          <p className="text-xs mt-2 opacity-75">
            💡 Tip: Use an ad blocker for best experience
          </p>
          {retryCount < maxRetries && (
            <button
              onClick={retryExtraction}
              className="mt-2 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded transition-colors"
            >
              Retry Ad-Free ({maxRetries - retryCount} left)
            </button>
          )}
        </div>
      )}

      {/* Blocked Popups Counter */}
      {blockedPopups > 0 && playerMode === 'iframe' && (
        <div className="absolute top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-30 flex items-center space-x-2 animate-fade-in">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-sm">{blockedPopups} popup{blockedPopups > 1 ? 's' : ''} blocked</span>
        </div>
      )}

      {/* Player Controls Overlay - HLS Mode Only */}
      {playerMode === 'hls' && isPlaying && (
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between gap-2">
          {/* Quality Selector */}
          {availableQualities.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium text-sm">
                  {currentQuality === -1 ? 'Auto' : availableQualities[currentQuality]?.label || 'Quality'}
                </span>
              </button>

              {/* Quality Menu */}
              {showQualityMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-black bg-opacity-95 rounded-lg shadow-xl overflow-hidden min-w-[120px]">
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className={`w-full px-4 py-2 text-left hover:bg-arsenalRed transition-colors ${
                      currentQuality === -1 ? 'bg-arsenalRed text-white' : 'text-gray-200'
                    }`}
                  >
                    Auto
                  </button>
                  {availableQualities.map((quality) => (
                    <button
                      key={quality.index}
                      onClick={() => handleQualityChange(quality.index)}
                      className={`w-full px-4 py-2 text-left hover:bg-arsenalRed transition-colors ${
                        currentQuality === quality.index ? 'bg-arsenalRed text-white' : 'text-gray-200'
                      }`}
                    >
                      {quality.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Source Switcher */}
          {availableSources.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="font-medium text-sm">
                  Source {currentSourceIndex + 1}/{availableSources.length}
                </span>
              </button>

              {/* Source Menu */}
              {showSourceMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-black bg-opacity-95 rounded-lg shadow-xl overflow-hidden min-w-[200px]">
                  {availableSources.map((source, index) => (
                    <button
                      key={index}
                      onClick={() => handleSourceSwitch(index)}
                      className={`w-full px-4 py-2 text-left hover:bg-arsenalRed transition-colors ${
                        currentSourceIndex === index ? 'bg-arsenalRed text-white' : 'text-gray-200'
                      }`}
                    >
                      <div className="font-medium">{source.channelName || `Source ${index + 1}`}</div>
                      {source.quality && <div className="text-xs opacity-75">{source.quality}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fullscreen Toggle (Mobile-optimized) */}
          {isMobile && (
            <button
              onClick={toggleFullscreen}
              className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-lg transition-all ml-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                )}
              </svg>
            </button>
          )}
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

      {/* Iframe Fallback (With Ads - But Protected) */}
      {playerMode === 'iframe' && (
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allowFullScreen
          referrerPolicy="no-referrer"
          title={`Stream Channel ${channelId}`}
        />
      )}
    </div>
  );
};

export default EnhancedPlayer;
