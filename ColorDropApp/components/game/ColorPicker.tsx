'use client';

import { useState, useEffect } from 'react';

export type HSLColor = {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
};

interface ColorPickerProps {
  onColorChange: (color: HSLColor) => void;
  disabled?: boolean;
}

export function ColorPicker({ onColorChange, disabled = false }: ColorPickerProps) {
  const [color, setColor] = useState<HSLColor>({ h: 180, s: 50, l: 50 });

  useEffect(() => {
    onColorChange(color);
  }, [color, onColorChange]);

  const handleHueChange = (value: number) => {
    setColor(prev => ({ ...prev, h: value }));
  };

  const handleSaturationChange = (value: number) => {
    setColor(prev => ({ ...prev, s: value }));
  };

  const handleLightnessChange = (value: number) => {
    setColor(prev => ({ ...prev, l: value }));
  };

  const hslString = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;

  // Common slider classes for touch-friendly interaction
  // h-8 = 32px height for easy finger touch on mobile
  const sliderClasses = "w-full h-6 sm:h-4 rounded-full appearance-none cursor-pointer touch-pan-x slider-thumb-large";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Color Preview - Smaller on mobile */}
      <div className="flex justify-center">
        <div
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl shadow-lg border-4 border-white"
          style={{ backgroundColor: hslString }}
        />
      </div>

      {/* HSL Sliders - Touch optimized */}
      <div className="space-y-5 sm:space-y-4">
        {/* Hue Slider */}
        <div>
          <div className="flex justify-between items-center mb-1 sm:mb-2">
            <label className="text-sm sm:text-sm font-medium text-celo-brown">
              Hue
            </label>
            <span className="text-sm sm:text-sm font-mono text-celo-body bg-celo-dark-tan/50 px-2 py-0.5 rounded">{color.h}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={color.h}
            onChange={(e) => handleHueChange(Number(e.target.value))}
            disabled={disabled}
            className={sliderClasses}
            style={{
              background: `linear-gradient(to right,
                hsl(0, ${color.s}%, ${color.l}%),
                hsl(60, ${color.s}%, ${color.l}%),
                hsl(120, ${color.s}%, ${color.l}%),
                hsl(180, ${color.s}%, ${color.l}%),
                hsl(240, ${color.s}%, ${color.l}%),
                hsl(300, ${color.s}%, ${color.l}%),
                hsl(360, ${color.s}%, ${color.l}%)
              )`,
            }}
          />
        </div>

        {/* Saturation Slider */}
        <div>
          <div className="flex justify-between items-center mb-1 sm:mb-2">
            <label className="text-sm sm:text-sm font-medium text-celo-brown">
              Saturation
            </label>
            <span className="text-sm sm:text-sm font-mono text-celo-body bg-celo-dark-tan/50 px-2 py-0.5 rounded">{color.s}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={color.s}
            onChange={(e) => handleSaturationChange(Number(e.target.value))}
            disabled={disabled}
            className={sliderClasses}
            style={{
              background: `linear-gradient(to right,
                hsl(${color.h}, 0%, ${color.l}%),
                hsl(${color.h}, 100%, ${color.l}%)
              )`,
            }}
          />
        </div>

        {/* Lightness Slider */}
        <div>
          <div className="flex justify-between items-center mb-1 sm:mb-2">
            <label className="text-sm sm:text-sm font-medium text-celo-brown">
              Lightness
            </label>
            <span className="text-sm sm:text-sm font-mono text-celo-body bg-celo-dark-tan/50 px-2 py-0.5 rounded">{color.l}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={color.l}
            onChange={(e) => handleLightnessChange(Number(e.target.value))}
            disabled={disabled}
            className={sliderClasses}
            style={{
              background: `linear-gradient(to right,
                hsl(${color.h}, ${color.s}%, 0%),
                hsl(${color.h}, ${color.s}%, 50%),
                hsl(${color.h}, ${color.s}%, 100%)
              )`,
            }}
          />
        </div>
      </div>

      {/* Color Values */}
      <div className="bg-celo-dark-tan/30 rounded-lg p-2 sm:p-3 border border-celo-dark-tan">
        <div className="text-xs font-mono text-celo-body text-center">
          {hslString}
        </div>
      </div>

      {/* Custom slider styles for larger thumb on touch devices */}
      <style jsx global>{`
        /* Large touch-friendly thumb for sliders */
        .slider-thumb-large::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          border: 3px solid #4E632A;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          margin-top: -4px;
        }

        .slider-thumb-large::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: white;
          border: 3px solid #4E632A;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }

        /* Active state for better feedback */
        .slider-thumb-large::-webkit-slider-thumb:active {
          transform: scale(1.1);
          box-shadow: 0 3px 10px rgba(78, 99, 42, 0.4);
        }

        .slider-thumb-large::-moz-range-thumb:active {
          transform: scale(1.1);
          box-shadow: 0 3px 10px rgba(78, 99, 42, 0.4);
        }

        /* Desktop: slightly smaller thumb */
        @media (min-width: 640px) {
          .slider-thumb-large::-webkit-slider-thumb {
            width: 22px;
            height: 22px;
            border-width: 2px;
          }
          .slider-thumb-large::-moz-range-thumb {
            width: 22px;
            height: 22px;
            border-width: 2px;
          }
        }
      `}</style>
    </div>
  );
}
