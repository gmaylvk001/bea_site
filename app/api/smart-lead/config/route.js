import { NextResponse } from "next/server";
import { getResolvedSmartLeadConfig } from "@/lib/smartLead/configServer.js";
import { CONTENT_PLACEHOLDERS } from "@/lib/smartLead/configDefaults.js";

/**
 * Public config for the storefront (cached server-side ~30s).
 * GET /api/smart-lead/config
 */
export async function GET() {
  try {
    const config = await getResolvedSmartLeadConfig();
    return NextResponse.json(
      {
        success: true,
        data: config,
        placeholders: CONTENT_PLACEHOLDERS,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/smart-lead/config", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load config" },
      { status: 500 }
    );
  }
}
