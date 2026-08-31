import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import SmartLead from "@/models/smartLead";

/**
 * PATCH help options / WhatsApp attribution onto an existing lead.
 * Does NOT create a new lead.
 */
export async function PATCH(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const leadId = String(body.leadId || "").trim();
    if (!leadId) {
      return NextResponse.json({ success: false, error: "leadId required" }, { status: 400 });
    }

    const lead = await SmartLead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }

    const journey = Array.isArray(lead.visitorJourney) ? [...lead.visitorJourney] : [];
    const pushJourney = (type, label, meta = {}) => {
      journey.push({
        order: journey.length + 1,
        type,
        label,
        at: new Date().toISOString(),
        meta,
      });
    };

    if (Array.isArray(body.helpOptions)) {
      const helpOptions = body.helpOptions.map((h) => String(h)).filter(Boolean);
      const whatsappRequested =
        Boolean(body.whatsappRequested) || helpOptions.includes("whatsapp_me");
      lead.helpOptions = helpOptions;
      lead.whatsappRequested = whatsappRequested;
      if (whatsappRequested || body.whatsappClicked) {
        lead.whatsappClicked = true;
      }
      if (body.name) {
        lead.name = String(body.name).trim().slice(0, 80);
      }
      pushJourney(
        "help_selection",
        helpOptions.length ? `Help: ${helpOptions.join(", ")}` : "Help selection skipped",
        { helpOptions, whatsappRequested }
      );
    } else if (body.whatsappClicked || body.whatsappRequested) {
      lead.whatsappClicked = true;
      if (body.whatsappRequested) lead.whatsappRequested = true;
      pushJourney("whatsapp", "WhatsApp clicked", { whatsappClicked: true });
    }

    if (body.talkToId) {
      lead.talkToId = String(body.talkToId).slice(0, 120);
    }

    lead.visitorJourney = journey;
    await lead.save();

    return NextResponse.json({ success: true, leadId: String(lead._id) });
  } catch (error) {
    console.error("PATCH /api/smart-lead/help", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update help options" },
      { status: 500 }
    );
  }
}
