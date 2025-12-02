'use client';

import { useState, useCallback, useEffect } from 'react';
import { ColorPicker, type HSLColor } from './ColorPicker';
import { TargetColor } from './TargetColor';
import { GameTimer } from './GameTimer';
import { calculateAccuracy, getAccuracyTier, generateRandomColor } from '@/lib/colorUtils';

type GameState = 'idle' | 'playing' | 'finished';

interface GameResult {
  targetColor: HSLColor;
  userColor: HSLColor;
  accuracy: number;
  timestamp: number;
}

interface GameScreenProps {
  onBackToLobby?: () => void;
  slotNumber?: number;
}

export function GameScreen({ onBackToLobby, slotNumber }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>('playing');
  const [targetColor, setTargetColor] = useState<HSLColor>(generateRandomColor());
  const [userColor, setUserColor] = useState<HSLColor>({ h: 180, s: 50, l: 50 });
  const [result, setResult] = useState<GameResult | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const GAME_DURATION = 8; // 8 seconds
  const ENTRY_FEE_VALUE = parseFloat(process.env.NEXT_PUBLIC_ENTRY_FEE || '0.1');
  const ENTRY_FEE = `${ENTRY_FEE_VALUE} CELO`;

  // Save played slot to localStorage when game finishes
  useEffect(() => {
    if (gameState === 'finished' && slotNumber) {
      const playedSlots = JSON.parse(localStorage.getItem('playedSlots') || '[]');
      if (!playedSlots.includes(slotNumber)) {
        playedSlots.push(slotNumber);
        localStorage.setItem('playedSlots', JSON.stringify(playedSlots));
      }
    }
  }, [gameState, slotNumber]);

  const handleStartGame = () => {
    const newTarget = generateRandomColor();
    setTargetColor(newTarget);
    setUserColor({ h: 180, s: 50, l: 50 });
    setResult(null);
    setGameState('playing');
  };

  const handlePayAndPlayAgain = async () => {
    setIsPaying(true);
    try {
      // TODO: Call smart contract to pay entry fee
      console.log(`Paying ${ENTRY_FEE} entry fee and starting new game...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Go back to lobby instead of starting new game here
      if (onBackToLobby) {
        onBackToLobby();
      }
    } catch (error) {
      console.error('Failed to pay entry fee:', error);
    } finally {
      setIsPaying(false);
    }
  };

  const handleTimeUp = useCallback(() => {
    const accuracy = calculateAccuracy(userColor, targetColor);
    const gameResult: GameResult = {
      targetColor,
      userColor,
      accuracy,
      timestamp: Date.now(),
    };
    setResult(gameResult);
    setGameState('finished');
  }, [userColor, targetColor]);

  const handleColorChange = (color: HSLColor) => {
    if (gameState === 'playing') {
      setUserColor(color);
    }
  };

  const tier = result ? getAccuracyTier(result.accuracy) : null;

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Color Drop Tournament
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Match the target color as closely as you can in 8 seconds!
        </p>
        {slotNumber && (
          <div className="mt-2 inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
            Slot #{slotNumber}
          </div>
        )}
      </div>

      {/* Game Area */}
      {gameState === 'idle' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="text-6xl">🎨</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to Play?
            </h2>
            <p className="text-gray-600 mb-6">
              You'll have 8 seconds to match a random color using HSL sliders.
              <br />
              The closer your match, the higher your score!
            </p>
          </div>
          <button
            onClick={handleStartGame}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Timer */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
            <GameTimer
              duration={GAME_DURATION}
              onTimeUp={handleTimeUp}
              isRunning={true}
            />
          </div>

          {/* Game Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Target Color */}
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <TargetColor color={targetColor} revealed={false} />
            </div>

            {/* User Color Picker */}
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-center text-gray-900 mb-4">
                Your Color
              </h3>
              <ColorPicker onColorChange={handleColorChange} disabled={false} />
            </div>
          </div>
        </div>
      )}

      {gameState === 'finished' && result && (
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 space-y-4 sm:space-y-6">
          {/* Result Header */}
          <div className="text-center">
            <div className="text-5xl sm:text-6xl mb-3">{tier!.emoji}</div>
            <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${tier!.color}`}>
              {tier!.tier}
            </h2>
            <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-1">
              {result.accuracy.toFixed(2)}%
            </div>
            <p className="text-sm sm:text-base text-gray-600">Accuracy</p>
          </div>

          {/* Color Comparison */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Target Color
              </div>
              <div
                className="w-full h-24 sm:h-32 rounded-xl shadow-md border-2 border-gray-200"
                style={{
                  backgroundColor: `hsl(${result.targetColor.h}, ${result.targetColor.s}%, ${result.targetColor.l}%)`,
                }}
              />
              <div className="text-[10px] sm:text-xs font-mono text-gray-500 mt-2">
                H:{result.targetColor.h} S:{result.targetColor.s} L:{result.targetColor.l}
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Your Color
              </div>
              <div
                className="w-full h-24 sm:h-32 rounded-xl shadow-md border-2 border-gray-200"
                style={{
                  backgroundColor: `hsl(${result.userColor.h}, ${result.userColor.s}%, ${result.userColor.l}%)`,
                }}
              />
              <div className="text-[10px] sm:text-xs font-mono text-gray-500 mt-2">
                H:{result.userColor.h} S:{result.userColor.s} L:{result.userColor.l}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handlePayAndPlayAgain}
              disabled={isPaying}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-md text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPaying ? 'Processing Payment...' : `Play Another Slot (Pay ${ENTRY_FEE})`}
            </button>
            {onBackToLobby && (
              <button
                onClick={onBackToLobby}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-sm sm:text-base"
              >
                Back to Lobby
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
