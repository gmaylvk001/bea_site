import jwt from "jsonwebtoken";
import Product from "@/models/product";
import Wishlist from "@/models/ecom_wishlist_info";
import User from "@/models/User";
import WishlistMailCronConfig from "@/models/wishlist_mail_cron_config";
import WishlistMailLog from "@/models/wishlist_mail_log";
import {
  buildWishlistMailEygrParams,
  sendEygrWishlistMail,
  getProductImageUrl,
} from "@/lib/wishlistMailEygr";

export async function getWishlistMailConfig() {
  let config = await WishlistMailCronConfig.findOne({ key: "default" });
  if (!config) {
    config = await WishlistMailCronConfig.create({});
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

function parseCronTime(cronTime = "09:00") {
  const [h, m] = String(cronTime || "09:00").split(":").map((n) => Number(n));
  return {
    hour: Number.isFinite(h) ? h : 9,
    minute: Number.isFinite(m) ? m : 0,
  };
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

function buildUnsubscribeToken(wishlistId) {
  return jwt.sign(
    { wishlistId: String(wishlistId), purpose: "wishlist-mail-unsubscribe" },
    process.env.JWT_SECRET || "wishlist-mail-secret",
    { expiresIn: "180d" }
  );
}

async function sendWishlistReminderEmail({
  to,
  userName,
  product,
  productUrl,
  unsubscribeUrl,
  siteUrl,
}) {
  const params = buildWishlistMailEygrParams({
    userName,
    productName: product?.name,
    productImageUrl: getProductImageUrl(product, siteUrl),
    productUrl,
    unsubscribeUrl,
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
  if (!item?.alertsEnabled) return false;
  if ((item.mailsSent || 0) >= Number(config.maxMailsPerUser || 5)) return false;

  if (item.lastNotifiedAt) {
    const cooldownDays = Number(config.mailCooldownDays || 7);
    const nextAllowed = new Date(item.lastNotifiedAt);
    nextAllowed.setDate(nextAllowed.getDate() + cooldownDays);
    if (now < nextAllowed) return false;
  }

  return true;
}

/**
 * Send wishlist reminder mails based on admin settings:
 * max mails per user/product, days between mails, cron time/days.
 * No price comparison — triggered when a product is on a wishlist.
 */
export async function processWishlistMails({ force = false } = {}) {
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
    "https://bharathelectronics.in";

  const flaggedProducts = await Product.find({ productMailsending: true }).lean();

  let sent = 0;
  let productsProcessed = 0;
  let productsCleared = 0;
  const details = [];

  for (const product of flaggedProducts) {
    productsProcessed += 1;
    const wishlistItems = await Wishlist.find({ productId: product._id });

    for (const item of wishlistItems) {
      if (!isUserEligible(item, config, now)) continue;

      const user = await User.findById(item.userId).lean();
      if (!user?.email) continue;

      const mailNumber = (item.mailsSent || 0) + 1;
      const productUrl = `${siteUrl}/product/${product.slug || product._id}`;
      const unsubscribeUrl = `${siteUrl}/api/wishlist/unsubscribe-wishlist-mail?token=${buildUnsubscribeToken(item._id)}`;

      try {
        await sendWishlistReminderEmail({
          to: user.email,
          userName: user.name,
          product,
          productUrl,
          unsubscribeUrl,
          siteUrl,
        });

        item.mailsSent = mailNumber;
        item.lastNotifiedAt = now;
        await item.save();

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

    // Stop product when every wishlist user hit max mails or turned alerts off
    const remaining = await Wishlist.find({ productId: product._id });
    const anyStillPending = remaining.some((w) => {
      const atCap = (w.mailsSent || 0) >= Number(config.maxMailsPerUser || 5);
      const alertsOff = w.alertsEnabled === false;
      return !atCap && !alertsOff;
    });

    if (!anyStillPending) {
      await Product.updateOne(
        { _id: product._id },
        { $set: { productMailsending: false } }
      );
      productsCleared += 1;
    }
  }

  const stats = {
    sent,
    productsProcessed,
    productsCleared,
    productsFlagged: flaggedProducts.length,
  };

  config.lastRunAt = now;
  config.lastRunStats = stats;
  await config.save();

  return {
    skipped: false,
    sent,
    productsProcessed,
    productsCleared,
    details,
    config: {
      maxMailsPerUser: config.maxMailsPerUser,
      mailCooldownDays: config.mailCooldownDays,
    },
  };
}
