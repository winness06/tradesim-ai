import { CandlestickData, Time } from "lightweight-charts"

/**
 * Evaluates trade with up to 3 take profits and returns result + quality score.
 */
export function evaluateTrade(
  newCandles: CandlestickData<Time>[],
  entry: number | null,
  tp1: number | null,
  sl: number | null,
  tp2?: number | null,
  tp3?: number | null
): { result: string; score: number } {

  if (entry === null) {
    return { result: "Waiting for entry — no trade taken yet.", score: 0 }
  }

  let hitTP1 = false
  let hitTP2 = false
  let hitTP3 = false
  let stoppedOut = false

  for (const candle of newCandles) {
    if (sl !== null && candle.low <= sl) {
      stoppedOut = true
      break
    }
    if (tp1 !== null && candle.high >= tp1) hitTP1 = true
    if (tp2 !== undefined && tp2 !== null && candle.high >= tp2) hitTP2 = true
    if (tp3 !== undefined && tp3 !== null && candle.high >= tp3) hitTP3 = true
  }

  // Determine result and score
  if (stoppedOut) return { result: "Stopped out. Price hit your stop loss.", score: 20 }
  if (hitTP3) return { result: "Take Profit 3 hit — excellent trade management.", score: 95 }
  if (hitTP2) return { result: "Take Profit 2 hit — strong trade outcome.", score: 80 }
  if (hitTP1) return { result: "Take Profit 1 hit — nice work.", score: 60 }

  return { result: "Price didn’t hit TP or SL yet. Consider managing the trade.", score: 30 }
}
