import { getAuth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await getAuth(req)

    if (!userId) {
      console.log("No userId found, likely unauthenticated.")
      return NextResponse.json({ tokens: 0, subscriptionActive: false })
    }

    const user = await clerkClient.users.getUser(userId)

    const meta = user.privateMetadata || {}
    const subscriptionActive = Boolean(meta.subscriptionActive)
    let tokens = Number(meta.currentSimTokens) || 0
    let lastReset = String(meta.lastResetDate || "")

    const maxDaily = 10
    const today = new Date().toISOString().slice(0, 10)

    if (subscriptionActive && lastReset !== today) {
      tokens += maxDaily
      lastReset = today

      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...meta,
          currentSimTokens: tokens,
          lastResetDate: today,
        },
      })
    }

    return NextResponse.json({
      tokens,
      subscriptionActive,
    })
  } catch (err) {
    console.error("SERVER ERROR in get-tokens route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
