import React, { useState, useEffect } from 'react';
import { Sun, Moon, Palette } from 'lucide-react';

export default function ThemeSwitcher() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [colorTheme, setColorTheme] = useState('emerald');
  const [isOpen, setIsOpen] = useState(false);

  const colors = [
    { id: 'emerald', hex: '#10b981' },
    { id: 'blue', hex: '#3b82f6' },
    { id: 'purple', hex: '#a855f7' },
    { id: 'rose', hex: '#f43f5e' },
  ];

  useEffect(() => {
    const root = document.documentElement;
    
    // Handle light/dark mode
    if (isLightMode) {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }

    // Handle color themes
    root.classList.remove('theme-emerald', 'theme-blue', 'theme-purple', 'theme-rose');
    if (colorTheme !== 'emerald') {
      root.classList.add(`theme-${colorTheme}`);
    }
  }, [isLightMode, colorTheme]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 p-2 rounded-xl shadow-2xl hover:border-zinc-700 transition-colors"
      >
        <Palette size={18} className="text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl p-4 z-[70]">
          <div className="mb-4">
            <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Mode</p>
            <div className="flex bg-zinc-950/70 rounded-lg p-1">
              <button
                onClick={() => setIsLightMode(false)}
                className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors ${!isLightMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Moon size={14} />
              </button>
              <button
                onClick={() => setIsLightMode(true)}
                className={`flex-1 flex justify-center py-1.5 rounded-md transition-colors ${isLightMode ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Sun size={14} />
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Accent</p>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color.id}
                  onClick={() => setColorTheme(color.id)}
                  style={{ backgroundColor: color.hex }}
                  className={`w-6 h-6 rounded-full ${colorTheme === color.id ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-70 hover:opacity-100'} transition-all`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
