import dbConnect from "@/lib/db";
import EcomOrderInfo from "@/models/ecom_order_info";
import Product from "@/models/product";
import ComboProduct from "@/models/ComboProduct";
import mongoose from 'mongoose';
import Brand from "@/models/ecom_brand_info";
import Category from "@/models/ecom_category_info";
import Coupon from '@/models/ecom_offer_info';
import Usedcoupon from '@/models/ecom_coupon_track_info';

async function buildTrucoPromotionCartItems(orderItems) {
  return Promise.all(orderItems.map(async (item) => {
    let product = null;
    if (item.productId && mongoose.isValidObjectId(item.productId)) {
      product = await Product.findById(item.productId)
        .select("brand category sub_category sub_category_new_name")
        .lean();
    }
    if (!product && item.item_code) {
      product = await Product.findOne({ item_code: item.item_code })
        .select("brand category sub_category sub_category_new_name")
        .lean();
    }

    const rawBrand = product?.brand;
    const brandId = rawBrand && typeof rawBrand === "object"
      ? rawBrand._id || rawBrand.id
      : rawBrand;
    const brandDocument = brandId && mongoose.isValidObjectId(brandId)
      ? await Brand.findById(brandId).select("brand_name").lean()
      : null;

    const rawCategory = product?.sub_category || product?.category;
    const categoryId = rawCategory && typeof rawCategory === "object"
      ? rawCategory._id || rawCategory.id
      : rawCategory;
    const categoryDocument = categoryId && mongoose.isValidObjectId(categoryId)
      ? await Category.findById(categoryId).select("category_name").lean()
      : null;

    return {
      sku: item.item_code || String(item.productId || ""),
      brand: brandDocument?.brand_name ||
        (typeof rawBrand === "string" && !mongoose.isValidObjectId(rawBrand) ? rawBrand : item.brand || ""),
      category: categoryDocument?.category_name ||
        product?.sub_category_new_name ||
        (typeof rawCategory === "string" && !mongoose.isValidObjectId(rawCategory) ? rawCategory : item.category || ""),
      price: Number(item.price) > 0 ? Number(item.price) : Number(item.actual_price) || 0,
      quantity: Number(item.quantity) || 0,
    };
  }));
}

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();

    const {
      user_id,
      order_username,
      order_phonenumber,
      order_item,
      order_amount,
      order_deliveryaddress,
      customer_comments, // IMPORTANT
      payment_method,
      payment_type,
      payment_id,
      order_status,
      delivery_type,
      order_number,
      order_details,
      user_adddeliveryid,
      email_address,
      loyalty_points_redeemed,
      loyalty_discount,
      loyalty_bill_total,
      loyalty_redemption_token,
      loyalty_redemption_expires_at,
      delivery_charge,
      promotion_code_applied,
      promotion_is_truco,
      promotion_discount_applied,
      promotion_transaction_amount,
      promotion_cart_items,
      pickup_store,
      store_id,
      gst_number,
      gst_business_name,
      gst_name,
    } = body;

    // Validate required fields
    if (!user_id || !email_address || !order_phonenumber || !order_item?.length || !order_amount) {
      return Response.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }
    const finalPayableAmount = Number(order_amount);
    if (!Number.isFinite(finalPayableAmount) || finalPayableAmount <= 0) {
      return Response.json({ success: false, message: "A valid final payable amount is required" }, { status: 400 });
    }

    const normalizedPaymentMethod = String(payment_method || "").trim().toLowerCase();
    const hasTrucoCoupon = promotion_is_truco === true;
    if (hasTrucoCoupon && !String(promotion_code_applied || "").trim()) {
      return Response.json(
        { success: false, message: "A coupon code is required for this Truco promotion." },
        { status: 400 }
      );
    }
    if (
      hasTrucoCoupon &&
      !["online", "emi"].includes(normalizedPaymentMethod)
    ) {
      return Response.json(
        { success: false, message: "Truco coupons are available for online and EMI orders only" },
        { status: 400 }
      );
    }

    const hasLoyaltyRedemptionDetails =
      Boolean(loyalty_redemption_token) ||
      Number(loyalty_points_redeemed) > 0 ||
      Number(loyalty_discount) > 0;
    if (hasLoyaltyRedemptionDetails) {
      const validatedBillTotal = Number(loyalty_bill_total);
      const redeemedPoints = Number(loyalty_points_redeemed);
      const appliedLoyaltyDiscount = Number(loyalty_discount);
      if (
        !loyalty_redemption_token ||
        !Number.isFinite(redeemedPoints) || redeemedPoints <= 0 ||
        !Number.isFinite(appliedLoyaltyDiscount) || appliedLoyaltyDiscount <= 0 ||
        !Number.isFinite(validatedBillTotal) || validatedBillTotal <= 0 ||
        Math.abs(validatedBillTotal - (finalPayableAmount + appliedLoyaltyDiscount)) > 0.01
      ) {
        return Response.json(
          { success: false, message: "A valid loyalty token and consistent validated bill total are required" },
          { status: 400 }
        );
      }
    }
    if (
      !["online", "emi"].includes(normalizedPaymentMethod) &&
      hasLoyaltyRedemptionDetails
    ) {
      return Response.json(
        { success: false, message: "Loyalty points are available for online and EMI orders only" },
        { status: 400 }
      );
    }

    // Ensure line items have required invoice fields populated (item_code, actual_price, name)
    for (const item of order_item) {
      if (!item.productId && (item.product || item._id || item.id)) {
        item.productId = item.product || item._id || item.id;
      }
      if (item.actual_price == null || item.actual_price === "" || Number.isNaN(Number(item.actual_price))) {
        item.actual_price = item.price != null && !Number.isNaN(Number(item.price)) ? Number(item.price) : 0;
      }
      if (item.price == null || item.price === "" || Number.isNaN(Number(item.price))) {
        item.price = item.actual_price != null && !Number.isNaN(Number(item.actual_price)) ? Number(item.actual_price) : 0;
      }
      const prodId = item.productId || item.product || item._id || item.id;
      if (!String(item.item_code || "").trim() && prodId) {
        try {
          const prod = await Product.findById(prodId).select("item_code price special_price name").lean();
          if (prod) {
            item.item_code = prod.item_code || String(prodId);
            const fallbackPrice = prod.price || prod.special_price || 0;
            if (!item.actual_price && fallbackPrice) item.actual_price = Number(fallbackPrice);
            if (!item.price && fallbackPrice) item.price = Number(fallbackPrice);
            if (!item.name) item.name = prod.name;
          } else {
            item.item_code = String(prodId);
          }
        } catch {
          item.item_code = String(prodId);
        }
      }
      if (!String(item.item_code || "").trim()) {
        item.item_code = String(item.productId || item.product || item.id || item._id || "ITEM");
      }
      if (!String(item.name || "").trim()) {
        item.name = item.product_name || "Product";
      }
    }

    const parsedDeliveryCharge = delivery_charge == null || Number.isNaN(Number(delivery_charge)) ? 0 : Number(delivery_charge);
    const invoiceExtrasAreValid = order_item.every((item) => {
      const warranty = item.warranty == null || Number.isNaN(Number(item.warranty)) ? 0 : Number(item.warranty);
      const extendedWarranty = item.extendedWarranty == null || Number.isNaN(Number(item.extendedWarranty)) ? 0 : Number(item.extendedWarranty);
      return Number.isFinite(warranty) && warranty >= 0 &&
        Number.isFinite(extendedWarranty) && extendedWarranty >= 0;
    });
    const invoiceLineItemsAreComplete = order_item.every((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.actual_price != null && item.actual_price !== "" && !Number.isNaN(Number(item.actual_price)) ? item.actual_price : item.price);
      const hasCode = Boolean(String(item.item_code || item.productId || item.product || item.id || item._id || "").trim());
      const hasName = Boolean(String(item.name || item.product_name || "").trim());
      return hasCode &&
        hasName &&
        Number.isFinite(quantity) && quantity > 0 &&
        Number.isFinite(unitPrice) && unitPrice > 0;
    });
    const invoiceGrossAmount = invoiceLineItemsAreComplete &&
      invoiceExtrasAreValid &&
      Number.isFinite(parsedDeliveryCharge) &&
      parsedDeliveryCharge >= 0
      ? order_item.reduce((total, item) =>
        total +
        Number(item.actual_price != null && item.actual_price !== "" && !Number.isNaN(Number(item.actual_price)) ? item.actual_price : item.price) * Number(item.quantity) +
        (Number(item.warranty) || 0) +
        (Number(item.extendedWarranty) || 0), 0) + parsedDeliveryCharge
      : null;
    if (
      ["online", "emi"].includes(normalizedPaymentMethod) &&
      (!Number.isFinite(invoiceGrossAmount) || invoiceGrossAmount <= 0)
    ) {
      return Response.json(
        { success: false, message: "Order items and delivery charge must contain complete invoice data before online payment" },
        { status: 400 }
      );
    }

    const loyaltyTokenExpiry = loyalty_redemption_expires_at
      ? new Date(loyalty_redemption_expires_at)
      : null;
    if (
      loyalty_redemption_token &&
      (!loyaltyTokenExpiry || !Number.isFinite(loyaltyTokenExpiry.getTime()))
    ) {
      return Response.json(
        { success: false, message: "A valid loyalty redemption token expiry is required" },
        { status: 400 }
      );
    }

    // Validate that no combo products in the order are expired
    const now = new Date();
    for (const item of order_item) {
      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (!product) {
          const combo = await ComboProduct.findById(item.productId);
          if (combo) {
            const isOfferEnded = combo.status !== "Active" || now > new Date(combo.offer_end) || now < new Date(combo.offer_start);
            if (isOfferEnded) {
              return Response.json(
                { success: false, message: `Combo offer "${combo.name}" has expired and cannot be purchased.` },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    const resolvedPromotionCartItems = hasTrucoCoupon
      ? await buildTrucoPromotionCartItems(order_item)
      : [];

    const resolvedGstBusinessName = gst_business_name || gst_name || null;

    const orderFields = {
      user_id,
      order_username,
      order_phonenumber,
      order_item,
      order_amount,
      order_deliveryaddress,
      customer_comments, // IMPORTANT
      payment_method,
      payment_type,
      delivery_type,
      order_number,
      order_details,
      user_adddeliveryid,
      email_address,
      order_status: order_status || "pending",
      payment_status: ["online", "emi"].includes(normalizedPaymentMethod)
        ? "payment_initialized"
        : "pending",
      payment_confirmation_source: null,
      payment_verified_at: null,
      razorpay_order_id: null,
      payment_gateway_method: null,
      invoice_gross_amount: invoiceGrossAmount,
      invoice_net_amount: finalPayableAmount,
      payment_id: ["online", "emi"].includes(normalizedPaymentMethod)
        ? null
        : payment_id || null,
      loyalty_points_redeemed: loyalty_points_redeemed || 0,
      loyalty_discount: loyalty_discount || 0,
      loyalty_bill_total: loyalty_redemption_token && Number.isFinite(Number(loyalty_bill_total)) && Number(loyalty_bill_total) > 0
        ? Number(loyalty_bill_total)
        : null,
      loyalty_redemption_token: loyalty_redemption_token || null,
      loyalty_redemption_expires_at: loyalty_redemption_token ? loyaltyTokenExpiry : null,
      delivery_charge: Number.isFinite(Number(delivery_charge)) && Number(delivery_charge) >= 0
        ? Number(delivery_charge)
        : null,
      promotion_code_applied: hasTrucoCoupon ? String(promotion_code_applied).trim() : null,
      promotion_is_truco: hasTrucoCoupon,
      promotion_discount_applied: hasTrucoCoupon ? Number(promotion_discount_applied) || 0 : 0,
      promotion_transaction_amount: hasTrucoCoupon ? Number(promotion_transaction_amount) || 0 : 0,
      promotion_cart_items: resolvedPromotionCartItems,
      pickup_store: pickup_store || null,
      store_id: store_id || null,
      gst_number: gst_number || null,
      gst_business_name: resolvedGstBusinessName,
      gst_name: resolvedGstBusinessName,
    };

    // Check if order already exists (match by order_number if provided, else user + pending order)
    const existingOrder = order_number
      ? await EcomOrderInfo.findOne({ order_number })
      : null;

    let savedOrder;
    let isNew = false;

    if (existingOrder) {
      if (String(existingOrder.user_id) !== String(user_id)) {
        return Response.json({ success: false, message: "Order does not belong to this customer" }, { status: 403 });
      }
      savedOrder = existingOrder;
    } else {
      // Create new order
      const newOrder = new EcomOrderInfo(orderFields);
      savedOrder = await newOrder.save();
      isNew = true;
    }

    // Only run side-effects (stock deduction, coupon tracking) for new orders
    if (isNew) {
      for (const item of order_item) {
        if (item.productId) {
          const product = await Product.findById(item.productId);
          const discount = item.discount;

          if (discount > 0 && item.coupondetails?.length > 0 && item.coupondetails[0]?._id) {
           const userObjectId = new mongoose.Types.ObjectId(user_id);
          const couponid = new mongoose.Types.ObjectId(item.coupondetails[0]._id);

            const coupon_track = new Usedcoupon({ coupon_id: couponid, user_id: userObjectId });
            await coupon_track.save();

            const updatecoupon = await Coupon.findById(couponid);
            if (updatecoupon) {
              updatecoupon.used_by += 1;
              await updatecoupon.save();
            }
             }

          if (product && product.quantity > 0) {
            product.quantity = product.quantity - item.quantity;
            await product.save();
          } else if (!product) {
            const combo = await ComboProduct.findById(item.productId);
            if (combo && combo.quantity > 0) {
              combo.quantity = Math.max(0, combo.quantity - item.quantity);
              await combo.save();
            }
          }
        }
      }

      // Create notification only for new orders
      try {
        const Notification = require("@/models/Notification.js");
        const notification = new Notification({
          userId: user_id,
          message: `Order #${savedOrder.order_number || savedOrder._id} placed successfully!`,
          orderId: savedOrder._id,
        });
        await notification.save();
      } catch (notifErr) {
        console.error("Notification creation failed:", notifErr);
      }
    }

    return Response.json(
      {
        success: true,
        message: isNew ? "Order created successfully" : "Order updated successfully",
        order: savedOrder,
      },
      { status: isNew ? 201 : 200 }
    );

 } catch (error) {
  console.error("ORDER ERROR:", error.message, error.stack); 
  return Response.json({ 
    success: false, 
    message: "Server error", 
    error: error.message 
  }, { status: 500 });
}
}