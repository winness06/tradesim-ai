'use client';

import { useTheme, Theme } from '@/context/ThemeContext';

export default function ThemeSelectionModal({ onSelect }: { onSelect: () => void }) {
  const { setTheme } = useTheme();

  const pick = (t: Theme) => {
    setTheme(t);
    onSelect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-black text-white mb-2">
          Welcome to Chart<span style={{ color: '#E8313A' }}>Champ</span>
        </h1>
        <p className="text-gray-400 mb-8 text-sm">Choose your interface theme</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Dark */}
          <button
            onClick={() => pick('dark')}
            className="p-6 rounded-2xl border-2 border-gray-700 hover:border-[#E8313A] transition-all text-left group"
            style={{ background: '#1a1d27' }}
          >
            <div className="text-3xl mb-3">🌙</div>
            <p className="font-black text-white text-base">Dark</p>
            <p className="text-gray-500 text-xs mt-1">Easy on the eyes</p>
            <div className="mt-4 space-y-1.5">
              <div className="h-2 rounded-full bg-gray-700" />
              <div className="h-2 rounded-full bg-gray-800 w-3/4" />
              <div className="h-2 rounded-full bg-gray-700 w-1/2" />
            </div>
          </button>

          {/* Light */}
          <button
            onClick={() => pick('light')}
            className="p-6 rounded-2xl border-2 border-gray-300 hover:border-[#E8313A] transition-all text-left group"
            style={{ background: '#FFFFFF' }}
          >
            <div className="text-3xl mb-3">☀️</div>
            <p className="font-black text-gray-900 text-base">Light</p>
            <p className="text-gray-500 text-xs mt-1">Clean and sharp</p>
            <div className="mt-4 space-y-1.5">
              <div className="h-2 rounded-full bg-gray-200" />
              <div className="h-2 rounded-full bg-gray-100 w-3/4" />
              <div className="h-2 rounded-full bg-gray-200 w-1/2" />
            </div>
          </button>
        </div>

        <p className="text-gray-600 text-xs">You can change this anytime using the toggle button in the app</p>
      </div>
    </div>
  );
}
