"use client"

import { useEffect, useState } from "react"

export default function UpgradePage() {
  const [referralLink, setReferralLink] = useState("")
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [loadingExtra, setLoadingExtra] = useState(false)

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const res = await fetch("/api/get-referral-link")
        const data = await res.json()
        if (data.referralLink) setReferralLink(data.referralLink)
      } catch (err) {
        console.error("Error fetching referral link:", err)
      }
    }
    fetchLink()
  }, [])

  const handleUpgrade = async (plan: string) => {
    setLoadingPlan(plan)
    setMessage("Redirecting to secure payment...")

    const referralCode = localStorage.getItem("referralCode") || ""

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode, plan }),
      })
      const data = await res.json()

      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setMessage(data.error || "Something went wrong. Please try again.")
      }
    } catch (err) {
      console.error("Checkout error:", err)
      setMessage("Error connecting to Stripe. Please try again.")
    }

    setLoadingPlan(null)
  }

  const handleExtraSim = async () => {
    setLoadingExtra(true)
    setMessage("Processing $1 Sim purchase...")

    try {
      const res = await fetch("/api/buy-extra-sim", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setMessage(data.error || "Something went wrong.")
      }
    } catch (err) {
      console.error(err)
      setMessage("Error processing payment.")
    }

    setLoadingExtra(false)
  }

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Choose Your Plan</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {/* Starter Plan */}
        <div className="bg-gray-800 p-6 rounded-lg shadow hover:scale-105 transition">
          <h2 className="text-xl font-semibold mb-2">Starter</h2>
          <p className="mb-4">8 Daily Sims • Stackable</p>
          <p className="text-green-400 text-2xl mb-4">$7.99 / month</p>
          <button
            onClick={() => handleUpgrade("starter")}
            className="bg-blue-600 w-full p-2 rounded hover:bg-blue-500"
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "starter" ? "Loading..." : "Get Starter"}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gray-800 p-6 rounded-lg shadow border-2 border-yellow-400 hover:scale-110 transition relative">
          <div className="absolute -top-3 -right-3 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
            Most Popular
          </div>
          <h2 className="text-xl font-semibold mb-2">Pro</h2>
          <p className="mb-4">30 Daily Sims • Stackable</p>
          <p className="text-green-400 text-2xl mb-4">$24.99 / month</p>
          <button
            onClick={() => handleUpgrade("pro")}
            className="bg-blue-600 w-full p-2 rounded hover:bg-blue-500"
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "pro" ? "Loading..." : "Get Pro"}
          </button>
        </div>

        {/* Entire Flex Plan */}
        <div className="bg-gray-800 p-6 rounded-lg shadow hover:scale-105 transition">
          <h2 className="text-xl font-semibold mb-2">Entire Flex</h2>
          <p className="mb-4">Unlimited Sims • Best for Power Users</p>
          <p className="text-green-400 text-2xl mb-4">$59.99 / month</p>
          <button
            onClick={() => handleUpgrade("entire")}
            className="bg-blue-600 w-full p-2 rounded hover:bg-blue-500"
            disabled={loadingPlan !== null}
          >
            {loadingPlan === "entire" ? "Loading..." : "Get Entire Flex"}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">All plans billed monthly. Cancel anytime.</p>

      {/* $1 Extra Sim */}
      <div className="mt-8 bg-gray-800 p-4 rounded shadow max-w-md text-center">
        <h2 className="text-lg font-semibold mb-2">Need 1 More Sim?</h2>
        <p className="mb-2">Purchase an extra simulation instantly for $1</p>
        <button
          onClick={handleExtraSim}
          className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-500"
          disabled={loadingExtra}
        >
          {loadingExtra ? "Processing..." : "Buy 1 Extra Sim"}
        </button>
      </div>

      {/* Referral Section */}
      <div className="mt-8 bg-gray-800 p-4 rounded shadow max-w-md text-center">
        <h2 className="text-lg font-semibold mb-2">Share & Earn Free Sims</h2>
        <p className="mb-2">Friends get 1st month free, you earn rewards:</p>
        <p className="text-green-400 break-words mb-2">
          {referralLink || "Loading..."}
        </p>
        <button
          onClick={handleCopy}
          disabled={!referralLink}
          className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-500 disabled:opacity-50"
        >
          {copied ? "Copied ✓" : "Copy Link"}
        </button>
      </div>

      {message && <p className="mt-4 text-center text-green-300">{message}</p>}
    </main>
  )
}
