import { NextResponse } from "next/server";

export async function POST(req) {
  return NextResponse.json(
    {
      success: false,
      message: "Gmail SMTP notifications are disabled; use the Eygr order email flow.",
    },
    { status: 410 },
  );
}
