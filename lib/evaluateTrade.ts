import { CandlestickData, Time } from "lightweight-charts"

export interface TradeEvalResult {
  tp1Hit: boolean;
  tp2Hit: boolean;
  tp3Hit: boolean;
  slHit: boolean;
  outcome: 'win' | 'loss' | 'partial' | 'running' | 'not-triggered';
  score: number;
  direction: 'long' | 'short' | 'unknown';
  resultText: string;
}

export function evaluateTrade(
  newCandles: CandlestickData<Time>[],
  entry: number | null,
  tp1: number | null,
  sl: number | null,
  tp2?: number | null,
  tp3?: number | null,
  orderType: 'market' | 'limit' = 'market'
): TradeEvalResult {

  if (entry === null) {
    return {
      tp1Hit: false, tp2Hit: false, tp3Hit: false, slHit: false,
      outcome: 'running', score: 0, direction: 'unknown',
      resultText: "Waiting for entry — no trade taken yet.",
    }
  }

  // Detect trade direction
  let direction: 'long' | 'short' | 'unknown' = 'unknown'
  if (tp1 !== null) {
    direction = tp1 > entry ? 'long' : 'short'
  } else if (sl !== null) {
    direction = sl < entry ? 'long' : 'short'
  }

  // For limit orders, find candle where price reaches entry
  let evaluationCandles = newCandles
  if (orderType === 'limit' && newCandles.length > 0) {
    const entryIndex = newCandles.findIndex(candle => {
      if (direction === 'long') return candle.low <= entry
      else return candle.high >= entry
    })
    if (entryIndex === -1) {
      return {
        tp1Hit: false, tp2Hit: false, tp3Hit: false, slHit: false,
        outcome: 'not-triggered', score: 10, direction,
        resultText: "Limit order not triggered — price never reached your entry level.",
      }
    }
    evaluationCandles = newCandles.slice(entryIndex)
  }

  const tp1Set = tp1 !== null
  const tp2Set = tp2 != null
  const tp3Set = tp3 != null

  let hitTP1 = false
  let hitTP2 = false
  let hitTP3 = false
  let slHit = false

  for (const candle of evaluationCandles) {
    const isBullish = candle.close >= candle.open

    if (direction === 'long') {
      if (isBullish) {
        if (tp1Set && candle.high >= tp1!) hitTP1 = true
        if (tp2Set && candle.high >= tp2!) hitTP2 = true
        if (tp3Set && candle.high >= tp3!) hitTP3 = true
        if (!hitTP1 && sl !== null && candle.low <= sl) { slHit = true; break }
      } else {
        if (sl !== null && candle.low <= sl) { slHit = true; break }
        if (tp1Set && candle.high >= tp1!) hitTP1 = true
        if (tp2Set && candle.high >= tp2!) hitTP2 = true
        if (tp3Set && candle.high >= tp3!) hitTP3 = true
      }
    } else if (direction === 'short') {
      if (isBullish) {
        if (sl !== null && candle.high >= sl) { slHit = true; break }
        if (tp1Set && candle.low <= tp1!) hitTP1 = true
        if (tp2Set && candle.low <= tp2!) hitTP2 = true
        if (tp3Set && candle.low <= tp3!) hitTP3 = true
      } else {
        if (tp1Set && candle.low <= tp1!) hitTP1 = true
        if (tp2Set && candle.low <= tp2!) hitTP2 = true
        if (tp3Set && candle.low <= tp3!) hitTP3 = true
        if (!hitTP1 && sl !== null && candle.high >= sl) { slHit = true; break }
      }
    } else {
      if (sl !== null && candle.low <= sl) { slHit = true; break }
      if (tp1Set && candle.high >= tp1!) hitTP1 = true
      if (tp2Set && candle.high >= tp2!) hitTP2 = true
      if (tp3Set && candle.high >= tp3!) hitTP3 = true
    }
  }

  const dirLabel = direction === 'long' ? 'Long trade' : direction === 'short' ? 'Short trade' : 'Trade'

  // Determine outcome
  const allSetTpsHit =
    (!tp1Set || hitTP1) &&
    (!tp2Set || hitTP2) &&
    (!tp3Set || hitTP3)
  const anyHit = hitTP1 || hitTP2 || hitTP3

  let outcome: TradeEvalResult['outcome']
  let score: number
  let resultText: string

  if (slHit) {
    outcome = 'loss'
    score = 20
    resultText = `${dirLabel} — stopped out. Price hit your stop loss.`
  } else if (anyHit && allSetTpsHit) {
    outcome = 'win'
    // Score based on how many TPs were set and hit
    if (tp3Set) { score = 95; resultText = `${dirLabel} — all three take profits hit. Excellent trade management.` }
    else if (tp2Set) { score = 82; resultText = `${dirLabel} — both take profits hit. Strong outcome.` }
    else { score = 65; resultText = `${dirLabel} — Take Profit hit. Nice work.` }
  } else if (anyHit) {
    outcome = 'partial'
    if (hitTP2) {
      score = 72
      resultText = `${dirLabel} — TP1 and TP2 hit, TP3 still open. Trade running.`
    } else {
      score = 55
      const remaining = [!hitTP2 && tp2Set && 'TP2', !hitTP3 && tp3Set && 'TP3'].filter(Boolean).join(', ')
      resultText = `${dirLabel} — TP1 hit${remaining ? `, ${remaining} still open` : ''}. Trade running.`
    }
  } else {
    outcome = 'running'
    score = 30
    resultText = `${dirLabel} — price didn't hit TP or SL yet. Consider managing the trade.`
  }

  return { tp1Hit: hitTP1, tp2Hit: hitTP2, tp3Hit: hitTP3, slHit, outcome, score, direction, resultText }
}
