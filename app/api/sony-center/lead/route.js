import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SonyCenterLead from "@/models/SonyCenterLead";
import Notification from "@/models/Notification";

const DEFAULT_API_KEY = "bea_sony_center_key_7f8c92a1e4b6d0c5a39e8b1d";

// Helper to add CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization, Accept",
    "Access-Control-Max-Age": "86400",
  };
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

// POST handler for receiving leads from other domains
export async function POST(request) {
  try {
    // 1. API Key validation
    const expectedApiKey = process.env.SONY_CENTER_API_KEY || DEFAULT_API_KEY;

    const authHeader = request.headers.get("authorization");
    const xApiKey = request.headers.get("x-api-key");
    const url = new URL(request.url);
    const queryApiKey = url.searchParams.get("apiKey") || url.searchParams.get("api_key");

    let clientApiKey = xApiKey || queryApiKey;
    if (!clientApiKey && authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        clientApiKey = authHeader.substring(7).trim();
      } else {
        clientApiKey = authHeader.trim();
      }
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!clientApiKey && (body.apiKey || body.api_key)) {
      clientApiKey = body.apiKey || body.api_key;
    }

    if (!clientApiKey || clientApiKey !== expectedApiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Invalid or missing API Key. Please provide a valid 'x-api-key' header.",
        },
        { status: 401, headers: corsHeaders() }
      );
    }

    // 2. Extract and normalize fields
    const name = (body.name || "").trim();
    const phone = (
      body.phone ||
      body.phone_no ||
      body.phoneNumber ||
      body.mobile ||
      body.mobile_number ||
      ""
    ).toString().trim();
    const email = (body.email || body.email_address || "").trim().toLowerCase();
    const location = (body.location || body.city || body.address || "").trim();
    const message = (
      body.message ||
      body.requirement ||
      body.query ||
      body.comments ||
      ""
    ).trim();
    const source = (body.source || request.headers.get("origin") || request.headers.get("referer") || "External Sony Center Form").trim();

    // 3. Validation
    const missing = [];
    if (!name) missing.push("name");
    if (!phone) missing.push("phone");
    if (!email) missing.push("email");
    if (!location) missing.push("location");
    if (!message) missing.push("message");

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required fields: ${missing.join(", ")}`,
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Validate phone number digits
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid 10-digit phone number",
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address",
        },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 4. Save to Database
    await dbConnect();

    // Capture IP address if available
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "";

    const newLead = await SonyCenterLead.create({
      name,
      phone: digitsOnly,
      email,
      location,
      message,
      status: "new",
      source,
      ipAddress,
    });

    // 5. Admin Notification (non-blocking)
    try {
      if (Notification) {
        await Notification.create({
          type: "sony_center",
          message: `New Sony Center Lead: ${name} (${digitsOnly}) from ${location}`,
          read: false,
        });
      }
    } catch (notifErr) {
      console.warn("Could not create notification:", notifErr.message);
    }

    // 6. Return response
    return NextResponse.json(
      {
        success: true,
        message: "Sony Center lead submitted successfully",
        data: {
          id: newLead._id,
          name: newLead.name,
          createdAt: newLead.createdAt,
        },
      },
      { status: 201, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("Error submitting Sony Center lead:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error occurred while processing lead",
        error: error.message,
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
