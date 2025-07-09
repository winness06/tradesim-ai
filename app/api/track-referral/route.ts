import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const userId = body.data?.id;
  if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

  try {
    // Check localStorage referral (we saved in layout.tsx)
    const searchParams = new URL(body.data?.web?.redirect_url || "").searchParams;
    const refCode = searchParams.get("ref") || "";

    if (refCode) {
      const allUsers = await clerkClient.users.getUserList();
      const referrer = allUsers.find(u => u.publicMetadata?.referralCode === refCode);

      if (referrer) {
        const rawCount = referrer.publicMetadata?.referralCount;
const count = (typeof rawCount === "number" ? rawCount : 0) + 1;


        await clerkClient.users.updateUserMetadata(referrer.id, {
          publicMetadata: {
            referralCount: count,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Referral tracking error:", err);
    return NextResponse.json({ error: "Referral tracking failed" }, { status: 500 });
  }
}
