import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";

export async function POST(req) {
  await dbConnect();

  try {
    const { order_id, order_status } = await req.json();

    if (!order_id || !order_status) {
      return Response.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const updatedOrder = await EcomOrderInfo.findOneAndUpdate(
      { _id: order_id },
      { order_status },
      { new: true }
    );

    if (!updatedOrder) {
      return Response.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return Response.json({ success: true, message: `Order marked as ${order_status}`, order: updatedOrder });

  } catch (error) {
    return Response.json({ success: false, message: "Server error", error: error.message }, { status: 500 });
  }
}
