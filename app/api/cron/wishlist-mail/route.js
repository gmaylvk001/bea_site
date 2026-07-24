import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import {
  processWishlistMails,
  isWishlistMailTestAllowlistEnabled,
  getWishlistMailTestAllowlist,
} from "@/lib/wishlistMail";

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow in dev if secret not set
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const querySecret = req.nextUrl?.searchParams?.get("secret");
  return token === secret || querySecret === secret;
}

export async function GET(req) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const forceParam = req.nextUrl.searchParams.get("force") === "1";
    const testAllowlist = isWishlistMailTestAllowlistEnabled();
    // While test allowlist is ON, always force (bypass schedule window) — only 3 emails.
    const force = forceParam || testAllowlist;

    const result = await processWishlistMails({
      force,
      ignoreLimits: testAllowlist,
      maxForceSends: testAllowlist ? 10 : 20,
    });

    return NextResponse.json({
      success: true,
      testAllowlistEnabled: testAllowlist,
      testAllowlist: testAllowlist ? getWishlistMailTestAllowlist() : undefined,
      forced: force,
      result,
    });
  } catch (error) {
    console.error("cron wishlist-mail error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  return GET(req);
}
