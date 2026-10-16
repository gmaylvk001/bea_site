import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/ecom_cart_info";
import Product from "@/models/product";
import ComboProduct from "@/models/ComboProduct";
import jwt from "jsonwebtoken";

/** Utils **/
const extractToken = (req) => {
  const authHeader = req.headers.get("authorization");
  return authHeader?.split(" ")[1];
};

const verifyToken = (token) => {
  if (!token) throw new Error("Authorization token required");
   try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    } else {
      throw new Error("Invalid token");
    }
  }
};

const calculateCartTotals = (items) => {
  let totalItems = 0;
  let totalPrice = 0;

  for (const item of items) {
    const base = item.price * item.quantity;
    const warranty = item.warranty || 0;
    const extended = item.extendedWarranty || 0;
    const upsells = item.upsells?.reduce((uSum, u) => uSum + (u.price || 0), 0) || 0;

    totalItems += item.quantity;
    totalPrice += base + warranty + extended + upsells;
  }

  return { totalItems, totalPrice };
};

/** POST - Add to Cart **/
export async function POST(req) {
  try {
    await connectDB();

    let userId = null;
    let guestId = null;

    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch {
        // ignore if invalid/expired, fallback to guest
      }
    }

    const {
  productId,
  original_prod_quantity,
  quantity = 1,
  selectedWarranty = 0,
  selectedExtendedWarranty = 0,
  upsellProducts = [],
  guestCartId,
  warrantyData = null,
  
} = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    let isComboItem = false;
    let comboDoc = null;
    let product = await Product.findById(productId);

    if (!product) {
      comboDoc = await ComboProduct.findById(productId);
      if (comboDoc) {
        isComboItem = true;
      } else {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }

    if (isComboItem && comboDoc) {
      // Validate combo status and offer lifecycle dates on server!
      if (comboDoc.status !== "Active") {
        return NextResponse.json(
          { error: "This combo offer is currently unavailable." },
          { status: 400 }
        );
      }
      const now = new Date();
      if (now < new Date(comboDoc.offer_start)) {
        return NextResponse.json(
          { error: "This combo offer has not started yet." },
          { status: 400 }
        );
      }
      if (now > new Date(comboDoc.offer_end)) {
        return NextResponse.json(
          { error: "This combo offer has expired." },
          { status: 400 }
        );
      }
      if (comboDoc.quantity <= 0) {
        return NextResponse.json(
          { error: "This combo offer is out of stock." },
          { status: 400 }
        );
      }
    }

    // choose key
    const query = userId ? { userId } : { guestId: guestCartId };
    let cart = await Cart.findOne(query);

    if (!cart) {
      cart = new Cart({ ...(userId ? { userId } : { guestId: guestCartId }), items: [] });
    }

    // add/update item
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;

      const availableQty = isComboItem ? comboDoc.quantity : (original_prod_quantity || product.quantity);
      if (availableQty && availableQty < cart.items[existingItemIndex].quantity) {
        return NextResponse.json(
          { error: "Requested quantity exceeds available stock." },
          { status: 409 }
        );
      }
      cart.items[existingItemIndex].warranty = selectedWarranty;
      cart.items[existingItemIndex].extendedWarranty = selectedExtendedWarranty;
      cart.items[existingItemIndex].warrantyData = warrantyData;
    } else {
      if (isComboItem && comboDoc) {
        cart.items.push({
          item_code: comboDoc.slug,
          productId: comboDoc._id,
          quantity,
          price: comboDoc.combo_price,
          name: comboDoc.name,
          image: comboDoc.images?.[0] || "",
          warranty: 0,
          extendedWarranty: 0,
          warrantyData: null,
          actual_price: comboDoc.combo_mrp || comboDoc.combined_mrp || comboDoc.combo_price,
          isCombo: true,
          comboId: comboDoc._id,
        });
      } else {
        cart.items.push({
          item_code: product.item_code,
          productId,
          quantity,
          price: product.special_price ?? product.price,
          name: product.name,
          image: product.images[0],
          warranty: selectedWarranty,
          extendedWarranty: selectedExtendedWarranty,
          warrantyData: warrantyData,
          actual_price: product.special_price ?? product.price,
        });
      }
    }

    // totals
    const totals = calculateCartTotals(cart.items);
    cart.totalItems = totals.totalItems;
    cart.totalPrice = totals.totalPrice;

    await cart.save();

    return NextResponse.json(
      { message: "Product added", cart: { id: cart._id, ...totals, items: cart.items } },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST cart error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


/** GET - Fetch Cart **/
export async function GET(req) {
  try {
    
    
    let guestId = null;
    let cart = null;
    //let guestCartId = null;
    await connectDB();
    const token = extractToken(req);
    const productdata = [];
    if(token)
    {
    const decoded = verifyToken(token);
    const userId = decoded.userId;
    

    cart = await Cart.findOne({ userId }).populate(
      "items.productId",
      "name price images item_code quantity key_specifications"
    );

    }
    else
    {

      const guestId_use = req.headers.get("GuestCartId");
      guestId = guestId_use;
      cart = await Cart.findOne({  guestId }).populate(
      "items.productId",
      "name price images item_code quantity"
     );

    }

    if (!cart) {
      return NextResponse.json(
        { message: "Cart is empty", cart: { items: [], totalItems: 0, totalPrice: 0 } },
        { status: 200 }
      );
    }
     
      const items = await Promise.all(
      cart.items.map(async (item) => {
        if (!item.productId || item.isCombo) {
          // Check if this item is a combo product
          const comboId = item.comboId || (item.productId?._id ? item.productId._id : item.productId);
          const combo = await ComboProduct.findById(comboId).lean();
          if (combo) {
            const now = new Date();
            const isOfferEnded =
              combo.status !== "Active" ||
              now > new Date(combo.offer_end) ||
              now < new Date(combo.offer_start);
            const isOutOfStock = Number(combo.quantity) <= 0;
            const img = combo.images?.[0] || "";
            const formattedImg = img.startsWith("/uploads/") ? img.replace(/^\/uploads\/(products\/|combos\/)?/, "") : img;
            return {
              original_quantity: isOfferEnded ? 0 : (combo.quantity ?? 10),
              item_code: combo.slug,
              productId: combo._id,
              name: combo.name,
              price: item.price ?? combo.combo_price,
              image: img || formattedImg,
              fullImage: img,
              quantity: item.quantity,
              warranty: 0,
              extendedWarranty: 0,
              warrantyData: null,
              actual_price: combo.combo_mrp || combo.combined_mrp || combo.combo_price,
              specs: [`${combo.products?.length || 0} Products Combo`],
              isCombo: true,
              isExpired: isOfferEnded,
              isOfferEnded: isOfferEnded,
              isOutOfStock: isOutOfStock,
              stock_status: isOfferEnded ? "Offer Expired" : (isOutOfStock ? "Out of Stock" : "In Stock"),
              offer_start: combo.offer_start,
              offer_end: combo.offer_end,
            };
          }
          return {
            original_quantity: 0,
            item_code: item.item_code || "",
            productId: item.productId,
            name: item.name || "Product",
            price: item.price || 0,
            image: item.image || "",
            quantity: item.quantity,
            warranty: 0,
            extendedWarranty: 0,
            warrantyData: null,
            actual_price: item.actual_price || item.price || 0,
            specs: [],
            isCombo: item.isCombo || false,
            isExpired: item.isCombo ? true : false,
            isOfferEnded: item.isCombo ? true : false,
            stock_status: item.isCombo ? "Offer Expired" : "Unavailable",
          };
        }

        const original_quantity = await getQuantity(item.productId.item_code);
        return {
          original_quantity,
          item_code: item.productId.item_code,
          productId: item.productId._id,
          name: item.productId.name,
          price: item.price,
          image: item.productId.images?.[0] || item.image || "",
          quantity: item.quantity,
          warranty: item.warranty || 0,
          extendedWarranty: item.extendedWarranty || 0,
          warrantyData: item.warrantyData || null,
          actual_price: item.productId.price,
          specs: item.productId.key_specifications?.slice(0, 3) || [], 
          isCombo: item.isCombo || false,
        };
      })
    );

    return NextResponse.json(
      {
        cart: {
          id: cart._id,
          totalItems: cart.totalItems,
          totalPrice: cart.totalPrice,
          items,
        },
        products:{productdata},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET cart error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getQuantity(item_code) {
  if (!item_code) return null;
  const product = await Product.findOne({ item_code }).lean();
  if (product) return product.quantity ?? null;
  const combo = await ComboProduct.findOne({ slug: item_code }).lean();
  if (combo) {
    const now = new Date();
    const isOfferEnded = combo.status !== "Active" || now > new Date(combo.offer_end) || now < new Date(combo.offer_start);
    if (isOfferEnded) return 0;
    return combo.quantity ?? null;
  }
  return null;
}

/** PUT - Update Quantity **/
export async function PUT(req) {
  try {
    let guestId = null;
    let cart = null;

    await connectDB();

    const { productId, quantity } = await req.json();
    if (!productId || quantity < 1) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const token = extractToken(req);
    if(token)
    {
    const decoded = verifyToken(token);
    const userId = decoded.userId;
    cart = await Cart.findOne({ userId });
    }
    else
    {
      guestId = req.headers.get("GuestCartId");
      cart = await Cart.findOne({ guestId });
    }

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Product not in cart" }, { status: 404 });
    }

    // Check if combo item has expired
    if (cart.items[itemIndex].isCombo) {
      const comboId = cart.items[itemIndex].comboId || cart.items[itemIndex].productId;
      const combo = await ComboProduct.findById(comboId).lean();
      const now = new Date();
      if (!combo || combo.status !== "Active" || now > new Date(combo.offer_end) || now < new Date(combo.offer_start)) {
        return NextResponse.json(
          { error: "This combo offer has expired and can no longer be updated or purchased." },
          { status: 400 }
        );
      }
    }

    cart.items[itemIndex].quantity = quantity;
    const item_code = cart.items[itemIndex].item_code;
    const original_quantity = await getQuantity(item_code);
    const totals = calculateCartTotals(cart.items);
    cart.totalItems = totals.totalItems;
    cart.totalPrice = totals.totalPrice;
    cart.items[itemIndex].original_quantity = original_quantity;

    await cart.save();
    const items = cart.items.map((item) => ({
      productId: item.productId?._id || item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
      item_code: item.item_code,
      original_quantity: item.original_quantity ?? null,
      isCombo: item.isCombo || false,
    }));


    return NextResponse.json(
      {
        message: "Cart updated",
        cart: {
          id: cart._id,
          ...totals,
          items: items,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT cart error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




export async function DELETE(req) {
  try {
    await connectDB();
    let guestId = null;
    let cart = null;
    
    /*
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId; */

    const { productId, clearAll } = await req.json();

    const token = extractToken(req);
    if(token)
    {
    const decoded = verifyToken(token);
    const userId = decoded.userId;
    cart = await Cart.findOne({ userId });
    }
    else
    {
      guestId = req.headers.get("GuestCartId");
      cart = await Cart.findOne({ guestId });
    }

    //const cart = await Cart.findOne({ userId });
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    if (clearAll) {
      // Clear the entire cart
      cart.items = [];
      cart.totalItems = 0;
      cart.totalPrice = 0;
    } else {
      // Remove a specific item
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (existingItemIndex === -1) {
        return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
      }

      cart.items.splice(existingItemIndex, 1);

      // Recalculate totals
      cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    await cart.save();

    return NextResponse.json(
      {
        message: clearAll ? "Cart cleared" : "Item removed from cart",
        cart: {
          id: cart._id,
          totalItems: cart.totalItems,
          totalPrice: cart.totalPrice,
          items: cart.items
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Remove from cart error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update cart" },
      { status: 500 }
    );
  }
}



function getCartOwner(req) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return { userId: decoded.userId, guestCartId: null };
    } catch {
      return { userId: null, guestCartId: null }; // invalid token
    }
  }

  // Guest cart fallback
  return { userId: null, guestCartId: req.headers.get("x-guest-cart-id") };
}