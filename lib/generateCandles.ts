import { CandlestickData, Time, UTCTimestamp } from "lightweight-charts"

const TIMEFRAME_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
}

export function generateOneMinCandles(
  count = 30,
  lastCandle?: CandlestickData<Time>
): CandlestickData<Time>[] {

  const candles: CandlestickData<Time>[] = []
  let price = lastCandle ? lastCandle.close : 100
  const lastTime = lastCandle ? (lastCandle.time as number) : Math.floor(Date.now() / 1000)

  for (let i = 0; i < count; i++) {
    const open = price
    const close = open + (Math.random() - 0.5) * 2
    const high = Math.max(open, close) + Math.random()
    const low = Math.min(open, close) - Math.random()
    price = close

    candles.push({
      time: (lastTime + (i + 1) * 60) as UTCTimestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    })
  }

  return candles
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

    const open = chunk[0].open
    const close = chunk[chunk.length - 1].close
    const high = Math.max(...chunk.map(c => c.high))
    const low = Math.min(...chunk.map(c => c.low))
    const time = chunk[0].time

    aggregated.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    })
  }

  return aggregated
}
