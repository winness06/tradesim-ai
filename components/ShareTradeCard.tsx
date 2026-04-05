'use client';

import { useRef, useState } from 'react';

interface Props {
  score: number;
  rank: string;
  rankColor: string;
  result: string;
  date: string;
}

export default function ShareTradeCard({ score, rank, rankColor, result, date }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const h2c = await import('html2canvas') as any;
      const html2canvas = h2c.default ?? h2c;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0f1117',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `chartchamp-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Share card error:', err);
    }
    setDownloading(false);
  };

  return (
    <div className="mt-4 flex flex-col items-start gap-3">
      {/* Card to capture */}
      <div
        ref={cardRef}
        style={{
          width: '360px',
          background: '#0f1117',
          borderRadius: '20px',
          padding: '32px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          border: '1px solid rgba(232,49,58,0.25)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            Chart<span style={{ color: '#E8313A' }}>Champ</span>
          </span>
          <span style={{ fontSize: '11px', color: '#6b7280' }}>{date}</span>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '88px', fontWeight: 900, color: rankColor, lineHeight: '1', letterSpacing: '-4px' }}>
            {score}
          </div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>out of 100</div>
          <div style={{
            display: 'inline-block',
            marginTop: '12px',
            padding: '5px 18px',
            borderRadius: '100px',
            background: rankColor + '22',
            color: rankColor,
            fontWeight: 700,
            fontSize: '15px',
          }}>
            {rank}
          </div>
        </div>

        {/* Result */}
        <div style={{
          background: '#1a1d27',
          borderRadius: '12px',
          padding: '12px 16px',
          textAlign: 'center',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '24px',
        }}>
          {result}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280' }}>
          Train smarter at{' '}
          <span style={{ color: '#E8313A', fontWeight: 600 }}>chartchamp.com.au</span>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          width: '360px',
          padding: '11px',
          borderRadius: '12px',
          background: downloading ? '#374151' : '#E8313A',
          color: '#fff',
          fontWeight: 700,
          fontSize: '13px',
          cursor: downloading ? 'not-allowed' : 'pointer',
          border: 'none',
          transition: 'background 0.2s',
        }}
      >
        {downloading ? 'Generating image...' : '⬇  Download as Image'}
      </button>
    </div>
  );
}
