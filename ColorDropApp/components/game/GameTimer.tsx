'use client';

import { useState, useEffect } from 'react';

interface GameTimerProps {
  duration: number; // seconds
  onTimeUp: () => void;
  isRunning: boolean;
}

export function GameTimer({ duration, onTimeUp, isRunning }: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration);
      return;
    }

    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, duration, onTimeUp]);

  const progress = (timeLeft / duration) * 100;
  const isLowTime = timeLeft <= 3;

  return (
    <div className="space-y-2">
      {/* Timer Display */}
      <div className="flex justify-center">
        <div
          className={`text-5xl font-bold transition-colors ${
            isLowTime ? 'text-red-600 animate-pulse' : 'text-gray-900'
          }`}
        >
          {timeLeft}s
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isLowTime ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status Text */}
      <div className="text-center text-sm text-gray-600">
        {isRunning ? (
          isLowTime ? (
            <span className="font-semibold text-red-600">Hurry up!</span>
          ) : (
            'Match the color as closely as you can'
          )
        ) : (
          'Game not started'
        )}
      </div>
    </div>
  );
}
