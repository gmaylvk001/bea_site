import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Store from "@/models/store";
import mongoose from "mongoose";

function buildStoreQuery(storeId) {
  if (mongoose.Types.ObjectId.isValid(storeId)) {
    return { _id: storeId };
  }
  return {
    $or: [{ slug: storeId }, { location_id: storeId }],
  };
}

export async function GET(_request, context) {
  const { storeId } = await context.params;
  if (!storeId) {
    return NextResponse.json({ error: "Store identifier is required." }, { status: 400 });
  }

  const host = (process.env.ADTARBO_HOST || "").replace(/\/$/, "");
  const token = process.env.ADTARBO_API_TOKEN || "";
  if (!host || !token) {
    return NextResponse.json(
      { success: false, error: "Adtarbo credentials are not configured." },
      { status: 500 }
    );
  }

  try {
    await connectDB();
    const store = await Store.findOne(buildStoreQuery(storeId))
      .select("location_id organisation_name slug")
      .lean();

    if (!store) {
      return NextResponse.json({ success: false, error: "Store not found." }, { status: 404 });
    }

    const locationId = (store.location_id || "").toString().trim();
    if (!locationId) {
      return NextResponse.json({
        success: true,
        rating: null,
        featured_reviews: [],
        links: {},
        message: "Store has no location_id for Adtarbo lookup.",
      });
    }

    const url = `${host}/api/microsite/stores/show?location_id=${encodeURIComponent(locationId)}`;
    const res = await fetch(url, {
      headers: { "API-TOKEN": token },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[Adtarbo] store show failed", res.status, text.slice(0, 300));
      return NextResponse.json(
        { success: false, error: "Failed to fetch store reviews." },
        { status: res.status === 401 || res.status === 403 ? res.status : 502 }
      );
    }

    const json = await res.json();
    const data = json?.data || {};

    return NextResponse.json({
      success: true,
      rating: data.rating || null,
      featured_reviews: Array.isArray(data.featured_reviews) ? data.featured_reviews : [],
      links: {
        write_review: data.links?.write_review || null,
        all_reviews: data.links?.all_reviews || null,
      },
    });
  } catch (error) {
    console.error("[Adtarbo] reviews route error", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
