import Product from "@/models/product";
import Wishlist from "@/models/ecom_wishlist_info";
import User from "@/models/User";
import WishlistMailCronConfig from "@/models/wishlist_mail_cron_config";
import WishlistMailLog from "@/models/wishlist_mail_log";
import {
  buildWishlistMailEygrParams,
  sendEygrWishlistMail,
} from "@/lib/wishlistMailEygr";

export async function getWishlistMailConfig() {
  let config = await WishlistMailCronConfig.findOne({ key: "default" });
  if (!config) {
    config = await WishlistMailCronConfig.create({
      maxMailsPerUser: 2,
      mailCooldownDays: 15,
      cronTime: "12:00",
    });
  }
  return config;
}

/** Mark product for wishlist reminder mails when someone adds it. */
export async function enableProductMailSending(productId) {
  if (!productId) return;
  await Product.updateOne(
    { _id: productId },
    {
      $set: {
        productMailsending: true,
        mailSendingStartedAt: new Date(),
      },
    }
  );
}

function parseCronTime(cronTime = "12:00") {
  const [h, m] = String(cronTime || "12:00").split(":").map((n) => Number(n));
  return {
    hour: Number.isFinite(h) ? h : 12,
    minute: Number.isFinite(m) ? m : 0,
  };
}

/** Test allowlist — only these inboxes get wishlist/cron mails when enabled. */
const WISHLIST_MAIL_TEST_ALLOWLIST_DEFAULT = [
  "hariharann2026@gmail.com",
  "hariharann2028@gmail.com",
  "hariharan.g@eywamedia.com",
];

export function isWishlistMailTestAllowlistEnabled() {
  // Off by default — only enable with WISHLIST_MAIL_TEST_ALLOWLIST=true
  const flag = String(process.env.WISHLIST_MAIL_TEST_ALLOWLIST || "false")
    .trim()
    .toLowerCase();
  return flag === "1" || flag === "true" || flag === "on";
}

