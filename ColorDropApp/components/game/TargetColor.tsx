'use client';

import type { HSLColor } from './ColorPicker';

interface TargetColorProps {
  color: HSLColor;
  revealed?: boolean;
}

export function TargetColor({ color, revealed = false }: TargetColorProps) {
  const hslString = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;

  return (
    <div className="space-y-2 sm:space-y-3">
      <h3 className="text-sm sm:text-lg font-semibold text-center text-celo-brown">
        Target Color
      </h3>

      <div className="flex justify-center">
        <div
          className="w-28 h-28 sm:w-40 sm:h-40 rounded-2xl shadow-xl border-4 border-white relative overflow-hidden"
          style={{ backgroundColor: revealed ? hslString : '#e5e7eb' }}
        >
          {!revealed && (
            <div className="absolute inset-0 flex items-center justify-center bg-celo-dark-tan bg-opacity-90">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🎯</div>
                <div className="text-xs sm:text-sm font-medium text-celo-body">
                  Match this color!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {revealed && (
        <div className="bg-celo-forest/10 rounded-lg p-2 sm:p-3">
          <div className="text-[10px] sm:text-xs font-mono text-celo-forest text-center">
            H: {color.h}° | S: {color.s}% | L: {color.l}%
          </div>
        </div>
      )}
    </div>
  );
}
