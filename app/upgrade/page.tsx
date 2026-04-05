"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Get started",
    monthlyPrice: 0,
    sims: "3 sims/day",
    followUps: "2 AI follow-ups",
    features: ["3 simulations per day", "AI coach feedback", "All timeframes", "Rank tracking", "2 follow-up questions"],
    highlight: false,
    cta: "Get Started",
    href: "/sign-up",
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "Level up faster",
    monthlyPrice: 9.99,
    sims: "15 sims/day",
    followUps: "5 AI follow-ups",
    features: ["15 simulations per day", "Everything in Free", "5 follow-up questions", "Referral rewards", "Priority support"],
    highlight: false,
    cta: "Get Starter",
    href: null,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Serious about trading",
    monthlyPrice: 29.99,
    sims: "50 sims/day",
    followUps: "15 AI follow-ups",
    features: ["50 simulations per day", "Everything in Starter", "15 follow-up questions", "Leaderboard access", "Early feature access"],
    highlight: true,
    cta: "Get Pro",
    href: null,
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "The full experience",
    monthlyPrice: 39.99,
    sims: "Unlimited sims",
    followUps: "30 AI follow-ups",
    features: ["Unlimited simulations", "Everything in Pro", "30 follow-up questions", "VIP leaderboard", "Direct coach access"],
    highlight: false,
    cta: "Get Elite",
    href: null,
  },
]

export default function UpgradePage() {
  const [annual, setAnnual] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

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
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-4 text-center">
        <Link href="/app" className="text-gray-500 text-sm hover:text-gray-300 transition mb-6 inline-block">
          ← Back to app
        </Link>
        <h1 className="text-4xl font-black mb-3">Choose Your Plan</h1>
        <p className="text-gray-400 mb-8">Start free. Upgrade when you&apos;re ready to level up.</p>

        {/* Annual toggle */}
        <div className="inline-flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-full px-4 py-2">
          <span className={`text-sm font-semibold ${!annual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(a => !a)}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{ background: annual ? '#E8313A' : '#374151' }}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: annual ? '26px' : '4px' }}
            />
          </button>
          <span className={`text-sm font-semibold ${annual ? 'text-white' : 'text-gray-500'}`}>
            Annual <span className="text-green-400 text-xs font-bold">SAVE 20%</span>
          </span>
        </div>
      </div>

      {/* Plan grid */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {PLANS.map(plan => (
          <div
            key={plan.id}
            className="rounded-2xl p-6 flex flex-col"
            style={{
              background: plan.highlight ? '#1a0a0b' : '#111827',
              border: plan.highlight ? '2px solid #E8313A' : '1px solid #1f2937',
              position: 'relative',
            }}
          >
            {plan.highlight && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-black px-3 py-1 rounded-full"
                style={{ background: '#E8313A' }}
              >
                MOST POPULAR
              </div>
            )}
            <div className="mb-4">
              <h2 className="text-xl font-black">{plan.name}</h2>
              <p className="text-gray-500 text-sm">{plan.tagline}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-black">{getPrice(plan.monthlyPrice)}</span>
              {plan.monthlyPrice > 0 && (
                <span className="text-gray-500 text-sm">/mo{annual ? ' billed annually' : ''}</span>
              )}
              {annual && plan.monthlyPrice > 0 && (
                <p className="text-green-400 text-xs mt-1">
                  Save ${(plan.monthlyPrice * 12 * 0.2).toFixed(2)}/year
                </p>
              )}
            </div>
            <ul className="space-y-2 mb-8 flex-1">
              {plan.features.map(f => (
                <li key={f} className="text-sm text-gray-400 flex items-start gap-2">
                  <span style={{ color: '#E8313A' }} className="mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {plan.href ? (
              <Link
                href={plan.href}
                className="block text-center font-black py-3 rounded-xl transition"
                style={{ border: '1px solid #374151', color: '#fff' }}
              >
                {plan.cta}
              </Link>
            ) : (
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loadingPlan !== null}
                className="w-full font-black py-3 rounded-xl transition text-white disabled:opacity-60"
                style={{ background: plan.highlight ? '#E8313A' : '#1f2937', border: plan.highlight ? 'none' : '1px solid #374151' }}
              >
                {loadingPlan === plan.id ? "Loading..." : plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-gray-600 text-xs mb-8">All plans billed {annual ? 'annually' : 'monthly'}. Cancel anytime. No hidden fees.</p>

      {message && (
        <p className="text-center text-green-300 text-sm mb-6">{message}</p>
      )}

      {/* Referral section */}
      <div className="max-w-md mx-auto px-6 pb-16">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-bold mb-1">Share & Earn Free Sims</h2>
          <p className="text-gray-400 text-sm mb-4">Refer friends and earn rewards when they sign up.</p>
          <p className="text-gray-300 text-xs break-all mb-4 bg-gray-800 rounded-lg px-3 py-2">
            {referralLink || "Loading your referral link..."}
          </p>
          <button
            onClick={handleCopy}
            disabled={!referralLink}
            className="px-6 py-2 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition"
            style={{ background: '#E8313A' }}
          >
            {copied ? "Copied ✓" : "Copy Link"}
          </button>
        </div>
      </div>
    </main>
  )
}
