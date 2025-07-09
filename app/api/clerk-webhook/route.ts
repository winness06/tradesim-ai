import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Basic Clerk event structure:
    const eventType = payload.type;
    const userId = payload.data?.id;

    if (!userId) {
      console.error("No user ID in Clerk webhook.");
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    if (eventType === "user.created") {
      console.log(`New user created: ${userId}`);
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          subscriptionActive: false,
          currentSimTokens: 0,
          lastResetDate: "",
          referralCount: 0,
        },
      });
    }

    if (eventType === "user.updated") {
      console.log(`User updated: ${userId}`);
      // You can add logic here if needed for updates
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
