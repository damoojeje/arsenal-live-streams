import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';

const LandingPage: React.FC = () => {
  const [sliderValue, setSliderValue] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    if (value >= 95) {
      setIsUnlocked(true);
      // Set verification flag in localStorage
      localStorage.setItem('lolli-gooner-verified', 'true');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isUnlocked) return;
    setIsDragging(true);
    updateSliderPosition(e.currentTarget, e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isUnlocked || !isDragging) return;
    updateSliderPosition(e.currentTarget, e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (sliderValue < 95) {
      // Reset if not completed
      setTimeout(() => setSliderValue(0), 500);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isUnlocked) return;
    setIsDragging(true);
    updateSliderPosition(e.currentTarget, e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isUnlocked || !isDragging) return;
    e.preventDefault();
    updateSliderPosition(e.currentTarget, e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (sliderValue < 95) {
      // Reset if not completed
      setTimeout(() => setSliderValue(0), 500);
    }
  };

  const updateSliderPosition = (element: HTMLElement, clientX: number) => {
    const rect = element.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    handleSliderChange(percentage);
  };

  // Global mouse events for drag outside slider
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && !isUnlocked) {
        const sliderElement = document.getElementById('slider-track');
        if (sliderElement) {
          updateSliderPosition(sliderElement, e.clientX);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isUnlocked, sliderValue]);

  return (
    <>
      <Head>
        <title>lolli - Arsenal Gooner Verification</title>
        <meta name="description" content="Prove your allegiance to the Gooners to access live streaming links" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#DB0007" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-4">
        {/* Background Arsenal lollipop pattern */}
        <div className="absolute inset-0 opacity-10">
          {/* Lollipop circles scattered around */}
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-arsenalRed rounded-full bg-arsenalRed bg-opacity-20"></div>
          <div className="absolute top-32 right-20 w-16 h-16 border-2 border-arsenalRed rounded-full bg-arsenalRed bg-opacity-20"></div>
          <div className="absolute bottom-20 left-32 w-12 h-12 border-2 border-arsenalRed rounded-full bg-arsenalRed bg-opacity-20"></div>
          <div className="absolute bottom-32 right-10 w-24 h-24 border-2 border-arsenalRed rounded-full bg-arsenalRed bg-opacity-20"></div>

          {/* Additional lollipop sticks */}
          <div className="absolute top-28 left-18 w-1 h-16 bg-yellow-600 opacity-30 rotate-12"></div>
          <div className="absolute top-48 right-28 w-1 h-12 bg-yellow-600 opacity-30 rotate-45"></div>
          <div className="absolute bottom-36 left-40 w-1 h-10 bg-yellow-600 opacity-30 -rotate-12"></div>
          <div className="absolute bottom-56 right-18 w-1 h-20 bg-yellow-600 opacity-30 rotate-45"></div>
        </div>

        {/* Main card */}
        <div className="relative bg-white rounded-2xl shadow-2xl border-4 border-arsenalRed p-8 md:p-12 max-w-2xl w-full text-center">
          {/* Success overlay */}
          {isUnlocked && (
            <div className="absolute inset-0 bg-gradient-to-br from-arsenalRed to-red-700 bg-opacity-95 rounded-2xl flex items-center justify-center z-10">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold mb-2">Welcome, Gooner!</h2>
                <p className="text-lg">Redirecting to lolli...</p>
              </div>
            </div>
          )}

          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/assets/arsenal/arsenal-lollipop-logo-120.png"
              alt="Arsenal Lollipop Logo"
              width={120}
              height={120}
              className="mx-auto drop-shadow-lg"
            />
          </div>

          {/* Main text */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-sf-pro">
            lolli
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-2 font-medium">
            To access this page, you must swear your allegiance to the Gooners!
          </p>
          
          <p className="text-lg text-gray-600 mb-8">
            Only true Gooners may pass—slide the cannon to prove it.
          </p>

          {/* Enhanced Slider component */}
          <div className="mb-8">
            <div className="relative bg-gray-200 rounded-full h-6 mb-4 shadow-inner">
              {/* Progress fill */}
              <div
                className="absolute top-0 left-0 h-6 bg-gradient-to-r from-arsenalRed via-red-600 to-arsenalRed rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${sliderValue}%` }}
              ></div>

              {/* Track texture overlay */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>

              {/* Slider track */}
              <div
                id="slider-track"
                className={`relative w-full h-6 cursor-grab ${isDragging ? 'cursor-grabbing' : ''} select-none`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Arsenal Cannon Slider Handle */}
                <div
                  className={`absolute top-1/2 transform -translate-y-1/2 w-12 h-12 transition-all duration-300 ${
                    isDragging ? 'scale-110 shadow-xl' : 'shadow-lg hover:shadow-xl hover:scale-105'
                  }`}
                  style={{ left: `calc(${sliderValue}% - 24px)` }}
                >
                  {/* Arsenal Cannon Image */}
                  <div className="w-12 h-12 bg-white rounded-full border-3 border-arsenalRed flex items-center justify-center shadow-lg">
                    <Image
                      src="/assets/arsenal/cannon-slider-48.png"
                      alt="Arsenal Cannon"
                      width={36}
                      height={36}
                      className="pointer-events-none"
                    />
                  </div>

                  {/* Glow effect when dragging */}
                  {isDragging && (
                    <div className="absolute inset-0 rounded-full bg-arsenalRed opacity-30 animate-pulse"></div>
                  )}
                </div>

                {/* End zone indicator */}
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-arsenalRed rounded-full opacity-40 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Drag the Arsenal cannon</strong> all the way to the right
              </p>
              <p className="text-xs text-gray-500">
                🔴 Show your Gooner spirit and prove your allegiance!
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center space-x-2 mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  sliderValue > i * 20 ? 'bg-arsenalRed' : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-500 space-y-2">
            <p>💡 <strong>Tip:</strong> Slide the cannon all the way to the right</p>
            <p>🔴 <strong>Remember:</strong> Arsenal till I die!</p>
          </div>

        </div>
      </div>
    </>
  );
};

export default LandingPage;
