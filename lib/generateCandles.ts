import { CandlestickData, Time, UTCTimestamp } from "lightweight-charts"

const TIMEFRAME_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
}

type Regime = 'trending-up' | 'trending-down' | 'consolidating'

function pickRegime(): Regime {
  const r = Math.random()
  if (r < 0.35) return 'trending-up'
  if (r < 0.70) return 'trending-down'
  return 'consolidating'
}

function getBias(regime: Regime): number {
  switch (regime) {
    case 'trending-up': return 0.65
    case 'trending-down': return 0.35
    case 'consolidating': return 0.50
  }
}

function getVolatility(regime: Regime, timeframe: string): number {
  const baseVol: Record<string, number> = {
    '1m': 0.15,
    '5m': 0.25,
    '15m': 0.40,
    '1h': 0.70,
    '4h': 1.20,
    '1d': 2.00,
  }
  const base = baseVol[timeframe] || 0.25
  if (regime === 'consolidating') return base * 0.5
  return base
}

export function generateOneMinCandles(
  count = 30,
  lastCandle?: CandlestickData<Time>,
  forcedBias?: number
): CandlestickData<Time>[] {
  const candles: CandlestickData<Time>[] = []
  let price = lastCandle ? lastCandle.close : 100 + Math.random() * 50
  const lastTime = lastCandle
    ? (lastCandle.time as number)
    : Math.floor(Date.now() / 1000) - count * 60

  let regime = pickRegime()
  let candlesInRegime = 0
  const regimeLength = 8 + Math.floor(Math.random() * 6)

  for (let i = 0; i < count; i++) {
    if (candlesInRegime >= regimeLength) {
      regime = pickRegime()
      candlesInRegime = 0
    }
    candlesInRegime++

    const vol = getVolatility(regime, '1m')
    let bias = getBias(regime)

    if (forcedBias !== undefined) {
      bias = forcedBias
    }

    const isUp = Math.random() < bias
    const bodySize = vol * (0.5 + Math.random() * 0.8)
    const wickSize = vol * (0.2 + Math.random() * 0.4)

    const open = price
    const close = isUp ? open + bodySize : open - bodySize
    const high = Math.max(open, close) + wickSize
    const low = Math.min(open, close) - wickSize

    const safeClose = Math.max(close, 1)
    const safeLow = Math.max(low, 0.5)

    price = safeClose

    candles.push({
      time: (lastTime + (i + 1) * 60) as UTCTimestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(safeLow.toFixed(2)),
      close: parseFloat(safeClose.toFixed(2)),
    })
  }

  return candles
}

export function generateOneMinCandlesWithBias(
  count: number,
  lastCandle: CandlestickData<Time>,
  direction: 'long' | 'short' | 'unknown'
): CandlestickData<Time>[] {
  const bias = direction === 'long'
    ? 0.58
    : direction === 'short'
    ? 0.42
    : undefined
  return generateOneMinCandles(count, lastCandle, bias)
}

export function aggregateCandles(
  oneMinCandles: CandlestickData<Time>[],
  targetTimeframe: string
): CandlestickData<Time>[] {
  if (targetTimeframe === "1m") return oneMinCandles

  const groupSize = TIMEFRAME_SECONDS[targetTimeframe] / 60
  const aggregated: CandlestickData<Time>[] = []

  for (let i = 0; i < oneMinCandles.length; i += groupSize) {
    const chunk = oneMinCandles.slice(i, i + groupSize)
    if (chunk.length === 0) continue

    aggregated.push({
      time: chunk[0].time,
      open: parseFloat(chunk[0].open.toFixed(2)),
      high: parseFloat(Math.max(...chunk.map(c => c.high)).toFixed(2)),
      low: parseFloat(Math.min(...chunk.map(c => c.low)).toFixed(2)),
      close: parseFloat(chunk[chunk.length - 1].close.toFixed(2)),
    })
  }

  return aggregated
}
