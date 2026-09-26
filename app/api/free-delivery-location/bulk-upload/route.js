import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/db";
import FreeDeliveryLocation from "@/models/FreeDeliveryLocation";

function cleanKey(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function extractRowFields(row) {
  const keys = Object.keys(row || {});
  let pincode = "";
  let area = "";
  let district = "";

  // 1. Try finding by column header names (handles "pincode", "1.pincode", "Area", "2.Area", "District", "3.District", etc.)
  for (const k of keys) {
    const ck = cleanKey(k);
    if (
      ck === "pincode" ||
      ck === "1pincode" ||
      ck === "pin" ||
      ck === "pincodes" ||
      ck === "postalcode" ||
      ck === "zipcode" ||
      ck === "postcode"
    ) {
      if (!pincode) pincode = String(row[k] ?? "").trim();
    } else if (
      ck === "area" ||
      ck === "2area" ||
      ck === "areaname" ||
      ck === "location" ||
      ck === "locality" ||
      ck === "place"
    ) {
      if (!area) area = String(row[k] ?? "").trim();
    } else if (
      ck === "district" ||
      ck === "3district" ||
      ck === "dist" ||
      ck === "city" ||
      ck === "town"
    ) {
      if (!district) district = String(row[k] ?? "").trim();
    }
  }

  // 2. Fallback to column position if headers did not match exact keywords
  if (!pincode && keys.length > 0 && row[keys[0]] !== undefined) {
    pincode = String(row[keys[0]] ?? "").trim();
  }
  if (!area && keys.length > 1 && row[keys[1]] !== undefined) {
    area = String(row[keys[1]] ?? "").trim();
  }
  if (!district && keys.length > 2 && row[keys[2]] !== undefined) {
    district = String(row[keys[2]] ?? "").trim();
  }

  // Sanitize pincode
  pincode = pincode.replace(/\s+/g, "");
  if (pincode.endsWith(".0")) {
    pincode = pincode.slice(0, -2);
  }

  return { pincode, area, district };
}

export async function POST(req) {
  try {
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get("file");
    const replaceAll = formData.get("replace") === "true" || formData.get("replace") === true;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Please upload an Excel (.xlsx/.xls) or CSV (.csv) file." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json(
        { success: false, error: "The uploaded file contains no sheets." },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "The uploaded sheet is empty." },
        { status: 400 }
      );
    }

    const validRowsMap = new Map();
    const errors = [];
    let skipped = 0;

    rows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const { pincode, area, district } = extractRowFields(row);

      if (!pincode) {
        skipped++;
        if (errors.length < 50) {
          errors.push({ row: rowNum, error: "Missing or empty pincode" });
        }
        return;
      }

      // Deduplicate within the sheet using pincode + area as composite key
      const dedupeKey = `${pincode}__${area.toLowerCase()}`;
      validRowsMap.set(dedupeKey, { pincode, area, district });
    });

    const uniqueRows = Array.from(validRowsMap.values());

    if (uniqueRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid rows found. Please ensure the first row has: 1.pincode, 2.Area, 3.District.",
          errors,
        },
        { status: 400 }
      );
    }

    if (replaceAll) {
      await FreeDeliveryLocation.deleteMany({});
    }

    const ops = uniqueRows.map((item) => ({
      updateOne: {
        filter: { pincode: item.pincode, area: item.area },
        update: {
          $set: {
            pincode: item.pincode,
            area: item.area,
            district: item.district,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));

    // Execute bulkWrite in chunks of 1000 to handle large spreadsheets cleanly
    const chunkSize = 1000;
    let totalUpserted = 0;
    let totalModified = 0;

    for (let i = 0; i < ops.length; i += chunkSize) {
      const chunk = ops.slice(i, i + chunkSize);
      const res = await FreeDeliveryLocation.bulkWrite(chunk, { ordered: false });
      totalUpserted += res.upsertedCount || 0;
      totalModified += res.modifiedCount || 0;
    }

    const totalCount = await FreeDeliveryLocation.countDocuments({ isActive: true });

    return NextResponse.json({
      success: true,
      message: `Free delivery locations uploaded successfully! Total Rows: ${rows.length}, Unique: ${uniqueRows.length}, Inserted: ${totalUpserted}, Updated: ${totalModified}, Skipped: ${skipped}`,
      totalRows: rows.length,
      processed: uniqueRows.length,
      inserted: totalUpserted,
      updated: totalModified,
      skipped,
      totalActiveLocations: totalCount,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("Free delivery location bulk upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process bulk upload.",
      },
      { status: 500 }
    );
  }
}
