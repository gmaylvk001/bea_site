import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SmartLead from "@/models/smartLead";
import { buildEnrichedLeadFields } from "@/lib/smartLead/leadContext.js";

function normalizeMobile(mobile = "") {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.slice(-10);
}

function isValidMobile(mobile) {
  return /^[6-9]\d{9}$/.test(mobile);
}

function getClientMeta(req) {
  const headers = req.headers;
  const userAgent = headers.get("user-agent") || "";
  const forwarded = headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || headers.get("x-real-ip") || "";
  return { userAgent, ipArea: ip ? `IP:${ip.split(".").slice(0, 2).join(".")}.x.x` : "" };
}

/**
 * POST /api/smart-lead/capture
 * Creates the lead immediately with full visitor context (Part 4 enrichment).
 */
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const mobile = normalizeMobile(body.mobile);
    if (!isValidMobile(mobile)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    const enriched = buildEnrichedLeadFields(
      { ...body, mobile },
      getClientMeta(req)
    );

    const lead = await SmartLead.create(enriched);

    return NextResponse.json(
      {
        success: true,
        message: "Lead captured",
        leadId: String(lead._id),
        mobile: lead.mobile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/smart-lead/capture", error);
    if (error?.name === "ValidationError") {
      return NextResponse.json(
        { success: false, error: error.message || "Invalid lead data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to capture lead" },
      { status: 500 }
    );
  }
}
