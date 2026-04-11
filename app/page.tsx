'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DemoSimulator from '@/components/DemoSimulator';
import MobileNav from '@/components/MobileNav';

const ranks = [
  { name: 'Rookie', color: '#9ca3af', min: 0, icon: '🥉' },
  { name: 'Intermediate', color: '#34d399', min: 40, icon: '🥈' },
  { name: 'Pro', color: '#60a5fa', min: 60, icon: '🥇' },
  { name: 'Elite', color: '#f59e0b', min: 80, icon: '💎' },
  { name: 'Master', color: '#f43f5e', min: 95, icon: '👑' },
];

const features = [
  {
    icon: '📈',
    title: 'AI-Generated Charts',
    desc: 'Practice on realistic simulated price action — new charts every session.',
  },
  {
    icon: '🤖',
    title: 'AI Trading Coach',
    desc: 'Get instant feedback on every trade. Know exactly what you did right or wrong.',
  },
  {
    icon: '🎯',
    title: 'Multiple Take Profits',
    desc: 'Set up to 3 take profit targets and a stop loss — just like real trading.',
  },
  {
    icon: '📊',
    title: 'RSI, MACD & Volume',
    desc: 'Practice reading real technical indicators. Toggle them on or off.',
  },
  {
    icon: '⏱️',
    title: '6 Timeframes',
    desc: 'Switch between 1m, 5m, 15m, 1h, 4h and daily charts instantly.',
  },
  {
    icon: '🏆',
    title: 'Rank Up System',
    desc: 'Start as a Rookie. Earn your way to Master through consistent good trades.',
  },
];

const steps = [
  { num: '01', title: 'Get a Chart', desc: 'A new AI-generated chart appears. Study it like a real trade.' },
  { num: '02', title: 'Place Your Trade', desc: 'Set your entry, take profits, and stop loss. Write your reasoning.' },
  { num: '03', title: 'Get AI Feedback', desc: 'See exactly what happened and receive coaching on your decision.' },
];

