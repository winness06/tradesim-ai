'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DemoSimulator from '@/components/DemoSimulator';
import MobileNav from '@/components/MobileNav';

// ── Data ────────────────────────────────────────────────────────────────────

const ranks = [
  { name: 'Rookie',       color: '#9ca3af', min: 0,  icon: '🥉' },
  { name: 'Intermediate', color: '#34d399', min: 40, icon: '🥈' },
  { name: 'Pro',          color: '#60a5fa', min: 60, icon: '🥇' },
  { name: 'Elite',        color: '#f59e0b', min: 80, icon: '💎' },
  { name: 'Master',       color: '#E8313A', min: 95, icon: '👑' },
];

const ticker = [
  { label: 'AVG SCORE',    value: '74.2' },
  { label: 'WIN RATE',     value: '61%' },
  { label: 'TRADES TODAY', value: '1,247' },
  { label: 'TOP RANK',     value: '👑 Master' },
];

// ── Shared style tokens ─────────────────────────────────────────────────────

const BG      = '#07080f';
const SURFACE = '#0e1018';
const BORDER  = 'rgba(255,255,255,0.06)';
const BORDER_LG = 'rgba(255,255,255,0.12)';
const TEXT    = '#e8eaf0';
const MUTED   = '#5a6070';
const ACCENT  = '#E8313A';
const GREEN   = '#00d4aa';

// ── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [activeRank, setActiveRank] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveRank(p => (p + 1) % ranks.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <main style={{ background: BG, color: TEXT, fontFamily: "'DM Sans', sans-serif", overflowX: 'hidden', minHeight: '100vh' }}>

      {/* ═══════════════════════════════════════════════════════ NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 56,
        background: 'rgba(7,8,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.04em', color: TEXT, lineHeight: 1 }}>
            CHART<span style={{ color: ACCENT }}>CHAMP</span>
          </span>

          {/* Center links — desktop */}
          <div className="hidden md:flex" style={{ gap: 32, alignItems: 'center' }}>
            {[['Features', '#features'], ['How It Works', '#how'], ['Pricing', '#pricing']].map(([label, href]) => (
              <a key={label} href={href} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
                onMouseLeave={e => (e.currentTarget.style.color = MUTED)}>
                {label}
              </a>
            ))}
          </div>

          {/* Right CTAs — desktop */}
          <div className="hidden md:flex" style={{ gap: 10, alignItems: 'center' }}>
            <Link href="/sign-in" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED, padding: '7px 16px', border: `1px solid ${BORDER}`, borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.borderColor = BORDER_LG; }}
              onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER; }}>
              Sign In
            </Link>
            <Link href="/sign-up" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', padding: '7px 16px', background: ACCENT, borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s', boxShadow: '0 0 16px rgba(232,49,58,0.3)' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
              Start Free
            </Link>
          </div>

          {/* Mobile nav */}
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════ HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px 60px', textAlign: 'center', position: 'relative',
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,49,58,0.12), transparent)`,
      }}>
        {/* Data ticker bar */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', display: 'flex', alignItems: 'center', gap: 0, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, marginBottom: 52, overflow: 'hidden', maxWidth: '100%', flexWrap: 'wrap' }}>
          {ticker.map((t, i) => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', padding: '8px 20px', borderRight: i < ticker.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 8 }}>{t.label}</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: TEXT, fontWeight: 500 }}>{t.value}</span>
            </div>
          ))}
        </div>

        {/* H1 */}
        <h1 className="animate-fade-in-up" style={{
          animationDelay: '0.2s',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(56px, 10vw, 120px)',
          lineHeight: 0.95,
          letterSpacing: '0.02em',
          marginBottom: 24,
          maxWidth: 900,
        }}>
          <span style={{ display: 'block', color: TEXT }}>MASTER THE MARKET</span>
          <span style={{ display: 'block', color: TEXT }}>WITHOUT LOSING</span>
          <span style={{ display: 'block', color: ACCENT }}>A SINGLE DOLLAR</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in-up" style={{ animationDelay: '0.3s', fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: MUTED, maxWidth: 480, lineHeight: 1.65, marginBottom: 40 }}>
          AI-generated charts. Real coaching. Gamified ranking. Practice trading the way professionals do — with stakes, feedback, and progression.
        </p>

        {/* CTA row */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
          <Link href="/sign-up" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#fff', padding: '14px 32px', background: ACCENT, borderRadius: 10, textDecoration: 'none', boxShadow: '0 0 32px rgba(232,49,58,0.4)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
            Start Training Free →
          </Link>
          <a href="#demo" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16, color: TEXT, padding: '14px 32px', border: `1px solid ${BORDER_LG}`, borderRadius: 10, textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER_LG; }}>
            Try Demo
          </a>
        </div>

        {/* Social proof */}
        <p className="animate-fade-in-up" style={{ animationDelay: '0.5s', fontFamily: "'DM Mono', monospace", fontSize: 11, color: MUTED, letterSpacing: '0.15em' }}>
          FREE TO START &nbsp;·&nbsp; NO CREDIT CARD &nbsp;·&nbsp; INSTANT ACCESS
        </p>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div className="bounce-down" style={{ color: MUTED, fontSize: 18 }}>↓</div>
        </div>

        {/* Bottom border */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: BORDER }} />
      </section>

      {/* ═══════════════════════════════════════════════════════ SECTION 1 — THE PROBLEM */}
      <section style={{ padding: '120px 24px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: 64 }} className="md:grid-cols-2-problem">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase', marginBottom: 20 }}>THE PROBLEM</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 6vw, 72px)', lineHeight: 1, color: TEXT, marginBottom: 28, letterSpacing: '0.02em' }}>
              MOST TRADERS LOSE MONEY IN YEAR ONE
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: MUTED, lineHeight: 1.8, maxWidth: 480 }}>
              Not because they lack intelligence. Because they practice with real money before they&apos;re ready. Paper trading on your broker has no stakes, no coaching, and no progression. You don&apos;t learn — you just lose.
            </p>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(80px, 12vw, 140px)', lineHeight: 1, color: ACCENT, letterSpacing: '0.02em' }}>90%</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED, lineHeight: 1.6, marginTop: 12 }}>
              of retail traders<br />lose money<br />in their first year
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ SECTION 2 — THE SOLUTION */}
      <section style={{ padding: '120px 24px', background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', marginBottom: 72 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase', marginBottom: 16 }}>THE SOLUTION</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px, 5vw, 60px)', lineHeight: 1.05, color: TEXT, letterSpacing: '0.02em', maxWidth: 700 }}>
              PRACTICE LIKE A PRO. RANK UP. GET COACHED.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
            {[
              {
                num: '01', title: 'AI-Generated Charts',
                desc: 'Every simulation is unique. Regime-based momentum, 6 timeframes, realistic price action. Never the same chart twice.',
              },
              {
                num: '02', title: 'AI Coach Feedback',
                desc: 'Specific advice on your exact entry, take profit, and stop loss after every trade. Not generic tips — your trade, dissected.',
              },
              {
                num: '03', title: 'Rank & Progress',
                desc: 'Score every trade. Earn badges. Climb from Rookie to Master through consistent, disciplined decision-making.',
              },
            ].map((item, i) => (
              <div key={item.num} className="animate-fade-in-up" style={{ animationDelay: `${0.1 + i * 0.1}s`, padding: '40px 36px', borderTop: `2px solid ${ACCENT}`, background: BG }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: MUTED, marginBottom: 20, letterSpacing: '0.1em' }}>{item.num}</div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 14, lineHeight: 1.3 }}>{item.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED, lineHeight: 1.75 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ SECTION 3 — RANK SHOWCASE */}
      <section style={{ padding: '100px 24px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          {/* Rank timeline */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 56, flexWrap: 'wrap' }}>
            {ranks.map((rank, i) => (
              <div key={rank.name} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '0 12px' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                    border: `2px solid ${i === activeRank ? rank.color : BORDER}`,
                    background: i === activeRank ? `${rank.color}18` : 'transparent',
                    transition: 'all 0.5s ease',
                    animation: i === activeRank ? 'rankPulse 2s ease-in-out infinite' : 'none',
                  }}>
                    {rank.icon}
                  </div>
                  <span style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 13, letterSpacing: '0.08em',
                    color: i === activeRank ? rank.color : MUTED,
                    transition: 'color 0.5s ease',
                  }}>{rank.name.toUpperCase()}</span>
                </div>
                {i < ranks.length - 1 && (
                  <div style={{ width: 32, height: 1, background: BORDER, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>

          <h2 className="animate-fade-in-up" style={{ animationDelay: '0.2s', fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(36px, 5vw, 56px)', color: TEXT, letterSpacing: '0.04em', lineHeight: 1 }}>
            WHERE DO YOU RANK?
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED, marginTop: 16, lineHeight: 1.6 }}>
            Start as Rookie. Earn your way to <span style={{ color: ACCENT, fontWeight: 600 }}>Master</span> through consistent, disciplined trades.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ SECTION 4 — HOW IT WORKS */}
      <section id="how" style={{ padding: '120px 24px', background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase', marginBottom: 72 }}>HOW IT WORKS</div>

          {[
            { num: '01', title: 'GET A CHART', desc: 'A new AI-generated chart appears every session. Study it like a real trade — analyse the trend, support levels, and market regime. No two charts are the same.' },
            { num: '02', title: 'PLACE YOUR TRADE', desc: 'Set your entry price, take profit targets (up to 3), and stop loss. Write your reasoning. Commit — like you would with real money.' },
            { num: '03', title: 'GET AI FEEDBACK', desc: 'See exactly what happened. Your AI coach dissects your specific levels, flags mistakes, and gives you one concrete thing to fix next time.' },
          ].map((step, i) => (
            <div key={step.num} className="animate-fade-in-up" style={{
              animationDelay: `${0.1 + i * 0.15}s`,
              display: 'grid',
              gridTemplateColumns: i % 2 === 0 ? '1fr 1fr' : '1fr 1fr',
              gap: 0,
              borderTop: `1px solid ${BORDER}`,
              padding: '64px 0',
              position: 'relative',
            }}>
              {/* Ghost number */}
              <div style={{
                position: 'absolute',
                [i % 2 === 0 ? 'right' : 'left']: 0,
                top: '50%', transform: 'translateY(-50%)',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(100px, 15vw, 200px)',
                lineHeight: 1,
                color: 'rgba(255,255,255,0.025)',
                letterSpacing: '-0.02em',
                userSelect: 'none',
                pointerEvents: 'none',
              }}>{step.num}</div>

              <div style={{ order: i % 2 === 0 ? 0 : 1, padding: '0 32px 0 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: MUTED, marginBottom: 16, letterSpacing: '0.1em' }}>{step.num}</div>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(36px, 4vw, 52px)', color: TEXT, lineHeight: 1, letterSpacing: '0.02em', marginBottom: 20 }}>{step.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: MUTED, lineHeight: 1.75, maxWidth: 380 }}>{step.desc}</p>
              </div>

              <div style={{ order: i % 2 === 0 ? 1 : 0 }} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ SECTION 5 — DEMO */}
      <section id="demo" style={{ padding: '120px 24px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase', marginBottom: 16 }}>TRY IT NOW — NO SIGN UP</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px, 5vw, 60px)', color: TEXT, letterSpacing: '0.02em', lineHeight: 1, marginBottom: 16 }}>SEE EXACTLY HOW IT WORKS</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED, maxWidth: 440, margin: '0 auto', lineHeight: 1.7 }}>
              Study the chart, place your trade, and get real AI coaching feedback. 3 free trades before signing up.
            </p>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <DemoSimulator />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ SECTION 6 — FEATURES */}
      <section id="features" style={{ padding: '120px 24px', background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', marginBottom: 64 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase', marginBottom: 16 }}>FEATURES</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px, 5vw, 60px)', color: TEXT, letterSpacing: '0.02em', lineHeight: 1 }}>EVERYTHING YOU NEED TO IMPROVE.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 1 }}>
            {[
              { label: 'AI-Generated Charts', desc: 'Realistic simulated price action — new charts every session across 6 timeframes.' },
              { label: 'AI Trading Coach', desc: 'Instant, specific feedback on every trade. Know exactly what you did right or wrong.' },
              { label: 'Multiple Take Profits', desc: 'Set up to 3 take profit targets and a stop loss — just like real trading.' },
              { label: 'RSI, MACD & Volume', desc: 'Practice reading real technical indicators. Toggle them on or off anytime.' },
              { label: '6 Timeframes', desc: 'Switch between 1m, 5m, 15m, 1h, 4h and daily charts instantly.' },
              { label: 'Rank Up System', desc: 'Start as Rookie. Earn your way to Master through consistent good trades.' },
            ].map((f, i) => (
              <div key={f.label} className="animate-fade-in-up" style={{ animationDelay: `${0.05 * i}s`, padding: '36px', background: BG, borderTop: `1px solid ${BORDER}` }}
                onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}08`; }}
                onMouseLeave={e => { e.currentTarget.style.background = BG; }}>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 10 }}>{f.label}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ SECTION 7 — REFERRAL */}
      <section style={{ padding: '120px 24px', borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase', marginBottom: 20 }}>REFERRAL PROGRAM</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px, 6vw, 72px)', color: TEXT, letterSpacing: '0.02em', lineHeight: 1, marginBottom: 16 }}>
              EARN WHILE YOUR<br />FRIENDS LEARN
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 56 }}>
              Share your referral link. Earn 20% of every payment your friends make — for 3 full months.
            </p>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, marginBottom: 48, background: BORDER }}>
            {[
              { value: '20%',    label: 'Commission Rate',      sub: 'On every payment your referrals make' },
              { value: '3 MO',   label: 'Commission Duration',  sub: 'Per referred friend, not just first payment' },
              { value: '$18/mo', label: 'Per Pro Referral',     sub: 'When friends subscribe to the Pro plan' },
            ].map(({ value, label, sub }) => (
              <div key={label} style={{ padding: '48px 32px', background: SURFACE }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 500, color: ACCENT, marginBottom: 10, lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{sub}</div>
              </div>
            ))}
          </div>

          <Link href="/sign-up" style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#fff', padding: '14px 36px', background: ACCENT, borderRadius: 10, textDecoration: 'none', boxShadow: '0 0 32px rgba(232,49,58,0.35)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
            Start Earning → Sign Up Free
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ SECTION 8 — PRICING */}
      <section id="pricing" style={{ padding: '120px 24px', background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s', marginBottom: 64 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase', marginBottom: 16 }}>PRICING</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px, 5vw, 60px)', color: TEXT, letterSpacing: '0.02em', lineHeight: 1 }}>
              START FREE. UPGRADE WHEN READY.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {/* Free */}
            {[
              { name: 'FREE', price: '$0', period: '', features: ['3 simulations per day', 'AI coach feedback', 'All timeframes', 'Rank tracking'], cta: 'Get Started', href: '/sign-up', highlight: false },
              { name: 'STARTER', price: '$7.99', period: '/mo', features: ['15 simulations per day', 'Everything in Free', '5 AI follow-ups', 'Referral rewards'], cta: 'Get Starter', href: '/upgrade', highlight: false },
              { name: 'PRO', price: '$29.99', period: '/mo', features: ['50 simulations per day', 'Everything in Starter', '15 AI follow-ups', 'Leaderboard access'], cta: 'Get Pro', href: '/upgrade', highlight: true },
              { name: 'ELITE', price: '$39.99', period: '/mo', features: ['Unlimited simulations', 'Everything in Pro', '30 AI follow-ups', 'VIP leaderboard'], cta: 'Get Elite', href: '/upgrade', highlight: false },
            ].map((plan, i) => (
              <div key={plan.name} className="animate-fade-in-up" style={{
                animationDelay: `${0.05 * i}s`,
                background: plan.highlight ? 'radial-gradient(ellipse at top, rgba(232,49,58,0.1), #0e1018)' : BG,
                border: `1px solid ${plan.highlight ? 'rgba(232,49,58,0.4)' : BORDER}`,
                borderRadius: 16,
                padding: '32px 28px',
                display: 'flex', flexDirection: 'column',
                position: 'relative',
                boxShadow: plan.highlight ? '0 0 48px rgba(232,49,58,0.12)' : 'none',
              }}>
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: ACCENT, color: '#fff', fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, padding: '3px 12px', borderRadius: 99, letterSpacing: '0.1em', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(232,49,58,0.5)' }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED, marginBottom: 20 }}>{plan.name}</div>

                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 44, fontWeight: 500, color: plan.highlight ? ACCENT : TEXT, lineHeight: 1 }}>{plan.price}</span>
                  {plan.period && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED, marginLeft: 2 }}>{plan.period}</span>}
                </div>

                <div style={{ flex: 1, marginBottom: 28 }}>
                  {plan.features.map((f, fi) => (
                    <div key={f} style={{
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED, padding: '10px 0',
                      borderTop: fi === 0 ? `1px solid ${BORDER}` : 'none',
                      borderBottom: `1px solid ${BORDER}`,
                    }}>{f}</div>
                  ))}
                </div>

                <Link href={plan.href} style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14,
                  color: plan.highlight ? '#fff' : TEXT,
                  padding: '12px', borderRadius: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center',
                  background: plan.highlight ? ACCENT : 'transparent',
                  border: plan.highlight ? 'none' : `1px solid ${BORDER_LG}`,
                  boxShadow: plan.highlight ? '0 0 20px rgba(232,49,58,0.3)' : 'none',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { if (!plan.highlight) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                  onMouseLeave={e => { if (!plan.highlight) e.currentTarget.style.borderColor = BORDER_LG; }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: MUTED, textAlign: 'center', marginTop: 24, letterSpacing: '0.08em' }}>PRICES IN USD · CANCEL ANYTIME · SWITCH PLANS ANYTIME</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ FINAL CTA */}
      <section style={{ padding: '140px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(232,49,58,0.09), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }} className="animate-fade-in-up">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase', marginBottom: 24 }}>GET STARTED TODAY</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 0.95, color: TEXT, letterSpacing: '0.02em', marginBottom: 24 }}>
            READY TO BECOME<br />A BETTER TRADER?
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: MUTED, lineHeight: 1.7, marginBottom: 40 }}>
            Join ChartChamp and start building real trading skills today — for free.
          </p>
          <Link href="/sign-up" style={{ display: 'inline-block', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#fff', padding: '16px 40px', background: ACCENT, borderRadius: 12, textDecoration: 'none', boxShadow: '0 0 48px rgba(232,49,58,0.45), 0 8px 32px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
            Start Training Free →
          </Link>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: MUTED, marginTop: 20, letterSpacing: '0.12em' }}>FREE TO START · NO CREDIT CARD · INSTANT ACCESS</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ FOOTER */}
      <footer style={{ padding: '24px', borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: MUTED, letterSpacing: '0.08em' }}>
          © 2025 CHARTCHAMP · BUILT FOR TRADERS WHO WANT TO GET BETTER
        </p>
      </footer>

    </main>
  );
}
