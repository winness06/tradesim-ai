"use client"

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import CandleChart from "@/components/CandleChart"
import { CandlestickData, Time } from "lightweight-charts"
import { generateOneMinCandles, aggregateCandles } from "@/lib/generateCandles"
import { evaluateTrade } from "@/lib/evaluateTrade"
import { useSearchParams } from "next/navigation"


export default function Home() {
  const [entryPrice, setEntryPrice] = useState("")
  const [takeProfit, setTakeProfit] = useState("")
  const [takeProfit2, setTakeProfit2] = useState("")
  const [takeProfit3, setTakeProfit3] = useState("")
  const [stopLoss, setStopLoss] = useState("")
  const [userReasoning, setUserReasoning] = useState("")
  const [feedback, setFeedback] = useState("Waiting for your trade...")
  const [tradeScore, setTradeScore] = useState<number | null>(null)
  const [showVolume, setShowVolume] = useState(false)
  const [showRSI, setShowRSI] = useState(false)
  const [showMACD, setShowMACD] = useState(false)
  const [tokens, setTokens] = useState(0)
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [referralLink, setReferralLink] = useState("")
  const [dailySims, setDailySims] = useState(0)
  const [timeframe, setTimeframe] = useState("5m")
  const [allCandles, setAllCandles] = useState<CandlestickData<Time>[]>([])
  const [candles, setCandles] = useState<CandlestickData<Time>[]>([])
const params = useSearchParams()
const [showBanner, setShowBanner] = useState(false)

useEffect(() => {
  if (params.get("upgrade_success") === "true") {
    setShowBanner(true)
    const timeout = setTimeout(() => setShowBanner(false), 5000)
    return () => clearTimeout(timeout)
  }
}, [params])

  const DAILY_GOAL = 3
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

  const SIM_CANDLE_COUNT: Record<string, number> = {
    "1m": 40, "5m": 25, "15m": 15, "1h": 8, "4h": 4, "1d": 2,
  }

  const getRank = (score: number | null) => {
    if (score === null) return ""
    if (score < 40) return "Rookie"
    if (score < 60) return "Intermediate"
    if (score < 80) return "Pro"
    if (score < 95) return "Elite"
    return "Master"
  }

  useEffect(() => {
    const masterData = generateOneMinCandles(1000)
    setAllCandles(masterData)
    applyTimeframe(masterData, timeframe)
    fetchTokens()
    fetchLink()
    checkDailyCount()
  }, [])

  const fetchTokens = async () => {
    try {
      const res = await fetch("/api/get-tokens")
      const data = await res.json()
      setTokens(data.tokens)
      setSubscriptionActive(data.subscriptionActive)
    } catch (err) {
      console.error("Error fetching tokens:", err)
    }
  }

  const fetchLink = async () => {
    try {
      const res = await fetch("/api/get-referral-link")
      const data = await res.json()
      if (data.referralLink) setReferralLink(data.referralLink)
    } catch (err) {
      console.error("Error fetching referral link:", err)
    }
  }

  const checkDailyCount = () => {
    const today = new Date().toISOString().slice(0, 10)
    const storedDate = localStorage.getItem("dailySimDate")
    const storedCount = localStorage.getItem("dailySims")
    if (storedDate === today && storedCount) setDailySims(parseInt(storedCount))
    else localStorage.setItem("dailySimDate", today), localStorage.setItem("dailySims", "0")
  }

  const applyTimeframe = (all: CandlestickData<Time>[], tf: string) => {
    const agg = aggregateCandles(all, tf)
    setCandles(agg)
  }

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf)
    applyTimeframe(allCandles, tf)
  }

  const handleNextCandle = () => {
    if (tokens <= 0 && !subscriptionActive) {
      setFeedback("Out of free simulations. Please upgrade to continue.")
      return
    }
    const newCandle = generateOneMinCandles(1, allCandles[allCandles.length - 1])
    const updated = [...allCandles, ...newCandle]
    setAllCandles(updated)
    applyTimeframe(updated, timeframe)
  }

  const handleSimulate = async () => {
    if (tokens <= 0 && !subscriptionActive) {
      setFeedback("Out of free simulations. Please upgrade to continue.")
      return
    }

    const entry = parseFloat(entryPrice)
    const tp = parseFloat(takeProfit)
    const tp2 = parseFloat(takeProfit2)
    const tp3 = parseFloat(takeProfit3)
    const sl = parseFloat(stopLoss)

    const { result, score } = evaluateTrade(
      allCandles.slice(-SIM_CANDLE_COUNT[timeframe] || 25),
      entry,
      tp,
      sl,
      tp2,
      tp3
    )

    setFeedback("Waiting for AI feedback...")
    setTradeScore(score)

    const payload = {
      entry: isNaN(entry) ? null : entry,
      takeProfit: isNaN(tp) ? null : tp,
      takeProfit2: isNaN(tp2) ? null : tp2,
      takeProfit3: isNaN(tp3) ? null : tp3,
      stopLoss: isNaN(sl) ? null : sl,
      result,
      score,
      userReasoning,
    }

    const simCount = SIM_CANDLE_COUNT[timeframe] || 25
    const newCandles = generateOneMinCandles(simCount, allCandles[allCandles.length - 1])
    const updated = [...allCandles, ...newCandles]
    setAllCandles(updated)

    for (let i = 0; i < newCandles.length; i++) {
      applyTimeframe(updated.slice(0, updated.length - newCandles.length + i + 1), timeframe)
      await sleep(300)
    }

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setFeedback(data.feedback)
      setTokens(data.tokensRemaining)
      setSubscriptionActive(data.subscriptionActive)
      const newCount = dailySims + 1
      setDailySims(newCount)
      localStorage.setItem("dailySims", newCount.toString())
    } catch (err) {
      console.error("AI error:", err)
      setFeedback("Error getting AI feedback.")
    }
  }

  const progressPercent = Math.min((dailySims / DAILY_GOAL) * 100, 100)

  return (
  
    
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      <SignedIn>
        {showBanner && (
  <div className="bg-green-600 text-white text-center py-2 text-sm">
    ✅ Upgrade successful! Enjoy unlimited simulations.
  </div>
)}

        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold">TradeSim AI Coach</h1>
          <UserButton />
        </header>

        <div className="p-4 flex flex-col md:flex-row md:items-center gap-2">
          <button onClick={() => { navigator.clipboard.writeText(referralLink); alert("Referral link copied!") }} className="bg-blue-600 p-2 rounded hover:bg-blue-500">Copy My Referral Link</button>
          <button onClick={() => { const refreshed = generateOneMinCandles(1000); setAllCandles(refreshed); applyTimeframe(refreshed, timeframe) }} className="bg-yellow-500 p-2 rounded hover:bg-yellow-400">Refresh Chart</button>
        </div>

        <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl mb-2">Simulation Chart</h2>
            <div className="flex gap-2 mb-2">
              {["1m", "5m", "15m", "1h", "4h", "1d"].map(tf => (
                <button key={tf} onClick={() => handleTimeframeChange(tf)} className={`px-2 py-1 rounded text-sm ${timeframe === tf ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>{tf}</button>
              ))}
            </div>
            <CandleChart candles={candles} showVolume={showVolume} showRSI={showRSI} showMACD={showMACD} timeframe={timeframe} onTimeframeChange={handleTimeframeChange} />
            <div className="flex gap-4 mt-4">
              <label className="flex items-center gap-1"><input type="checkbox" checked={showVolume} onChange={(e) => setShowVolume(e.target.checked)} /> Show Volume</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={showRSI} onChange={(e) => setShowRSI(e.target.checked)} /> Show RSI</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={showMACD} onChange={(e) => setShowMACD(e.target.checked)} /> Show MACD</label>
            </div>
            <div className="mt-4">
              <h3 className="text-sm mb-1">Daily Progress ({dailySims}/{DAILY_GOAL} Sims Completed)</h3>
              <div className="w-full h-4 bg-gray-700 rounded overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${progressPercent}%` }}></div></div>
              {dailySims >= DAILY_GOAL && <p className="text-green-400 text-sm mt-2">Bonus unlocked! Keep going for more practice.</p>}
            </div>
          </section>

          <section className="bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl mb-2">Your Trade Decision</h2>
            <div className="space-y-3">
              <label className="block">Entry Price:<input type="number" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="mt-1 w-full p-2 bg-gray-700 rounded" placeholder="Leave blank to wait..." /></label>
              <label className="block">Take Profit:<input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="mt-1 w-full p-2 bg-gray-700 rounded" placeholder="Optional" /></label>
              {takeProfit && !takeProfit2 && (<button onClick={() => setTakeProfit2("")} className="text-blue-400 text-sm underline">+ Add TP2</button>)}
              {takeProfit2 && (<><label className="block">Take Profit 2:<input type="number" value={takeProfit2} onChange={(e) => setTakeProfit2(e.target.value)} className="mt-1 w-full p-2 bg-gray-700 rounded" placeholder="Optional" /></label>{!takeProfit3 && (<button onClick={() => setTakeProfit3("")} className="text-blue-400 text-sm underline">+ Add TP3</button>)}</>)}
              {takeProfit3 && (<label className="block">Take Profit 3:<input type="number" value={takeProfit3} onChange={(e) => setTakeProfit3(e.target.value)} className="mt-1 w-full p-2 bg-gray-700 rounded" placeholder="Optional" /></label>)}
              <label className="block">Stop Loss:<input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="mt-1 w-full p-2 bg-gray-700 rounded" placeholder="Optional" /></label>
              <label className="block">Reasoning / Notes:<textarea value={userReasoning} onChange={(e) => setUserReasoning(e.target.value)} className="mt-1 w-full p-2 bg-gray-700 rounded h-20" placeholder="E.g. Buying after VWAP bounce" /></label>

              <button onClick={handleSimulate} disabled={tokens <= 0 && !subscriptionActive} className={`w-full p-2 rounded ${tokens > 0 || subscriptionActive ? "bg-green-600 hover:bg-green-500" : "bg-gray-600 cursor-not-allowed"}`}>Simulate</button>
              <button onClick={handleNextCandle} disabled={tokens <= 0 && !subscriptionActive} className={`w-full p-1 mt-1 rounded text-xs ${tokens > 0 || subscriptionActive ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-800 cursor-not-allowed"}`}>Simulate 1 Candle</button>

              {!subscriptionActive && (<button onClick={() => window.location.href = "/upgrade"} className="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-500 mt-2">Upgrade to Premium</button>)}

              <div className="space-y-2 pt-4">
                <p className="text-sm text-gray-400 underline cursor-pointer" onClick={() => window.location.href = "/upgrade"}>Simulations Remaining: {tokens >= 9999 ? "Unlimited" : tokens} {!subscriptionActive && "(Need more?)"}</p>
                <p className="text-sm text-blue-400 underline cursor-pointer" onClick={() => window.location.href = "/upgrade"}>Subscription Status: {subscriptionActive ? "Premium Plan" : "Free Plan (3 Sims)"}</p>
              </div>
            </div>
          </section>
        </div>

        <footer className="bg-gray-800 p-4 border-t border-gray-700">
          <h2 className="text-xl mb-2">AI Coaching Feedback</h2>
          <div className="bg-gray-700 p-4 rounded text-gray-200 border border-green-500">{feedback}</div>
          {tradeScore !== null && (
            <div className="mt-2 text-yellow-400 text-sm">
              AI Trade Quality Score: {tradeScore}/100 — Rank: {getRank(tradeScore)}
            </div>
          )}
        </footer>
      </SignedIn>

      <SignedOut>
        <div className="min-h-screen flex justify-center items-center">
          <p className="text-white text-xl">Please <a href="/sign-in" className="text-blue-500">sign in</a> to access TradeSim AI.</p>
        </div>
      </SignedOut>
    </main>
  )
}
