'use client';

import { useState, useEffect, useRef } from 'react';

interface GameTimerProps {
  duration: number; // seconds
  onTimeUp: () => void;
  isRunning: boolean;
}

export function GameTimer({ duration, onTimeUp, isRunning }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const hasCalledTimeUp = useRef(false);

  // Reset timer when duration or isRunning changes
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration);
      hasCalledTimeUp.current = false;
    }
  }, [isRunning, duration]);

  // Handle time up callback in a separate effect to avoid render-phase updates
  useEffect(() => {
    if (timeLeft <= 0 && isRunning && !hasCalledTimeUp.current) {
      hasCalledTimeUp.current = true;
      onTimeUp();
    }
  }, [timeLeft, isRunning, onTimeUp]);

  // Countdown timer
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const progress = (timeLeft / duration) * 100;
  const isLowTime = timeLeft <= 3;

  return (
    <div className="space-y-1 sm:space-y-2">
      {/* Timer Display - Larger and more prominent */}
      <div className="flex justify-center">
        <div
          className={`text-4xl sm:text-6xl font-bold transition-colors ${
            isLowTime ? 'text-celo-error animate-pulse' : 'text-celo-brown'
          }`}
        >
          {timeLeft}<span className="text-2xl sm:text-4xl">s</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-celo-dark-tan rounded-full h-2 sm:h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isLowTime ? 'bg-celo-error' : 'bg-celo-forest'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status Text - Compact on mobile */}
      <div className="text-center text-xs sm:text-sm text-celo-body">
        {isRunning ? (
          isLowTime ? (
            <span className="font-semibold text-celo-error">⚡ Hurry!</span>
          ) : (
            <span className="hidden sm:inline">Match the color as closely as you can</span>
          )
        ) : (
          'Game not started'
        )}
      </div>
    </div>
  );
}
