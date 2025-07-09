import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // ✅ REMOVE this line entirely:
  // apiVersion: "2022-11-15",
})


const PLAN_TOKENS = {
  starter: 8,
  pro: 30,
  entire: 9999,
} as const;

type PlanType = keyof typeof PLAN_TOKENS;

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing Stripe signature or webhook secret.");
    return new NextResponse("Webhook Error", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const referralCode = session.metadata?.referralCode;
    const plan = session.metadata?.plan as PlanType;
    const amountCents = session.amount_total || 0;

    if (!userId || !PLAN_TOKENS[plan]) {
      console.error("Missing userId or invalid plan.");
      return new NextResponse("Invalid session metadata", { status: 400 });
    }

    try {
      const user = await clerkClient.users.getUser(userId);
      const meta = user.privateMetadata || {};

      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          ...meta,
          subscriptionActive: plan !== "starter",
          currentSimTokens: PLAN_TOKENS[plan],
          lastResetDate: new Date().toISOString().slice(0, 10),
          userPlan: plan,
        },
      });

      if (referralCode && amountCents > 0) {
        try {
          const refUser = await clerkClient.users.getUser(referralCode);
          const refMeta = refUser.privateMetadata || {};

          const commission = (amountCents * 0.1) / 100; // 10% of total in USD

          await clerkClient.users.updateUserMetadata(referralCode, {
            privateMetadata: {
              ...refMeta,
              referralCount: (Number(refMeta.referralCount) || 0) + 1,
              currentSimTokens: (Number(refMeta.currentSimTokens) || 0) + 5,
              referralEarnings: (Number(refMeta.referralEarnings) || 0) + commission,
            },
          });

          console.log(`✅ $${commission.toFixed(2)} earnings added for referral ${referralCode}`);
        } catch {
          console.warn("Referral code invalid or referrer not found.");
        }
      }

      console.log(`✅ Plan '${plan}' activated for user ${userId}`);
    } catch (err) {
      console.error("Failed to update user after checkout:", err);
    }
  }

  return new NextResponse("Received", { status: 200 });
}
