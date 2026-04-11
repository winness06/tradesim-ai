"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

// ── Style tokens ─────────────────────────────────────────────────────────────

const BG      = '#07080f';
const SURFACE = '#0e1018';
const BORDER  = 'rgba(255,255,255,0.06)';
const BORDER_LG = 'rgba(255,255,255,0.12)';
const TEXT    = '#e8eaf0';
const MUTED   = '#5a6070';
const ACCENT  = '#E8313A';

// ── Plan data ─────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Get started",
    monthlyPrice: 0,
    features: [
      "3 simulations per day",
      "AI coach feedback",
      "All timeframes",
      "Rank tracking",
      "2 follow-up questions",
    ],
    highlight: false,
    cta: "Get Started",
    href: "/sign-up",
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "Level up faster",
    monthlyPrice: 9.99,
    features: [
      "15 simulations per day",
      "Everything in Free",
      "5 follow-up questions",
      "Referral rewards",
      "Priority support",
    ],
    highlight: false,
    cta: "Get Starter",
    href: null,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Serious about trading",
    monthlyPrice: 29.99,
    features: [
      "50 simulations per day",
      "Everything in Starter",
      "15 follow-up questions",
      "Leaderboard access",
      "Early feature access",
    ],
    highlight: true,
    cta: "Get Pro",
    href: null,
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "The full experience",
    monthlyPrice: 39.99,
    features: [
      "Unlimited simulations",
      "Everything in Pro",
      "30 follow-up questions",
      "VIP leaderboard",
      "Direct coach access",
    ],
    highlight: false,
    cta: "Get Elite",
    href: null,
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  const [annual, setAnnual] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/get-referral-link")
      .then(r => r.json())
      .then(d => { if (d.referralLink) setReferralLink(d.referralLink) })
      .catch(() => {})
  }, [])

  const handleUpgrade = async (planId: string) => {
    if (planId === "free") return
    setLoadingPlan(planId)
    setMessage("Redirecting to secure payment...")
    const referralCode = localStorage.getItem("referralCode") || ""
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode, plan: planId }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setMessage(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setMessage("Error connecting to payment. Please try again.")
    }
    setLoadingPlan(null)
  }

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getPrice = (monthly: number) => {
    if (monthly === 0) return "$0"
    if (annual) return `$${(monthly * 0.8).toFixed(2)}`
    return `$${monthly.toFixed(2)}`
  }

  return (
    <main style={{ background: BG, color: TEXT, fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 56,
        background: 'rgba(7,8,15,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.04em', color: TEXT, textDecoration: 'none', lineHeight: 1 }}>
            CHART<span style={{ color: ACCENT }}>CHAMP</span>
          </Link>
          <Link href="/app" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={e => (e.currentTarget.style.color = MUTED)}>
            ← Back to app
          </Link>
        </div>
      </nav>

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <section style={{
        paddingTop: 120, paddingBottom: 48, textAlign: 'center', padding: '120px 24px 48px',
        background: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,49,58,0.1), transparent)`,
      }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: ACCENT, marginBottom: 12 }}>
          Pricing
        </p>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 8vw, 80px)', letterSpacing: '0.02em', lineHeight: 1, color: TEXT, margin: '0 0 12px' }}>
          CHOOSE YOUR PLAN
        </h1>
        <p style={{ fontSize: 15, color: MUTED, margin: '0 0 40px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
          Start free. Upgrade when you&apos;re ready to level up.
        </p>

        {/* Annual toggle */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 40,
          padding: '8px 20px',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: !annual ? TEXT : MUTED, transition: 'color 0.2s' }}>Monthly</span>
          <button
            onClick={() => setAnnual(a => !a)}
            style={{
              position: 'relative', width: 44, height: 24, borderRadius: 12,
              background: annual ? ACCENT : BORDER_LG,
              boxShadow: annual ? '0 0 12px rgba(232,49,58,0.4)' : 'none',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0,
            }}
            aria-label="Toggle annual billing"
          >
            <span style={{
              position: 'absolute', top: 4, width: 16, height: 16, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
              left: annual ? 24 : 4,
            }} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: annual ? TEXT : MUTED, transition: 'color 0.2s' }}>
            Annual&nbsp;
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.08em', color: '#00d4aa', fontWeight: 700 }}>
              SAVE 20%
            </span>
          </span>
        </div>
      </section>

      {/* ── PLAN GRID ───────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {PLANS.map(plan => {
            const isHovered = hovered === plan.id;
            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHovered(plan.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'relative',
                  background: plan.highlight
                    ? 'radial-gradient(ellipse 100% 80% at 50% -20%, rgba(232,49,58,0.18), transparent), #0d0608'
                    : SURFACE,
                  border: `1px solid ${plan.highlight ? 'rgba(232,49,58,0.4)' : isHovered ? BORDER_LG : BORDER}`,
                  borderRadius: 16,
                  padding: '28px 24px',
                  display: 'flex', flexDirection: 'column',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxShadow: plan.highlight
                    ? '0 0 60px rgba(232,49,58,0.12), 0 0 120px rgba(232,49,58,0.04)'
                    : isHovered ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {/* Popular badge */}
                {plan.highlight && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: ACCENT, color: '#fff',
                    fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.1em',
                    padding: '3px 12px', borderRadius: 20,
                    boxShadow: '0 0 16px rgba(232,49,58,0.5)',
                    whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}

                {/* Plan name + tagline */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: plan.highlight ? ACCENT : MUTED, marginBottom: 4 }}>
                    {plan.tagline}
                  </p>
                  <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.03em', color: TEXT, margin: 0 }}>
                    {plan.name}
                  </h2>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 42, fontWeight: 500, color: TEXT, lineHeight: 1, letterSpacing: '-0.02em' }}>
                      {getPrice(plan.monthlyPrice)}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span style={{ fontSize: 12, color: MUTED }}>/mo</span>
                    )}
                  </div>
                  {annual && plan.monthlyPrice > 0 && (
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#00d4aa', marginTop: 6 }}>
                      Save ${(plan.monthlyPrice * 12 * 0.2).toFixed(2)}/year
                    </p>
                  )}
                  {annual && plan.monthlyPrice > 0 && (
                    <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>billed annually</p>
                  )}
                </div>

                {/* Features */}
                <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: MUTED }}>
                      <span style={{
                        width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        background: plan.highlight ? 'rgba(232,49,58,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${plan.highlight ? 'rgba(232,49,58,0.3)' : BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: plan.highlight ? ACCENT : MUTED,
                      }}>
                        ✓
                      </span>
                      <span style={{ color: '#9aa0b0' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.href ? (
                  <Link
                    href={plan.href}
                    style={{
                      display: 'block', textAlign: 'center', textDecoration: 'none',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                      color: TEXT, padding: '12px 0', borderRadius: 10, minHeight: 44,
                      border: `1px solid ${BORDER_LG}`, transition: 'all 0.15s',
                      lineHeight: '20px',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER_LG; e.currentTarget.style.color = TEXT; }}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loadingPlan !== null}
                    style={{
                      width: '100%', cursor: loadingPlan !== null ? 'not-allowed' : 'pointer',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
                      color: '#fff', padding: '12px 0', borderRadius: 10, minHeight: 44,
                      background: plan.highlight ? ACCENT : 'transparent',
                      border: plan.highlight ? 'none' : `1px solid ${BORDER_LG}`,
                      boxShadow: plan.highlight ? '0 0 20px rgba(232,49,58,0.35)' : 'none',
                      opacity: loadingPlan !== null ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {loadingPlan === plan.id ? "Loading..." : plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Billing note */}
        <p style={{ textAlign: 'center', fontSize: 11, color: MUTED, marginTop: 24, fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>
          All plans billed {annual ? 'annually' : 'monthly'} · Cancel anytime · No hidden fees
        </p>

        {/* Status message */}
        {message && (
          <p style={{ textAlign: 'center', color: '#00d4aa', fontSize: 13, marginTop: 16 }}>{message}</p>
        )}
      </section>

      {/* ── REFERRAL ────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 480, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{
          background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16,
          padding: '32px 28px', textAlign: 'center',
        }}>
          {/* Icon */}
          <div style={{
            width: 44, height: 44, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(232,49,58,0.1)', border: `1px solid rgba(232,49,58,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            🎁
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: '0.03em', color: TEXT, margin: '0 0 8px' }}>
            SHARE &amp; EARN FREE SIMS
          </h2>
          <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px', lineHeight: 1.6 }}>
            Refer friends and earn rewards when they sign up.
          </p>

          {/* Referral link display */}
          <div style={{
            background: BG, border: `1px solid ${BORDER}`, borderRadius: 10,
            padding: '10px 14px', marginBottom: 16,
            fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9aa0b0',
            wordBreak: 'break-all', textAlign: 'left', lineHeight: 1.6,
          }}>
            {referralLink || "Loading your referral link..."}
          </div>

          <button
            onClick={handleCopy}
            disabled={!referralLink}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13,
              color: '#fff', padding: '12px 28px', borderRadius: 10, minHeight: 44,
              background: referralLink ? ACCENT : 'rgba(232,49,58,0.3)',
              border: 'none', cursor: referralLink ? 'pointer' : 'not-allowed',
              boxShadow: referralLink ? '0 0 16px rgba(232,49,58,0.3)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {copied ? "Copied ✓" : "Copy Link"}
          </button>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: MUTED, letterSpacing: '0.06em' }}>
          © 2025 CHARTCHAMP · <Link href="/" style={{ color: MUTED, textDecoration: 'none' }}>Home</Link> · <Link href="/app" style={{ color: MUTED, textDecoration: 'none' }}>App</Link>
        </p>
      </footer>

    </main>
  )
}
