import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // Extract required Svix headers
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  // Verify the signature using the raw body
  const rawBody = await req.text();

  let payload: { type: string; data: { id?: string } };
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof payload;
  } catch (err) {
    console.error("Svix signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const eventType = payload.type;
  const userId = payload.data?.id;

  if (!userId) {
    console.error("No user ID in Clerk webhook payload.");
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
    return NextResponse.json({ success: true });
  }

  if (eventType === "user.updated") {
    console.log(`User updated: ${userId}`);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unrecognised event type" }, { status: 400 });
}