export default function LandingPage() {
  const [activeRank, setActiveRank] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRank((prev) => (prev + 1) % ranks.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <span className="text-xl font-black tracking-tighter text-white">
            Chart<span style={{ color: '#E8313A' }}>Champ</span>
          </span>
          {/* Desktop nav */}
          <div className="hidden md:flex gap-3 items-center">
            <Link href="/sign-in" className="text-gray-400 hover:text-white text-sm transition">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="font-bold text-sm px-4 py-2 rounded-lg transition text-white"
              style={{ background: '#E8313A' }}
            >
              Start Free
            </Link>
          </div>
          {/* Mobile nav */}
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-28 px-6 text-center relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[380px] rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(232,49,58,0.09)' }} />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full blur-2xl pointer-events-none" style={{ background: 'rgba(232,49,58,0.05)' }} />

        <div className="relative max-w-4xl mx-auto">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-wide"
            style={{ borderColor: 'rgba(232,49,58,0.35)', background: 'rgba(232,49,58,0.08)', color: '#f87171' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
            AI-Powered Trading Simulator
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
            Learn to Trade.
            <br />
            <span style={{ color: '#E8313A' }}>Without Losing Real Money.</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            AI-generated charts, instant coaching feedback, and a rank system
            that makes improving actually addictive.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="font-black text-lg px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 text-white"
              style={{ background: '#E8313A', boxShadow: '0 0 32px rgba(232,49,58,0.35), 0 4px 16px rgba(0,0,0,0.3)' }}
            >
              Start Training Free →
            </Link>
            <Link
              href="/sign-in"
              className="border border-gray-700 hover:border-gray-500 hover:text-white text-gray-400 font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-200"
            >
              Sign In
            </Link>
          </div>

          <p className="text-gray-600 text-sm mt-5">Free plan available · No credit card needed</p>
        </div>
      </section>

      {/* RANK SHOWCASE */}
      <section className="py-16 px-6 border-y" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] mb-10 font-bold">
            Your Trading Journey
          </p>
          <div className="flex justify-center gap-6 md:gap-12 flex-wrap">
            {ranks.map((rank, i) => (
              <div
                key={rank.name}
                className="flex flex-col items-center gap-2.5 transition-all duration-500"
                style={{ opacity: i === activeRank ? 1 : 0.3, transform: i === activeRank ? 'scale(1.18)' : 'scale(1)' }}
              >
                <div className="text-3xl leading-none">{rank.icon}</div>
                <span className="text-xs font-bold tracking-wide" style={{ color: i === activeRank ? rank.color : '#4b5563' }}>
                  {rank.name.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-sm mt-10 leading-relaxed">
            Start as <span className="text-gray-400 font-semibold">Rookie</span> · Climb to{' '}
            <span className="font-semibold" style={{ color: '#E8313A' }}>Master</span> through consistent performance
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] font-bold mb-3" style={{ color: '#E8313A' }}>How It Works</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Three steps. Real skills.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="rounded-2xl p-8 transition-all duration-200 group cursor-default"
                style={{ background: '#111520', border: '1px solid #1e2235' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,49,58,0.3)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(232,49,58,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2235'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black mb-5 text-white"
                  style={{ background: '#E8313A', boxShadow: '0 0 16px rgba(232,49,58,0.4)' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="text-lg font-bold mb-2 tracking-tight">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO SIMULATOR */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest font-semibold mb-3" style={{ color: '#E8313A' }}>
              Try It Now — No Sign Up
            </p>
            <h2 className="text-4xl font-black mb-4">
              See exactly how it works.
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Study the chart, place your trade, and get real AI coaching feedback.
              You get 3 free trades before signing up.
            </p>
          </div>
          <DemoSimulator />
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-28 px-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] font-bold mb-3" style={{ color: '#E8313A' }}>Features</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Everything you need to improve.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 transition-all duration-200"
                style={{ background: '#111520', border: '1px solid #1e2235' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2a2e45'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2235'; e.currentTarget.style.transform = 'none'; }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                  style={{ background: 'rgba(232,49,58,0.1)', border: '1px solid rgba(232,49,58,0.2)' }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-base mb-1.5 tracking-tight">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFERRAL HOOK */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] font-bold mb-3" style={{ color: '#E8313A' }}>Referral Program</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Refer Friends. Get Paid.</h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
              Share your referral link. Earn 20% of every payment your friends make — for 3 full months.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
            {[
              { value: '20%', label: 'Commission Rate', sub: 'On every payment your referrals make' },
              { value: '3 Months', label: 'Commission Duration', sub: 'Per referred friend, not just the first payment' },
              { value: '$18/mo', label: 'Per Pro Referral', sub: 'When friends subscribe to the Pro plan' },
            ].map(({ value, label, sub }) => (
              <div key={label} className="rounded-2xl p-8 text-center"
                style={{ background: '#111520', border: '1px solid #1e2235' }}>
                <p className="text-5xl font-black mb-2 tabular-nums" style={{ color: '#E8313A' }}>{value}</p>
                <p className="font-bold text-white text-sm mb-1.5">{label}</p>
                <p className="text-gray-600 text-xs leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/sign-up"
              className="inline-block font-black text-lg px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 text-white"
              style={{ background: '#E8313A', boxShadow: '0 0 32px rgba(232,49,58,0.3)' }}
            >
              Start Earning → Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="py-28 px-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] font-bold mb-3" style={{ color: '#E8313A' }}>Pricing</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Start free. Upgrade when ready.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Free */}
            <div className="rounded-2xl p-6 flex flex-col" style={{ background: '#111520', border: '1px solid #1e2235' }}>
              <h3 className="font-bold text-base mb-0.5">Free</h3>
              <p className="text-gray-600 text-xs mb-5">Get started</p>
              <p className="text-3xl font-black mb-5 tabular-nums">$0</p>
              <ul className="space-y-2 text-xs text-gray-500 mb-6 flex-1">
                {['3 simulations per day','AI coach feedback','All timeframes','Rank tracking'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-gray-600 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className="block text-center font-semibold py-2.5 rounded-xl transition-all duration-200 text-sm text-gray-300 hover:text-white"
                style={{ border: '1px solid #2a2e45' }}>
                Get Started
              </Link>
            </div>

            {/* Starter */}
            <div className="rounded-2xl p-6 flex flex-col" style={{ background: '#111520', border: '1px solid #1e2235' }}>
              <h3 className="font-bold text-base mb-0.5">Starter</h3>
              <p className="text-gray-600 text-xs mb-5">Level up faster</p>
              <p className="text-3xl font-black mb-5 tabular-nums">$7.99<span className="text-sm text-gray-600 font-normal">/mo</span></p>
              <ul className="space-y-2 text-xs text-gray-500 mb-6 flex-1">
                {['15 simulations per day','Everything in Free','5 AI follow-ups','Referral rewards'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-gray-600 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/upgrade" className="block text-center font-semibold py-2.5 rounded-xl transition-all duration-200 text-sm text-gray-300 hover:text-white"
                style={{ border: '1px solid #2a2e45' }}>
                Get Starter
              </Link>
            </div>

            {/* Pro — highlighted */}
            <div className="rounded-2xl p-6 relative flex flex-col" style={{ background: '#1a0709', border: '2px solid #E8313A', boxShadow: '0 0 48px rgba(232,49,58,0.15), 0 0 0 1px rgba(232,49,58,0.05)' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-black px-3 py-1 rounded-full whitespace-nowrap" style={{ background: '#E8313A', boxShadow: '0 0 12px rgba(232,49,58,0.5)' }}>
                MOST POPULAR
              </div>
              <h3 className="font-bold text-base mb-0.5">Pro</h3>
              <p className="text-gray-500 text-xs mb-5">Serious about trading</p>
              <p className="text-3xl font-black mb-5 tabular-nums">$29.99<span className="text-sm text-gray-500 font-normal">/mo</span></p>
              <ul className="space-y-2 text-xs text-gray-400 mb-6 flex-1">
                {['50 simulations per day','Everything in Starter','15 AI follow-ups','Leaderboard access'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: '#E8313A' }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/upgrade" className="block text-center font-black py-2.5 rounded-xl transition-all duration-200 text-sm text-white hover:opacity-90"
                style={{ background: '#E8313A' }}>
                Get Pro
              </Link>
            </div>

            {/* Elite */}
            <div className="rounded-2xl p-6 relative flex flex-col" style={{ background: '#111520', border: '1px solid #1e2235' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-black px-3 py-1 rounded-full whitespace-nowrap" style={{ background: '#d97706' }}>
                BEST VALUE
              </div>
              <h3 className="font-bold text-base mb-0.5">Elite</h3>
              <p className="text-gray-600 text-xs mb-5">The full experience</p>
              <p className="text-3xl font-black mb-5 tabular-nums">$39.99<span className="text-sm text-gray-600 font-normal">/mo</span></p>
              <ul className="space-y-2 text-xs text-gray-500 mb-6 flex-1">
                {['Unlimited simulations','Everything in Pro','30 AI follow-ups','VIP leaderboard'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/upgrade" className="block text-center font-semibold py-2.5 rounded-xl transition-all duration-200 text-sm text-gray-300 hover:text-white"
                style={{ border: '1px solid #2a2e45' }}>
                Get Elite
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-700 text-xs mt-8">Prices in USD · Cancel anytime · Switch plans anytime</p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(232,49,58,0.07) 0%, transparent 70%)' }} />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] font-bold mb-5" style={{ color: '#E8313A' }}>Get Started Today</p>
          <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
            Ready to become<br />a better trader?
          </h2>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            Join ChartChamp and start building real trading skills — for free.
          </p>
          <Link
            href="/sign-up"
            className="inline-block font-black text-xl px-10 py-5 rounded-xl transition-all duration-200 hover:scale-105 text-white"
            style={{ background: '#E8313A', boxShadow: '0 0 40px rgba(232,49,58,0.4), 0 8px 24px rgba(0,0,0,0.3)' }}
          >
            Start Training Free →
          </Link>
          <p className="text-gray-700 text-sm mt-5">Free plan available · No credit card needed</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 text-center text-gray-700 text-xs" style={{ borderTop: '1px solid #1a1d2a' }}>
        <p>© 2025 ChartChamp · Built for traders who want to get better.</p>
      </footer>

    </main>
  );
}