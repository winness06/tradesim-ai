import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authData = await auth();
  const userId = authData.userId;

  if (!userId) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const referralCode = encodeURIComponent(userId);
  const referralLink = `${process.env.NEXT_PUBLIC_BASE_URL}/sign-up?ref=${referralCode}`;

  try {
    const user = await clerkClient.users.getUser(userId);
    const meta = user.privateMetadata || {};

    const referralCount = Number(meta.referralCount) || 0;
    const referralEarningsRaw = Number(meta.referralEarnings);
    const referralEarnings = isNaN(referralEarningsRaw) ? "0.00" : referralEarningsRaw.toFixed(2);

    return NextResponse.json({
      referralLink,
      referralCount,
      referralEarnings,
    });
  } catch (err) {
    console.error("Error fetching referral data:", err);
    return NextResponse.json({ error: "Failed to fetch referral details." }, { status: 500 });
  }
}
