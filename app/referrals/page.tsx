"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const REWARD_TIERS = [
  { count: 1,  reward: "5 Bonus Sims",               desc: "Just for getting started" },
  { count: 5,  reward: "$5 Cash Bonus",               desc: "First milestone" },
  { count: 10, reward: "15 Free Sims + $15 Bonus",    desc: "Earning machine" },
  { count: 20, reward: "$25 Cash Bonus",               desc: "Top referrer status" },
  { count: 50, reward: "$1,000 Leaderboard Entry",     desc: "Elite ambassador" },
]

export default function ReferralsPage() {
  const [referralLink, setReferralLink] = useState("")
  const [referralCount, setReferralCount] = useState(0)
  const [referralEarnings, setReferralEarnings] = useState(0)
  const [copied, setCopied] = useState(false)
  const [friendCount, setFriendCount] = useState(5)

  useEffect(() => {
    fetch("/api/get-referral-link")
      .then(r => r.json())
      .then(d => {
        if (d.referralLink) setReferralLink(d.referralLink)
        if (typeof d.referralCount === "number") setReferralCount(d.referralCount)
        if (typeof d.referralEarnings === "string") setReferralEarnings(parseFloat(d.referralEarnings))
      })
      .catch(() => {})
  }, [])

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`I've been training my trading with ChartChamp — AI-generated charts + coaching. Check it out: ${referralLink}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`I've been training my trading with ChartChamp. Try it free: ${referralLink}`)
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  const handleCopyPromo = () => {
    const text = `Hey! I've been using ChartChamp to practice trading with AI coaching — it's actually really good. You get 3 free sims a day on the free plan. Check it out: ${referralLink}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const monthlyPerFriend = 29.99 * 0.2
  const threeMonthEstimate = friendCount * monthlyPerFriend * 3
  const nextTier = REWARD_TIERS.find(t => referralCount < t.count)
  const progressPct = nextTier ? Math.min((referralCount / nextTier.count) * 100, 100) : 100

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <div className="max-w-4xl mx-auto px-6 pt-8 pb-2">
        <Link href="/app" className="text-gray-500 text-sm hover:text-gray-300 transition">
          ← Back to app
        </Link>
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-10 pb-12 text-center">
        <div className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6" style={{ background: 'rgba(232,49,58,0.15)', color: '#E8313A', border: '1px solid rgba(232,49,58,0.3)' }}>
          Referral Program
        </div>
        <h1 className="text-5xl md:text-6xl font-black mb-4 leading-tight">
          Earn Real Money.
          <br />
          <span style={{ color: '#E8313A' }}>Just Share a Link.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          Get <span className="text-white font-bold">20% commission</span> on every payment your referrals make — for 3 full months.
          Real USD, paid to you.
        </p>

        {/* Stat boxes */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
          {[
            { value: "20%", label: "Commission" },
            { value: "3 mo", label: "Duration" },
            { value: `$${monthlyPerFriend.toFixed(0)}/mo`, label: "Per referral" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl py-5">
              <p className="text-3xl font-black" style={{ color: '#E8313A' }}>{value}</p>
              <p className="text-xs text-gray-500 mt-1 font-semibold uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Your link */}
        <div className="max-w-lg mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Your Referral Link</p>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-300 truncate font-mono">
              {referralLink || "Loading..."}
            </div>
            <button
              onClick={handleCopy}
              disabled={!referralLink}
              className="font-black text-sm px-5 py-3 rounded-xl text-white disabled:opacity-40 transition"
              style={{ background: '#E8313A' }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          {/* Share buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleShareTwitter}
              disabled={!referralLink}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-700 hover:border-gray-500 transition disabled:opacity-40"
            >
              𝕏 Twitter
            </button>
            <button
              onClick={handleShareWhatsApp}
              disabled={!referralLink}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-700 hover:border-gray-500 transition disabled:opacity-40"
            >
              💬 WhatsApp
            </button>
            <button
              onClick={handleCopyPromo}
              disabled={!referralLink}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-700 hover:border-gray-500 transition disabled:opacity-40"
            >
              📋 Copy Text
            </button>
          </div>
        </div>
      </section>

      {/* Your stats */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { value: referralCount.toString(), label: "Total Referrals" },
            { value: `$${referralEarnings.toFixed(2)}`, label: "Total Earned" },
            { value: `$${(referralCount * monthlyPerFriend).toFixed(2)}/mo`, label: "Monthly Rate" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <p className="text-3xl font-black" style={{ color: '#E8313A' }}>{value}</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mt-2">{label}</p>
            </div>
          ))}
        </div>

        {/* Next tier progress */}
        {nextTier && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <div className="flex justify-between mb-3">
              <span className="text-sm text-gray-400">{referralCount} / {nextTier.count} referrals toward</span>
              <span className="text-sm font-bold" style={{ color: '#E8313A' }}>{nextTier.reward}</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: '#E8313A' }} />
            </div>
          </div>
        )}
      </section>

      {/* Earnings calculator */}
      <section className="max-w-4xl mx-auto px-6 pb-10">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-xl font-black mb-1">Earnings Calculator</h2>
          <p className="text-gray-500 text-sm mb-6">See how much you could earn over 3 months</p>

          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400 font-semibold">Friends referred</label>
              <span className="text-sm font-black" style={{ color: '#E8313A' }}>{friendCount}</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={friendCount}
              onChange={e => setFriendCount(parseInt(e.target.value))}
              className="w-full accent-red-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>1</span>
              <span>50</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">${(friendCount * monthlyPerFriend).toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">Month 1</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-white">${(friendCount * monthlyPerFriend * 2).toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">Month 2</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(232,49,58,0.15)', border: '1px solid rgba(232,49,58,0.3)' }}>
              <p className="text-2xl font-black" style={{ color: '#E8313A' }}>${threeMonthEstimate.toFixed(0)}</p>
              <p className="text-xs text-gray-500 mt-1">3-Month Total</p>
            </div>
          </div>

          <p className="text-xs text-gray-600 mt-4 text-center">
            Based on {friendCount} friends subscribing to Pro ($29.99/mo) × 20% commission × 3 months
          </p>
        </div>
      </section>

      {/* Reward tiers */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-xl font-black mb-4">Reward Tiers</h2>
        <div className="space-y-3">
          {REWARD_TIERS.map((tier, i) => {
            const isUnlocked = referralCount >= tier.count
            return (
              <div
                key={i}
                className="flex items-center justify-between p-5 rounded-2xl border"
                style={{
                  background: isUnlocked ? 'rgba(232,49,58,0.08)' : '#111827',
                  borderColor: isUnlocked ? 'rgba(232,49,58,0.4)' : '#1f2937',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                    style={{ background: isUnlocked ? '#E8313A' : '#1f2937', color: isUnlocked ? '#fff' : '#6b7280' }}>
                    {tier.count}
                  </div>
                  <div>
                    <p className="font-bold text-white">{tier.reward}</p>
                    <p className="text-xs text-gray-500">{tier.desc}</p>
                  </div>
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${isUnlocked ? 'text-green-400 bg-green-400/10' : 'text-gray-600 bg-gray-800'}`}>
                  {isUnlocked ? "Unlocked ✓" : `${tier.count} refs`}
                </span>
              </div>
            )
          })}
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          20% commission paid for 3 months per referral. Cash bonuses paid via PayPal or bank transfer.
        </p>
      </section>

    </main>
  )
}
