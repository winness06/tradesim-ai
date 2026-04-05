'use client';

import { useRef, useState, useEffect } from 'react';
import { DrawTool } from '@/types/drawings';

// ── Tool definitions ───────────────────────────────────────────────────────────

interface ToolDef {
  id: DrawTool;
  label: string;
  icon: string;
  hint?: string;
  todo?: boolean;
}

const DRAWING_GROUPS: { header: string; items: ToolDef[] }[] = [
  {
    header: 'Lines',
    items: [
      { id: 'hline',         icon: '—',  label: 'Horizontal Line',    hint: 'Click a price level' },
      { id: 'hray',          icon: '→',  label: 'Horizontal Ray',     hint: 'Click start point' },
      { id: 'vline',         icon: '|',  label: 'Vertical Line',      hint: 'Click a time position' },
      { id: 'trendline',     icon: '↗',  label: 'Trend Line',         hint: 'Click two points' },
      { id: 'extended_line', icon: '↔',  label: 'Extended Line',      hint: 'Click two points' },
      { id: 'parallel_channel', icon: '⫽', label: 'Parallel Channel', hint: 'Click 3 points', todo: true },
    ],
  },
  {
    header: 'Shapes',
    items: [
      { id: 'rect_zone',  icon: '▭', label: 'Zone (Rectangle)',  hint: 'Click and drag' },
      { id: 'circle',     icon: '○', label: 'Circle',            hint: 'Click center, drag radius', todo: true },
    ],
  },
  {
    header: 'Fibonacci',
    items: [
      { id: 'fib',           icon: 'F↕', label: 'Fibonacci Retracement', hint: 'Click swing low → swing high' },
      { id: 'fib_extension', icon: 'F↑', label: 'Fibonacci Extension',   hint: 'Three clicks', todo: true },
      { id: 'fib_fan',       icon: 'F⟁', label: 'Fibonacci Fan',         hint: 'Two clicks', todo: true },
    ],
  },
  {
    header: 'Annotations',
    items: [
      { id: 'text',        icon: 'T',  label: 'Text Label',  hint: 'Click to place' },
      { id: 'price_label', icon: '⚑',  label: 'Price Label', hint: 'Click a price level' },
    ],
  },
];

const INDICATOR_GROUPS: { header: string; items: { id: string; label: string; todo?: boolean }[] }[] = [
  {
    header: 'Overlays',
    items: [
      { id: 'ma20',  label: 'MA 20' },
      { id: 'ma50',  label: 'MA 50' },
      { id: 'ma200', label: 'MA 200' },
      { id: 'ema9',  label: 'EMA 9' },
      { id: 'ema21', label: 'EMA 21' },
      { id: 'bb',    label: 'Bollinger Bands' },
      { id: 'vwap',  label: 'VWAP' },
    ],
  },
  {
    header: 'Sub-panels',
    items: [
      { id: 'volume', label: 'Volume' },
      { id: 'rsi',    label: 'RSI' },
      { id: 'macd',   label: 'MACD' },
      { id: 'atr',    label: 'ATR' },
      { id: 'stochrsi', label: 'Stochastic RSI', todo: true },
    ],
  },
];

// Flat list for search
const ALL_TOOLS = DRAWING_GROUPS.flatMap(g => g.items);
const ALL_INDICATORS = INDICATOR_GROUPS.flatMap(g => g.items);

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  activeTool: DrawTool | null;
  onSelectTool: (tool: DrawTool | null) => void;
  onClearDrawings: () => void;
  onUndo: () => void;
  canUndo: boolean;
  pendingPoint: boolean;
  activeIndicators: Set<string>;
  onToggleIndicator: (id: string) => void;
  isDark: boolean;
}

type MenuId = 'drawings' | 'indicators' | 'search';

