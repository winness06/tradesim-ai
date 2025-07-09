import { auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const authData = await auth()
  const userId = authData.userId

  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  try {
    const today = new Date().toISOString().slice(0, 10)
    const dailyLimit = 15

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        subscriptionActive: true,
        currentSimTokens: dailyLimit,
        lastResetDate: today,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Upgrade failed:", err)
    return NextResponse.json({ error: "Upgrade failed" }, { status: 500 })
  }
}
