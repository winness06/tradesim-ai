import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { entry, takeProfit, stopLoss, result } = await req.json()

  const prompt = `
You are an AI Trading Coach. A user submitted this trade:

- Entry Price: ${entry}
- Take Profit: ${takeProfit}
- Stop Loss: ${stopLoss}
- Result: ${result}

Provide short, critical but motivating feedback. Suggest improvements or praise good decisions.
`

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
      system: `You are an expert trading coach answering a follow-up question about a specific trade the user just took. You have access to the exact trade details in the conversation context (entry, TP, SL, result). You must reference the EXACT price levels from that trade in your answers — never give generic advice. Be direct, specific, and under 150 words per response. Every sentence must connect back to their specific trade details.`,
      messages: [
        { role: "user", content: prompt },
      ],
    }),
  })

  const data = await res.json()

  const message = data.content?.[0]?.text || "No AI feedback generated."

  return NextResponse.json({ feedback: message })
}
