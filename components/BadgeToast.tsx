'use client';

import { useEffect, useState } from 'react';

export type ToastBadge = { id: string; emoji: string; name: string; bonus?: number };

function BadgeToastItem({
  badge,
  onDone,
}: {
  badge: ToastBadge;
  onDone: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const show = setTimeout(() => setVisible(true), 50);
    // Animate out
    const hide = setTimeout(() => setVisible(false), 3000);
    // Remove
    const remove = setTimeout(() => onDone(badge.id), 3400);
    return () => { clearTimeout(show); clearTimeout(hide); clearTimeout(remove); };
  }, [badge.id, onDone]);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-none"
      style={{
        background: '#1a1d27',
        border: '1px solid rgba(232,49,58,0.3)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-16px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <span className="text-2xl">{badge.emoji}</span>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#E8313A' }}>
          Badge Unlocked!
        </p>
        <p className="text-sm font-semibold text-white">{badge.name}</p>
        {badge.bonus && <p className="text-xs font-bold" style={{ color: '#10b981' }}>+{badge.bonus} bonus sims!</p>}
      </div>
    </div>
  );
}

export default function BadgeToast({
  queue,
  onDismiss,
}: {
  queue: ToastBadge[];
  onDismiss: (id: string) => void;
}) {
  if (queue.length === 0) return null;
  return (
    <div className="fixed bottom-20 left-4 z-50 space-y-2">
      {queue.map((b) => (
        <BadgeToastItem key={b.id + b.name} badge={b} onDone={onDismiss} />
      ))}
    </div>
  );
}
