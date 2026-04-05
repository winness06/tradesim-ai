'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DemoSimulator from '@/components/DemoSimulator';

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
          <span className="text-xl font-black tracking-tight text-white">
            Chart<span style={{ color: '#E8313A' }}>Champ</span>
          </span>
          <div className="flex gap-3 items-center">
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
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-6 text-center relative">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(232,49,58,0.07)' }} />

        <div className="relative max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight">
            Learn to Trade.
            <br />
            <span style={{ color: '#E8313A' }}>Without Losing Real Money.</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            ChartChamp gives you AI-generated charts, instant AI coaching, and a rank system
            that makes learning trading actually fun.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="font-black text-lg px-8 py-4 rounded-xl transition transform hover:scale-105 text-white"
              style={{ background: '#E8313A' }}
            >
              Start Training Free →
            </Link>
            <Link
              href="/sign-in"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 font-semibold text-lg px-8 py-4 rounded-xl transition"
            >
              Sign In
            </Link>
          </div>

          <p className="text-gray-600 text-sm mt-4">Free plan available. No credit card needed.</p>
        </div>
      </section>

      {/* RANK SHOWCASE */}
      <section className="py-16 px-6 border-y border-gray-800 bg-gray-900/40">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm uppercase tracking-widest mb-8 font-semibold">
            Your Trading Journey
          </p>
          <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
            {ranks.map((rank, i) => (
              <div
                key={rank.name}
                className="flex flex-col items-center gap-2 transition-all duration-500"
                style={{ opacity: i === activeRank ? 1 : 0.35, transform: i === activeRank ? 'scale(1.15)' : 'scale(1)' }}
              >
                <span className="text-3xl">{rank.icon}</span>
                <span className="text-sm font-bold" style={{ color: i === activeRank ? rank.color : '#6b7280' }}>
                  {rank.name}
                </span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-8">
            Start as a <span className="text-gray-300 font-semibold">Rookie</span>. Earn your way to{' '}
            <span className="text-red-400 font-semibold">Master</span> through consistent trades.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest font-semibold mb-3" style={{ color: '#E8313A' }}>How It Works</p>
            <h2 className="text-4xl font-black">Three steps. Real skills.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative bg-gray-900 border border-gray-800 rounded-2xl p-8 transition" style={{ }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,49,58,0.4)')} onMouseLeave={e => (e.currentTarget.style.borderColor = '')}>
                <span className="text-6xl font-black text-gray-800 absolute top-6 right-6 leading-none select-none">
                  {step.num}
                </span>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
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
      <section className="py-24 px-6 bg-gray-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest font-semibold mb-3" style={{ color: '#E8313A' }}>Features</p>
            <h2 className="text-4xl font-black">Everything you need to improve.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFERRAL HOOK */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest font-semibold mb-3" style={{ color: '#E8313A' }}>Referral Program</p>
            <h2 className="text-4xl font-black mb-4">Refer Friends. Get Paid.</h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              Share your referral link. Earn 20% of every payment your friends make — for 3 full months.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { value: '20%', label: 'Commission Rate', sub: 'On every payment your referrals make' },
              { value: '3 Months', label: 'Commission Duration', sub: 'Per referred friend, not just the first payment' },
              { value: '$18/mo', label: 'Per Pro Referral', sub: 'When friends subscribe to the Pro plan' },
            ].map(({ value, label, sub }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
                <p className="text-4xl font-black mb-2" style={{ color: '#E8313A' }}>{value}</p>
                <p className="font-bold text-white mb-2">{label}</p>
                <p className="text-gray-500 text-sm">{sub}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/sign-up"
              className="inline-block font-black text-lg px-8 py-4 rounded-xl transition transform hover:scale-105 text-white mr-4"
              style={{ background: '#E8313A' }}
            >
              Start Earning → Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-widest font-semibold mb-3" style={{ color: '#E8313A' }}>Pricing</p>
            <h2 className="text-4xl font-black">Start free. Upgrade when ready.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {/* Free */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-1">Free</h3>
              <p className="text-gray-500 text-sm mb-4">Get started</p>
              <p className="text-3xl font-black mb-4">$0</p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ 3 simulations per day</li>
                <li>✓ AI coach feedback</li>
                <li>✓ All timeframes</li>
                <li>✓ Rank tracking</li>
              </ul>
              <Link href="/sign-up" className="block text-center border border-gray-700 hover:border-gray-500 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                Get Started
              </Link>
            </div>

            {/* Starter */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-1">Starter</h3>
              <p className="text-gray-500 text-sm mb-4">More sims, more progress.</p>
              <p className="text-3xl font-black mb-4">$7.99<span className="text-base text-gray-500 font-normal">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ 15 simulations per day</li>
                <li>✓ Everything in Free</li>
                <li>✓ 5 AI follow-ups</li>
                <li>✓ Referral rewards</li>
              </ul>
              <Link href="/upgrade" className="block text-center border border-gray-700 hover:border-gray-500 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                Get Starter
              </Link>
            </div>

            {/* Pro — highlighted */}
            <div className="rounded-2xl p-6 relative" style={{ background: '#1a0a0b', border: '2px solid #E8313A' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-black px-3 py-1 rounded-full" style={{ background: '#E8313A' }}>
                MOST POPULAR
              </div>
              <h3 className="font-bold text-lg mb-1">Pro</h3>
              <p className="text-gray-500 text-sm mb-4">Serious about trading</p>
              <p className="text-3xl font-black mb-4">$29.99<span className="text-base text-gray-500 font-normal">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ 50 simulations per day</li>
                <li>✓ Everything in Starter</li>
                <li>✓ 15 AI follow-ups</li>
                <li>✓ Leaderboard access</li>
              </ul>
              <Link href="/upgrade" className="block text-center font-black py-2.5 rounded-xl transition text-sm text-white" style={{ background: '#E8313A' }}>
                Get Pro
              </Link>
            </div>

            {/* Elite */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-black px-3 py-1 rounded-full bg-amber-500">
                BEST VALUE
              </div>
              <h3 className="font-bold text-lg mb-1">Elite</h3>
              <p className="text-gray-500 text-sm mb-4">The full experience</p>
              <p className="text-3xl font-black mb-4">$39.99<span className="text-base text-gray-500 font-normal">/mo</span></p>
              <ul className="space-y-2 text-sm text-gray-400 mb-6">
                <li>✓ Unlimited simulations</li>
                <li>✓ Everything in Pro</li>
                <li>✓ 30 AI follow-ups</li>
                <li>✓ VIP leaderboard</li>
              </ul>
              <Link href="/upgrade" className="block text-center border border-gray-700 hover:border-gray-500 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                Get Elite
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-600 text-xs mt-6">Prices in USD. Cancel anytime. Switch plans anytime.</p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(232,49,58,0.04)' }} />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to become a better trader?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join ChartChamp and start building real trading skills today — for free.
          </p>
          <Link
            href="/sign-up"
            className="inline-block font-black text-xl px-10 py-5 rounded-xl transition transform hover:scale-105 text-white"
            style={{ background: '#E8313A' }}
          >
            Start Training Free →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-600 text-sm">
        <p>© 2025 ChartChamp. Built for traders who want to get better.</p>
      </footer>

    </main>
  );
}