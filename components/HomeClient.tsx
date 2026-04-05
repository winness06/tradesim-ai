'use client';

import { useAuth, UserButton } from '@clerk/nextjs';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CandlestickData, Time } from 'lightweight-charts';
import { generateOneMinCandles, generateOneMinCandlesWithBias, aggregateCandles } from '@/lib/generateCandles';
import { evaluateTrade, TradeEvalResult } from '@/lib/evaluateTrade';
import { useSearchParams } from 'next/navigation';
import CandleChartWrapper from '@/components/CandleChartWrapper';
import { useTheme } from '@/context/ThemeContext';
import ThemeSelectionModal from '@/components/ThemeSelectionModal';
import BadgeToast, { ToastBadge } from '@/components/BadgeToast';
import ShareTradeCard from '@/components/ShareTradeCard';
import { Drawing, DrawTool } from '@/types/drawings';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'simulator' | 'coach' | 'progress' | 'journal' | 'referrals' | 'missions' | 'achievements';

interface BadgeMeta {
  totalSims: number;
  consecutiveTP1: number;
  lastResult: string;
  totalStopLossSet: number;
  reasoningTradesCount: number;
}

interface TradeRecord {
  id: string;
  date: string;
  timeframe: string;
  entry: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
  result: string;
  score: number;
  pnl: number | null;
  feedbackSummary: string;
  reasoning: string;
  direction?: string;
  orderType?: string;
  holdCount?: number;
  closedEarly?: boolean;
  mode?: string;
}

