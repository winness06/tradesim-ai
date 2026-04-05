import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { NextRequest, NextResponse } from "next/server"

// ---------------------------------------------------------------------------
// In-memory IP rate limiter for unauthenticated demo requests
// Key: "<ip>:<YYYY-MM-DD>"  Value: request count
// ---------------------------------------------------------------------------
const guestLimits = new Map<string, number>()
const GUEST_DAILY_LIMIT = 3

function getGuestKey(ip: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `${ip}:${today}`
}

function pruneGuestLimits() {
  const today = new Date().toISOString().slice(0, 10)
  for (const key of guestLimits.keys()) {
    if (!key.endsWith(today)) guestLimits.delete(key)
  }
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are an expert trading coach giving sharp, specific feedback on a single trade. You must reference the EXACT price levels the user set (entry, TP, SL) in your response.

Structure your response in 3 short sections with no headers:

1. WHAT HAPPENED: In 1-2 sentences, explain specifically what the price did relative to their exact entry (e.g. "Price rejected at your $X entry and sold off $Y to your stop"). Reference actual numbers.

2. WHAT WAS WRONG (or right): Be direct and specific. Point out exact issues — e.g. "Your SL at $X was only 0.3% away from entry, leaving no room for noise" or "TP1 at $X was reasonable but TP2 at $Y was unrealistic given the resistance above". If the trade was good, say exactly why the levels made sense.

3. ONE THING TO FIX: Give one concrete, specific improvement they can apply next trade. Reference price structure, risk/reward ratios, or level placement. E.g. "Move your SL below the $X swing low, which would have given you a 2.1R trade instead of 0.8R."

Keep total response under 150 words. Be direct. No generic advice. Every sentence must reference their specific trade details.`

function buildPrompt(
  entry: number | null,
  takeProfit: number | null,
  takeProfit2: number | null | undefined,
  takeProfit3: number | null | undefined,
  stopLoss: number | null,
  result: string,
  score: number,
  userReasoning: string,
  direction?: string,
  orderType?: string,
  holdCount?: number,
  closedEarly?: boolean,
  tp1Hit?: boolean,
  tp2Hit?: boolean,
  tp3Hit?: boolean,
): string {
  const tradeOutcome = result || "The trade is still open — price has not yet hit take profit or stop loss."
  const dir = direction === 'long' ? 'LONG (bullish)' : direction === 'short' ? 'SHORT (bearish)' : 'Unknown'
  const isStillOpen = tradeOutcome.toLowerCase().includes('still open') || tradeOutcome.toLowerCase().includes('running')

  // Build TP hit status string only when relevant TPs exist
  const tpStatusParts: string[] = []
  if (takeProfit != null) tpStatusParts.push(`TP1: ${tp1Hit ? 'HIT ✓' : 'not hit'}`)
  if (takeProfit2 != null) tpStatusParts.push(`TP2: ${tp2Hit ? 'HIT ✓' : 'not hit'}`)
  if (takeProfit3 != null) tpStatusParts.push(`TP3: ${tp3Hit ? 'HIT ✓' : 'not hit'}`)
  const tpStatusLine = tpStatusParts.length > 0 ? `\nTP Hit Status: ${tpStatusParts.join('  ')}` : ''

  let extraContext = ''
  if (holdCount && holdCount > 0) {
    extraContext += `\nNote: The trader held this position through ${holdCount} extension(s) before this outcome. In real trading, holding too long often means giving back profits or deepening losses. Address this in your coaching.`
  }
  if (closedEarly) {
    extraContext += `\nNote: The trader closed early at market rather than waiting for their target. This shows discipline — or impatience. Assess which it was based on the numbers and comment on it.`
  }
  if (isStillOpen) {
    extraContext += `\nThe trade is still open. If any TPs were hit, coach on managing the remaining position. Otherwise coach on patience and what to watch for.`
  }

  return `Review this trade:

Direction: ${dir}
Order Type: ${orderType ?? 'market'}
Entry: ${entry ?? 'Not set'}
Take Profit 1: ${takeProfit ?? 'Not set'}
Take Profit 2: ${takeProfit2 ?? 'Not set'}
Take Profit 3: ${takeProfit3 ?? 'Not set'}
Stop Loss: ${stopLoss ?? 'Not set'}${tpStatusLine}
Result: ${tradeOutcome}
AI Quality Score: ${score}/100
Trader's reasoning: "${userReasoning || 'No reasoning given'}"${extraContext}

Give your coaching in 3-4 sentences maximum. Be direct. Start by acknowledging the result in plain English. Then go straight into the psychology or technique. If their reasoning is weak, questionable or funny, address it first — that's the most important signal. End with one specific actionable improvement for next time. Never use bullet points. Write like you're talking to them.`
}

async function callClaude(userPrompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: userPrompt },
      ],
    }),
  })
  const data = await response.json()
  return data.content?.[0]?.text || "AI coach unavailable. Please try again."
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const authData = await auth()
  const userId = authData.userId

  const body = await req.json()
  const {
    guestMode,
    entry,
    takeProfit,
    takeProfit2,
    takeProfit3,
    stopLoss,
    result,
    score,
    userReasoning,
    direction,
    orderType,
    holdCount,
    closedEarly,
    tp1Hit,
    tp2Hit,
    tp3Hit,
  } = body

  // ── GUEST PATH ────────────────────────────────────────────────────────────
  if (!userId) {
    if (!guestMode) {
      return NextResponse.json(
        { feedback: "You must be signed in to simulate." },
        { status: 401 }
      )
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"

    const key = getGuestKey(ip)
    const count = guestLimits.get(key) ?? 0

    if (count >= GUEST_DAILY_LIMIT) {
      return NextResponse.json({
        feedback:
          "You've used your 3 free demo trades for today. Sign up free to keep training — no credit card needed!",
        limitReached: true,
      })
    }

    // Prune stale keys occasionally to keep memory tidy
    if (guestLimits.size > 500) pruneGuestLimits()
    guestLimits.set(key, count + 1)

    try {
      const prompt = buildPrompt(entry, takeProfit, null, null, stopLoss, result, score, userReasoning, direction, orderType, holdCount, closedEarly, tp1Hit, tp2Hit, tp3Hit)
      const feedback = await callClaude(prompt)
      return NextResponse.json({ feedback, limitReached: false })
    } catch (err) {
      console.error("Guest AI error:", err)
      return NextResponse.json({ feedback: "Error contacting AI coach." }, { status: 500 })
    }
  }

  // ── AUTHENTICATED PATH ────────────────────────────────────────────────────
  const user = await clerkClient.users.getUser(userId)
  const meta = user.privateMetadata || {}
  const subscriptionActive = Boolean(meta.subscriptionActive)
  const tokens = typeof meta.currentSimTokens === "number" ? meta.currentSimTokens : 0

  if (tokens <= 0 && !subscriptionActive) {
    return NextResponse.json({
      feedback: "Out of free simulations. Please upgrade to continue.",
      tokensRemaining: 0,
      subscriptionActive,
    })
  }

  try {
    const prompt = buildPrompt(entry, takeProfit, takeProfit2, takeProfit3, stopLoss, result, score, userReasoning, direction, orderType, holdCount, closedEarly, tp1Hit, tp2Hit, tp3Hit)
    const feedback = await callClaude(prompt)

    let newTokens = tokens
    if (!subscriptionActive) {
      newTokens = Math.max(tokens - 1, 0)
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { ...meta, currentSimTokens: newTokens },
      })
    }

    return NextResponse.json({ feedback, tokensRemaining: newTokens, subscriptionActive })
  } catch (err) {
    console.error("AI error occurred:", err)
    return NextResponse.json({ feedback: "Error contacting AI coach." }, { status: 500 })
  }
}
