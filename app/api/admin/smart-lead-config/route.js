import { NextResponse } from "next/server";
import {
  getResolvedSmartLeadConfig,
  saveSmartLeadConfig,
} from "@/lib/smartLead/configServer.js";
import { getDefaultSmartLeadConfig, CONTENT_PLACEHOLDERS, DESIGN_TEMPLATES } from "@/lib/smartLead/configDefaults.js";
import { validateSmartLeadConfigInput } from "@/lib/smartLead/configResolve.js";

/**
 * GET /api/admin/smart-lead-config
 */
export async function GET() {
  try {
    const config = await getResolvedSmartLeadConfig({ force: true });
    return NextResponse.json({
      success: true,
      data: config,
      defaults: getDefaultSmartLeadConfig(),
      placeholders: CONTENT_PLACEHOLDERS,
      templates: DESIGN_TEMPLATES,
    });
  } catch (error) {
    console.error("GET /api/admin/smart-lead-config", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load config" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/smart-lead-config
 * Body: full or partial config object. Validated + merged with defaults.
 * Pass { reset: true } to restore document defaults.
 */
export async function PUT(req) {
  try {
    const body = await req.json();
    if (body?.reset === true) {
      const saved = await saveSmartLeadConfig(getDefaultSmartLeadConfig());
      return NextResponse.json({
        success: true,
        data: saved,
        message: "Configuration reset to defaults",
      });
    }

    const { ok, errors, config } = validateSmartLeadConfigInput(body);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: errors.join("; "), errors },
        { status: 400 }
      );
    }

    const saved = await saveSmartLeadConfig(config);
    return NextResponse.json({
      success: true,
      data: saved,
      message: "Configuration saved",
    });
  } catch (error) {
    console.error("PUT /api/admin/smart-lead-config", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save config" },
      { status: 500 }
    );
  }
}