export function getWishlistMailTestAllowlist() {
  const fromEnv = String(process.env.WISHLIST_MAIL_TEST_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (fromEnv.length) return fromEnv;
  return WISHLIST_MAIL_TEST_ALLOWLIST_DEFAULT.map((e) => e.toLowerCase());
}

export function isEmailOnWishlistTestAllowlist(email) {
  if (!isWishlistMailTestAllowlistEnabled()) return true;
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  return getWishlistMailTestAllowlist().includes(normalized);
}

export function isWithinCronWindow(config, now = new Date(), windowMinutes = 20) {
  if (!config?.enabled) return false;

  const days = Array.isArray(config.cronDays) ? config.cronDays : [0, 1, 2, 3, 4, 5, 6];
  if (!days.includes(now.getDay())) return false;

  const { hour, minute } = parseCronTime(config.cronTime);
  const scheduled = new Date(now);
  scheduled.setHours(hour, minute, 0, 0);

  const diffMs = now.getTime() - scheduled.getTime();
  if (diffMs < 0 || diffMs > windowMinutes * 60 * 1000) return false;

  if (config.lastRunAt) {
    const last = new Date(config.lastRunAt);
    if (
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate() &&
      last.getHours() === hour
    ) {
      return false;
    }
  }

  return true;
}

async function sendWishlistReminderEmail({
  to,
  userName,
  product,
  siteUrl,
}) {
  const wishlistUrl = `${siteUrl}/wishlist`;
  const params = buildWishlistMailEygrParams({
    userName,
    productName: product?.name,
    wishlistUrl,
  });

  const result = await sendEygrWishlistMail(to, params);
  if (!result.ok) {
    throw new Error(
      `Eygr wishlist mail failed (${result.status}): ${JSON.stringify(result.data)}`
    );
  }
  return result;
}

function isUserEligible(item, config, now = new Date()) {
  if (item?.alertsEnabled === false) return false;

  if ((item.mailsSent || 0) >= Number(config.maxMailsPerUser || 2)) return false;

  if (item.lastNotifiedAt) {
    const cooldownDays = Number(config.mailCooldownDays || 15);
    if (cooldownDays > 0) {
      const nextAllowed = new Date(item.lastNotifiedAt);
      nextAllowed.setDate(nextAllowed.getDate() + cooldownDays);
      if (now < nextAllowed) return false;
    }
  }

  return true;
}

/**
 * Admin Run now: send 1 mail to a specific inbox (same as Send test),
 * but params come from a real wishlist row in the DB.
 */
export async function sendOneWishlistMailToEmail(targetEmail) {
  const email = String(targetEmail || "").trim().toLowerCase();
  if (!email) {
    return { success: false, error: "email is required", sent: 0 };
  }

  if (!isEmailOnWishlistTestAllowlist(email)) {
    return {
      success: false,
      error: `Test allowlist is ON — only these emails are allowed: ${getWishlistMailTestAllowlist().join(", ")}`,
      sent: 0,
      allowlist: getWishlistMailTestAllowlist(),
    };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.ORDER_EMAIL_SITE_URL ||
    "https://www.bharathelectronics.in";

  // Prefer a wishlist row that belongs to this email
  let user = await User.findOne({
    email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
  }).lean();

  let item = null;
  let product = null;

  if (user?._id) {
    item = await Wishlist.findOne({
      userId: user._id,
      alertsEnabled: { $ne: false },
    }).sort({ updatedAt: -1, createdAt: -1 });
  }

  // Fallback: any wishlist row with a valid product
  if (!item) {
    const candidates = await Wishlist.find({ alertsEnabled: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(40);
    for (const row of candidates) {
      const p = await Product.findById(row.productId).lean();
      if (p?.name) {
        item = row;
        product = p;
        if (!user) {
          user = await User.findById(row.userId).lean();
        }
        break;
      }
    }
  }

  if (!product && item) {
    product = await Product.findById(item.productId).lean();
  }

  if (!product?.name) {
    return {
      success: false,
      error: "No wishlist product found in DB to build the mail",
      sent: 0,
    };
  }

  const userName = user?.name || "Customer";
  const params = buildWishlistMailEygrParams({
    userName,
    productName: product.name,
    wishlistUrl: `${siteUrl}/wishlist`,
  });

  const result = await sendEygrWishlistMail(email, params);
  if (!result.ok) {
    return {
      success: false,
      error: `Eygr failed (${result.status}): ${JSON.stringify(result.data)}`,
      sent: 0,
      params,
      result,
    };
  }

  // Update counters only when mail went to the real wishlist owner
  if (item && user?.email && String(user.email).toLowerCase() === email) {
    item.mailsSent = (item.mailsSent || 0) + 1;
    item.lastNotifiedAt = new Date();
    await item.save();
  }

  if (user?._id || item?.userId) {
    await WishlistMailLog.create({
      userId: user?._id || item.userId,
      userName,
      userEmail: email,
      productId: product._id,
      productName: product.name,
      productSlug: product.slug || "",
      mailNumber: item?.mailsSent || 1,
      wishlistId: item?._id || null,
    }).catch((err) => console.error("wishlist log create failed:", err));
  }

  return {
    success: true,
    sent: 1,
    email,
    userName,
    productName: product.name,
    params,
    result,
  };
}

/**
 * Send wishlist reminder mails based on admin settings:
 * max mails per user/product, days between mails, cron time/days.
 * Finds wishlist items directly (does not rely only on productMailsending flag).
 */
export async function processWishlistMails({
  force = false,
  ignoreLimits = false,
  maxForceSends = 10,
} = {}) {
  const config = await getWishlistMailConfig();
  const now = new Date();

  if (!force && !isWithinCronWindow(config, now)) {
    return {
      skipped: true,
      reason: config.enabled
        ? "Outside cron window or already ran for this slot"
        : "Cron disabled",
      sent: 0,
      productsProcessed: 0,
    };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.ORDER_EMAIL_SITE_URL ||
    "https://www.bharathelectronics.in";

  // All active wishlist rows (alerts on). Flag alone was clearing after 1 send.
  const wishlistItems = await Wishlist.find({
    alertsEnabled: { $ne: false },
  });

  console.log("Wishlist mail run starting:", {
    force,
    ignoreLimits,
    wishlistItems: wishlistItems.length,
    maxMailsPerUser: config.maxMailsPerUser,
    siteUrl,
    testAllowlistEnabled: isWishlistMailTestAllowlistEnabled(),
    testAllowlist: isWishlistMailTestAllowlistEnabled()
      ? getWishlistMailTestAllowlist()
      : null,
  });

  let sent = 0;
  let skippedIneligible = 0;
  let skippedNoUser = 0;
  let skippedNoProduct = 0;
  let skippedNotAllowlisted = 0;
  const productsTouched = new Set();
  const details = [];

  for (const item of wishlistItems) {
    // Admin "Run now" can ignore caps; cron always respects them.
    if (!ignoreLimits && !isUserEligible(item, config, now)) {
      skippedIneligible += 1;
      continue;
    }
    if (ignoreLimits && sent >= Number(maxForceSends || 10)) {
      break;
    }

    const user = await User.findById(item.userId).lean();
    if (!user?.email) {
      skippedNoUser += 1;
      continue;
    }

    if (!isEmailOnWishlistTestAllowlist(user.email)) {
      skippedNotAllowlisted += 1;
      continue;
    }

    const product = await Product.findById(item.productId).lean();
    if (!product) {
      skippedNoProduct += 1;
      continue;
    }

    productsTouched.add(String(product._id));
    const mailNumber = (item.mailsSent || 0) + 1;

    try {
      await sendWishlistReminderEmail({
        to: user.email,
        userName: user.name || "Customer",
        product,
        siteUrl,
      });

      item.mailsSent = mailNumber;
      item.lastNotifiedAt = now;
      await item.save();

      // Keep product flagged while any eligible users remain (for cron visibility)
      await Product.updateOne(
        { _id: product._id },
        {
          $set: {
            productMailsending: true,
            mailSendingStartedAt: product.mailSendingStartedAt || now,
          },
        },
      );

      await WishlistMailLog.create({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        productId: product._id,
        productName: product.name,
        productSlug: product.slug || "",
        mailNumber,
        wishlistId: item._id,
      });

      sent += 1;
      details.push({
        userEmail: user.email,
        productName: product.name,
        mailNumber,
        eygr: "sent",
      });
    } catch (err) {
      console.error("Wishlist reminder mail failed:", err);
      details.push({
        userEmail: user?.email,
        productName: product.name,
        error: err.message || String(err),
        eygr: "failed",
      });
    }
  }

  // Clear product flag when nobody left under the normal (non-force) cap
  let productsCleared = 0;
  for (const productId of productsTouched) {
    const remaining = await Wishlist.find({ productId });
    const anyStillPending = remaining.some((w) => {
      if (w.alertsEnabled === false) return false;
      return (w.mailsSent || 0) < Number(config.maxMailsPerUser || 2);
    });
    if (!anyStillPending) {
      await Product.updateOne(
        { _id: productId },
        { $set: { productMailsending: false } },
      );
      productsCleared += 1;
    }
  }

  const stats = {
    sent,
    productsProcessed: productsTouched.size,
    productsCleared,
    wishlistItems: wishlistItems.length,
    skippedIneligible,
    skippedNoUser,
    skippedNoProduct,
    skippedNotAllowlisted,
    testAllowlistEnabled: isWishlistMailTestAllowlistEnabled(),
    testAllowlist: isWishlistMailTestAllowlistEnabled()
      ? getWishlistMailTestAllowlist()
      : undefined,
  };

  config.lastRunAt = now;
  config.lastRunStats = stats;
  await config.save();

  return {
    skipped: false,
    sent,
    productsProcessed: productsTouched.size,
    productsCleared,
    details,
    stats,
    config: {
      maxMailsPerUser: config.maxMailsPerUser,
      mailCooldownDays: config.mailCooldownDays,
    },
    hint:
      sent === 0
        ? `No mails sent. Found ${wishlistItems.length} wishlist row(s); skippedIneligible=${skippedIneligible}, skippedNoUser=${skippedNoUser}, skippedNoProduct=${skippedNoProduct}, skippedNotAllowlisted=${skippedNotAllowlisted}. Check maxMailsPerUser=${config.maxMailsPerUser} / cooldown / allowlist (${isWishlistMailTestAllowlistEnabled() ? getWishlistMailTestAllowlist().join(", ") : "OFF"}).`
        : undefined,
  };
}
