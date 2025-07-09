import { auth, currentUser } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const { referrer } = await req.json()
  if (!referrer) return NextResponse.json({ success: false })

  try {
    // Find influencer by username or email etc
    const matches = await clerkClient.users.getUserList({ username: referrer })
    const influencer = matches[0]

    if (!influencer) return NextResponse.json({ success: false })

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: { referredBy: influencer.id },
      publicMetadata: { subscriptionActive: true }, // Free trial starts
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Referral error:", err)
    return NextResponse.json({ error: "Failed to apply referral" }, { status: 500 })
  }
}
