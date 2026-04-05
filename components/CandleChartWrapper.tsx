'use client'

import dynamic from 'next/dynamic';
import type { CandlestickData, Time } from 'lightweight-charts';
import type { Drawing, DrawTool } from '@/types/drawings';

const CandleChart = dynamic(() => import('@/components/CandleChart'), { ssr: false });

interface Props {
  candles: CandlestickData<Time>[];
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  // Drawing
  activeTool: DrawTool | null;
  drawings: Drawing[];
  onSelectTool: (t: DrawTool | null) => void;
  onAddDrawing: (d: Drawing) => void;
  onRemoveDrawing: (id: string) => void;
  onClearDrawings: () => void;
  onUndo: () => void;
  canUndo: boolean;
  // Indicators
  activeIndicators: Set<string>;
  onToggleIndicator: (id: string) => void;
  // Theme
  isDark: boolean;
  // Trade levels (auto-drawn lines)
  entryPrice?: number | null;
  takeProfit?: number | null;
  takeProfit2?: number | null;
  takeProfit3?: number | null;
  stopLoss?: number | null;
  tpHitStatus?: { tp1: boolean; tp2: boolean; tp3: boolean };
  tradeDirection?: 'long' | 'short' | 'unknown';
  // Draggable trade levels
  onTpChange?: (tp1: number | null, tp2: number | null, tp3: number | null) => void;
  onSlChange?: (sl: number | null) => void;
  isDraggable?: boolean;
}

export default function CandleChartWrapper(props: Props) {
  return <CandleChart {...props} />;
}
