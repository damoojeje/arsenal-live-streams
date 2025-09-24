import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';

const LandingPage: React.FC = () => {
  const [sliderValue, setSliderValue] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const router = useRouter();

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    if (value >= 95) {
      setIsUnlocked(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isUnlocked) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    handleSliderChange(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isUnlocked) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    handleSliderChange(percentage);
  };

  return (
    <>
      <Head>
        <title>lolli - Arsenal Gooner Verification</title>
        <meta name="description" content="Prove your allegiance to the Gooners to access live streaming links" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-4">
        {/* Background Arsenal pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-arsenalRed rounded-full"></div>
          <div className="absolute top-32 right-20 w-16 h-16 border-2 border-arsenalRed rounded-full"></div>
          <div className="absolute bottom-20 left-32 w-12 h-12 border-2 border-arsenalRed rounded-full"></div>
          <div className="absolute bottom-32 right-10 w-24 h-24 border-2 border-arsenalRed rounded-full"></div>
        </div>

        {/* Main card */}
        <div className="relative bg-white rounded-2xl shadow-2xl border-4 border-arsenalRed p-8 md:p-12 max-w-2xl w-full text-center">
          {/* Success overlay */}
          {isUnlocked && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-95 rounded-2xl flex items-center justify-center z-10">
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
              src="/assets/arsenal/lolli-logo.svg"
              alt="lolli - Arsenal Lollipop Logo"
              width={120}
              height={120}
              className="mx-auto"
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

          {/* Slider component */}
          <div className="mb-8">
            <div className="relative bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="absolute top-0 left-0 h-4 bg-gradient-to-r from-arsenalRed to-red-600 rounded-full transition-all duration-300"
                style={{ width: `${sliderValue}%` }}
              ></div>
              
              {/* Slider track */}
              <div 
                className="relative w-full h-4 cursor-pointer"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onMouseLeave={() => {
                  if (sliderValue < 95) {
                    setSliderValue(0);
                  }
                }}
              >
                {/* Cannon handle */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-8 h-8 bg-arsenalRed rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-300"
                  style={{ left: `calc(${sliderValue}% - 16px)` }}
                >
                  <div className="w-4 h-4 text-white text-xs">⚽</div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              Drag the cannon to the end to prove you're a true Gooner
            </p>
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