interface ChallengeSave {
  weekKey: string;
  challengeIndex: number;
  progress: number;
  completed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const RED = '#E8313A';
const RED_DARK = '#c92a32';

const TABS: { id: Tab; label: string }[] = [
  { id: 'simulator',    label: 'Simulator' },
  { id: 'coach',        label: 'AI Coach' },
  { id: 'progress',     label: 'Progress' },
  { id: 'journal',      label: 'Journal' },
  { id: 'referrals',    label: 'Referrals' },
  { id: 'missions',     label: 'Missions 🔒' },
  { id: 'achievements', label: 'Achievements' },
];

const DAILY_GOAL = 3;

const INITIAL_CANDLE_COUNT: Record<string, number> = {
  '1m': 300,   // 300 one-minute candles
  '5m': 750,   // 150 five-minute candles * 5
  '15m': 1200, // 80 fifteen-minute candles * 15
  '1h': 2400,  // 40 hourly candles * 60
  '4h': 5760,  // 24 four-hour candles * 240
  '1d': 43200, // 30 daily candles * 1440
};

// 1-minute candle counts for sim (aggregated for display, ~6-15 visible candles per TF)
const SIM_CANDLE_COUNT: Record<string, number> = {
  '1m': 15, '5m': 60, '15m': 150, '1h': 480, '4h': 1440, '1d': 7200,
};

const MINUTES_PER_TF: Record<string, number> = {
  '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1d': 1440,
};

const REWARD_TIERS = [
  { count: 5,  reward: '$5 Bonus' },
  { count: 10, reward: '15 Free Sims' },
  { count: 20, reward: '$25 Bonus' },
  { count: 50, reward: 'Entry to $1000 Leaderboard' },
];

const ALL_BADGES = [
  { id: 'first_trade',    emoji: '🎯', name: 'First Trade',      desc: 'Complete your first simulation' },
  { id: 'hat_trick',      emoji: '🎩', name: 'Hat Trick',        desc: 'Complete 3 sims in one day' },
  { id: 'streak_starter', emoji: '🔥', name: 'Streak Starter',   desc: 'Reach a 3-day streak' },
  { id: 'week_warrior',   emoji: '⚔️', name: 'Week Warrior',     desc: 'Reach a 7-day streak' },
  { id: 'sharpshooter',   emoji: '🏹', name: 'Sharpshooter',     desc: 'Hit TP1 on 3 consecutive trades' },
  { id: 'risk_manager',   emoji: '🛡️', name: 'Risk Manager',     desc: 'Set a stop loss on 10 trades' },
  { id: 'tp3_hunter',     emoji: '💎', name: 'TP3 Hunter',       desc: 'Hit Take Profit 3 on any trade' },
  { id: 'high_scorer',    emoji: '⭐', name: 'High Scorer',      desc: 'Score 90 or above on a trade' },
  { id: 'comeback_kid',   emoji: '💪', name: 'Comeback Kid',     desc: 'Profit after being stopped out' },
  { id: 'scholar',        emoji: '📚', name: 'Scholar',          desc: 'Write trade notes on 5 trades' },
  { id: 'weekly_champ',   emoji: '🏆', name: 'Weekly Champion',  desc: 'Complete a weekly challenge' },
];

const BADGE_REWARDS: Record<string, number> = {
  first_trade: 2, hat_trick: 3, streak_starter: 5, week_warrior: 10,
  sharpshooter: 5, risk_manager: 5, tp3_hunter: 8, high_scorer: 10,
  comeback_kid: 3, scholar: 5, weekly_champ: 15,
};

const WEEKLY_CHALLENGES = [
  { text: 'Hit TP1 or higher on 3 trades this week',                     goal: 3,  type: 'tp1_hit' },
  { text: 'Complete 5 simulations with a stop loss set',                  goal: 5,  type: 'sim_with_sl' },
  { text: 'Write reasoning notes on 5 different trades',                  goal: 5,  type: 'reasoning' },
  { text: 'Achieve a score of 70+ on 3 different trades',                 goal: 3,  type: 'score_70' },
  { text: 'Complete at least 1 simulation per day for 5 days',            goal: 5,  type: 'daily_streak' },
  { text: 'Hit TP2 or higher on 2 different trades',                      goal: 2,  type: 'tp2_hit' },
  { text: 'Use the 15m timeframe or higher for 5 trades',                 goal: 5,  type: 'high_tf' },
  { text: 'Build a 5-day trading streak',                                 goal: 5,  type: 'streak_5' },
  { text: 'Unlock any 2 badges this week',                                goal: 2,  type: 'badges_2' },
  { text: 'Score above 80 on any single trade',                           goal: 1,  type: 'score_80' },
  { text: 'Complete 10 simulations this week',                            goal: 10, type: 'total_sims' },
  { text: 'Hit Take Profit on 4 consecutive trades',                      goal: 4,  type: 'tp_consec' },
  { text: 'Write detailed reasoning (50+ chars) on 3 trades',             goal: 3,  type: 'detailed_notes' },
  { text: 'Complete 3 trades on the 1h timeframe or above',               goal: 3,  type: 'tf_1h_plus' },
  { text: 'Score 80+ on 2 separate trades',                               goal: 2,  type: 'score_80_x2' },
  { text: 'Complete 7 simulations this week',                             goal: 7,  type: 'sims_7' },
  { text: 'Set a stop loss on 5 different trades',                        goal: 5,  type: 'sl_5' },
  { text: 'Hit TP1 or higher on 5 out of your next 7 trades',             goal: 5,  type: 'tp1_5of7' },
  { text: 'Score 95 or above on any trade',                               goal: 1,  type: 'score_95' },
  { text: 'Complete 3 trades on the daily (1d) timeframe',                goal: 3,  type: 'daily_tf' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────
function getWeekKey(): string {
  const d = new Date();
  const dow = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  const jan1 = new Date(mon.getFullYear(), 0, 1);
  const week = Math.ceil(((mon.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${mon.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getChallengeIndex(weekKey: string): number {
  const m = weekKey.match(/W(\d+)$/);
  return m ? (parseInt(m[1]) - 1) % 20 : 0;
}

function getRank(score: number | null): string {
  if (score === null) return '';
  if (score < 40) return 'Rookie';
  if (score < 60) return 'Intermediate';
  if (score < 80) return 'Pro';
  if (score < 95) return 'Elite';
  return 'Master';
}

function getRankColor(score: number | null): string {
  if (score === null) return '#9ca3af';
  if (score < 40) return '#9ca3af';
  if (score < 60) return '#10b981';
  if (score < 80) return '#60a5fa';
  if (score < 95) return '#f59e0b';
  return '#E8313A';
}

function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Start your streak today!';
  if (streak < 3)   return 'Good start! Keep it going.';
  if (streak < 7)   return "You're building a habit 🔥";
  if (streak < 14)  return 'One week strong! 💪';
  if (streak < 30)  return 'Two weeks! Incredible consistency.';
  return 'Elite discipline 👑';
}

function checkBadges(p: {
  score: number; result: string; slSet: boolean; hasReasoning: boolean;
  newDailySims: number; newStreak: number;
  meta: BadgeMeta; unlocked: Record<string, string>;
}): { newUnlocked: Record<string, string>; newMeta: BadgeMeta; awarded: string[] } {
  const now = new Date().toISOString().slice(0, 10);
  const r = p.result.toLowerCase();
  const newMeta: BadgeMeta = {
    totalSims: p.meta.totalSims + 1,
    consecutiveTP1: r.includes('take profit 1') ? p.meta.consecutiveTP1 + 1 : 0,
    lastResult: p.result,
    totalStopLossSet: p.meta.totalStopLossSet + (p.slSet ? 1 : 0),
    reasoningTradesCount: p.meta.reasoningTradesCount + (p.hasReasoning ? 1 : 0),
  };
  const newUnlocked = { ...p.unlocked };
  const awarded: string[] = [];
  const award = (id: string) => { if (!newUnlocked[id]) { newUnlocked[id] = now; awarded.push(id); } };

  if (p.meta.totalSims === 0) award('first_trade');
  if (p.newDailySims >= 3) award('hat_trick');
  if (p.newStreak >= 3) award('streak_starter');
  if (p.newStreak >= 7) award('week_warrior');
  if (newMeta.consecutiveTP1 >= 3) award('sharpshooter');
  if (newMeta.totalStopLossSet >= 10) award('risk_manager');
  if (r.includes('take profit 3')) award('tp3_hunter');
  if (p.score >= 90) award('high_scorer');
  if (p.meta.lastResult.toLowerCase().includes('stopped') && r.includes('take profit')) award('comeback_kid');
  if (newMeta.reasoningTradesCount >= 5) award('scholar');

  return { newUnlocked, newMeta, awarded };
}

function computeChallenge(
  current: ChallengeSave | null,
  sim: { result: string; score: number; slSet: boolean; hasReasoning: boolean; timeframe: string; newStreak: number; newBadgesCount: number; reasoningLen: number }
): { newSave: ChallengeSave; justCompleted: boolean } {
  const weekKey = getWeekKey();
  const challengeIndex = getChallengeIndex(weekKey);
  const ch = WEEKLY_CHALLENGES[challengeIndex];
  const base: ChallengeSave = (current?.weekKey === weekKey)
    ? current
    : { weekKey, challengeIndex, progress: 0, completed: false };

  if (base.completed) return { newSave: base, justCompleted: false };

  const r = sim.result.toLowerCase();
  let delta = 0;
  switch (ch.type) {
    case 'tp1_hit':       delta = r.includes('take profit') ? 1 : 0; break;
    case 'sim_with_sl':   delta = sim.slSet ? 1 : 0; break;
    case 'reasoning':     delta = sim.hasReasoning ? 1 : 0; break;
    case 'score_70':      delta = sim.score >= 70 ? 1 : 0; break;
    case 'daily_streak':  delta = Math.max(0, sim.newStreak - base.progress); break;
    case 'tp2_hit':       delta = (r.includes('take profit 2') || r.includes('take profit 3')) ? 1 : 0; break;
    case 'high_tf':       delta = ['15m','1h','4h','1d'].includes(sim.timeframe) ? 1 : 0; break;
    case 'streak_5':      delta = Math.max(0, sim.newStreak - base.progress); break;
    case 'badges_2':      delta = sim.newBadgesCount; break;
    case 'score_80':      delta = sim.score >= 80 ? 1 : 0; break;
    case 'total_sims':    delta = 1; break;
    case 'tp_consec':     delta = r.includes('take profit') ? 1 : 0; break;
    case 'detailed_notes': delta = sim.reasoningLen >= 50 ? 1 : 0; break;
    case 'tf_1h_plus':    delta = ['1h','4h','1d'].includes(sim.timeframe) ? 1 : 0; break;
    case 'score_80_x2':   delta = sim.score >= 80 ? 1 : 0; break;
    case 'sims_7':        delta = 1; break;
    case 'sl_5':          delta = sim.slSet ? 1 : 0; break;
    case 'tp1_5of7':      delta = r.includes('take profit') ? 1 : 0; break;
    case 'score_95':      delta = sim.score >= 95 ? 1 : 0; break;
    case 'daily_tf':      delta = sim.timeframe === '1d' ? 1 : 0; break;
  }

  const newProgress = Math.min(base.progress + delta, ch.goal);
  const justCompleted = newProgress >= ch.goal;
  return {
    newSave: { ...base, progress: newProgress, completed: justCompleted },
    justCompleted,
  };
}

const DEFAULT_META: BadgeMeta = {
  totalSims: 0, consecutiveTP1: 0, lastResult: '',
  totalStopLossSet: 0, reasoningTradesCount: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeClient() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const { c, theme, toggleTheme, themeLoaded } = useTheme();

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>('simulator');

  // Trade inputs
  const [entryPrice, setEntryPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [takeProfit2, setTakeProfit2] = useState('');
  const [takeProfit3, setTakeProfit3] = useState('');
  const [showTp2, setShowTp2] = useState(false);
  const [showTp3, setShowTp3] = useState(false);
  const [stopLoss, setStopLoss] = useState('');
  const [userReasoning, setUserReasoning] = useState('');

  // Results
  const [feedback, setFeedback] = useState('');
  const [tradeScore, setTradeScore] = useState<number | null>(null);
  const [tradeResult, setTradeResult] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Chart
  const [timeframe, setTimeframe] = useState('5m');
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(new Set());
  const toggleIndicator = (id: string) => setActiveIndicators(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const [allCandles, setAllCandles] = useState<CandlestickData<Time>[]>([]);
  const [candles, setCandles] = useState<CandlestickData<Time>[]>([]);

  // Account
  const [tokens, setTokens] = useState(0);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Progress
  const [dailySims, setDailySims] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakSavedToday, setStreakSavedToday] = useState(false);

  // Badges
  const [badgesUnlocked, setBadgesUnlocked] = useState<Record<string, string>>({});
  const [badgeMeta, setBadgeMeta] = useState<BadgeMeta>(DEFAULT_META);
  const [toastQueue, setToastQueue] = useState<ToastBadge[]>([]);

  // Trade history / journal
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);

  // Weekly challenge
  const [challengeSave, setChallengeSave] = useState<ChallengeSave | null>(null);

  // Referrals
  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [copied, setCopied] = useState(false);

  // Missions
  const [missionsEmail, setMissionsEmail] = useState('');
  const [missionsEmailSaved, setMissionsEmailSaved] = useState(false);

  // Theme modal
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Achievements
  const [simAchievementsOpen, setSimAchievementsOpen] = useState(true);
  const [paperAchievementsOpen, setPaperAchievementsOpen] = useState(false);

  // Order type
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');

  // Sim phase & extension flow
  type SimPhase = 'idle' | 'animating' | 'auto-extending' | 'awaiting-decision' | 'complete';
  const [simPhase, setSimPhase] = useState<SimPhase>('idle');
  const [extensionCount, setExtensionCount] = useState(0);
  const [tpHitStatus, setTpHitStatus] = useState<{ tp1: boolean; tp2: boolean; tp3: boolean }>({ tp1: false, tp2: false, tp3: false });
  const [currentTradeEntry, setCurrentTradeEntry] = useState<number | null>(null);
  const [coachNotification, setCoachNotification] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const MAX_EXTENSIONS = 4;

  // Captured trade context — set at sim start, used by all extension handlers
  const tradeContextRef = useRef<{
    entry: number;
    tp: number | null;
    tp2: number | null;
    tp3: number | null;
    sl: number | null;
    direction: 'long' | 'short' | 'unknown';
    reasoning: string;
  } | null>(null);

  // Drawing tools
  const [activeTool, setActiveTool] = useState<DrawTool | null>(null);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [prevDrawings, setPrevDrawings] = useState<Drawing[] | null>(null);

  // Chat / AI Coach
  interface ChatMessage { role: 'user' | 'assistant'; content: string }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [currentTradeContext, setCurrentTradeContext] = useState<Record<string, unknown> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [userPlan, setUserPlan] = useState('free');

  const PLAN_FOLLOWUP_LIMITS: Record<string, number> = { free: 2, starter: 5, pro: 15, elite: 30 };
  const FOLLOWUP_LIMIT = PLAN_FOLLOWUP_LIMITS[userPlan] ?? 2;

  const params = useSearchParams();

  // Upgrade success banner
  useEffect(() => {
    if (params.get('upgrade_success') === 'true') {
      setShowBanner(true);
      const t = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [params]);

  // Mount initialisation
  useEffect(() => {
    const masterData = generateOneMinCandles(INITIAL_CANDLE_COUNT['5m']);
    setAllCandles(masterData);
    setCandles(aggregateCandles(masterData, '5m'));

    fetchTokens();
    fetchReferralData();
    initLocalStorage();
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/get-tokens');
      const data = await res.json();
      if (data.error) { setTokens(3); return; }
      setTokens(data.tokens);
      setSubscriptionActive(data.subscriptionActive);
      if (data.plan) setUserPlan(data.plan);
    } catch (err) { console.error(err); setTokens(3); }
  };

  const fetchReferralData = async () => {
    try {
      const res = await fetch('/api/get-referral-link');
      const data = await res.json();
      if (data.referralLink) setReferralLink(data.referralLink);
      if (typeof data.referralCount === 'number') setReferralCount(data.referralCount);
      if (typeof data.referralEarnings === 'string') setReferralEarnings(parseFloat(data.referralEarnings));
    } catch (err) { console.error(err); }
  };

  const initLocalStorage = () => {
    const today = new Date().toISOString().slice(0, 10);

    // Theme modal
    if (!localStorage.getItem('chartchamp_theme')) setShowThemeModal(true);

    // Daily sims
    const storedDate = localStorage.getItem('dailySimDate');
    const storedCount = localStorage.getItem('dailySims');
    if (storedDate === today && storedCount) setDailySims(parseInt(storedCount));
    else { localStorage.setItem('dailySimDate', today); localStorage.setItem('dailySims', '0'); }

    // Streak
    const lastSim = localStorage.getItem('lastSimDate');
    const storedStreak = parseInt(localStorage.getItem('currentStreak') || '0');
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (lastSim === today || lastSim === yesterday) {
      setStreak(storedStreak);
      if (lastSim === today) setStreakSavedToday(true);
    } else {
      setStreak(0);
      localStorage.setItem('currentStreak', '0');
    }

    // Badges
    try {
      const rawUnlocked = localStorage.getItem('chartchamp_badges_unlocked');
      const rawMeta = localStorage.getItem('chartchamp_badge_meta');
      if (rawUnlocked) setBadgesUnlocked(JSON.parse(rawUnlocked));
      if (rawMeta) setBadgeMeta({ ...DEFAULT_META, ...JSON.parse(rawMeta) });
    } catch {}

    // Trade history
    try {
      const raw = localStorage.getItem('chartchamp_history');
      if (raw) setTradeHistory(JSON.parse(raw));
    } catch {}

    // Weekly challenge
    try {
      const raw = localStorage.getItem('chartchamp_challenge');
      if (raw) setChallengeSave(JSON.parse(raw));
    } catch {}

    // Missions email
    const email = localStorage.getItem('chartchamp_missions_email');
    if (email) { setMissionsEmail(email); setMissionsEmailSaved(true); }
  };

  // ── Chart ──────────────────────────────────────────────────────────────────
  const applyTimeframe = useCallback((all: CandlestickData<Time>[], tf: string) => {
    setCandles(aggregateCandles(all, tf));
  }, []);

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    // Regenerate master data pool sized for this timeframe
    const masterData = generateOneMinCandles(INITIAL_CANDLE_COUNT[tf] || 1800);
    setAllCandles(masterData);
    setCandles(aggregateCandles(masterData, tf));
  };

  const handleRefreshChart = () => {
    const refreshed = generateOneMinCandles(INITIAL_CANDLE_COUNT[timeframe] || 1800);
    setAllCandles(refreshed);
    setCandles(aggregateCandles(refreshed, timeframe));
    setDrawings([]);
    setPrevDrawings(null);
    setActiveTool(null);
    setSimPhase('idle');
  };

  const handleSelectTool = (tool: DrawTool | null) => {
    if (tool === 'clear') { setDrawings([]); setPrevDrawings(null); setActiveTool(null); return; }
    setActiveTool(prev => prev === tool ? null : tool);
  };

  const handleAddDrawing = (d: Drawing) => {
    setPrevDrawings(drawings);
    setDrawings(prev => [...prev, d]);
  };

  const handleRemoveDrawing = (id: string) => {
    setPrevDrawings(drawings);
    setDrawings(prev => prev.filter(x => x.id !== id));
  };

  const handleUndo = () => {
    if (prevDrawings !== null) { setDrawings(prevDrawings); setPrevDrawings(null); }
  };

  const handleClearDrawings = () => { setPrevDrawings(drawings); setDrawings([]); };

  const handleTpChange = (tp1: number | null, tp2: number | null, tp3: number | null) => {
    setTakeProfit(tp1 != null ? String(tp1) : '');
    setTakeProfit2(tp2 != null ? String(tp2) : '');
    setTakeProfit3(tp3 != null ? String(tp3) : '');
  };

  const handleSlChange = (sl: number | null) => {
    setStopLoss(sl != null ? String(sl) : '');
  };

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  // ── Trade actions ──────────────────────────────────────────────────────────
  const handleNextCandle = () => {
    if (tokens <= 0 && !subscriptionActive) { setFeedback('Out of free simulations. Please upgrade.'); return; }
    const minsNeeded = MINUTES_PER_TF[timeframe] || 5;
    const newMinCandles = generateOneMinCandles(minsNeeded, allCandles[allCandles.length - 1]);
    const updated = [...allCandles, ...newMinCandles];
    setAllCandles(updated);
    applyTimeframe(updated, timeframe);
  };

  // ── runSimBatch: generate + animate one batch of candles, return eval ────────
  const runSimBatch = async (
    currentAllCandles: CandlestickData<Time>[],
    simCandleCount: number,
    direction: 'long' | 'short' | 'unknown',
    entry: number,
    tp: number | null,
    tp2: number | null,
    tp3: number | null,
    sl: number | null,
    prevHits: { tp1: boolean; tp2: boolean; tp3: boolean } = { tp1: false, tp2: false, tp3: false },
  ): Promise<TradeEvalResult & { outcomeReached: boolean; updatedCandles: CandlestickData<Time>[]; accumulated: { tp1: boolean; tp2: boolean; tp3: boolean } }> => {
    const newCandles = generateOneMinCandlesWithBias(simCandleCount, currentAllCandles[currentAllCandles.length - 1], direction);
    const updated = [...currentAllCandles, ...newCandles];

    // Animate per timeframe candle (max 12 visible steps)
    const groupSize = MINUTES_PER_TF[timeframe] || 5;
    const totalTfCandles = Math.floor(newCandles.length / groupSize);
    const animStep = Math.max(1, Math.floor(totalTfCandles / 12));
    for (let tfIdx = animStep; tfIdx <= totalTfCandles; tfIdx += animStep) {
      applyTimeframe(updated.slice(0, currentAllCandles.length + tfIdx * groupSize), timeframe);
      await sleep(200);
    }
    applyTimeframe(updated, timeframe);

    const evalResult = evaluateTrade(
      aggregateCandles(newCandles, timeframe),
      entry, tp, sl, tp2, tp3, orderType
    );

    // Accumulate TP hits across batches
    const accumulated = {
      tp1: prevHits.tp1 || evalResult.tp1Hit,
      tp2: prevHits.tp2 || evalResult.tp2Hit,
      tp3: prevHits.tp3 || evalResult.tp3Hit,
    };

    // Trade is done if SL hit OR all set TPs are now accumulated-hit
    const allSetTpsHit =
      (!tp || accumulated.tp1) &&
      (!tp2 || accumulated.tp2) &&
      (!tp3 || accumulated.tp3);
    const anyHit = accumulated.tp1 || accumulated.tp2 || accumulated.tp3;
    const outcomeReached = evalResult.slHit || (anyHit && allSetTpsHit) || evalResult.outcome === 'not-triggered';

    return { ...evalResult, outcomeReached, updatedCandles: updated, accumulated };
  };

  // ── callAICoach: fires AI, saves journal entry, updates streaks/badges ───────
  const callAICoach = async (payload: Record<string, unknown>) => {
    setCoachLoading(true);
    setCoachNotification(false);
    const result = String(payload.result || '');
    const score = Number(payload.score || 0);
    const direction = String(payload.direction || 'unknown');
    const sl = payload.stopLoss as number | null;
    const tp = payload.takeProfit as number | null;
    const holdCount = Number(payload.holdCount || 0);
    const closedEarly = Boolean(payload.closedEarly);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const feedback = data.feedback || 'No feedback received.';
      setCoachFeedback(feedback);
      setChatMessages([{ role: 'assistant', content: feedback }]);
      setFollowUpCount(0);
      setCurrentTradeContext({
        entry: payload.entry,
        tp1: tp,
        sl,
        result, score, timeframe,
        reasoning: userReasoning,
        direction, orderType,
      });
      setTokens(data.tokensRemaining ?? tokens);
      setSubscriptionActive(data.subscriptionActive ?? subscriptionActive);
      setTradeScore(score);
      setTradeResult(result);

      // ── daily sims ──
      const newDailySims = dailySims + 1;
      setDailySims(newDailySims);
      localStorage.setItem('dailySims', newDailySims.toString());

      // ── streak ──
      const today = new Date().toISOString().slice(0, 10);
      const lastSim = localStorage.getItem('lastSimDate');
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = lastSim === today ? streak : lastSim === yesterday ? streak + 1 : 1;
      setStreak(newStreak);
      setStreakSavedToday(true);
      localStorage.setItem('lastSimDate', today);
      localStorage.setItem('currentStreak', String(newStreak));

      // ── badges ──
      const slSet = sl !== null && sl !== undefined;
      const hasReasoning = userReasoning.trim().length > 0;
      const rawUnlocked = localStorage.getItem('chartchamp_badges_unlocked');
      const rawMeta = localStorage.getItem('chartchamp_badge_meta');
      const currentUnlocked: Record<string, string> = rawUnlocked ? JSON.parse(rawUnlocked) : {};
      const currentBadgeMeta: BadgeMeta = rawMeta ? { ...DEFAULT_META, ...JSON.parse(rawMeta) } : DEFAULT_META;
      const { newUnlocked, newMeta, awarded } = checkBadges({
        score, result, slSet, hasReasoning,
        newDailySims, newStreak,
        meta: currentBadgeMeta, unlocked: currentUnlocked,
      });
      localStorage.setItem('chartchamp_badges_unlocked', JSON.stringify(newUnlocked));
      localStorage.setItem('chartchamp_badge_meta', JSON.stringify(newMeta));
      setBadgesUnlocked(newUnlocked);
      setBadgeMeta(newMeta);

      // ── weekly challenge ──
      const rawChallenge = localStorage.getItem('chartchamp_challenge');
      const currentChallenge: ChallengeSave | null = rawChallenge ? JSON.parse(rawChallenge) : null;
      const { newSave, justCompleted } = computeChallenge(currentChallenge, {
        result, score, slSet, hasReasoning, timeframe, newStreak,
        newBadgesCount: awarded.length,
        reasoningLen: userReasoning.trim().length,
      });
      localStorage.setItem('chartchamp_challenge', JSON.stringify(newSave));
      setChallengeSave(newSave);

      // ── badge toasts ──
      const finalUnlocked = { ...newUnlocked };
      const toasts: ToastBadge[] = [];
      if (justCompleted && !finalUnlocked['weekly_champ']) {
        finalUnlocked['weekly_champ'] = today;
        localStorage.setItem('chartchamp_badges_unlocked', JSON.stringify(finalUnlocked));
        setBadgesUnlocked(finalUnlocked);
        const wb = ALL_BADGES.find(b => b.id === 'weekly_champ')!;
        toasts.push({ id: wb.id + Date.now(), emoji: wb.emoji, name: wb.name, bonus: BADGE_REWARDS['weekly_champ'] });
      }
      let bonusSims = 0;
      awarded.forEach(id => {
        const b = ALL_BADGES.find(x => x.id === id);
        const bonus = BADGE_REWARDS[id] ?? 0;
        bonusSims += bonus;
        if (b) toasts.push({ id: b.id + Date.now(), emoji: b.emoji, name: b.name, bonus: bonus > 0 ? bonus : undefined });
      });
      if (bonusSims > 0) setTokens(prev => prev + bonusSims);
      if (toasts.length) setToastQueue(q => [...q, ...toasts]);

      // ── save to journal ──
      const newTrade: TradeRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        timeframe,
        entry: currentTradeEntry,
        takeProfit: tp,
        stopLoss: sl,
        result, score,
        pnl: null,
        feedbackSummary: feedback.slice(0, 120),
        reasoning: userReasoning,
        direction, orderType,
        holdCount, closedEarly,
        mode: 'sim',
      };
      const newHistory = [newTrade, ...tradeHistory].slice(0, 100);
      localStorage.setItem('chartchamp_history', JSON.stringify(newHistory));
      setTradeHistory(newHistory);

    } catch {
      setCoachFeedback('⚠️ Coach unavailable. Please try again.');
      setChatMessages([{ role: 'assistant', content: '⚠️ Coach unavailable. Please try again.' }]);
    } finally {
      setCoachLoading(false);
      setCoachNotification(true);
    }
  };

  // ── Clear inputs when trade fully closes ─────────────────────────────────────
  useEffect(() => {
    if (simPhase === 'complete') {
      setEntryPrice('');
      setTakeProfit('');
      setTakeProfit2('');
      setTakeProfit3('');
      setShowTp2(false);
      setShowTp3(false);
      setStopLoss('');
      setUserReasoning('');
      setTpHitStatus({ tp1: false, tp2: false, tp3: false });
      tradeContextRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simPhase]);

  // ── handleSimulate ────────────────────────────────────────────────────────────
  const handleSimulate = async () => {
    if (tokens <= 0 && !subscriptionActive) {
      setFeedback('Out of free simulations. Please upgrade to continue.');
      return;
    }

    const lastClose = allCandles.length > 0 ? allCandles[allCandles.length - 1].close : NaN;
    const rawEntry = orderType === 'market' ? lastClose : parseFloat(entryPrice);
    const entry = isNaN(rawEntry) ? null : rawEntry;
    if (entry === null) { setFeedback('No entry price set.'); return; }

    const tp  = parseFloat(takeProfit) || null;
    const tp2 = parseFloat(takeProfit2) || null;
    const tp3 = parseFloat(takeProfit3) || null;
    const sl  = parseFloat(stopLoss) || null;

    const direction: 'long' | 'short' | 'unknown' =
      tp !== null ? (tp > entry ? 'long' : 'short') :
      sl !== null ? (sl < entry ? 'long' : 'short') : 'unknown';

    // Capture trade context so extension handlers don't re-parse cleared state
    tradeContextRef.current = { entry, tp, tp2, tp3, sl, direction, reasoning: userReasoning };

    setCurrentTradeEntry(entry);
    setSimPhase('animating');
    setIsSimulating(true);
    setExtensionCount(0);
    setCoachNotification(false);
    setFeedback('');

    const simCount = SIM_CANDLE_COUNT[timeframe] || 60;
    const noHits = { tp1: false, tp2: false, tp3: false };

    // First batch
    let batch = await runSimBatch(allCandles, simCount, direction, entry, tp, tp2, tp3, sl, noHits);
    setAllCandles(batch.updatedCandles);
    let accumulated = batch.accumulated;

    // Auto-extend once if no outcome
    if (!batch.outcomeReached) {
      setSimPhase('auto-extending');
      batch = await runSimBatch(batch.updatedCandles, simCount, direction, entry, tp, tp2, tp3, sl, accumulated);
      accumulated = batch.accumulated;
      setAllCandles(batch.updatedCandles);
      setExtensionCount(1);
    }

    setTpHitStatus(accumulated);

    if (!batch.outcomeReached) {
      // Show hold/close decision
      setSimPhase('awaiting-decision');
      setIsSimulating(false);
      const openMsg = accumulated.tp1
        ? `TP1 hit — trade running, waiting for remaining targets`
        : 'Trade still open — no level hit yet';
      callAICoach({ entry, takeProfit: tp, takeProfit2: tp2, takeProfit3: tp3, stopLoss: sl,
        direction, orderType, result: openMsg, score: batch.score,
        userReasoning, tp1Hit: accumulated.tp1, tp2Hit: accumulated.tp2, tp3Hit: accumulated.tp3 });
      return;
    }

    // Outcome reached
    callAICoach({ entry, takeProfit: tp, takeProfit2: tp2, takeProfit3: tp3, stopLoss: sl,
      direction, orderType, result: batch.resultText, score: batch.score,
      userReasoning, tp1Hit: accumulated.tp1, tp2Hit: accumulated.tp2, tp3Hit: accumulated.tp3 });
    setSimPhase('complete');
    setIsSimulating(false);
  };

  // ── handleHoldPosition ────────────────────────────────────────────────────────
  const handleHoldPosition = async () => {
    const ctx = tradeContextRef.current;
    if (!ctx) return;
    const { entry, tp, tp2, tp3, sl, direction, reasoning: tradeReasoning } = ctx;

    if (extensionCount >= MAX_EXTENSIONS) {
      handleForceClose();
      return;
    }

    setSimPhase('animating');
    setIsSimulating(true);
    const simCount = SIM_CANDLE_COUNT[timeframe] || 60;

    const batch = await runSimBatch(allCandles, simCount, direction, entry, tp, tp2, tp3, sl, tpHitStatus);
    setAllCandles(batch.updatedCandles);
    const accumulated = batch.accumulated;
    setTpHitStatus(accumulated);
    const newExtCount = extensionCount + 1;
    setExtensionCount(newExtCount);

    if (batch.outcomeReached || newExtCount >= MAX_EXTENSIONS) {
      const finalResult = batch.outcomeReached
        ? batch.resultText
        : `Force closed at ${batch.updatedCandles[batch.updatedCandles.length - 1].close.toFixed(2)} — maximum hold time reached`;
      const finalScore = batch.outcomeReached ? batch.score : 35;
      callAICoach({ entry, takeProfit: tp, takeProfit2: tp2, takeProfit3: tp3, stopLoss: sl,
        direction, orderType, result: finalResult, score: finalScore,
        userReasoning: tradeReasoning, holdCount: newExtCount,
        tp1Hit: accumulated.tp1, tp2Hit: accumulated.tp2, tp3Hit: accumulated.tp3 });
      setSimPhase('complete');
    } else {
      const openMsg = accumulated.tp1
        ? `TP1 hit — trade running, waiting for remaining targets`
        : 'Trade still open after extension';
      callAICoach({ entry, takeProfit: tp, takeProfit2: tp2, takeProfit3: tp3, stopLoss: sl,
        direction, orderType, result: openMsg, score: batch.score,
        userReasoning: tradeReasoning, holdCount: newExtCount,
        tp1Hit: accumulated.tp1, tp2Hit: accumulated.tp2, tp3Hit: accumulated.tp3 });
      setSimPhase('awaiting-decision');
    }
    setIsSimulating(false);
  };

  // ── handleCloseAtMarket ───────────────────────────────────────────────────────
  const handleCloseAtMarket = () => {
    const ctx = tradeContextRef.current;
    if (!ctx) return;
    const { entry, tp, sl, direction, reasoning: tradeReasoning } = ctx;
    const closePrice = allCandles[allCandles.length - 1].close;
    const isWin = direction === 'long' ? closePrice > entry : closePrice < entry;
    const pnlPct = ((closePrice - entry) / entry * 100 * (direction === 'short' ? -1 : 1)).toFixed(2);
    const result = isWin
      ? `Closed at market for a gain of ${pnlPct}% (exit: ${closePrice.toFixed(2)})`
      : `Closed at market for a loss of ${Math.abs(parseFloat(pnlPct))}% (exit: ${closePrice.toFixed(2)})`;
    callAICoach({ entry, takeProfit: tp, stopLoss: sl, direction, orderType,
      result, score: isWin ? 55 : 30, userReasoning: tradeReasoning, closedEarly: true });
    setSimPhase('complete');
  };

  // ── handleForceClose ──────────────────────────────────────────────────────────
  const handleForceClose = () => {
    const ctx = tradeContextRef.current;
    if (!ctx) return;
    const { entry, tp, direction, reasoning: tradeReasoning } = ctx;
    const closePrice = allCandles[allCandles.length - 1].close;
    const isWin = direction === 'long' ? closePrice > entry : closePrice < entry;
    const pnlPct = ((closePrice - entry) / entry * 100 * (direction === 'short' ? -1 : 1)).toFixed(2);
    const result = `Force closed after maximum extensions — ${isWin ? 'gain' : 'loss'} of ${pnlPct}%`;
    callAICoach({ entry, takeProfit: tp, stopLoss: null, direction, orderType,
      result, score: 30, userReasoning: tradeReasoning, holdCount: MAX_EXTENSIONS });
    setSimPhase('complete');
  };

  const handleCopyReferral = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClearHistory = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    localStorage.removeItem('chartchamp_history');
    setTradeHistory([]);
    setConfirmClear(false);
  };

  // ── Auto-scroll chat ────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // ── Chat send ───────────────────────────────────────────────────────────────
  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    if (!subscriptionActive && followUpCount >= FOLLOWUP_LIMIT) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newHistory);
    setChatLoading(true);
    setFollowUpCount(n => n + 1);

    try {
      const res = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, tradeContext: currentTradeContext }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No response.' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Unable to reach AI coach right now. Please check your connection and try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const progressPercent = Math.min((dailySims / DAILY_GOAL) * 100, 100);
  const nextTier = REWARD_TIERS.find(t => referralCount < t.count);
  const refProgressPct = nextTier ? Math.min((referralCount / nextTier.count) * 100, 100) : 100;
  const canSimulate = tokens > 0 || subscriptionActive;
  const weekKey = getWeekKey();
  const challengeIndex = getChallengeIndex(weekKey);
  const currentChallenge = WEEKLY_CHALLENGES[challengeIndex];
  const challengeProgress = challengeSave?.weekKey === weekKey ? challengeSave.progress : 0;
  const challengeCompleted = challengeSave?.weekKey === weekKey && challengeSave.completed;
  const challengePct = Math.min((challengeProgress / currentChallenge.goal) * 100, 100);

  // ── Auth guards ────────────────────────────────────────────────────────────
  if (!isLoaded || !themeLoaded) {
    return (
      <main style={{ background: '#0f1117' }} className="min-h-screen">
        {/* Nav skeleton */}
        <div style={{ borderBottom: '1px solid #1f2937', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 120, height: 24 }} />
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        </div>
        {/* Tab skeleton */}
        <div style={{ display: 'flex', gap: 8, padding: '16px 24px', borderBottom: '1px solid #1f2937' }}>
          {[80, 70, 90, 60, 80, 100].map((w, i) => (
            <div key={i} className="skeleton" style={{ width: w, height: 32, borderRadius: 8 }} />
          ))}
        </div>
        {/* Content skeleton */}
        <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ width: '100%', height: 400 }} />
          <div style={{ display: 'flex', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ flex: 1, height: 80 }} />
            ))}
          </div>
        </div>
      </main>
    );
  }
  if (!isSignedIn) { router.push('/sign-in'); return null; }

