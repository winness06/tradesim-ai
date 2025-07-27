'use client'

import dynamic from 'next/dynamic';
import type { CandlestickData, Time } from 'lightweight-charts';

// Dynamically import CandleChart with SSR disabled
const CandleChart = dynamic(() => import('@/components/CandleChart'), {
  ssr: false,
});

interface CandleChartWrapperProps {
  candles: CandlestickData<Time>[];
  showVolume: boolean;
  showRSI: boolean;
  showMACD: boolean;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

export default function CandleChartWrapper({
  candles,
  showVolume,
  showRSI,
  showMACD,
  timeframe,
  onTimeframeChange,
}: CandleChartWrapperProps) {
  return (
    <CandleChart
      candles={candles}
      showVolume={showVolume}
      showRSI={showRSI}
      showMACD={showMACD}
      timeframe={timeframe}
      onTimeframeChange={onTimeframeChange}
    />
  );
}
