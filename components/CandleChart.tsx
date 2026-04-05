"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  createChart,
  CandlestickData,
  Time,
  LineStyle,
  IChartApi,
  ISeriesApi,
  SeriesType,
  Logical,
} from "lightweight-charts"
import { DrawTool, Drawing } from "@/types/drawings"
import ChartToolbar from "@/components/ChartToolbar"

// ─── uid ───────────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) }

// ─── Time helpers ──────────────────────────────────────────────────────────────
function timeAsNum(t: Time): number {
  if (typeof t === "number") return t
  if (typeof t === "string") return new Date(t).getTime() / 1000
  const { year, month, day } = t as { year: number; month: number; day: number }
  return new Date(year, month - 1, day).getTime() / 1000
}

function pseudoVol(close: number, i: number): number {
  return Math.abs(Math.sin(close * 7 + i * 13) * 800 + 400)
}

// ─── Indicator calculations ────────────────────────────────────────────────────
function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null
    return values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
  })
}
function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1)
  const out = [values[0]]
  for (let i = 1; i < values.length; i++) out.push(values[i] * k + out[i - 1] * (1 - k))
  return out
}
function calcBB(candles: CandlestickData<Time>[], period = 20, mult = 2) {
  const closes = candles.map(c => c.close)
  return candles.map((c, i) => {
    if (i < period - 1) return null
    const slice = closes.slice(i - period + 1, i + 1)
    const mean = slice.reduce((a, b) => a + b) / period
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period)
    return { time: c.time, upper: mean + mult * std, middle: mean, lower: mean - mult * std }
  }).filter(Boolean) as { time: Time; upper: number; middle: number; lower: number }[]
}
function calcVWAP(candles: CandlestickData<Time>[]) {
  let cpv = 0, cv = 0
  return candles.map((c, i) => {
    const tp = (c.high + c.low + c.close) / 3
    const v = pseudoVol(c.close, i)
    cpv += tp * v; cv += v
    return { time: c.time, value: cpv / cv }
  })
}
function calcRSI(candles: CandlestickData<Time>[], period = 14) {
  const closes = candles.map(c => c.close)
  const out: { time: Time; value: number }[] = []
  let g = 0, l = 0
  for (let i = 1; i <= period; i++) { const d = closes[i] - closes[i - 1]; if (d >= 0) g += d; else l -= d }
  let ag = g / period, al = l / period
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    ag = (ag * (period - 1) + Math.max(d, 0)) / period
    al = (al * (period - 1) + Math.max(-d, 0)) / period
    out.push({ time: candles[i].time, value: parseFloat((100 - 100 / (1 + ag / (al || 1e-8))).toFixed(2)) })
  }
  return out
}
function calcMACD(candles: CandlestickData<Time>[]) {
  const closes = candles.map(c => c.close)
  const e12 = ema(closes, 12), e26 = ema(closes, 26)
  const ml = e12.map((v, i) => v - e26[i])
  const sig = ema(ml, 9)
  return candles.slice(26).map((c, idx) => ({
    time: c.time, macd: ml[idx + 26], signal: sig[idx + 26], hist: ml[idx + 26] - sig[idx + 26],
  }))
}
function calcATR(candles: CandlestickData<Time>[], period = 14) {
  const tr = candles.slice(1).map((c, i) => Math.max(c.high - c.low, Math.abs(c.high - candles[i].close), Math.abs(c.low - candles[i].close)))
  const atrSma = sma(tr, period)
  return candles.slice(1).map((c, i) => atrSma[i] === null ? null : { time: c.time, value: atrSma[i] as number }).filter(Boolean) as { time: Time; value: number }[]
}

// ─── Canvas rounded rect helper ────────────────────────────────────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ─── Internal drawing types ────────────────────────────────────────────────────
interface DP { price: number; logical: number }
type IDrawing =
  | { id: string; type: 'hline'; price: number }
  | { id: string; type: 'vline'; logical: number }
  | { id: string; type: 'hray'; price: number; startLogical: number }
  | { id: string; type: 'trendline'; p1: DP; p2: DP; extended: boolean }
  | { id: string; type: 'fib'; high: number; low: number }
  | { id: string; type: 'rect'; p1: DP; p2: DP; zone: 'support' | 'resist' }
  | { id: string; type: 'text'; pos: DP; label: string }
  | { id: string; type: 'price_label'; pos: DP }

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  candles: CandlestickData<Time>[]
  timeframe: string
  onTimeframeChange: (tf: string) => void
  activeTool?: DrawTool | null
  drawings?: Drawing[]
  onSelectTool?: (t: DrawTool | null) => void
  onAddDrawing?: (d: Drawing) => void
  onRemoveDrawing?: (id: string) => void
  onClearDrawings?: () => void
  onUndo?: () => void
  canUndo?: boolean
  activeIndicators: Set<string>
  onToggleIndicator: (id: string) => void
  isDark: boolean
  // Trade level lines
  entryPrice?: number | null
  takeProfit?: number | null
  takeProfit2?: number | null
  takeProfit3?: number | null
  stopLoss?: number | null
  tpHitStatus?: { tp1: boolean; tp2: boolean; tp3: boolean }
  tradeDirection?: 'long' | 'short' | 'unknown'
  // Drag callbacks
  onTpChange?: (tp1: number | null, tp2: number | null, tp3: number | null) => void
  onSlChange?: (sl: number | null) => void
  isDraggable?: boolean
}

