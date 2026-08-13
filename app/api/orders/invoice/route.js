import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";
import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";

function loadBeaLogo() {
  const candidates = [
    path.join(process.cwd(), "public", "uploads", "beaHqlogo.png"),
    path.join(process.cwd(), "public", "logo.png"),
    path.join(process.cwd(), "public", "images", "logo", "logo.png"),
  ];

  for (const logoPath of candidates) {
    try {
      if (fs.existsSync(logoPath)) {
        const base64 = fs.readFileSync(logoPath).toString("base64");
        return `data:image/png;base64,${base64}`;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const order_number = searchParams.get("order_id");

  if (!order_number) {
    return NextResponse.json({ error: "Order number is required" }, { status: 400 });
  }

  try {
    await dbConnect();

    const order = await EcomOrderInfo.findOne({ order_number });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items =
      Array.isArray(order.order_item) && order.order_item.length > 0
        ? order.order_item.map((item) => ({
            name: item.name || item.product_name || "Item",
            price: Number(item.price ?? item.product_price ?? 0),
            qty: Number(item.quantity ?? 1),
          }))
        : Array.isArray(order.order_details)
          ? order.order_details.map((item) => ({
              name: item.product_name || item.name || "Item",
              price: Number(item.product_price ?? item.price ?? 0),
              qty: Number(item.quantity ?? 1),
            }))
          : [];

    const logoData = loadBeaLogo();
    const doc = new jsPDF();

    const addLogo = () => {
      if (!logoData) return;
      // A4 width 210mm — place BEA HQ logo at top-right of every page
      doc.addImage(logoData, "PNG", 152, 6, 48, 20);
    };

    const startNewPage = () => {
      doc.addPage();
      addLogo();
      return 30; // content starts below logo
    };

    addLogo();
    let y = 30;

    doc.setFontSize(18);
    doc.text("Invoice", 105, y, { align: "center" });
    y += 12;

    doc.setFontSize(11);
    const lines = [
      `Order Number: ${order.order_number || "-"}`,
      `Customer Name: ${order.order_username || "-"}`,
      `Phone Number: ${order.order_phonenumber || "-"}`,
      `Email: ${order.email_address || "-"}`,
      `Payment Method: ${order.payment_method || "-"}`,
      `Delivery Address: ${order.order_deliveryaddress || "-"}`,
      `Order Status: ${order.order_status || "-"}`,
      `Payment Status: ${order.payment_status || "-"}`,
    ];

    const gstBusinessName = order.gst_business_name || order.gst_name || "";
    const gstNumber = order.gst_number || "";

    if (gstBusinessName || gstNumber) {
      lines.push("---- GST Invoice Details ----");
      lines.push(`Business Name: ${gstBusinessName || "-"}`);
      lines.push(`GSTIN Number: ${gstNumber || "-"}`);
    }

    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, 180);
      if (y + wrapped.length * 6 > 270) {
        y = startNewPage();
      }
      doc.text(wrapped, 14, y);
      y += wrapped.length * 6;
    });

    y += 6;
    if (y > 270) y = startNewPage();
    doc.setFontSize(13);
    doc.text("Items:", 14, y);
    y += 8;
    doc.setFontSize(11);

    if (items.length === 0) {
      if (y > 270) y = startNewPage();
      doc.text("No items found for this order.", 14, y);
      y += 7;
    } else {
      items.forEach((item, index) => {
        const line = `${index + 1}. ${item.name} (Qty: ${item.qty}) - Rs ${item.price}`;
        const wrapped = doc.splitTextToSize(line, 180);
        if (y + wrapped.length * 6 > 270) {
          y = startNewPage();
        }
        doc.text(wrapped, 14, y);
        y += wrapped.length * 6;
      });
    }

    y += 8;
    if (y > 270) y = startNewPage();
    doc.setFontSize(12);
    doc.text(`Total Amount: Rs ${order.order_amount ?? 0}`, 196, y, { align: "right" });

    // Ensure logo is present on every page (including any missed pages)
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addLogo();
    }

    const arrayBuffer = doc.output("arraybuffer");

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice_${order.order_number}.pdf`,
      },
    });
  } catch (error) {
    console.error("Invoice generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
