import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const authData = await auth()
  const userId = authData.userId

  if (!userId) {
    return NextResponse.json({ feedback: "You must be signed in to simulate." }, { status: 401 })
  }

  const {
    entry,
    takeProfit,
    takeProfit2,
    takeProfit3,
    stopLoss,
    result,
    score,
    userReasoning
  } = await req.json()

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

  const tradeOutcome = result || "The trade is still open — price has not yet hit take profit or stop loss."

  const prompt = `
You are an expert trading coach. A student submitted this trade:

- Entry Price: ${entry ?? "No entry price — they are waiting to enter."}
- Take Profit 1: ${takeProfit ?? "Not set"}
- Take Profit 2: ${takeProfit2 ?? "Not set"}
- Take Profit 3: ${takeProfit3 ?? "Not set"}
- Stop Loss: ${stopLoss ?? "Not set"}
- Trade Result: ${tradeOutcome}
- AI Quality Score: ${score}/100
- Student's Reasoning: ${userReasoning || "No reasoning provided."}

Provide honest, motivating feedback:
- If they are waiting to enter, coach them on patience, structure, and psychology.
- If trade is open, suggest improvements, risk management, technical patterns, mindset tips.
`

  try {
    console.log("Prompt sent to AI:", prompt)

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a strict but helpful professional trading coach." },
          { role: "user", content: prompt },
        ],
        max_tokens: 200,
      }),
    })

    const data = await aiRes.json()
    console.log("Full AI Response:", data)

    const feedback = data.choices?.[0]?.message?.content || "AI coach unavailable. Please try again."

    let newTokens = tokens
    if (!subscriptionActive) {
      newTokens = Math.max(tokens - 1, 0)
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { ...meta, currentSimTokens: newTokens },
      })
    }

    return NextResponse.json({
      feedback,
      tokensRemaining: newTokens,
      subscriptionActive,
    })

  } catch (err) {
    console.error("AI error occurred:", err)
    return NextResponse.json({ feedback: "Error contacting AI coach." }, { status: 500 })
  }
}
