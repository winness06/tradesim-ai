"use client"

import { useEffect, useRef } from "react"
import {
  createChart,
  CandlestickData,
  Time,
  LineStyle,
} from "lightweight-charts"

interface Props {
  candles: CandlestickData<Time>[]
  showVolume: boolean
  showRSI: boolean
  showMACD: boolean
  timeframe: string
  onTimeframeChange: (tf: string) => void
}

function calculateEMA(values: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const ema = [values[0]]
  for (let i = 1; i < values.length; i++) {
    ema.push(values[i] * k + ema[i - 1] * (1 - k))
  }
  return ema
}

function calculateRSI(candles: CandlestickData<Time>[]) {
  const period = 14
  const closes = candles.map(c => c.close)
  const rsi: { time: Time; value: number }[] = []
  let gains = 0, losses = 0

  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    if (d >= 0) gains += d
    else losses -= d
  }
  let avgGain = gains / period
  let avgLoss = losses / period

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period
    const rs = avgGain / (avgLoss || 1e-8)
    const val = 100 - 100 / (1 + rs)
    rsi.push({ time: candles[i].time, value: parseFloat(val.toFixed(2)) })
  }
  return rsi
}

function calculateMACD(candles: CandlestickData<Time>[]) {
  const closes = candles.map(c => c.close)
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  const macdLine = ema12.map((v, i) => v - ema26[i])
  const signal = calculateEMA(macdLine, 9)
  const histogram = macdLine.map((v, i) => v - signal[i])

  return candles.slice(26).map((c, idx) => ({
    time: c.time,
    macd: macdLine[idx + 26],
    signal: signal[idx + 26],
    hist: histogram[idx + 26],
  }))
}

export default function CandleChart({
  candles,
  showVolume,
  showRSI,
  showMACD,
  timeframe,
  onTimeframeChange,
}: Props) {

  const mainRef = useRef<HTMLDivElement>(null)
  const rsiRef = useRef<HTMLDivElement>(null)
  const macdRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mainRef.current) return

    const chart = createChart(mainRef.current, {
      width: mainRef.current.clientWidth,
      height: 400,
      layout: { background: { color: "#1f2937" }, textColor: "#d1d5db" },
      grid: { vertLines: { color: "#374151" }, horzLines: { color: "#374151" } },
      timeScale: { timeVisible: true, rightOffset: 2, barSpacing: 6 },
    })

    const candleSeries = chart.addCandlestickSeries()
    const sortedCandles = [...candles].sort((a, b) => (a.time as number) - (b.time as number))
    candleSeries.setData(sortedCandles)

    if (showVolume) {
      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        color: "#4ade80",
      })
      volSeries.setData(sortedCandles.map(c => ({
        time: c.time,
        value: Math.floor(Math.random() * 1000 + 200),
        color: c.close >= c.open ? "#4ade80" : "#f87171",
      })))
    }

    const resize = () => chart.applyOptions({ width: mainRef.current!.clientWidth })
    window.addEventListener("resize", resize)
    return () => { window.removeEventListener("resize", resize); chart.remove() }
  }, [candles, showVolume])

  useEffect(() => {
    if (showRSI && rsiRef.current) {
      const chart = createChart(rsiRef.current, {
        width: rsiRef.current.clientWidth,
        height: 150,
        layout: { background: { color: "#1f2937" }, textColor: "#d1d5db" },
        grid: { vertLines: { color: "#374151" }, horzLines: { color: "#374151" } },
        timeScale: { timeVisible: true },
      })
      const data = calculateRSI(candles)

      const rsiSeries = chart.addLineSeries({
        color: "#60a5fa",
        lineStyle: LineStyle.Solid,
      })
      rsiSeries.setData(data)

      const resize = () => chart.applyOptions({ width: rsiRef.current!.clientWidth })
      window.addEventListener("resize", resize)
      return () => { window.removeEventListener("resize", resize); chart.remove() }
    }
  }, [candles, showRSI])

  useEffect(() => {
    if (showMACD && macdRef.current) {
      const chart = createChart(macdRef.current, {
        width: macdRef.current.clientWidth,
        height: 150,
        layout: { background: { color: "#1f2937" }, textColor: "#d1d5db" },
        grid: { vertLines: { color: "#374151" }, horzLines: { color: "#374151" } },
        timeScale: { timeVisible: true },
      })
      const data = calculateMACD(candles)

      const macdSeries = chart.addLineSeries({
        color: "#facc15",
        lineWidth: 2,
      })
      macdSeries.setData(data.map(d => ({ time: d.time, value: d.macd })))

      const signalSeries = chart.addLineSeries({
        color: "#60a5fa",
        lineWidth: 1,
      })
      signalSeries.setData(data.map(d => ({ time: d.time, value: d.signal })))

      const histSeries = chart.addHistogramSeries({})
      histSeries.setData(data.map(d => ({
        time: d.time,
        value: d.hist,
        color: d.hist >= 0 ? "#4ade80" : "#f87171",
      })))

      const resize = () => chart.applyOptions({ width: macdRef.current!.clientWidth })
      window.addEventListener("resize", resize)
      return () => { window.removeEventListener("resize", resize); chart.remove() }
    }
  }, [candles, showMACD])

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-300">
          Timeframe: <span className="text-white font-semibold">{timeframe}</span>
        </div>
        <select
          value={timeframe}
          onChange={(e) => onTimeframeChange(e.target.value)}
          className="bg-gray-800 text-white p-2 rounded border border-gray-600"
        >
          <option value="1m">1 Min</option>
          <option value="5m">5 Min</option>
          <option value="15m">15 Min</option>
          <option value="1h">1 Hour</option>
          <option value="4h">4 Hour</option>
          <option value="1d">1 Day</option>
        </select>
      </div>

      <div ref={mainRef} className="w-full h-[400px]" />
      {showRSI && <div ref={rsiRef} className="w-full h-[150px]" />}
      {showMACD && <div ref={macdRef} className="w-full h-[150px]" />}
    </div>
  )
}
