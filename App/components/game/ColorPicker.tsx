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

  return (
    <div className="space-y-6">
      {/* Color Preview */}
      <div className="flex justify-center">
        <div
          className="w-32 h-32 rounded-2xl shadow-lg border-4 border-white"
          style={{ backgroundColor: hslString }}
        />
      </div>

      {/* HSL Sliders */}
      <div className="space-y-4">
        {/* Hue Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Hue
            </label>
            <span className="text-sm font-mono text-gray-600">{color.h}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={color.h}
            onChange={(e) => handleHueChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
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
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Saturation
            </label>
            <span className="text-sm font-mono text-gray-600">{color.s}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={color.s}
            onChange={(e) => handleSaturationChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
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
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">
              Lightness
            </label>
            <span className="text-sm font-mono text-gray-600">{color.l}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={color.l}
            onChange={(e) => handleLightnessChange(Number(e.target.value))}
            disabled={disabled}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
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
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-xs font-mono text-gray-600 text-center">
          {hslString}
        </div>
      </div>
    </div>
  );
}
