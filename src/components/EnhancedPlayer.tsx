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

const EnhancedPlayer: React.FC<EnhancedPlayerProps> = ({ channelId, availableSources = [] }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [playerMode, setPlayerMode] = useState<'loading' | 'hls' | 'iframe'>('loading');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Alternative DaddyLive domains
  const alternativeDomains = [
    'dlhd.dad',
    'daddylivehd.sx',
    'daddyhd.com'
  ];

  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);

  // Quality selection state
  const [availableQualities, setAvailableQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
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

        const response = await fetch(`/api/stream/extract/${channelId}`);
        const data = await response.json();

        if (!mounted) return;

        if (data.success && data.streamUrl) {
          setStreamUrl(data.streamUrl);
          setPlayerMode('hls');
        } else {
          // Silently fallback to iframe
          setPlayerMode('iframe');
        }
      } catch {
        if (!mounted) return;
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
        const levels = hls.levels.map((level, index) => ({
          height: level.height,
          bitrate: level.bitrate,
          index,
          label: getQualityLabel(level.height)
        }));

        setAvailableQualities(levels);

        if (currentQuality >= 0 && currentQuality < levels.length) {
          hls.currentLevel = currentQuality;
        }

        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setPlayerMode('iframe');
              break;
          }
        }
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

      video.addEventListener('error', () => {
        setPlayerMode('iframe');
      });
    } else {
      setPlayerMode('iframe');
    }
  }, [playerMode, streamUrl, currentQuality]);

  // Helper: Get current iframe URL with selected domain
  const getIframeUrl = () => {
    const domain = alternativeDomains[currentDomainIndex];
    return `https://${domain}/stream/stream-${channelId}.php`;
  };

  const iframeUrl = getIframeUrl();

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

    hls.currentLevel = qualityIndex;

    localStorage.setItem('preferredQuality', qualityIndex.toString());
    setCurrentQuality(qualityIndex);
    setShowQualityMenu(false);

    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
  };

  // Source switching handler
  const handleSourceSwitch = (sourceIndex: number) => {
    if (sourceIndex === currentSourceIndex) return;
    setCurrentSourceIndex(sourceIndex);
    setShowSourceMenu(false);
    setPlayerMode('loading');
    window.location.reload();
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    const container = videoRef.current?.parentElement;
    if (!container) return;

    try {
      if (!isFullscreen) {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch {}
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Loading State */}
      {playerMode === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
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
                className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-all"
              >
                <span>{currentQuality === -1 ? 'Auto' : availableQualities[currentQuality]?.label || 'Quality'}</span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-black/95 rounded-lg shadow-xl overflow-hidden min-w-[100px]">
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-red-500 transition-colors ${
                      currentQuality === -1 ? 'bg-red-500 text-white' : 'text-gray-200'
                    }`}
                  >
                    Auto
                  </button>
                  {availableQualities.map((quality) => (
                    <button
                      key={quality.index}
                      onClick={() => handleQualityChange(quality.index)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-red-500 transition-colors ${
                        currentQuality === quality.index ? 'bg-red-500 text-white' : 'text-gray-200'
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
                className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-lg text-sm transition-all"
              >
                Source {currentSourceIndex + 1}/{availableSources.length}
              </button>

              {showSourceMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-black/95 rounded-lg shadow-xl overflow-hidden min-w-[150px]">
                  {availableSources.map((source, index) => (
                    <button
                      key={index}
                      onClick={() => handleSourceSwitch(index)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-red-500 transition-colors ${
                        currentSourceIndex === index ? 'bg-red-500 text-white' : 'text-gray-200'
                      }`}
                    >
                      {source.channelName || `Source ${index + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fullscreen Toggle */}
          {isMobile && (
            <button
              onClick={toggleFullscreen}
              className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition-all ml-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* HLS Video Player */}
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

      {/* Iframe Fallback */}
      {playerMode === 'iframe' && (
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          title={`Stream ${channelId}`}
        />
      )}
    </div>
  );
};

export default EnhancedPlayer;
