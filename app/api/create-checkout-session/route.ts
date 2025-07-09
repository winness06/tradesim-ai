import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
});

const PRICING = {
  starter: { amount: 799, label: "TradeSim Starter (8 Daily Sims)" },
  pro: { amount: 2499, label: "TradeSim Pro (30 Daily Sims)" },
  entire: { amount: 5999, label: "TradeSim Entire Flex (Unlimited Sims)" },
} as const;

type PlanType = keyof typeof PRICING;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await req.json();
  const plan = body.plan as PlanType;
  const referralCode = body.referralCode || "";

  if (!plan || !PRICING[plan]) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: PRICING[plan].label },
            unit_amount: PRICING[plan].amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?upgrade_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade`,
      metadata: { userId, referralCode, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}
