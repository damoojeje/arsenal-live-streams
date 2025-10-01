import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface HLSPlayerProps {
  src: string;
  headers?: Record<string, string>;
  onError?: () => void;
}

const HLSPlayer: React.FC<HLSPlayerProps> = ({ src, headers, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          // Add custom headers if provided
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              xhr.setRequestHeader(key, value);
            });
          }
        },
        enableWorker: true,
        lowLatencyMode: true,
      });

      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch((err) => {
          console.log('Autoplay prevented:', err);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          setError('Stream loading failed');
          setIsLoading(false);
          if (onError) onError();
        }
      });

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch((err) => {
          console.log('Autoplay prevented:', err);
        });
      });
      video.addEventListener('error', () => {
        setError('Stream loading failed');
        setIsLoading(false);
        if (onError) onError();
      });
    } else {
      setError('HLS not supported in this browser');
      setIsLoading(false);
      if (onError) onError();
    }
  }, [src, headers, onError]);

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-arsenalRed border-t-transparent mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading stream...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-10">
          <div className="text-center text-white">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl mb-2">{error}</p>
            <p className="text-sm text-gray-400">Falling back to iframe player...</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay
        playsInline
      />
    </div>
  );
};

export default HLSPlayer;