  // ── Shared style helpers ───────────────────────────────────────────────────
  const card = {
    background: c.card,
    border: `1px solid ${c.cardBorder}`,
    borderRadius: '12px',
    padding: '24px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: c.inputBg,
    border: `1px solid ${c.inputBorder}`,
    borderRadius: '8px',
    color: c.text,
    fontSize: '14px',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '10px',
    fontWeight: 700,
    color: c.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '4px',
  };

  const btnRed = {
    background: RED,
    color: 'white',
    fontWeight: 700,
    borderRadius: '10px',
    padding: '11px 20px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.15s',
  };

  const btnOutline = {
    background: 'transparent',
    color: RED,
    fontWeight: 700,
    borderRadius: '10px',
    padding: '10px 20px',
    border: `1px solid ${RED}`,
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.15s',
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="overflow-x-hidden" style={{ background: c.bg, minHeight: '100vh', color: c.text, display: 'flex', flexDirection: 'column' }}>

      {/* Theme selection modal (first visit) */}
      {showThemeModal && <ThemeSelectionModal onSelect={() => setShowThemeModal(false)} />}

      {/* Upgrade banner */}
      {showBanner && (
        <div style={{ background: RED }} className="text-white text-center py-2 text-sm font-medium">
          Upgrade successful! Enjoy unlimited simulations.
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        style={{ background: c.headerBg, borderBottom: `1px solid ${c.tabBorder}` }}
        className="px-6 py-3.5 flex justify-between items-center"
      >
        <span className="text-xl font-black tracking-tight" style={{ color: c.text }}>
          Chart<span style={{ color: RED }}>Champ</span>
        </span>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer"
            style={subscriptionActive
              ? { color: RED, background: RED + '14', borderColor: RED + '33' }
              : { color: c.textMuted, background: c.card, borderColor: c.cardBorder }}
            onClick={() => window.location.href = '/upgrade'}
          >
            {subscriptionActive ? 'Premium' : 'Free Plan'}
          </span>
          <UserButton />
        </div>
      </header>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <nav style={{ background: c.tabBg, borderBottom: `1px solid ${c.tabBorder}` }}>
        <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'coach') setCoachNotification(false);
              }}
              className="px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors"
              style={activeTab === tab.id
                ? { borderColor: RED, color: RED }
                : { borderColor: 'transparent', color: c.textMuted }}
            >
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                {tab.label}
                {tab.id === 'coach' && coachNotification && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: RED,
                    display: 'inline-block', flexShrink: 0,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                )}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">

        {/* ════════ SIMULATOR ════════ */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">

            {/* Chart — always dark */}
            <div style={{ background: '#1a2332', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
              <div className="px-4 pt-3 pb-2 flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-1.5 flex-wrap">
                  {['1m','5m','15m','1h','4h','1d'].map(tf => (
                    <button key={tf} onClick={() => handleTimeframeChange(tf)}
                      style={timeframe === tf
                        ? { background: RED, color: 'white', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer' }
                        : { background: 'rgba(255,255,255,0.1)', color: '#9ca3af', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }
                      }
                    >{tf}</button>
                  ))}
                </div>
                <button onClick={handleRefreshChart}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#9ca3af', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', border: 'none', cursor: 'pointer' }}
                >↺ New Chart</button>
              </div>
              <div className="px-4 pb-4">
                <div className="overflow-hidden h-[280px] sm:h-[400px]">
                <CandleChartWrapper
                  candles={candles}
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                  activeTool={activeTool}
                  drawings={drawings}
                  onSelectTool={handleSelectTool}
                  onAddDrawing={handleAddDrawing}
                  onRemoveDrawing={handleRemoveDrawing}
                  onClearDrawings={handleClearDrawings}
                  onUndo={handleUndo}
                  canUndo={prevDrawings !== null}
                  activeIndicators={activeIndicators}
                  onToggleIndicator={toggleIndicator}
                  isDark={theme === 'dark'}
                  entryPrice={orderType === 'market'
                    ? (allCandles.length > 0 ? allCandles[allCandles.length - 1].close : null)
                    : (() => { const v = parseFloat(entryPrice); return isNaN(v) ? null : v; })()}
                  takeProfit={(() => { const v = parseFloat(takeProfit); return isNaN(v) ? null : v; })()}
                  takeProfit2={(() => { const v = parseFloat(takeProfit2); return isNaN(v) ? null : v; })()}
                  takeProfit3={(() => { const v = parseFloat(takeProfit3); return isNaN(v) ? null : v; })()}
                  stopLoss={(() => { const v = parseFloat(stopLoss); return isNaN(v) ? null : v; })()}
                  tpHitStatus={tpHitStatus}
                  tradeDirection={
                    (() => {
                      const ep = orderType === 'market'
                        ? (allCandles.length > 0 ? allCandles[allCandles.length - 1].close : NaN)
                        : parseFloat(entryPrice);
                      const tp = parseFloat(takeProfit);
                      const sl = parseFloat(stopLoss);
                      if (!isNaN(ep) && !isNaN(tp)) return tp > ep ? 'long' : 'short';
                      if (!isNaN(ep) && !isNaN(sl)) return sl < ep ? 'long' : 'short';
                      return 'unknown';
                    })()
                  }
                  onTpChange={handleTpChange}
                  onSlChange={handleSlChange}
                  isDraggable={simPhase === 'idle' || simPhase === 'complete'}
                />
                </div>
              </div>
            </div>

            {/* Trade inputs */}
            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Trade</h2>

              {/* Inputs + Simulate — hidden while trade is active */}
              {(simPhase === 'idle' || simPhase === 'complete') && <>

              {/* Order type toggle */}
              <div>
                <span style={labelStyle}>Order Type</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['market', 'limit'] as const).map(ot => (
                    <button key={ot} onClick={() => setOrderType(ot)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                        border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                        background: orderType === ot ? RED : c.cardBorder,
                        color: orderType === ot ? '#fff' : c.textMuted,
                      }}>
                      {ot.charAt(0).toUpperCase() + ot.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry Price */}
              {(() => {
                const ep = orderType === 'market'
                  ? (allCandles.length > 0 ? allCandles[allCandles.length - 1].close : NaN)
                  : parseFloat(entryPrice);
                const tp = parseFloat(takeProfit);
                const sl = parseFloat(stopLoss);
                let detectedDir: 'long' | 'short' | null = null;
                if (!isNaN(ep) && !isNaN(tp)) detectedDir = tp > ep ? 'long' : 'short';
                else if (!isNaN(ep) && !isNaN(sl)) detectedDir = sl < ep ? 'long' : 'short';
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={labelStyle}>Entry Price</span>
                      {detectedDir && (
                        <span style={{
                          fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '99px',
                          background: detectedDir === 'long' ? '#10b98120' : '#E8313A20',
                          color: detectedDir === 'long' ? '#10b981' : '#E8313A',
                        }}>
                          {detectedDir === 'long' ? 'LONG 📈' : 'SHORT 📉'}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={orderType === 'market' ? '' : entryPrice}
                      onChange={e => { if (orderType === 'limit') setEntryPrice(e.target.value); }}
                      disabled={orderType === 'market'}
                      style={{ ...inputStyle, opacity: orderType === 'market' ? 0.55 : 1, cursor: orderType === 'market' ? 'not-allowed' : 'text' }}
                      placeholder={orderType === 'market'
                        ? `Current price: ${allCandles.length > 0 ? allCandles[allCandles.length - 1].close.toFixed(2) : '—'}`
                        : 'Your limit price'}
                      onFocus={e => { if (orderType === 'limit') e.target.style.borderColor = RED; }}
                      onBlur={e => (e.target.style.borderColor = c.inputBorder)}
                    />
                    {orderType === 'limit' && <p style={{ fontSize: '10px', color: c.textMuted, marginTop: '3px' }}>Your order fills when price reaches this level</p>}
                  </div>
                );
              })()}

              {/* Take Profit 1 */}
              {(() => {
                const ep = orderType === 'market'
                  ? (allCandles.length > 0 ? allCandles[allCandles.length - 1].close : NaN)
                  : parseFloat(entryPrice);
                const tp = parseFloat(takeProfit);
                const sl = parseFloat(stopLoss);
                const detectedDir: 'long' | 'short' | null =
                  !isNaN(ep) && !isNaN(tp) ? (tp > ep ? 'long' : 'short') :
                  !isNaN(ep) && !isNaN(sl) ? (sl < ep ? 'long' : 'short') : null;
                const tpWarn = detectedDir && !isNaN(ep) && !isNaN(tp)
                  ? (detectedDir === 'long' && tp < ep ? 'TP must be above entry for a long trade'
                    : detectedDir === 'short' && tp > ep ? 'TP must be below entry for a short trade'
                    : null)
                  : null;
                return (
                  <div>
                    <span style={labelStyle}>Take Profit</span>
                    <input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} style={inputStyle} placeholder="Optional"
                      onFocus={e => (e.target.style.borderColor = RED)} onBlur={e => (e.target.style.borderColor = c.inputBorder)} />
                    {tpWarn && <p style={{ fontSize: '10px', color: '#f87171', marginTop: '3px' }}>{tpWarn}</p>}
                  </div>
                );
              })()}

              {takeProfit && !showTp2 && (
                <button onClick={() => setShowTp2(true)} style={{ color: RED, fontSize: '12px', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>+ Add TP2</button>
              )}
              {showTp2 && (
                <div>
                  <span style={labelStyle}>Take Profit 2</span>
                  <input type="number" value={takeProfit2} onChange={e => setTakeProfit2(e.target.value)} style={inputStyle} placeholder="Optional"
                    onFocus={e => (e.target.style.borderColor = RED)} onBlur={e => (e.target.style.borderColor = c.inputBorder)} />
                  {!showTp3 && <button onClick={() => setShowTp3(true)} style={{ color: RED, fontSize: '12px', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px', padding: 0 }}>+ Add TP3</button>}
                </div>
              )}
              {showTp3 && (
                <div>
                  <span style={labelStyle}>Take Profit 3</span>
                  <input type="number" value={takeProfit3} onChange={e => setTakeProfit3(e.target.value)} style={inputStyle} placeholder="Optional"
                    onFocus={e => (e.target.style.borderColor = RED)} onBlur={e => (e.target.style.borderColor = c.inputBorder)} />
                </div>
              )}

              {/* Stop Loss */}
              {(() => {
                const ep = orderType === 'market'
                  ? (allCandles.length > 0 ? allCandles[allCandles.length - 1].close : NaN)
                  : parseFloat(entryPrice);
                const tp = parseFloat(takeProfit);
                const sl = parseFloat(stopLoss);
                const detectedDir: 'long' | 'short' | null =
                  !isNaN(ep) && !isNaN(tp) ? (tp > ep ? 'long' : 'short') :
                  !isNaN(ep) && !isNaN(sl) ? (sl < ep ? 'long' : 'short') : null;
                const slWarn = detectedDir && !isNaN(ep) && !isNaN(sl)
                  ? (detectedDir === 'long' && sl >= ep ? 'Stop loss must be below entry for a long trade'
                    : detectedDir === 'short' && sl <= ep ? 'Stop loss must be above entry for a short trade'
                    : null)
                  : null;
                return (
                  <div>
                    <span style={labelStyle}>Stop Loss</span>
                    <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} style={inputStyle} placeholder="Optional"
                      onFocus={e => (e.target.style.borderColor = RED)} onBlur={e => (e.target.style.borderColor = c.inputBorder)} />
                    {slWarn && <p style={{ fontSize: '10px', color: '#f87171', marginTop: '3px' }}>{slWarn}</p>}
                  </div>
                );
              })()}

              <div>
                <span style={labelStyle}>Reasoning / Notes</span>
                <textarea value={userReasoning} onChange={e => setUserReasoning(e.target.value)}
                  style={{ ...inputStyle, height: '72px', resize: 'none' as const }}
                  placeholder="E.g. Buying after VWAP bounce"
                  onFocus={e => (e.target.style.borderColor = RED)} onBlur={e => (e.target.style.borderColor = c.inputBorder)}
                />
              </div>

              <button onClick={handleSimulate}
                disabled={!canSimulate}
                style={{ ...btnRed, width: '100%', padding: '13px', fontSize: '14px', fontWeight: 900,
                  opacity: !canSimulate ? 0.5 : 1,
                  cursor: !canSimulate ? 'not-allowed' : 'pointer',
                  minHeight: '44px' }}
                onMouseEnter={e => { if (canSimulate) e.currentTarget.style.background = RED_DARK; }}
                onMouseLeave={e => { if (canSimulate) e.currentTarget.style.background = RED; }}
              >
                Simulate Trade →
              </button>

              </> /* end inputs block */}

              {/* Hold / Close panel */}
              {simPhase === 'awaiting-decision' && (
                <div style={{ background: c.bg, border: `1px solid ${RED}44`, borderRadius: '10px', padding: '14px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: RED, marginBottom: '8px', textAlign: 'center' }}>
                    Trade still open — what do you want to do?
                    {extensionCount > 0 && <span style={{ color: c.textMuted, fontWeight: 400 }}> ({extensionCount}/{MAX_EXTENSIONS} extensions used)</span>}
                  </p>
                  {/* TP hit status indicator */}
                  {(tradeContextRef.current?.tp || tradeContextRef.current?.tp2 || tradeContextRef.current?.tp3) && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '10px' }}>
                      {tradeContextRef.current?.tp && (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                          background: tpHitStatus.tp1 ? '#26a69a20' : '#6b728020',
                          color: tpHitStatus.tp1 ? '#26a69a' : '#6b7280' }}>
                          TP1 {tpHitStatus.tp1 ? '✓' : '—'}
                        </span>
                      )}
                      {tradeContextRef.current?.tp2 && (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                          background: tpHitStatus.tp2 ? '#26a69a20' : '#6b728020',
                          color: tpHitStatus.tp2 ? '#26a69a' : '#6b7280' }}>
                          TP2 {tpHitStatus.tp2 ? '✓' : '—'}
                        </span>
                      )}
                      {tradeContextRef.current?.tp3 && (
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px',
                          background: tpHitStatus.tp3 ? '#26a69a20' : '#6b728020',
                          color: tpHitStatus.tp3 ? '#26a69a' : '#6b7280' }}>
                          TP3 {tpHitStatus.tp3 ? '✓' : '—'}
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleHoldPosition}
                      style={{ ...btnRed, flex: 1, padding: '10px', fontSize: '13px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = RED_DARK)}
                      onMouseLeave={e => (e.currentTarget.style.background = RED)}
                    >{extensionCount >= MAX_EXTENSIONS ? 'Force Close' : 'Hold Position'}</button>
                    <button onClick={handleCloseAtMarket}
                      style={{ ...btnOutline, flex: 1, padding: '10px', fontSize: '13px' }}
                      onMouseEnter={e => { e.currentTarget.style.background = RED; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = RED; }}
                    >Close at Market</button>
                  </div>
                </div>
              )}

              <button onClick={handleNextCandle}
                disabled={!canSimulate || simPhase === 'animating' || simPhase === 'auto-extending'}
                style={{ width: '100%', padding: '9px', background: 'transparent', border: `1px solid ${c.cardBorder}`, color: c.textMuted, borderRadius: '9px', fontSize: '12px', fontWeight: 600,
                  cursor: (canSimulate && simPhase !== 'animating' && simPhase !== 'auto-extending') ? 'pointer' : 'not-allowed',
                  opacity: (canSimulate && simPhase !== 'animating' && simPhase !== 'auto-extending') ? 1 : 0.5 }}
              >Simulate 1 {timeframe} Candle</button>

              <div style={{ borderTop: `1px solid ${c.divider}`, paddingTop: '10px' }}>
                <p style={{ fontSize: '12px', color: c.textMuted, cursor: 'pointer' }} onClick={() => window.location.href = '/upgrade'}>
                  Sims remaining: <span style={{ fontWeight: 700, color: c.text }}>{tokens >= 9999 ? 'Unlimited' : tokens}</span>
                  {!subscriptionActive && <span style={{ color: RED }}> · Upgrade?</span>}
                </p>
                {!subscriptionActive && (
                  <button onClick={() => window.location.href = '/upgrade'}
                    style={{ ...btnOutline, width: '100%', marginTop: '8px', padding: '9px' }}
                    onMouseEnter={e => { e.currentTarget.style.background = RED; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = RED; }}
                  >Upgrade to Premium</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════ AI COACH (Chat) ════════ */}
        {activeTab === 'coach' && (
          <div className="max-w-2xl mx-auto space-y-4">
            {chatMessages.length > 0 ? (
              <>
                {/* Score card */}
                {tradeScore !== null && (
                  <div style={card}>
                    <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: c.textMuted, marginBottom: '12px' }}>Trade Score</p>
                    <div className="flex items-baseline gap-3">
                      <span style={{ fontSize: '48px', fontWeight: 900, color: getRankColor(tradeScore), lineHeight: 1 }}>{tradeScore}</span>
                      <span style={{ color: c.textMuted, fontSize: '14px' }}>/ 100</span>
                      <span className="ml-auto text-sm font-bold px-3 py-1 rounded-full"
                        style={{ color: getRankColor(tradeScore), background: getRankColor(tradeScore) + '1a' }}>
                        {getRank(tradeScore)}
                      </span>
                    </div>
                    <div style={{ marginTop: '10px', height: 5, borderRadius: 99, background: c.cardBorder, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${tradeScore}%`, background: getRankColor(tradeScore), borderRadius: 99 }} />
                    </div>
                  </div>
                )}

                {/* Chat window */}
                <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🤖</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.textMuted }}>AI Coach</span>
                    {!subscriptionActive && (
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: c.textMuted }}>
                        {Math.max(0, FOLLOWUP_LIMIT - followUpCount)} follow-up{Math.max(0, FOLLOWUP_LIMIT - followUpCount) !== 1 ? 's' : ''} remaining
                      </span>
                    )}
                  </div>

                  {/* Messages */}
                  <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '8px' }}>
                        {msg.role === 'assistant' && (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: RED + '22', border: `1px solid ${RED}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>🤖</div>
                        )}
                        <div style={{
                          maxWidth: '80%',
                          padding: '10px 14px',
                          borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                          background: msg.role === 'user' ? RED : c.card,
                          border: msg.role === 'user' ? 'none' : `1px solid ${c.cardBorder}`,
                          color: msg.role === 'user' ? '#fff' : c.text,
                          fontSize: '14px',
                          lineHeight: '1.6',
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {/* Loading dots */}
                    {chatLoading && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: RED + '22', border: `1px solid ${RED}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>🤖</div>
                        <div style={{ padding: '10px 16px', borderRadius: '4px 16px 16px 16px', background: c.card, border: `1px solid ${c.cardBorder}`, display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {[0, 1, 2].map(i => (
                            <div key={i} style={{
                              width: 6, height: 6, borderRadius: '50%', background: c.textMuted,
                              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Upgrade prompt when limit hit */}
                  {!subscriptionActive && followUpCount >= FOLLOWUP_LIMIT ? (
                    <div style={{ padding: '12px 16px', borderTop: `1px solid ${c.cardBorder}`, textAlign: 'center' }}>
                      <p style={{ fontSize: '13px', color: c.textMuted, marginBottom: '8px' }}>Upgrade to Pro for unlimited coaching conversations</p>
                      <button onClick={() => window.location.href = '/upgrade'} style={{ ...btnRed, padding: '8px 20px', fontSize: '13px' }}>Upgrade to Pro →</button>
                    </div>
                  ) : (
                    /* Input bar */
                    <div style={{ padding: '12px', borderTop: `1px solid ${c.cardBorder}`, display: 'flex', gap: '8px' }}>
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                        placeholder="Ask your coach a question..."
                        disabled={chatLoading}
                        style={{ ...inputStyle, flex: 1, opacity: chatLoading ? 0.6 : 1 }}
                        onFocus={e => (e.target.style.borderColor = RED)}
                        onBlur={e => (e.target.style.borderColor = c.inputBorder)}
                      />
                      <button
                        onClick={handleChatSend}
                        disabled={chatLoading || !chatInput.trim()}
                        style={{ ...btnRed, padding: '10px 16px', opacity: (chatLoading || !chatInput.trim()) ? 0.5 : 1, cursor: (chatLoading || !chatInput.trim()) ? 'not-allowed' : 'pointer' }}
                      >↑</button>
                    </div>
                  )}
                </div>

                {/* Share card for scores ≥ 60 */}
                {tradeScore !== null && tradeScore >= 60 && (
                  <div style={card}>
                    <p style={{ fontSize: '12px', color: c.textMuted, marginBottom: '8px', fontWeight: 600 }}>Share your trade 📲</p>
                    <ShareTradeCard
                      score={tradeScore}
                      rank={getRank(tradeScore)}
                      rankColor={getRankColor(tradeScore)}
                      result={tradeResult}
                      date={new Date().toLocaleDateString()}
                    />
                  </div>
                )}

                <button onClick={() => setActiveTab('simulator')} style={{ ...btnOutline, width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.background = RED; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = RED; }}
                >← Back to Simulator</button>
              </>
            ) : (
              <div style={{ ...card, textAlign: 'center', padding: '64px 32px' }}>
                <div className="text-5xl mb-4">🤖</div>
                <h3 style={{ fontWeight: 700, color: c.text, marginBottom: '8px' }}>No feedback yet</h3>
                <p style={{ color: c.textMuted, fontSize: '14px', marginBottom: '24px' }}>Run a simulation to receive AI coaching feedback here.</p>
                <button onClick={() => setActiveTab('simulator')} style={btnRed}
                  onMouseEnter={e => (e.currentTarget.style.background = RED_DARK)}
                  onMouseLeave={e => (e.currentTarget.style.background = RED)}
                >Go to Simulator</button>
              </div>
            )}
          </div>
        )}

        {/* ════════ PROGRESS ════════ */}
        {activeTab === 'progress' && (
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Daily */}
            <div style={card}>
              <p style={{ ...labelStyle, marginBottom: '16px' }}>Daily Progress</p>
              <div className="flex items-baseline justify-between mb-3">
                <span style={{ fontSize: '36px', fontWeight: 900, color: c.text }}>{dailySims}</span>
                <span style={{ color: c.textMuted, fontSize: '14px' }}>/ {DAILY_GOAL} sims today</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: c.cardBorder, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: RED, borderRadius: 99 }} />
              </div>
              {dailySims >= DAILY_GOAL && <p style={{ color: RED, fontSize: '13px', marginTop: '10px', fontWeight: 600 }}>Daily goal hit! Keep going.</p>}
            </div>

            {/* Streak */}
            <div style={card}>
              <p style={{ ...labelStyle, marginBottom: '16px' }}>Trading Streak 🔥</p>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: '52px', fontWeight: 900, color: RED }}>{streak}</span>
                <div>
                  <p style={{ fontWeight: 700, color: c.text, fontSize: '16px' }}>{streak === 1 ? 'day' : 'days'} in a row</p>
                  <p style={{ color: c.textMuted, fontSize: '12px', marginTop: '2px' }}>{getStreakMessage(streak)}</p>
                  {streakSavedToday && <p style={{ color: '#10b981', fontSize: '12px', marginTop: '4px', fontWeight: 600 }}>✓ Streak saved today!</p>}
                </div>
              </div>
            </div>

            {/* Weekly challenge */}
            <div style={card}>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>Weekly Challenge</p>
              <p style={{ color: c.text, fontSize: '14px', fontWeight: 600, marginBottom: '16px', lineHeight: '1.4' }}>{currentChallenge.text}</p>
              {challengeCompleted ? (
                <p style={{ color: RED, fontWeight: 700, fontSize: '15px' }}>Challenge Complete! 🏆</p>
              ) : (
                <>
                  <div className="flex justify-between mb-1.5">
                    <span style={{ fontSize: '12px', color: c.textMuted }}>{challengeProgress} / {currentChallenge.goal}</span>
                    <span style={{ fontSize: '12px', color: c.textMuted }}>{Math.round(challengePct)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: c.cardBorder, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${challengePct}%`, background: RED, borderRadius: 99, transition: 'width 0.3s' }} />
                  </div>
                </>
              )}
            </div>

            {/* Rank */}
            {tradeScore !== null && (
              <div style={card}>
                <p style={{ ...labelStyle, marginBottom: '12px' }}>Current Rank</p>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '28px', fontWeight: 900, color: getRankColor(tradeScore) }}>{getRank(tradeScore)}</span>
                  <span style={{ fontSize: '12px', color: c.textMuted }}>Last score: {tradeScore}/100</span>
                </div>
              </div>
            )}

            {/* Badges */}
            <div style={card}>
              <p style={{ ...labelStyle, marginBottom: '16px' }}>Achievement Badges</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {ALL_BADGES.map(badge => {
                  const unlockDate = badgesUnlocked[badge.id];
                  return (
                    <div key={badge.id} style={{
                      background: unlockDate ? c.bg : (theme === 'dark' ? '#1a1d27' : '#f5f5f3'),
                      border: `1px solid ${unlockDate ? RED + '44' : c.cardBorder}`,
                      borderRadius: '10px',
                      padding: '14px 12px',
                      textAlign: 'center',
                      opacity: unlockDate ? 1 : 0.45,
                    }}>
                      <div style={{ fontSize: '26px', marginBottom: '6px' }}>{unlockDate ? badge.emoji : '🔒'}</div>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>{badge.name}</p>
                      <p style={{ fontSize: '10px', color: c.textMuted, lineHeight: '1.3' }}>{badge.desc}</p>
                      {unlockDate && <p style={{ fontSize: '9px', color: RED, marginTop: '6px', fontWeight: 600 }}>{unlockDate}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account */}
            <div style={card}>
              <p style={{ ...labelStyle, marginBottom: '12px' }}>Account</p>
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontWeight: 700, color: c.text }}>{subscriptionActive ? 'Premium Plan' : 'Free Plan'}</p>
                  <p style={{ fontSize: '12px', color: c.textMuted, marginTop: '2px' }}>
                    {tokens >= 9999 ? 'Unlimited simulations' : `${tokens} simulations remaining`}
                  </p>
                </div>
                {!subscriptionActive && (
                  <button onClick={() => window.location.href = '/upgrade'} style={btnRed}
                    onMouseEnter={e => (e.currentTarget.style.background = RED_DARK)}
                    onMouseLeave={e => (e.currentTarget.style.background = RED)}
                  >Upgrade</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════ JOURNAL ════════ */}
        {activeTab === 'journal' && (
          <div className="max-w-3xl mx-auto">
            {tradeHistory.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', padding: '64px 32px' }}>
                <div className="text-5xl mb-4">📓</div>
                <h3 style={{ fontWeight: 700, color: c.text, marginBottom: '8px' }}>Your trade journal is empty</h3>
                <p style={{ color: c.textMuted, fontSize: '14px', marginBottom: '24px' }}>Complete your first simulation to start tracking your progress.</p>
                <button onClick={() => setActiveTab('simulator')} style={btnRed}
                  onMouseEnter={e => (e.currentTarget.style.background = RED_DARK)}
                  onMouseLeave={e => (e.currentTarget.style.background = RED)}
                >Go to Simulator</button>
              </div>
            ) : (
              <>
                {/* Stats bar */}
                {(() => {
                  const wins = tradeHistory.filter(t => {
                    const r = t.result.toLowerCase();
                    return r.includes('take profit') || r.includes('gain');
                  }).length;
                  const winRate = tradeHistory.length > 0 ? Math.round((wins / tradeHistory.length) * 100) : 0;
                  const avgScore = tradeHistory.length > 0 ? Math.round(tradeHistory.reduce((s, t) => s + t.score, 0) / tradeHistory.length) : 0;
                  const bestScore = tradeHistory.length > 0 ? Math.max(...tradeHistory.map(t => t.score)) : 0;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                      {[
                        { label: 'Total Trades', value: tradeHistory.length, color: c.text },
                        { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 50 ? '#10b981' : RED },
                        { label: 'Avg Score', value: avgScore, color: '#60a5fa' },
                        { label: 'Best Trade', value: bestScore, color: '#f59e0b' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ ...card, padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ fontSize: '22px', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                          <div style={{ fontSize: '10px', color: c.textMuted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginTop: '4px' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: c.textMuted }}>{tradeHistory.length} trade{tradeHistory.length !== 1 ? 's' : ''} recorded</p>
                  <button onClick={handleClearHistory}
                    style={{ fontSize: '12px', color: confirmClear ? RED : c.textMuted, background: 'none', border: `1px solid ${confirmClear ? RED : c.cardBorder}`, borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}
                  >{confirmClear ? 'Confirm clear?' : 'Clear History'}</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tradeHistory.map(t => {
                    const sc = t.score;
                    const rc = getRankColor(sc);
                    const d = new Date(t.date);
                    return (
                      <div key={t.id} style={{ ...card, padding: '16px 20px' }}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span style={{ fontSize: '10px', color: c.textMuted }}>
                                {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span style={{ fontSize: '10px', background: c.cardBorder, color: c.textMuted, padding: '2px 7px', borderRadius: '4px' }}>{t.timeframe}</span>
                              {t.direction && t.direction !== 'unknown' && (
                                <span style={{
                                  fontSize: '9px', fontWeight: 900, padding: '2px 6px', borderRadius: '99px',
                                  background: t.direction === 'long' ? '#10b98120' : '#E8313A20',
                                  color: t.direction === 'long' ? '#10b981' : '#E8313A',
                                }}>{t.direction === 'long' ? 'LONG' : 'SHORT'}</span>
                              )}
                              {t.holdCount && t.holdCount > 0 && (
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#f59e0b', background: '#f59e0b20', padding: '2px 6px', borderRadius: '99px' }}>
                                  held ×{t.holdCount}
                                </span>
                              )}
                              {t.closedEarly && (
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#60a5fa', background: '#60a5fa20', padding: '2px 6px', borderRadius: '99px' }}>
                                  early exit
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '13px', color: c.text, marginBottom: '4px', fontWeight: 600 }}>{t.result}</p>
                            {t.feedbackSummary && (
                              <p style={{ fontSize: '12px', color: c.textMuted, lineHeight: '1.5' }}>{t.feedbackSummary}{t.feedbackSummary.length >= 100 ? '...' : ''}</p>
                            )}
                            {t.reasoning && (
                              <p style={{ fontSize: '11px', color: c.textMuted, marginTop: '6px', fontStyle: 'italic' }}>"{t.reasoning.slice(0, 80)}{t.reasoning.length > 80 ? '…' : ''}"</p>
                            )}
                          </div>
                          <div style={{ textAlign: 'center', minWidth: '52px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: rc, lineHeight: 1 }}>{sc}</div>
                            <div style={{ fontSize: '10px', color: rc, fontWeight: 700, marginTop: '2px' }}>{getRank(sc)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════ REFERRALS ════════ */}
        {activeTab === 'referrals' && (
          <div className="max-w-lg mx-auto space-y-4">
            <div style={card}>
              <p style={{ ...labelStyle, marginBottom: '10px' }}>Your Referral Link</p>
              <div className="flex gap-2">
                <input readOnly value={referralLink || 'Loading...'} style={{ ...inputStyle, flex: 1, fontSize: '12px', background: theme === 'dark' ? '#0d0f17' : '#f5f5f3' }} />
                <button onClick={handleCopyReferral} disabled={!referralLink}
                  style={{ ...btnRed, padding: '10px 16px', fontSize: '12px', opacity: referralLink ? 1 : 0.5 }}
                  onMouseEnter={e => { if (referralLink) e.currentTarget.style.background = RED_DARK; }}
                  onMouseLeave={e => (e.currentTarget.style.background = RED)}
                >{copied ? 'Copied!' : 'Copy'}</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[{ v: referralCount, label: 'Referrals' }, { v: `$${referralEarnings.toFixed(2)}`, label: 'Earned' }].map(({ v, label }) => (
                <div key={label} style={{ ...card, textAlign: 'center', padding: '20px' }}>
                  <p style={{ fontSize: '32px', fontWeight: 900, color: RED }}>{v}</p>
                  <p style={{ fontSize: '10px', color: c.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>{label}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '12px', color: c.textMuted, textAlign: 'center' }}>
              Earn <span style={{ fontWeight: 700, color: c.text }}>20% of every payment</span> from your referrals for 3 months, paid in USD.
            </p>

            <div style={card}>
              <p style={{ ...labelStyle, marginBottom: '16px' }}>Reward Tiers</p>
              {nextTier && (
                <div style={{ marginBottom: '20px' }}>
                  <div className="flex justify-between mb-1.5">
                    <span style={{ fontSize: '12px', color: c.textMuted }}>{referralCount}/{nextTier.count} toward</span>
                    <span style={{ fontSize: '12px', color: RED, fontWeight: 700 }}>{nextTier.reward}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: c.cardBorder, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${refProgressPct}%`, background: RED, borderRadius: 99 }} />
                  </div>
                </div>
              )}
              <div>
                {REWARD_TIERS.map((tier, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < REWARD_TIERS.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: c.text }}>{tier.count} Referrals</p>
                      <p style={{ fontSize: '12px', color: RED, marginTop: '2px' }}>{tier.reward}</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
                      ...(referralCount >= tier.count
                        ? { background: '#ecfdf5', color: '#059669' }
                        : { background: c.cardBorder, color: c.textMuted }) }}>
                      {referralCount >= tier.count ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════ MISSIONS ════════ */}
        {activeTab === 'missions' && (
          <div className="max-w-lg mx-auto" style={{ textAlign: 'center' }}>
            <div style={{ ...card, padding: '48px 32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: c.text, marginBottom: '12px' }}>Missions & Scenarios</h2>
              <p style={{ color: c.textMuted, fontSize: '14px', lineHeight: '1.7', maxWidth: '360px', margin: '0 auto 32px' }}>
                Complete story-driven trading scenarios based on real market events. Each mission teaches a different pattern, strategy, or market condition.
              </p>
              <div style={{ background: c.bg, borderRadius: '10px', padding: '20px', border: `1px solid ${c.cardBorder}`, maxWidth: '320px', margin: '0 auto 16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: c.text, marginBottom: '10px' }}>
                  Get notified when Missions launch
                </p>
                {missionsEmailSaved ? (
                  <p style={{ color: '#10b981', fontSize: '14px', fontWeight: 700 }}>✓ You're on the list!</p>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      value={missionsEmail}
                      onChange={e => setMissionsEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={{ ...inputStyle, flex: 1, fontSize: '13px' }}
                      onFocus={e => (e.target.style.borderColor = RED)}
                      onBlur={e => (e.target.style.borderColor = c.inputBorder)}
                    />
                    <button
                      onClick={() => {
                        if (missionsEmail.includes('@')) {
                          localStorage.setItem('chartchamp_missions_email', missionsEmail);
                          setMissionsEmailSaved(true);
                        }
                      }}
                      style={{ ...btnRed, padding: '10px 14px', fontSize: '12px', whiteSpace: 'nowrap' as const }}
                      onMouseEnter={e => (e.currentTarget.style.background = RED_DARK)}
                      onMouseLeave={e => (e.currentTarget.style.background = RED)}
                    >Notify Me</button>
                  </div>
                )}
              </div>
              <p style={{ fontSize: '12px', color: c.textMuted }}>Coming soon — stay tuned.</p>
            </div>
          </div>
        )}

        {/* ════════ ACHIEVEMENTS ════════ */}
        {activeTab === 'achievements' && (
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Simulator Achievements */}
            <div style={card}>
              <button
                onClick={() => setSimAchievementsOpen(o => !o)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}
              >
                <div>
                  <p style={{ ...labelStyle, marginBottom: '2px' }}>Simulator Achievements</p>
                  <p style={{ fontSize: '12px', color: c.textMuted }}>
                    {Object.keys(badgesUnlocked).length} / {ALL_BADGES.length} unlocked
                  </p>
                </div>
                <span style={{ fontSize: '18px', color: c.textMuted, transform: simAchievementsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
              </button>

              {simAchievementsOpen && (
                <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                  {ALL_BADGES.map(badge => {
                    const unlockDate = badgesUnlocked[badge.id];
                    const bonus = BADGE_REWARDS[badge.id];
                    return (
                      <div key={badge.id} style={{
                        background: unlockDate ? c.bg : (theme === 'dark' ? '#1a1d27' : '#f5f5f3'),
                        border: `1px solid ${unlockDate ? RED + '55' : c.cardBorder}`,
                        borderRadius: '10px',
                        padding: '14px 12px',
                        textAlign: 'center',
                        opacity: unlockDate ? 1 : 0.5,
                        position: 'relative',
                      }}>
                        <div style={{ fontSize: '28px', marginBottom: '6px' }}>{unlockDate ? badge.emoji : '🔒'}</div>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: c.text, marginBottom: '2px' }}>{badge.name}</p>
                        <p style={{ fontSize: '10px', color: c.textMuted, lineHeight: '1.3', marginBottom: '6px' }}>{badge.desc}</p>
                        {unlockDate ? (
                          <p style={{ fontSize: '9px', color: RED, fontWeight: 600 }}>Earned {unlockDate}</p>
                        ) : bonus ? (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', background: '#10b98120', padding: '2px 8px', borderRadius: '99px' }}>
                            +{bonus} sims
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paper Trading Achievements */}
            <div style={card}>
              <button
                onClick={() => setPaperAchievementsOpen(o => !o)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}
              >
                <div>
                  <p style={{ ...labelStyle, marginBottom: '2px' }}>Paper Trading Achievements</p>
                  <p style={{ fontSize: '12px', color: c.textMuted }}>Coming soon</p>
                </div>
                <span style={{ fontSize: '18px', color: c.textMuted, transform: paperAchievementsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
              </button>

              {paperAchievementsOpen && (
                <div style={{ marginTop: '24px', textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📈</div>
                  <p style={{ fontWeight: 700, color: c.text, marginBottom: '8px' }}>Paper Trading — Coming Soon</p>
                  <p style={{ fontSize: '13px', color: c.textMuted, maxWidth: '280px', margin: '0 auto' }}>
                    Trade with simulated capital against real-time market conditions. Achievements will unlock here.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ── Theme toggle (fixed bottom-right) ─────────────────────────────── */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{ background: c.card, border: `1px solid ${c.cardBorder}`, fontSize: '18px', cursor: 'pointer' }}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* ── Badge toasts (fixed bottom-left) ─────────────────────────────── */}
      <BadgeToast
        queue={toastQueue}
        onDismiss={id => setToastQueue(q => q.filter(b => b.id !== id))}
      />
    </div>
  );
}
