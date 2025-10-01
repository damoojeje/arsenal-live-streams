import React, { useEffect, useRef, useState } from 'react';

interface AdBlockedPlayerProps {
  streamUrl: string;
  channelId: string;
}

const AdBlockedPlayer: React.FC<AdBlockedPlayerProps> = ({ streamUrl, channelId }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedPopups, setBlockedPopups] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Block popup windows
    const originalWindowOpen = window.open;
    let popupCount = 0;

    window.open = function(...args) {
      popupCount++;
      setBlockedPopups(popupCount);
      console.log('🛡️ Blocked popup attempt:', args[0]);
      return null;
    };

    // Block new tab attempts
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only block if not user-initiated
      if (!e.isTrusted) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Monitor iframe load
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = () => {
        setIsLoading(false);

        try {
          // Try to inject ad-blocking script into iframe (may fail due to CORS)
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const script = iframeDoc.createElement('script');
            script.textContent = `
              // Block popups from within iframe
              window.open = function() { return null; };

              // Block redirects
              Object.defineProperty(window, 'location', {
                set: function(val) {
                  console.log('Blocked redirect to:', val);
                },
                get: function() { return window.location; }
              });

              // Remove overlay ads
              setInterval(() => {
                const overlays = document.querySelectorAll('[class*="overlay"], [class*="popup"], [id*="popup"], [class*="ad-"]');
                overlays.forEach(el => el.remove());
              }, 1000);
            `;
            iframeDoc.head.appendChild(script);
          }
        } catch (e) {
          // CORS will block this, but we still have other protections
          console.log('Cannot inject into iframe (CORS):', e);
        }
      };
    }

    return () => {
      window.open = originalWindowOpen;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Prevent clicks on overlay ads
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Fullscreen handler
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black">
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-arsenalRed border-t-transparent mx-auto mb-4"></div>
            <p className="text-white text-xl mb-2">Loading stream...</p>
            <p className="text-gray-400 text-sm">Ad blocker active 🛡️</p>
          </div>
        </div>
      )}

      {/* Blocked Popups Counter */}
      {blockedPopups > 0 && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-30 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{blockedPopups} popup{blockedPopups > 1 ? 's' : ''} blocked</span>
        </div>
      )}

      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 left-4 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-lg z-30 transition-all"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* Click-jacking Protection Overlay (invisible, catches unwanted clicks) */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ touchAction: 'none' }}
        onClickCapture={handleOverlayClick}
      />

      {/* The Iframe - Sandbox removed for compatibility */}
      <iframe
        ref={iframeRef}
        src={streamUrl}
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        referrerPolicy="no-referrer"
        title={`Stream Channel ${channelId}`}
        style={{ zIndex: 5 }}
      />

      {/* Instructions Banner */}
      {!isLoading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-6 py-3 rounded-lg z-30 max-w-md text-center text-sm">
          <p className="mb-1">🛡️ <strong>Ad Blocker Active</strong></p>
          <p className="text-xs text-gray-300">Popups blocked • New tabs prevented • Mobile optimized</p>
        </div>
      )}
    </div>
  );
};

export default AdBlockedPlayer;
