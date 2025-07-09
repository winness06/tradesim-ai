"use client"

import { useEffect, useState } from "react"

export default function ReferralsPage() {
  const [referralLink, setReferralLink] = useState("")
  const [referralCount, setReferralCount] = useState(0)
  const [referralEarnings, setReferralEarnings] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/get-referral-link")
        const data = await res.json()
        if (data.referralLink) setReferralLink(data.referralLink)
        if (typeof data.referralCount === "number") setReferralCount(data.referralCount)
        if (typeof data.referralEarnings === "string") setReferralEarnings(parseFloat(data.referralEarnings))
      } catch (err) {
        console.error("Error fetching referral data:", err)
      }
    }
    fetchData()
  }, [])

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const rewardTiers = [
    { count: 5, reward: "$5 Bonus" },
    { count: 10, reward: "15 Free Sims" },
    { count: 20, reward: "$25 Bonus" },
    { count: 50, reward: "Entry to $1000 Leaderboard Competition" },
  ]

  const nextTier = rewardTiers.find(t => referralCount < t.count)
  const progressPercent = nextTier
    ? Math.min((referralCount / nextTier.count) * 100, 100)
    : 100

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">Referral Rewards</h1>

      <div className="bg-gray-800 p-4 rounded shadow max-w-md w-full text-center">
        <h2 className="text-lg font-semibold mb-2">Your Referral Link</h2>
        <p className="text-green-400 break-words mb-2">{referralLink || "Loading..."}</p>
        <button
          onClick={handleCopy}
          disabled={!referralLink}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50 mb-6"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>

        <h2 className="text-lg font-semibold mb-2">Total Referrals</h2>
        <p className="text-2xl text-green-300 mb-4">{referralCount}</p>

        <h2 className="text-lg font-semibold mb-2">Your Earnings</h2>
        <p className="text-2xl text-yellow-400 mb-4">${referralEarnings.toFixed(2)} USD</p>

        <p className="text-sm text-gray-400 mb-4">
          You earn <span className="text-green-400 font-semibold">10% of every payment</span> made by your referrals, paid in real USD.
        </p>

        <div className="bg-gray-700 p-4 rounded mb-4">
          <h3 className="text-sm font-semibold mb-2">Rewards Progress</h3>

          {nextTier ? (
            <div className="mb-4">
              <p className="text-sm mb-1">
                {referralCount}/{nextTier.count} Referrals toward <span className="text-yellow-400">{nextTier.reward}</span>
              </p>
              <div className="w-full h-3 bg-gray-600 rounded overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <p className="text-green-400 text-sm mb-4">All rewards unlocked — amazing work!</p>
          )}

          {rewardTiers.map((tier, idx) => (
            <div key={idx} className="flex justify-between items-center mb-2">
              <p>
                {tier.count} Referrals - <span className="text-yellow-400">{tier.reward}</span>
              </p>
              <span className={`text-sm ${referralCount >= tier.count ? "text-green-400" : "text-gray-500"}`}>
                {referralCount >= tier.count ? "Unlocked ✅" : "Locked 🔒"}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          Invite friends to AI trade — unlock bonuses, earn cash, and climb the leaderboard!
        </p>
      </div>
    </main>
  )
}
