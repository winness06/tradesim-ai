import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
   // Add if not already set for safety
});

// Your real Stripe price IDs (replace these with actual IDs from your Stripe dashboard)
const SUBSCRIPTION_PRICE_IDS = {
  starter: { priceId: "price_1RkjigAoEEs1A8KI3OZBk2Ec", label: "TradeSim Starter (8 Daily Sims)" },
  pro: { priceId: "price_1RkjjEAoEEs1A8KIKBNOYRtG", label: "TradeSim Pro (30 Daily Sims)" },
  entire: { priceId: "price_1RkjjiAoEEs1A8KIAAiJ55xj", label: "TradeSim Entire Flex (Unlimited Sims)" },
} as const;

type PlanType = keyof typeof SUBSCRIPTION_PRICE_IDS;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await req.json();
  const plan = body.plan as PlanType;
  const referralCode = body.referralCode || "";

  if (!plan || !SUBSCRIPTION_PRICE_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // ✅ CHANGED
      payment_method_types: ["card"],
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_IDS[plan].priceId, // ✅ Use Stripe Price ID
          quantity: 1,
        },
      ],
      success_url: "https://chartchamp.com.au/?upgrade_success=true",
      cancel_url: "https://chartchamp.com.au/",
      metadata: { userId, referralCode, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
