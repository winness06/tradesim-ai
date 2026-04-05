'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex flex-col justify-center items-center w-10 h-10 gap-1.5"
        aria-label="Toggle menu"
      >
        <span
          className="block w-6 h-0.5 bg-white transition-transform duration-200"
          style={{ transform: open ? 'rotate(45deg) translate(4px, 4px)' : 'none' }}
        />
        <span
          className="block w-6 h-0.5 bg-white transition-opacity duration-200"
          style={{ opacity: open ? 0 : 1 }}
        />
        <span
          className="block w-6 h-0.5 bg-white transition-transform duration-200"
          style={{ transform: open ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
          <Link
            href="/sign-in"
            className="block px-5 py-3.5 text-gray-300 hover:text-white hover:bg-gray-800 text-sm font-semibold transition"
            onClick={() => setOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="block px-5 py-3.5 text-white text-sm font-bold transition"
            style={{ background: '#E8313A' }}
            onClick={() => setOpen(false)}
          >
            Start Free →
          </Link>
        </div>
      )}
    </div>
  );
}