interface TradeLevels {
  entryPrice?: number | null
  takeProfit?: number | null
  takeProfit2?: number | null
  takeProfit3?: number | null
  stopLoss?: number | null
  tradeDirection?: 'long' | 'short' | 'unknown'
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function CandleChart({
  candles, timeframe, onTimeframeChange,
  activeIndicators, onToggleIndicator, isDark,
  entryPrice, takeProfit, takeProfit2, takeProfit3, stopLoss, tpHitStatus, tradeDirection,
  onTpChange, onSlChange, isDraggable,
}: Props) {

  // ── Refs: drawing tool state ───────────────────────────────────────────────
  const activeToolRef  = useRef<DrawTool | null>(null)
  const drawingsRef    = useRef<IDrawing[]>([])
  const undoStackRef   = useRef<IDrawing[][]>([])
  const pendingPtRef   = useRef<DP | null>(null)
  const hoverRef       = useRef<{ x: number; y: number; price: number; logical: number } | null>(null)
  const rectDragRef    = useRef<{ x: number; y: number; price: number; logical: number } | null>(null)
  const redrawRef      = useRef<(() => void) | null>(null)
  const tradeLevelsRef = useRef<TradeLevels>({})

  // ── Refs: trade level canvas ───────────────────────────────────────────────
  const tpHitStatusRef    = useRef(tpHitStatus)
  const isDraggableRef    = useRef(isDraggable ?? true)
  const onTpChangeRef     = useRef(onTpChange)
  const onSlChangeRef     = useRef(onSlChange)
  const tradeLinesCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawTradeLinesRef   = useRef<(() => void) | null>(null)
  // Active drag: which field + live price during drag
  const tradeDragRef = useRef<{ field: 'tp1' | 'tp2' | 'tp3' | 'sl'; currentPrice: number } | null>(null)

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const mainRef    = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef   = useRef<IChartApi | null>(null)
  const rsiRef     = useRef<HTMLDivElement>(null)
  const macdRef    = useRef<HTMLDivElement>(null)
  const atrRef     = useRef<HTMLDivElement>(null)
  const overlaySeriesRef = useRef<Map<string, ISeriesApi<SeriesType>>>(new Map())
  const candleSeriesRef  = useRef<ISeriesApi<'Candlestick'> | null>(null)

  // ── Display state ──────────────────────────────────────────────────────────
  const [activeToolDisplay, setActiveToolDisplay] = useState<DrawTool | null>(null)
  const [pendingDisplay, setPendingDisplay] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [textInput, setTextInput] = useState<{ pos: DP; x: number; y: number; value: string } | null>(null)
  const [zonePopup, setZonePopup] = useState<{ p1: DP; p2: DP; cx: number; cy: number } | null>(null)
  const [containerW, setContainerW] = useState(600)

  // ── Keep callback/config refs fresh ───────────────────────────────────────
  useEffect(() => { tpHitStatusRef.current = tpHitStatus }, [tpHitStatus])
  useEffect(() => { isDraggableRef.current = isDraggable ?? true }, [isDraggable])
  useEffect(() => { onTpChangeRef.current = onTpChange }, [onTpChange])
  useEffect(() => { onSlChangeRef.current = onSlChange }, [onSlChange])

  // ── selectTool / clearTool ─────────────────────────────────────────────────
  const clearTool = useCallback(() => {
    activeToolRef.current = null
    pendingPtRef.current = null
    setActiveToolDisplay(null)
    setPendingDisplay(false)
    if (overlayRef.current) {
      overlayRef.current.style.pointerEvents = 'none'
      overlayRef.current.style.cursor = 'default'
    }
  }, [])

  const selectTool = useCallback((tool: DrawTool | null) => {
    if (!tool) { clearTool(); return }
    activeToolRef.current = tool
    pendingPtRef.current = null
    setPendingDisplay(false)
    setActiveToolDisplay(tool)
    if (overlayRef.current) {
      overlayRef.current.style.pointerEvents = 'all'
      overlayRef.current.style.cursor = tool === 'eraser' ? 'not-allowed' : 'crosshair'
    }
  }, [clearTool])

  // ── clearAllDrawings / handleUndo ──────────────────────────────────────────
  const clearAllDrawings = useCallback(() => {
    undoStackRef.current.push([...drawingsRef.current])
    drawingsRef.current = []
    setCanUndo(true)
    redrawRef.current?.()
  }, [])

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return
    drawingsRef.current = undoStackRef.current.pop()!
    setCanUndo(undoStackRef.current.length > 0)
    redrawRef.current?.()
  }, [])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearTool()
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [clearTool, handleUndo])

  // ── Trade levels → update ref and redraw both canvases ─────────────────────
  useEffect(() => {
    tradeLevelsRef.current = { entryPrice, takeProfit, takeProfit2, takeProfit3, stopLoss, tradeDirection }
    tpHitStatusRef.current = tpHitStatus
    redrawRef.current?.()
    drawTradeLinesRef.current?.()
  }, [entryPrice, takeProfit, takeProfit2, takeProfit3, stopLoss, tradeDirection, tpHitStatus])

  // ── Main chart + overlay effect ────────────────────────────────────────────
  useEffect(() => {
    if (!mainRef.current) return
    const container = mainRef.current
    const w = container.clientWidth
    let cssW = w
    setContainerW(w)

    const chart = createChart(container, {
      width: w,
      height: 400,
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
        horzLine: { color: '#758696', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
        barSpacing: 8,
        minBarSpacing: 4,
      },
    })
    chartRef.current = chart
    overlaySeriesRef.current.clear()

    const sorted = [...candles].sort((a, b) => timeAsNum(a.time) - timeAsNum(b.time))
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })
    candleSeries.setData(sorted)
    candleSeriesRef.current = candleSeries

    // ── Overlay indicators ─────────────────────────────────────────────────
    if (activeIndicators.has('volume')) {
      const vol = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, color: '#4ade80', priceScaleId: 'vol' })
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
      vol.setData(sorted.map((c, i) => ({ time: c.time, value: pseudoVol(c.close, i), color: c.close >= c.open ? '#4ade8066' : '#f8717166' })))
      overlaySeriesRef.current.set('volume', vol as ISeriesApi<SeriesType>)
    }
    const closes = sorted.map(c => c.close)
    const OVERLAY_CONFIGS: [string, string, number, boolean][] = [
      ['ma20','#3b82f6',20,false], ['ma50','#f97316',50,false], ['ma200','#ef4444',200,false],
      ['ema9','#a855f7',9,true], ['ema21','#14b8a6',21,true],
    ]
    for (const [id, color, period, isEma] of OVERLAY_CONFIGS) {
      if (!activeIndicators.has(id)) continue
      const vals = isEma ? ema(closes, period) : sma(closes, period)
      const data = sorted.map((c, i) => vals[i] != null ? { time: c.time, value: vals[i] as number } : null).filter(Boolean) as { time: Time; value: number }[]
      const s = chart.addLineSeries({ color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
      s.setData(data)
      overlaySeriesRef.current.set(id, s as ISeriesApi<SeriesType>)
    }
    if (activeIndicators.has('bb')) {
      const bb = calcBB(sorted)
      const upper = chart.addLineSeries({ color: '#60a5fa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: LineStyle.Dashed })
      const mid   = chart.addLineSeries({ color: '#60a5fa88', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
      const lower = chart.addLineSeries({ color: '#60a5fa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: LineStyle.Dashed })
      upper.setData(bb.map(d => ({ time: d.time, value: d.upper }))); mid.setData(bb.map(d => ({ time: d.time, value: d.middle }))); lower.setData(bb.map(d => ({ time: d.time, value: d.lower })))
      overlaySeriesRef.current.set('bb_upper', upper as ISeriesApi<SeriesType>)
      overlaySeriesRef.current.set('bb_mid', mid as ISeriesApi<SeriesType>)
      overlaySeriesRef.current.set('bb_lower', lower as ISeriesApi<SeriesType>)
    }
    if (activeIndicators.has('vwap')) {
      const s = chart.addLineSeries({ color: '#e2e8f088', lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false })
      s.setData(calcVWAP(sorted))
      overlaySeriesRef.current.set('vwap', s as ISeriesApi<SeriesType>)
    }

    // ── Trade lines canvas (z-index 9, below drawing canvas) ──────────────
    const dpr = window.devicePixelRatio || 1
    const tradeLinesCanvas = document.createElement('canvas')
    tradeLinesCanvas.style.cssText = 'position:absolute;top:0;left:0;z-index:9;pointer-events:none;'
    tradeLinesCanvas.style.width = w + 'px'
    tradeLinesCanvas.style.height = '400px'
    tradeLinesCanvas.width = w * dpr
    tradeLinesCanvas.height = 400 * dpr
    container.appendChild(tradeLinesCanvas)
    tradeLinesCanvasRef.current = tradeLinesCanvas

    // ── drawTradeLines function ────────────────────────────────────────────
    const CHART_H = 400
    const LABEL_W = 48, LABEL_H = 22

    const drawTradeLines = () => {
      const ctx = tradeLinesCanvas.getContext('2d')
      if (!ctx) return
      const W = cssW
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, tradeLinesCanvas.width, tradeLinesCanvas.height)
      ctx.scale(dpr, dpr)

      const tl = tradeLevelsRef.current
      const hitStatus = tpHitStatusRef.current
      const drag = tradeDragRef.current

      const ep   = tl.entryPrice   ?? null
      const tp1  = tl.takeProfit   ?? null
      const tp2  = tl.takeProfit2  ?? null
      const tp3  = tl.takeProfit3  ?? null
      const sl   = tl.stopLoss     ?? null

      // Live drag price overrides
      const liveTp1 = drag?.field === 'tp1' ? drag.currentPrice : tp1
      const liveTp2 = drag?.field === 'tp2' ? drag.currentPrice : tp2
      const liveTp3 = drag?.field === 'tp3' ? drag.currentPrice : tp3
      const liveSl  = drag?.field === 'sl'  ? drag.currentPrice : sl

      if (ep == null && liveTp1 == null && liveSl == null) return

      const toY = (price: number): number | null => candleSeries.priceToCoordinate(price)

      // ── Shaded zones ──────────────────────────────────────────────────────
      if (ep != null && liveSl != null) {
        const y1 = toY(ep), y2 = toY(liveSl)
        if (y1 !== null && y2 !== null) {
          ctx.fillStyle = 'rgba(239,83,80,0.08)'
          ctx.fillRect(0, Math.min(y1, y2), W, Math.abs(y2 - y1))
        }
      }
      if (ep != null && liveTp1 != null) {
        const y1 = toY(ep), y2 = toY(liveTp1)
        if (y1 !== null && y2 !== null) {
          ctx.fillStyle = 'rgba(38,166,154,0.08)'
          ctx.fillRect(0, Math.min(y1, y2), W, Math.abs(y2 - y1))
        }
      }
      if (liveTp1 != null && liveTp2 != null) {
        const y1 = toY(liveTp1), y2 = toY(liveTp2)
        if (y1 !== null && y2 !== null) {
          ctx.fillStyle = 'rgba(38,166,154,0.05)'
          ctx.fillRect(0, Math.min(y1, y2), W, Math.abs(y2 - y1))
        }
      }

      // ── Line drawing helper ───────────────────────────────────────────────
      const drawLine = (price: number, color: string, dashed: boolean, lw: number) => {
        const y = toY(price)
        if (y === null) return
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = lw
        ctx.setLineDash(dashed ? [6, 4] : [])
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }

      // ── Label drawing helper ───────────────────────────────────────────────
      const drawLabel = (price: number, color: string, title: string, draggable: boolean) => {
        const y = toY(price)
        if (y === null || y < 0 || y > CHART_H) return
        const lx = W - LABEL_W - 2
        const ly = y - LABEL_H / 2
        ctx.save()
        // Pill background
        ctx.globalAlpha = 0.92
        ctx.fillStyle = color
        roundRect(ctx, lx, ly, LABEL_W, LABEL_H, 11)
        ctx.fill()
        ctx.globalAlpha = 1
        // Price text
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(title, lx + (draggable ? 14 : 8), y + 3.5)
        // Drag handle bars
        if (draggable) {
          ctx.fillStyle = 'rgba(255,255,255,0.6)'
          for (let i = -1; i <= 1; i++) {
            ctx.fillRect(lx + 5, y + i * 4 - 0.5, 6, 1.5)
          }
        }
        ctx.restore()
      }

      // ── Draw lines ────────────────────────────────────────────────────────
      if (ep != null)    drawLine(ep, '#2196F3', false, 2)
      if (liveSl != null) drawLine(liveSl, '#ef5350', true, 1.5)

      const tp1Color = hitStatus?.tp1 ? '#6b7280' : '#26a69a'
      const tp2Color = hitStatus?.tp2 ? '#6b7280' : '#4db6ac'
      const tp3Color = hitStatus?.tp3 ? '#6b7280' : '#80cbc4'
      if (liveTp1 != null) drawLine(liveTp1, tp1Color, true, 1.5)
      if (liveTp2 != null) drawLine(liveTp2, tp2Color, true, 1.5)
      if (liveTp3 != null) drawLine(liveTp3, tp3Color, true, 1.5)

      // ── Draw labels ───────────────────────────────────────────────────────
      const canDrag = isDraggableRef.current
      if (ep != null)     drawLabel(ep, '#1565c0', 'Entry', false)
      if (liveSl != null) drawLabel(liveSl, '#c62828', 'SL', canDrag)
      if (liveTp1 != null) drawLabel(liveTp1, hitStatus?.tp1 ? '#555e6b' : '#1b7a6e', 'TP1', canDrag)
      if (liveTp2 != null) drawLabel(liveTp2, hitStatus?.tp2 ? '#555e6b' : '#2a7a72', 'TP2', canDrag)
      if (liveTp3 != null) drawLabel(liveTp3, hitStatus?.tp3 ? '#555e6b' : '#3a7a7a', 'TP3', canDrag)
    }

    drawTradeLinesRef.current = drawTradeLines

    // ── Drawing canvas (z-index 10, on top) ───────────────────────────────
    const overlay = document.createElement('canvas')
    overlay.style.cssText = 'position:absolute;top:0;left:0;z-index:10;pointer-events:none;cursor:default;'
    overlay.style.width = w + 'px'
    overlay.style.height = '400px'
    overlay.width = w * dpr
    overlay.height = 400 * dpr
    container.style.position = 'relative'
    container.appendChild(overlay)
    overlayRef.current = overlay

    if (activeToolRef.current) {
      overlay.style.pointerEvents = 'all'
      overlay.style.cursor = activeToolRef.current === 'eraser' ? 'not-allowed' : 'crosshair'
    }

    // ── Drawing canvas redraw ──────────────────────────────────────────────
    const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
    const FIB_LABELS = ['0%', '23.6%', '38.2%', '50%', '61.8%', '78.6%', '100%']

    const toY = (price: number) => candleSeries.priceToCoordinate(price)
    const toX = (logical: number) => chart.timeScale().logicalToCoordinate(logical as unknown as Logical)

    const doRedraw = () => {
      const ctx = overlay.getContext('2d')
      if (!ctx) return
      const W = cssW, H = 400
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, overlay.width, overlay.height)
      ctx.scale(dpr, dpr)

      for (const d of drawingsRef.current) {
        ctx.save()
        ctx.setLineDash([])

        if (d.type === 'hline') {
          const y = toY(d.price); if (y === null) { ctx.restore(); continue }
          ctx.strokeStyle = '#E8313A'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5])
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
          ctx.setLineDash([]); ctx.fillStyle = '#1e293b'; ctx.fillRect(W - 62, y - 10, 60, 16)
          ctx.fillStyle = '#E8313A'; ctx.font = '11px monospace'; ctx.textAlign = 'right'
          ctx.fillText(d.price.toFixed(2), W - 4, y + 4)

        } else if (d.type === 'vline') {
          const x = toX(d.logical); if (x === null) { ctx.restore(); continue }
          ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1; ctx.setLineDash([5, 5])
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()

        } else if (d.type === 'hray') {
          const y = toY(d.price); const x0 = toX(d.startLogical)
          if (y === null || x0 === null) { ctx.restore(); continue }
          ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5])
          ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(W, y); ctx.stroke()
          ctx.setLineDash([]); ctx.beginPath(); ctx.arc(x0, y, 4, 0, Math.PI * 2); ctx.fillStyle = '#3b82f6'; ctx.fill()

        } else if (d.type === 'trendline') {
          const x1 = toX(d.p1.logical), y1 = toY(d.p1.price)
          const x2 = toX(d.p2.logical), y2 = toY(d.p2.price)
          if (x1 === null || y1 === null || x2 === null || y2 === null) { ctx.restore(); continue }
          ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1.5
          ctx.beginPath()
          if (d.extended && x1 !== x2) {
            const slope = (y2 - y1) / (x2 - x1)
            ctx.moveTo(0, y1 + (0 - x1) * slope); ctx.lineTo(W, y1 + (W - x1) * slope)
          } else { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2) }
          ctx.stroke()

        } else if (d.type === 'fib') {
          const range = d.high - d.low
          ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
          for (let i = 0; i < FIB_LEVELS.length; i++) {
            const price = d.high - range * FIB_LEVELS[i]
            const y = toY(price); if (y === null) continue
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
            ctx.setLineDash([]); ctx.fillStyle = '#1e293b'; ctx.fillRect(W - 92, y - 11, 90, 14)
            ctx.fillStyle = '#F59E0B'; ctx.font = '10px monospace'; ctx.textAlign = 'right'
            ctx.fillText(`${FIB_LABELS[i]} ${price.toFixed(2)}`, W - 4, y - 1)
            ctx.setLineDash([4, 4])
          }

        } else if (d.type === 'rect') {
          const x1 = toX(d.p1.logical), y1 = toY(d.p1.price)
          const x2 = toX(d.p2.logical), y2 = toY(d.p2.price)
          if (x1 === null || y1 === null || x2 === null || y2 === null) { ctx.restore(); continue }
          const col = d.zone === 'support' ? '#4ade80' : '#f87171'
          ctx.fillStyle = d.zone === 'support' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'
          ctx.fillRect(x1, y1, x2 - x1, y2 - y1)
          ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

        } else if (d.type === 'text') {
          const x = toX(d.pos.logical), y = toY(d.pos.price)
          if (x === null || y === null) { ctx.restore(); continue }
          const tw = d.label.length * 7 + 10
          ctx.globalAlpha = 0.9; ctx.fillStyle = '#1e293b'; ctx.fillRect(x, y - 14, tw, 17)
          ctx.globalAlpha = 1; ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left'
          ctx.fillText(d.label, x + 4, y - 2)

        } else if (d.type === 'price_label') {
          const x = toX(d.pos.logical), y = toY(d.pos.price)
          if (x === null || y === null) { ctx.restore(); continue }
          const pl = d.pos.price.toFixed(2); const pw = pl.length * 6
          ctx.fillStyle = '#E8313A'; ctx.globalAlpha = 0.9
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y - 6); ctx.lineTo(x + 8 + pw, y - 6); ctx.lineTo(x + 8 + pw, y + 6); ctx.lineTo(x + 8, y + 6); ctx.closePath(); ctx.fill()
          ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(pl, x + 11, y + 3.5)
        }
        ctx.restore()
      }

      // Pending point dot
      const pp = pendingPtRef.current
      if (pp) {
        const px = toX(pp.logical), py = toY(pp.price)
        if (px !== null && py !== null) {
          ctx.save(); ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fillStyle = '#60a5fa'; ctx.fill(); ctx.restore()
        }
      }

      // Preview (tool active)
      const hover = hoverRef.current
      const tool = activeToolRef.current
      if (!hover || !tool) return

      const { x: hx, y: hy } = hover
      ctx.save(); ctx.globalAlpha = 0.55

      if (tool === 'hline') {
        ctx.strokeStyle = '#E8313A'; ctx.lineWidth = 1; ctx.setLineDash([5, 5])
        ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(W, hy); ctx.stroke()
      } else if (tool === 'vline') {
        ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1; ctx.setLineDash([5, 5])
        ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx, H); ctx.stroke()
      } else if (tool === 'hray') {
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1; ctx.setLineDash([5, 5])
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(W, hy); ctx.stroke()
      } else if ((tool === 'trendline' || tool === 'extended_line') && pp) {
        const px = toX(pp.logical), py = toY(pp.price)
        if (px !== null && py !== null) {
          ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1.5
          ctx.beginPath()
          if (tool === 'extended_line' && px !== hx) {
            const slope = (hy - py) / (hx - px)
            ctx.moveTo(0, py + (0 - px) * slope); ctx.lineTo(W, py + (W - px) * slope)
          } else { ctx.moveTo(px, py); ctx.lineTo(hx, hy) }
          ctx.stroke()
        }
      } else if (tool === 'fib' && pp) {
        const hi = Math.max(hover.price, pp.price), lo = Math.min(hover.price, pp.price)
        const range = hi - lo
        if (range > 0) {
          ctx.strokeStyle = '#F59E0B'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
          for (const lvl of FIB_LEVELS) {
            const y = toY(hi - range * lvl); if (y === null) continue
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
          }
        }
      } else if (tool === 'rect_zone' && rectDragRef.current) {
        const drag = rectDragRef.current
        ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
        ctx.strokeRect(drag.x, drag.y, hx - drag.x, hy - drag.y)
        ctx.fillStyle = 'rgba(156,163,175,0.1)'; ctx.setLineDash([]); ctx.fillRect(drag.x, drag.y, hx - drag.x, hy - drag.y)
      }

      if (tool === 'hline' || tool === 'hray') {
        ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2); ctx.fillStyle = '#E8313A'; ctx.fill()
      }
      ctx.restore()
    }

    redrawRef.current = doRedraw

    // ── Hit-test helpers for drawing tools ────────────────────────────────
    const toYH = (price: number) => candleSeries.priceToCoordinate(price)
    const toXH = (logical: number) => chart.timeScale().logicalToCoordinate(logical as unknown as Logical)

    // ── Drawing canvas event listeners ────────────────────────────────────
    overlay.addEventListener('click', (e: MouseEvent) => {
      const tool = activeToolRef.current
      if (!tool) return
      const rect = overlay.getBoundingClientRect()
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      const price = candleSeries.coordinateToPrice(y)
      const logical = chart.timeScale().coordinateToLogical(x)
      if (price === null || logical === null) return
      const dp: DP = { price: price as number, logical: logical as number }

      if (tool === 'hline') {
        undoStackRef.current.push([...drawingsRef.current])
        drawingsRef.current.push({ id: uid(), type: 'hline', price: dp.price })
        setCanUndo(true); clearTool(); doRedraw()
      } else if (tool === 'vline') {
        undoStackRef.current.push([...drawingsRef.current])
        drawingsRef.current.push({ id: uid(), type: 'vline', logical: dp.logical })
        setCanUndo(true); clearTool(); doRedraw()
      } else if (tool === 'hray') {
        undoStackRef.current.push([...drawingsRef.current])
        drawingsRef.current.push({ id: uid(), type: 'hray', price: dp.price, startLogical: dp.logical })
        setCanUndo(true); clearTool(); doRedraw()
      } else if (tool === 'trendline' || tool === 'extended_line') {
        if (!pendingPtRef.current) {
          pendingPtRef.current = dp; setPendingDisplay(true); doRedraw()
        } else {
          undoStackRef.current.push([...drawingsRef.current])
          drawingsRef.current.push({ id: uid(), type: 'trendline', p1: pendingPtRef.current, p2: dp, extended: tool === 'extended_line' })
          setCanUndo(true); pendingPtRef.current = null; setPendingDisplay(false); clearTool(); doRedraw()
        }
      } else if (tool === 'fib') {
        if (!pendingPtRef.current) {
          pendingPtRef.current = dp; setPendingDisplay(true); doRedraw()
        } else {
          undoStackRef.current.push([...drawingsRef.current])
          drawingsRef.current.push({ id: uid(), type: 'fib', high: Math.max(dp.price, pendingPtRef.current.price), low: Math.min(dp.price, pendingPtRef.current.price) })
          setCanUndo(true); pendingPtRef.current = null; setPendingDisplay(false); clearTool(); doRedraw()
        }
      } else if (tool === 'text') {
        setTextInput({ pos: dp, x, y, value: '' })
      } else if (tool === 'price_label') {
        undoStackRef.current.push([...drawingsRef.current])
        drawingsRef.current.push({ id: uid(), type: 'price_label', pos: dp })
        setCanUndo(true); clearTool(); doRedraw()
      } else if (tool === 'eraser') {
        const HIT = 12
        let found = -1
        for (let i = 0; i < drawingsRef.current.length; i++) {
          const d = drawingsRef.current[i]
          if (d.type === 'hline') {
            const dy = toYH(d.price); if (dy !== null && Math.abs(y - dy) < HIT) { found = i; break }
          } else if (d.type === 'vline') {
            const dx = toXH(d.logical); if (dx !== null && Math.abs(x - dx) < HIT) { found = i; break }
          } else if (d.type === 'hray') {
            const dy = toYH(d.price); const dx = toXH(d.startLogical)
            if (dy !== null && dx !== null && Math.abs(y - dy) < HIT && x >= dx - HIT) { found = i; break }
          } else if (d.type === 'trendline') {
            const x1 = toXH(d.p1.logical), y1 = toYH(d.p1.price), x2 = toXH(d.p2.logical), y2 = toYH(d.p2.price)
            if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
              const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
              if (len > 0) {
                const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (len * len)))
                if (Math.hypot(x - x1 - t * dx, y - y1 - t * dy) < HIT) { found = i; break }
              }
            }
          } else if (d.type === 'fib') {
            let hit = false
            for (const lvl of FIB_LEVELS) {
              const fy = toYH(d.high - (d.high - d.low) * lvl)
              if (fy !== null && Math.abs(y - fy) < HIT) { hit = true; break }
            }
            if (hit) { found = i; break }
          } else if (d.type === 'rect') {
            const x1 = toXH(d.p1.logical), y1 = toYH(d.p1.price), x2 = toXH(d.p2.logical), y2 = toYH(d.p2.price)
            if (x1 !== null && y1 !== null && x2 !== null && y2 !== null &&
                x >= Math.min(x1, x2) - HIT && x <= Math.max(x1, x2) + HIT &&
                y >= Math.min(y1, y2) - HIT && y <= Math.max(y1, y2) + HIT) { found = i; break }
          } else if (d.type === 'text' || d.type === 'price_label') {
            const pos = 'pos' in d ? d.pos : null
            if (pos) {
              const px = toXH(pos.logical), py = toYH(pos.price)
              if (px !== null && py !== null && Math.hypot(x - px, y - py) < 20) { found = i; break }
            }
          }
        }
        if (found >= 0) {
          undoStackRef.current.push([...drawingsRef.current])
          drawingsRef.current.splice(found, 1)
          setCanUndo(true); doRedraw()
        }
      }
    })

    overlay.addEventListener('mousedown', (e: MouseEvent) => {
      if (activeToolRef.current !== 'rect_zone') return
      const rect = overlay.getBoundingClientRect()
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      const price = candleSeries.coordinateToPrice(y)
      const logical = chart.timeScale().coordinateToLogical(x)
      if (price === null || logical === null) return
      rectDragRef.current = { x, y, price: price as number, logical: logical as number }
    })

    overlay.addEventListener('mouseup', (e: MouseEvent) => {
      if (activeToolRef.current !== 'rect_zone' || !rectDragRef.current) return
      const rect = overlay.getBoundingClientRect()
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      const price2 = candleSeries.coordinateToPrice(y)
      const logical2 = chart.timeScale().coordinateToLogical(x)
      const drag = rectDragRef.current
      rectDragRef.current = null
      if (!price2 || !logical2 || Math.hypot(x - drag.x, y - drag.y) < 5) return
      const cx = (drag.x + x) / 2, cy = (drag.y + y) / 2
      setZonePopup({ p1: { price: drag.price, logical: drag.logical }, p2: { price: price2 as number, logical: logical2 as number }, cx, cy })
    })

    overlay.addEventListener('mousemove', (e: MouseEvent) => {
      const tool = activeToolRef.current
      if (!tool) { hoverRef.current = null; return }
      const rect = overlay.getBoundingClientRect()
      const x = e.clientX - rect.left, y = e.clientY - rect.top
      const price = candleSeries.coordinateToPrice(y)
      const logical = chart.timeScale().coordinateToLogical(x)
      hoverRef.current = { x, y, price: (price ?? 0) as number, logical: (logical ?? 0) as number }
      doRedraw()
    })

    overlay.addEventListener('mouseleave', () => {
      hoverRef.current = null; rectDragRef.current = null; doRedraw()
    })

    // ── Drag interaction for trade labels ─────────────────────────────────
    const getLabelHit = (clientX: number, clientY: number): 'tp1' | 'tp2' | 'tp3' | 'sl' | null => {
      if (!isDraggableRef.current) return null
      const containerRect = container.getBoundingClientRect()
      const x = clientX - containerRect.left
      const y = clientY - containerRect.top
      if (y < 0 || y > CHART_H) return null
      const labelX = cssW - LABEL_W - 2
      if (x < labelX) return null

      const tl = tradeLevelsRef.current
      const HIT_Y = 13
      const levels: Array<{ field: 'tp1' | 'tp2' | 'tp3' | 'sl'; price: number | null | undefined }> = [
        { field: 'tp1', price: tl.takeProfit },
        { field: 'tp2', price: tl.takeProfit2 },
        { field: 'tp3', price: tl.takeProfit3 },
        { field: 'sl',  price: tl.stopLoss },
      ]
      for (const lvl of levels) {
        if (lvl.price == null) continue
        const labelY = candleSeries.priceToCoordinate(lvl.price)
        if (labelY !== null && Math.abs(y - labelY) <= HIT_Y) return lvl.field
      }
      return null
    }

    const handleWinMousedown = (e: MouseEvent) => {
      const field = getLabelHit(e.clientX, e.clientY)
      if (!field) return
      e.stopPropagation()
      e.preventDefault()
      const tl = tradeLevelsRef.current
      const initPrice = field === 'tp1' ? tl.takeProfit
        : field === 'tp2' ? tl.takeProfit2
        : field === 'tp3' ? tl.takeProfit3
        : tl.stopLoss
      if (initPrice == null) return
      tradeDragRef.current = { field, currentPrice: initPrice }
      container.style.cursor = 'ns-resize'
    }

    const handleWinMousemove = (e: MouseEvent) => {
      const drag = tradeDragRef.current
      if (!drag) {
        // Update cursor if hovering over a label
        const hit = getLabelHit(e.clientX, e.clientY)
        if (mainRef.current) {
          const rect = mainRef.current.getBoundingClientRect()
          const inChart = e.clientX >= rect.left && e.clientX <= rect.right &&
                          e.clientY >= rect.top && e.clientY <= rect.bottom
          if (inChart) container.style.cursor = hit ? 'ns-resize' : ''
        }
        return
      }
      const containerRect = container.getBoundingClientRect()
      const y = e.clientY - containerRect.top
      const price = candleSeries.coordinateToPrice(Math.max(0, Math.min(y, CHART_H)))
      if (price == null) return
      drag.currentPrice = price as number
      drawTradeLines()
    }

    const handleWinMouseup = () => {
      const drag = tradeDragRef.current
      if (!drag) return
      tradeDragRef.current = null
      container.style.cursor = ''

      const finalPrice = drag.currentPrice
      const tl = tradeLevelsRef.current
      if (drag.field === 'sl') {
        onSlChangeRef.current?.(finalPrice)
      } else {
        const tp1 = drag.field === 'tp1' ? finalPrice : (tl.takeProfit ?? null)
        const tp2 = drag.field === 'tp2' ? finalPrice : (tl.takeProfit2 ?? null)
        const tp3 = drag.field === 'tp3' ? finalPrice : (tl.takeProfit3 ?? null)
        onTpChangeRef.current?.(tp1, tp2, tp3)
      }
      drawTradeLines()
    }

    window.addEventListener('mousedown', handleWinMousedown, true)
    window.addEventListener('mousemove', handleWinMousemove)
    window.addEventListener('mouseup', handleWinMouseup)

    // ── Subscribe both canvases to pan/zoom ───────────────────────────────
    chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      doRedraw()
      drawTradeLines()
    })

    // Initial draws
    const initTimer = setTimeout(() => { doRedraw(); drawTradeLines() }, 80)

    // ── Resize ─────────────────────────────────────────────────────────────
    const resize = () => {
      if (!mainRef.current) return
      const nw = mainRef.current.clientWidth
      cssW = nw
      chart.applyOptions({ width: nw })
      overlay.width = nw * dpr
      overlay.style.width = nw + 'px'
      tradeLinesCanvas.width = nw * dpr
      tradeLinesCanvas.style.width = nw + 'px'
      setContainerW(nw)
      doRedraw()
      drawTradeLines()
    }
    window.addEventListener('resize', resize)

    return () => {
      clearTimeout(initTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousedown', handleWinMousedown, true)
      window.removeEventListener('mousemove', handleWinMousemove)
      window.removeEventListener('mouseup', handleWinMouseup)
      chart.remove()
      overlay.remove()
      tradeLinesCanvas.remove()
      overlayRef.current = null
      chartRef.current = null
      candleSeriesRef.current = null
      tradeLinesCanvasRef.current = null
      overlaySeriesRef.current.clear()
      redrawRef.current = null
      drawTradeLinesRef.current = null
      tradeDragRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, activeIndicators, clearTool])

  // ── RSI sub-panel ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeIndicators.has('rsi') || !rsiRef.current) return
    const chart = createChart(rsiRef.current, {
      width: rsiRef.current.clientWidth, height: 120,
      layout: { background: { color: '#1f2937' }, textColor: '#d1d5db' },
      grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
      timeScale: { timeVisible: true },
    })
    const sorted = [...candles].sort((a, b) => timeAsNum(a.time) - timeAsNum(b.time))
    chart.addLineSeries({ color: '#60a5fa', lineStyle: LineStyle.Solid }).setData(calcRSI(sorted))
    const resize = () => chart.applyOptions({ width: rsiRef.current!.clientWidth })
    window.addEventListener('resize', resize)
    return () => { window.removeEventListener('resize', resize); chart.remove() }
  }, [candles, activeIndicators])

  // ── MACD sub-panel ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeIndicators.has('macd') || !macdRef.current) return
    const chart = createChart(macdRef.current, {
      width: macdRef.current.clientWidth, height: 120,
      layout: { background: { color: '#1f2937' }, textColor: '#d1d5db' },
      grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
      timeScale: { timeVisible: true },
    })
    const sorted = [...candles].sort((a, b) => timeAsNum(a.time) - timeAsNum(b.time))
    const data = calcMACD(sorted)
    chart.addLineSeries({ color: '#facc15', lineWidth: 2 }).setData(data.map(d => ({ time: d.time, value: d.macd })))
    chart.addLineSeries({ color: '#60a5fa', lineWidth: 1 }).setData(data.map(d => ({ time: d.time, value: d.signal })))
    chart.addHistogramSeries({}).setData(data.map(d => ({ time: d.time, value: d.hist, color: d.hist >= 0 ? '#4ade80' : '#f87171' })))
    const resize = () => chart.applyOptions({ width: macdRef.current!.clientWidth })
    window.addEventListener('resize', resize)
    return () => { window.removeEventListener('resize', resize); chart.remove() }
  }, [candles, activeIndicators])

  // ── ATR sub-panel ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeIndicators.has('atr') || !atrRef.current) return
    const chart = createChart(atrRef.current, {
      width: atrRef.current.clientWidth, height: 100,
      layout: { background: { color: '#1f2937' }, textColor: '#d1d5db' },
      grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
      timeScale: { timeVisible: true },
    })
    const sorted = [...candles].sort((a, b) => timeAsNum(a.time) - timeAsNum(b.time))
    chart.addLineSeries({ color: '#a78bfa', lineWidth: 1 }).setData(calcATR(sorted))
    const resize = () => chart.applyOptions({ width: atrRef.current!.clientWidth })
    window.addEventListener('resize', resize)
    return () => { window.removeEventListener('resize', resize); chart.remove() }
  }, [candles, activeIndicators])

  // ── Text / zone commit ─────────────────────────────────────────────────────
  const commitText = () => {
    if (!textInput) return
    if (textInput.value.trim()) {
      undoStackRef.current.push([...drawingsRef.current])
      drawingsRef.current.push({ id: uid(), type: 'text', pos: textInput.pos, label: textInput.value.trim() })
      setCanUndo(true)
    }
    setTextInput(null); clearTool(); redrawRef.current?.()
  }

  const commitZone = (zone: 'support' | 'resist') => {
    if (!zonePopup) return
    undoStackRef.current.push([...drawingsRef.current])
    drawingsRef.current.push({ id: uid(), type: 'rect', p1: zonePopup.p1, p2: zonePopup.p2, zone })
    setCanUndo(true); setZonePopup(null); clearTool(); redrawRef.current?.()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <ChartToolbar
        activeTool={activeToolDisplay}
        onSelectTool={selectTool}
        onClearDrawings={clearAllDrawings}
        onUndo={handleUndo}
        canUndo={canUndo}
        pendingPoint={pendingDisplay}
        activeIndicators={activeIndicators}
        onToggleIndicator={onToggleIndicator}
        isDark={isDark}
      />

      {/* Timeframe selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          Timeframe: <span style={{ color: '#fff', fontWeight: 600 }}>{timeframe}</span>
        </div>
        <select
          value={timeframe}
          onChange={e => onTimeframeChange(e.target.value)}
          style={{ background: '#374151', color: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #4b5563', fontSize: '12px' }}
        >
          {['1m','5m','15m','1h','4h','1d'].map(tf => <option key={tf} value={tf}>{tf === '1m' ? '1 Min' : tf === '5m' ? '5 Min' : tf === '15m' ? '15 Min' : tf === '1h' ? '1 Hour' : tf === '4h' ? '4 Hour' : '1 Day'}</option>)}
        </select>
      </div>

      {/* Main chart container */}
      <div style={{ position: 'relative', width: '100%' }}>
        <div ref={mainRef} style={{ width: '100%' }} />

        {/* Text input popup */}
        {textInput && (
          <div style={{ position: 'absolute', left: Math.min(textInput.x, containerW - 190), top: Math.max(textInput.y - 40, 4), zIndex: 50, display: 'flex', gap: '4px', background: '#1e293b', padding: '4px', borderRadius: '6px', border: '1px solid #374151' }}>
            <input autoFocus value={textInput.value}
              onChange={e => setTextInput(t => t ? { ...t, value: e.target.value } : null)}
              onKeyDown={e => { if (e.key === 'Enter') commitText(); if (e.key === 'Escape') { setTextInput(null); clearTool() } }}
              placeholder="Label..."
              style={{ background: '#0f172a', color: '#fff', border: '1px solid #374151', borderRadius: '4px', padding: '3px 7px', fontSize: '12px', width: '130px', outline: 'none' }}
            />
            <button onClick={commitText} style={{ background: '#E8313A', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>✓</button>
          </div>
        )}

        {/* Zone type popup */}
        {zonePopup && (
          <div style={{ position: 'absolute', left: Math.min(zonePopup.cx - 70, containerW - 200), top: Math.max(zonePopup.cy - 20, 4), zIndex: 50, background: '#1e293b', border: '1px solid #374151', borderRadius: '8px', padding: '8px', display: 'flex', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', alignSelf: 'center' }}>Zone:</span>
            <button onClick={() => commitZone('support')} style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', borderRadius: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Support</button>
            <button onClick={() => commitZone('resist')} style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444', borderRadius: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Resistance</button>
            <button onClick={() => { setZonePopup(null); clearTool() }} style={{ background: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 6px' }}>✕</button>
          </div>
        )}
      </div>

      {/* Sub-panel indicators */}
      {activeIndicators.has('rsi')  && <div style={{ marginTop: 2 }}><div style={{ fontSize: '10px', color: '#6b7280', padding: '2px 0' }}>RSI (14)</div><div ref={rsiRef} style={{ width: '100%', height: 120 }} /></div>}
      {activeIndicators.has('macd') && <div style={{ marginTop: 2 }}><div style={{ fontSize: '10px', color: '#6b7280', padding: '2px 0' }}>MACD</div><div ref={macdRef} style={{ width: '100%', height: 120 }} /></div>}
      {activeIndicators.has('atr')  && <div style={{ marginTop: 2 }}><div style={{ fontSize: '10px', color: '#6b7280', padding: '2px 0' }}>ATR (14)</div><div ref={atrRef} style={{ width: '100%', height: 100 }} /></div>}
    </div>
  )
}
