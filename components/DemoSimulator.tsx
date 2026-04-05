'use client';

import { useState, useEffect } from 'react';
import { CandlestickData, Time } from 'lightweight-charts';
import { generateOneMinCandles, aggregateCandles } from '@/lib/generateCandles';
import { evaluateTrade } from '@/lib/evaluateTrade';
import CandleChartWrapper from '@/components/CandleChartWrapper';
import Link from 'next/link';

const DEMO_LIMIT = 3;
const COUNT_KEY = 'cc_demo_count';
const DATE_KEY = 'cc_demo_date';

const SIM_COUNTS: Record<string, number> = {
  '1m': 40, '5m': 25, '15m': 15, '1h': 8, '4h': 4, '1d': 2,
};

export default function DemoSimulator() {
  const [allCandles, setAllCandles] = useState<CandlestickData<Time>[]>([]);
  const [candles, setCandles] = useState<CandlestickData<Time>[]>([]);
  const [timeframe, setTimeframe] = useState('5m');
  const [entryPrice, setEntryPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Track submitted values to show lines on chart during/after simulation
  const [submittedEntry, setSubmittedEntry] = useState<number | null>(null);
  const [submittedTp, setSubmittedTp] = useState<number | null>(null);
  const [submittedSl, setSubmittedSl] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const today = new Date().toISOString().slice(0, 10);
    const storedDate = localStorage.getItem(DATE_KEY);
    const storedCount = parseInt(localStorage.getItem(COUNT_KEY) || '0');

    if (storedDate === today) {
      setAttemptsUsed(storedCount);
      if (storedCount >= DEMO_LIMIT) setLimitReached(true);
    } else {
      localStorage.setItem(DATE_KEY, today);
      localStorage.setItem(COUNT_KEY, '0');
    }

    const masterData = generateOneMinCandles(1000);
    setAllCandles(masterData);
    setCandles(aggregateCandles(masterData, '5m'));
  }, []);

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    setCandles(aggregateCandles(allCandles, tf));
  };

  const handleSimulate = async () => {
    if (limitReached || loading) return;

    const entry = parseFloat(entryPrice);
    const tp = parseFloat(takeProfit);
    const sl = parseFloat(stopLoss);

    const { resultText: result, score } = evaluateTrade(
      allCandles.slice(-(SIM_COUNTS[timeframe] ?? 25)),
      isNaN(entry) ? null : entry,
      isNaN(tp) ? null : tp,
      isNaN(sl) ? null : sl,
    );

    // Capture values for chart lines
    setSubmittedEntry(isNaN(entry) ? null : entry);
    setSubmittedTp(isNaN(tp) ? null : tp);
    setSubmittedSl(isNaN(sl) ? null : sl);

    setLoading(true);

    // Animate candles forward
    const simCount = SIM_COUNTS[timeframe] ?? 25;
    const newCandles = generateOneMinCandles(simCount, allCandles[allCandles.length - 1]);
    const updated = [...allCandles, ...newCandles];
    setAllCandles(updated);

    for (let i = 0; i < newCandles.length; i++) {
      setCandles(aggregateCandles(updated.slice(0, updated.length - newCandles.length + i + 1), timeframe));
      await sleep(200);
    }

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestMode: true,
          entry: isNaN(entry) ? null : entry,
          takeProfit: isNaN(tp) ? null : tp,
          stopLoss: isNaN(sl) ? null : sl,
          result,
          score,
          userReasoning: '',
        }),
      });

      const data = await res.json();

      if (data.limitReached) {
        setLimitReached(true);
        setAttemptsUsed(DEMO_LIMIT);
        localStorage.setItem(COUNT_KEY, String(DEMO_LIMIT));
        return;
      }

      const newCount = attemptsUsed + 1;
      setAttemptsUsed(newCount);
      localStorage.setItem(COUNT_KEY, String(newCount));
      if (newCount >= DEMO_LIMIT) setLimitReached(true);

    } catch {
      // silently ignore — feedback section is locked in demo
    } finally {
      setLoading(false);
    }
  };

  // Derive chart line values
  const chartEntry = submittedEntry;
  const chartTp = submittedTp;
  const chartSl = submittedSl;
  const tradeDirection: 'long' | 'short' | 'unknown' =
    chartEntry != null && chartTp != null
      ? chartTp > chartEntry ? 'long' : 'short'
      : chartEntry != null && chartSl != null
        ? chartSl < chartEntry ? 'long' : 'short'
        : 'unknown';

  // Don't render until client hydration is complete (avoids localStorage mismatch)
  if (!mounted) return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl h-[500px] animate-pulse" />
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">Try It Live</h3>
          <p className="text-gray-500 text-sm">No account needed — 3 free trades</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs uppercase tracking-wider">Trades used:</span>
          {Array.from({ length: DEMO_LIMIT }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < attemptsUsed ? 'bg-gray-700' : 'bg-green-400'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_280px]">
        {/* Chart column */}
        <div className="p-4 border-b md:border-b-0 md:border-r border-gray-800">
          <div className="flex gap-1.5 mb-3">
            {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  timeframe === tf
                    ? 'bg-green-500 text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          {candles.length > 0 && (
            <CandleChartWrapper
              candles={candles}
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
              activeTool={null}
              drawings={[]}
              onSelectTool={() => {}}
              onAddDrawing={() => {}}
              onRemoveDrawing={() => {}}
              onClearDrawings={() => {}}
              onUndo={() => {}}
              canUndo={false}
              activeIndicators={new Set<string>()}
              onToggleIndicator={() => {}}
              isDark={true}
              entryPrice={chartEntry}
              takeProfit={chartTp}
              stopLoss={chartSl}
              tradeDirection={tradeDirection}
              isDraggable={false}
            />
          )}
        </div>

        {/* Controls column */}
        <div className="p-5 flex flex-col gap-3">
          {limitReached ? (
            /* CTA shown after limit is reached */
            <div className="flex flex-col items-center text-center h-full justify-center gap-4 py-4">
              <div className="text-4xl">🏆</div>
              <div>
                <p className="font-black text-lg leading-tight mb-1">
                  You&apos;ve used your<br />3 free trades
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Sign up free to unlock unlimited practice, rank tracking, and full AI coaching.
                </p>
              </div>
              <Link
                href="/sign-up"
                className="w-full block text-center bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-xl transition transform hover:scale-105"
              >
                Sign Up Free →
              </Link>
              <p className="text-gray-600 text-xs">No credit card needed.</p>
            </div>
          ) : (
            /* Normal trade input form */
            <>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Entry Price</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-green-500 transition"
                  placeholder="e.g. 100.50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Take Profit</label>
                <input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-green-500 transition"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Stop Loss</label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-green-500 transition"
                  placeholder="Optional"
                />
              </div>

              <button
                onClick={handleSimulate}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-black text-sm transition ${
                  loading
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-400 text-black transform hover:scale-105'
                }`}
              >
                {loading ? 'Simulating...' : `Simulate Trade (${DEMO_LIMIT - attemptsUsed} left)`}
              </button>

              {/* AI feedback — locked in demo */}
              {loading || submittedEntry != null ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-700">
                  {/* Blurred placeholder content */}
                  <div className="p-3 bg-gray-800 select-none pointer-events-none">
                    <p className="text-xs font-semibold mb-1 uppercase tracking-wide text-gray-500">
                      AI Coach Feedback
                    </p>
                    <p className="text-xs leading-relaxed text-gray-600 blur-sm">
                      Your entry was well-placed but your stop was too tight, giving price no room to breathe. Move your SL below the recent swing low next time for a cleaner 2R setup.
                    </p>
                  </div>
                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gray-900/70 backdrop-blur-[1px]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" style={{ color: '#E8313A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-xs font-bold text-white">Sign in to access AI feedback</p>
                    <Link
                      href="/sign-in"
                      className="mt-1 px-3 py-1.5 rounded-lg text-xs font-black text-white transition hover:opacity-90"
                      style={{ backgroundColor: '#E8313A' }}
                    >
                      Sign In →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-xs text-center leading-relaxed">
                  Study the chart, set your levels, and hit Simulate to see what happens.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
