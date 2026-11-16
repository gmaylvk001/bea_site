import mongoose from "mongoose";


const OrderHistorySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },   // When the status was updated
    status: { 
      type: String, 
      enum: ["Pending", "Accepted", "Cancelled", "Shipped"], 
      required: true 
    },
    comment: { type: String, maxlength: 150 }, // Optional comment
    customer_notified: { type: Boolean, default: false } // whether customer got notified
  },
  { _id: false } // prevent automatic _id for subdocs
);

const OrderSchema = new mongoose.Schema(
  {
  user_id:{ type: String, required: true},
  order_username : { type: String, required: true },
  order_phonenumber: { type: String, required: true },
  email_address: { type: String, required: true },
   order_item: [{
      id: { type: Number },
      name: { type: String },
      price: { type: Number },
      actual_price: { type: Number },
      item_code: { type: String },
      model:{ type: String },
      coupondiscount:{ type: Number},
      coupondetails : { type: [String], default: [] },
      quantity: { type: Number },
      store_id: { type:String },
      warranty: { type:Number },
      extendedWarranty:{ type: Number },
        warrantyData: {
        item_no: { type: String, default: null },
        name: { type: String, default: null },
        year: { type: Number, default: null },
        price: { type: Number, default: null },
       
      },
      image: { type:String },
      original_quantity:{ type: Number },
      discount: { type:Number },
      created_at: { type: Date, default: Date.now },
      updated_at: { type: Date, default: Date.now }
    }],
  order_details: [{
    item_code: String,
    product_id: Number,
    product_name: String,
    product_price: Number,
    model: String,
    user_id: String,
    coupondiscount: Number,
    created_at: Date,
    updated_at: Date,
    quantity: Number,
    store_id: String,
    orderNumber: String
  }],
   order_amount:{ type: String, required: true},
  order_deliveryaddress:{ type: String},
  customer_comments: {
  type: String,
  default: "",
},

  payment_method:{ type: String},
  payment_type:{ type: String},
  delivery_type: { 
      type: String,
      enum: ["home", "store_pickup"],
      default: "standard"
    },
    pickup_store: { type: String },  // Store name for pickup
    store_id: { type: String },   
  //delivery_type:{ type: String},
  payment_id:{ type: String},
  order_number:{ type: String, required: true},
  razorpay_order_id: { type: String, default: null },
  payment_gateway_method: { type: String, default: null },
  payment_confirmation_source: {
    type: String,
    enum: ["razorpay", "cod_admin", "admin_manual"],
    default: null,
  },
  payment_verified_at: { type: Date, default: null },
  invoice_gross_amount: { type: Number, default: null },
  invoice_net_amount: { type: Number, default: null },
  user_adddeliveryid:{ type: String},
   delivery_date: { type: Date },
  order_status: {
    type: String,
    enum: ["pending", "cancelled", "shipped","Order Placed","Failure","payment_initialized"],
    default: "pending",
  },
  payment_status: {
    type: String,
    enum: ["paid", "pending","payment_initialized"],
    default: "unpaid",
  },
  api_status: {
    type: String,
  },
  api_reason: {
    type: String,
  },

  loyalty_points_awarded: { type: Number, default: 0 },
  truco_transaction_id: { type: String, default: null },
  loyalty_current_balance: { type: Number, default: null },
  loyalty_award_status: { type: String, enum: ["pending", "succeeded", "failed"], default: undefined },
  loyalty_award_error: { type: String, default: null },
  loyalty_points_redeemed: { type: Number, default: 0 },
loyalty_discount: { type: Number, default: 0 },
loyalty_redemption_token: { type: String, default: null },
loyalty_redemption_expires_at: { type: Date, default: null },
loyalty_redemption_processed_at: { type: Date, default: null },
loyalty_redemption_status: {
  type: String,
  enum: ["pending", "succeeded", "failed", "cancelled", "cancel_pending"],
  default: undefined,
},
loyalty_redemption_error: { type: String, default: null },
loyalty_refund_status: { type: String, enum: ["pending", "succeeded", "failed"], default: undefined },
loyalty_refund_error: { type: String, default: null },
delivery_charge: { type: Number, default: null },
points_per_currency_unit: { type: Number, default: null },
promotion_code_applied: { type: String, default: null },
promotion_is_truco: { type: Boolean, default: false },
promotion_discount_applied: { type: Number, default: 0 },
promotion_transaction_amount: { type: Number, default: 0 },
promotion_cart_items: [{
  sku: { type: String, default: "" },
  brand: { type: String, default: "" },
  category: { type: String, default: "" },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
}],
promotion_redemption_status: {
  type: String,
  enum: ["pending", "succeeded", "failed", "cancelled"],
  default: undefined,
},
promotion_redemption_error: { type: String, default: null },
gst_number: { type: String, default: null },
  gst_business_name: { type: String, default: null },
  gst_name: { type: String, default: null },


    order_history: [OrderHistorySchema]
},

  { timestamps: true }
);

// Ensure updated schema fields are applied after hot reload
if (mongoose.models.ecom_order_info) {
  delete mongoose.models.ecom_order_info;
}

export default mongoose.model("ecom_order_info", OrderSchema);