export default function ChartToolbar({
  activeTool, onSelectTool, onClearDrawings, onUndo, canUndo,
  pendingPoint, activeIndicators, onToggleIndicator, isDark,
}: Props) {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const bg      = isDark ? '#1a1d27' : '#ffffff';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : '#e8e4dc';
  const text    = isDark ? '#d1d5db' : '#374151';
  const muted   = isDark ? '#6b7280' : '#9ca3af';
  const dropBg  = isDark ? '#1a1d27' : '#ffffff';
  const hoverBg = isDark ? 'rgba(255,255,255,0.07)' : '#f3f0e8';
  const RED     = '#E8313A';

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleMenu = (id: MenuId) => {
    setOpenMenu(prev => prev === id ? null : id);
    if (id !== 'search') setSearchQuery('');
  };

  const activeToolDef = ALL_TOOLS.find(t => t.id === activeTool);
  const drawingsBtnLabel = activeToolDef
    ? activeToolDef.label
    : '📐 Drawings';

  const activeIndicatorCount = activeIndicators.size;

  const btnStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '5px 10px', borderRadius: '7px', border: 'none',
    background: active ? RED : 'transparent',
    color: active ? '#fff' : text,
    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.12s', whiteSpace: 'nowrap' as const,
  });

  const iconBtnStyle = (active?: boolean) => ({
    width: '28px', height: '28px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', borderRadius: '6px', border: 'none',
    background: active ? RED + '22' : 'transparent',
    color: active ? RED : muted,
    fontSize: '13px', cursor: 'pointer', transition: 'all 0.12s',
  });

  // Search results
  const q = searchQuery.toLowerCase().trim();
  const searchTools = q ? ALL_TOOLS.filter(t => t.label.toLowerCase().includes(q)) : [];
  const searchInds = q ? ALL_INDICATORS.filter(t => t.label.toLowerCase().includes(q)) : [];
  const hasSearchResults = searchTools.length > 0 || searchInds.length > 0;

  const dropdownStyle = {
    position: 'absolute' as const,
    top: '100%', left: 0,
    marginTop: '4px',
    background: dropBg,
    border: `1px solid ${border}`,
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    zIndex: 200,
    minWidth: '200px',
    padding: '6px 0',
    maxHeight: '400px',
    overflowY: 'auto' as const,
  };

  return (
    <div
      ref={rootRef}
      className="hidden md:flex"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '10px',
        padding: '5px 10px',
        alignItems: 'center',
        gap: '4px',
        flexWrap: 'wrap' as const,
        marginBottom: '6px',
        position: 'relative',
      }}
    >
      {/* ── Drawings dropdown ────────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <button
          style={btnStyle(!!activeTool)}
          onClick={() => toggleMenu('drawings')}
        >
          {activeTool ? `${activeToolDef?.icon ?? '📐'} ${drawingsBtnLabel}` : '📐 Drawings'}
          {activeTool ? (
            <span
              style={{ marginLeft: '4px', opacity: 0.7, fontWeight: 900, fontSize: '10px' }}
              onClick={e => { e.stopPropagation(); onSelectTool(null); }}
            >✕</span>
          ) : (
            <span style={{ opacity: 0.5, fontSize: '10px' }}>▾</span>
          )}
        </button>

        {openMenu === 'drawings' && (
          <div style={dropdownStyle}>
            {DRAWING_GROUPS.map((group, gi) => (
              <div key={gi}>
                <div style={{ padding: '6px 12px 3px', fontSize: '10px', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {group.header}
                </div>
                {group.items.map(tool => (
                  <button
                    key={tool.id}
                    style={{
                      width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '7px 12px', border: 'none', cursor: tool.todo ? 'default' : 'pointer',
                      background: activeTool === tool.id ? RED + '22' : 'transparent',
                      color: tool.todo ? muted : (activeTool === tool.id ? RED : text),
                      fontSize: '13px',
                    }}
                    onMouseEnter={e => { if (!tool.todo) e.currentTarget.style.background = hoverBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = activeTool === tool.id ? RED + '22' : 'transparent'; }}
                    onClick={() => {
                      if (tool.todo) return;
                      onSelectTool(activeTool === tool.id ? null : tool.id);
                      setOpenMenu(null);
                    }}
                  >
                    <span style={{ width: '18px', textAlign: 'center', fontSize: '12px' }}>{tool.icon}</span>
                    <span style={{ flex: 1 }}>{tool.label}</span>
                    {tool.todo && <span style={{ fontSize: '9px', background: muted + '33', color: muted, padding: '1px 5px', borderRadius: '3px' }}>Soon</span>}
                  </button>
                ))}
                {gi < DRAWING_GROUPS.length - 1 && (
                  <div style={{ margin: '4px 12px', borderTop: `1px solid ${border}` }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Indicators dropdown ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <button
          style={btnStyle(activeIndicatorCount > 0 && openMenu === 'indicators')}
          onClick={() => toggleMenu('indicators')}
        >
          📊 Indicators
          {activeIndicatorCount > 0 && (
            <span style={{ background: RED, color: '#fff', borderRadius: '99px', padding: '0 5px', fontSize: '10px', fontWeight: 800 }}>
              {activeIndicatorCount}
            </span>
          )}
          <span style={{ opacity: 0.5, fontSize: '10px' }}>▾</span>
        </button>

        {openMenu === 'indicators' && (
          <div style={dropdownStyle}>
            {INDICATOR_GROUPS.map((group, gi) => (
              <div key={gi}>
                <div style={{ padding: '6px 12px 3px', fontSize: '10px', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {group.header}
                </div>
                {group.items.map(ind => {
                  const isOn = activeIndicators.has(ind.id);
                  return (
                    <button
                      key={ind.id}
                      style={{
                        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '7px 12px', border: 'none', cursor: ind.todo ? 'default' : 'pointer',
                        background: isOn ? RED + '11' : 'transparent',
                        color: ind.todo ? muted : text,
                        fontSize: '13px',
                      }}
                      onMouseEnter={e => { if (!ind.todo) e.currentTarget.style.background = isOn ? RED + '22' : hoverBg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isOn ? RED + '11' : 'transparent'; }}
                      onClick={() => { if (!ind.todo) onToggleIndicator(ind.id); }}
                    >
                      <span style={{ width: '14px', fontSize: '11px', color: isOn ? RED : muted, fontWeight: 700 }}>
                        {isOn ? '✓' : ''}
                      </span>
                      <span style={{ flex: 1 }}>{ind.label}</span>
                      {ind.todo && <span style={{ fontSize: '9px', background: muted + '33', color: muted, padding: '1px 5px', borderRadius: '3px' }}>Soon</span>}
                    </button>
                  );
                })}
                {gi < INDICATOR_GROUPS.length - 1 && (
                  <div style={{ margin: '4px 12px', borderTop: `1px solid ${border}` }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <button style={btnStyle(openMenu === 'search')} onClick={() => toggleMenu('search')}>
          🔍
        </button>
        {openMenu === 'search' && (
          <div style={{ ...dropdownStyle, left: 'auto', right: 0 }}>
            <div style={{ padding: '6px 10px' }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tools & indicators..."
                style={{
                  width: '100%', padding: '6px 10px', background: isDark ? '#0f1117' : '#f5f5f3',
                  border: `1px solid ${border}`, borderRadius: '6px', color: text,
                  fontSize: '12px', outline: 'none',
                }}
              />
            </div>
            {q && !hasSearchResults && (
              <div style={{ padding: '8px 14px', color: muted, fontSize: '12px' }}>No results</div>
            )}
            {searchTools.length > 0 && (
              <>
                <div style={{ padding: '4px 12px 2px', fontSize: '10px', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Drawing Tools</div>
                {searchTools.map(tool => (
                  <button key={tool.id}
                    style={{ width: '100%', textAlign: 'left', padding: '7px 12px', border: 'none', cursor: 'pointer', background: 'transparent', color: text, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => { if (!tool.todo) { onSelectTool(tool.id); setOpenMenu(null); setSearchQuery(''); } }}
                  >
                    <span>{tool.icon}</span><span>{tool.label}</span>
                    {tool.todo && <span style={{ fontSize: '9px', color: muted }}>Soon</span>}
                  </button>
                ))}
              </>
            )}
            {searchInds.length > 0 && (
              <>
                <div style={{ padding: '4px 12px 2px', fontSize: '10px', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Indicators</div>
                {searchInds.map(ind => (
                  <button key={ind.id}
                    style={{ width: '100%', textAlign: 'left', padding: '7px 12px', border: 'none', cursor: 'pointer', background: activeIndicators.has(ind.id) ? RED + '11' : 'transparent', color: text, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
                    onMouseLeave={e => { e.currentTarget.style.background = activeIndicators.has(ind.id) ? RED + '11' : 'transparent'; }}
                    onClick={() => { if (!ind.todo) { onToggleIndicator(ind.id); } }}
                  >
                    <span style={{ width: '14px', color: activeIndicators.has(ind.id) ? RED : muted, fontWeight: 700, fontSize: '11px' }}>{activeIndicators.has(ind.id) ? '✓' : ''}</span>
                    <span>{ind.label}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────────── */}
      <div style={{ width: 1, height: 20, background: border, margin: '0 4px' }} />

      {/* ── Pinned icons ─────────────────────────────────────────────────────── */}
      <button
        title="Clear all drawings"
        style={iconBtnStyle()}
        onClick={onClearDrawings}
      >🗑</button>

      <button
        title="Undo last drawing (Ctrl+Z)"
        style={iconBtnStyle()}
        disabled={!canUndo}
        onClick={onUndo}
      >↩</button>

      {/* Hint text when tool needs 2 clicks */}
      {activeTool && (activeToolDef?.hint) && (
        <span style={{ fontSize: '11px', color: muted, paddingLeft: '6px', fontStyle: 'italic' }}>
          {(activeTool === 'trendline' || activeTool === 'extended_line' || activeTool === 'fib') && pendingPoint
            ? 'Click 2nd point'
            : activeToolDef.hint}
        </span>
      )}
    </div>
  );
}
