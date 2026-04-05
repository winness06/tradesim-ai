import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const authData = await auth()
  const userId = authData.userId

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { messages, tradeContext } = body

  const user = await clerkClient.users.getUser(userId)
  const meta = user.privateMetadata || {}
  const subscriptionActive = Boolean(meta.subscriptionActive)

  // TODO: Adaptive AI — store user's trading patterns (preferred timeframes, common mistakes,
  // strategy type) in their Clerk metadata. Feed this history into the system prompt so
  // the coach personalises advice to their specific style over time.

  const ctx = tradeContext ?? {}
  const systemPrompt = `You are ChartChamp's AI trading coach. You are reviewing this specific trade:
Entry: ${ctx.entry ?? "Not set"}, TP1: ${ctx.tp1 ?? "Not set"}, TP2: ${ctx.tp2 ?? "Not set"}, TP3: ${ctx.tp3 ?? "Not set"}, Stop Loss: ${ctx.sl ?? "Not set"}, Result: ${ctx.result ?? "Unknown"}, Score: ${ctx.score ?? "N/A"}/100, Timeframe: ${ctx.timeframe ?? "Unknown"}, Student reasoning: ${ctx.reasoning || "None provided"}.
Answer follow-up questions about this trade specifically. Be concise, direct, and educational. If asked about strategy personalisation, acknowledge that ChartChamp will soon offer adaptive AI coaching that learns your personal trading style.`

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    })
    const data = await res.json()
    const reply =
      data.content?.[0]?.text ||
      "I couldn't process that. Please try again."
    return NextResponse.json({ reply, subscriptionActive })
  } catch (err) {
    console.error("Coach chat error:", err)
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 })
  }
}
