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

  const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a friendly but honest trading mentor." },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
    }),
  })

  const data = await openAiRes.json()
  console.log(data) // ✅ This will print the full AI response in your terminal

  const message = data.choices?.[0]?.message?.content || "No AI feedback generated."

  return NextResponse.json({ feedback: message })
}
