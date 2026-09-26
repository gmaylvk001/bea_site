import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const data = [
      ["pincode", "Area", "District"],
      ["605702", "Moongilthuraipattu", "Kallakurichi"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 15 }, { wch: 28 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FreeDeliveryLocations");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Also persist file to public/uploads/files if possible
    try {
      const publicFilesDir = path.join(process.cwd(), "public", "uploads", "files");
      if (!fs.existsSync(publicFilesDir)) {
        fs.mkdirSync(publicFilesDir, { recursive: true });
      }
      const targetFilePath = path.join(publicFilesDir, "free_delivery_pincode_sample.xlsx");
      fs.writeFileSync(targetFilePath, buf);

      // Copy illustration image if available
      const generatedImg = "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\2dabd318-9c9d-4428-9080-9267789279d8\\free_delivery_pincode_bulk_upload_1790401883804.jpg";
      const targetImg = path.join(publicFilesDir, "free-delivery-pincode-bulk-upload.png");
      if (fs.existsSync(generatedImg) && !fs.existsSync(targetImg)) {
        fs.copyFileSync(generatedImg, targetImg);
      }
    } catch (e) {
      console.warn("Could not persist sample file to public folder:", e.message);
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="Free_Delivery_Pincodes_Sample.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Error generating sample excel:", error);
    return NextResponse.json({ error: "Failed to generate sample file" }, { status: 500 });
  }
}
