const formatRupees = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? `₹${amount.toLocaleString("en-IN")}`
    : null;
};

const getCouponCode = (coupon) => {
  const code = typeof coupon === "string"
    ? coupon
    : coupon?.offer_code || coupon?.code || coupon?.couponCode;

  return typeof code === "string" ? code.trim() : "";
};

export function getOrderBenefits(order) {
  if (!order) return [];

  const promotionCode = typeof order.promotion_code_applied === "string"
    ? order.promotion_code_applied.trim()
    : "";
  const isKnownTrucoCode = /^BEAO\d+$/i.test(promotionCode);
  const itemCoupons = (Array.isArray(order.order_item) ? order.order_item : [])
    .flatMap((item) => Array.isArray(item?.coupondetails) ? item.coupondetails : [])
    .concat(Array.isArray(order.coupondetails) ? order.coupondetails : [])
    .map(getCouponCode)
    .filter(Boolean);
  const adminCouponCodes = [...new Set(itemCoupons)]
    .filter((code) => !isKnownTrucoCode || code.toLowerCase() !== promotionCode.toLowerCase());
  const benefits = [];

  if (adminCouponCodes.length > 0) {
    benefits.push({
      label: "Coupon code",
      value: adminCouponCodes.join(", "),
    });

    const couponDiscount = (Array.isArray(order.order_item) ? order.order_item : [])
      .reduce((total, item) => {
        const discount = Number(item?.discount || item?.coupondiscount || 0);
        return total + (Number.isFinite(discount) ? discount : 0);
      }, 0);
    const formattedDiscount = formatRupees(couponDiscount);
    if (formattedDiscount) {
      benefits.push({
        label: "Coupon discount",
        value: formattedDiscount,
      });
    }
  }

  if (promotionCode && (isKnownTrucoCode || !itemCoupons.some(
    (code) => code.toLowerCase() === promotionCode.toLowerCase()
  ))) {
    benefits.push({
      label: "Truco coupon code",
      value: promotionCode,
    });
    const promotionDiscount = formatRupees(order.promotion_discount_applied);
    if (promotionDiscount) {
      benefits.push({
        label: "Truco coupon amount",
        value: promotionDiscount,
      });
    }
  } else if (promotionCode && adminCouponCodes.some(
    (code) => code.toLowerCase() === promotionCode.toLowerCase()
  )) {
    const promotionDiscount = formatRupees(order.promotion_discount_applied);
    if (promotionDiscount && !benefits.some((benefit) => benefit.label === "Coupon discount")) {
      benefits.push({
        label: "Coupon discount",
        value: promotionDiscount,
      });
    }
  }

  const redeemedPoints = Number(order.loyalty_points_redeemed || 0);
  if (Number.isFinite(redeemedPoints) && redeemedPoints > 0) {
    benefits.push({
      label: "Loyalty points used",
      value: redeemedPoints.toLocaleString("en-IN"),
    });
  }

  const loyaltyDiscount = formatRupees(order.loyalty_discount);
  if (loyaltyDiscount) {
    benefits.push({
      label: "Loyalty points amount",
      value: loyaltyDiscount,
    });
  }

  return benefits;
}

export default function OrderBenefits({ order, compact = false }) {
  const benefits = getOrderBenefits(order);
  if (benefits.length === 0) return null;

  if (compact) {
    return (
      <div className="mt-1 space-y-0.5 text-left text-xs leading-4">
        {benefits.map((benefit) => (
          <p key={benefit.label}>
            <span className="text-gray-500">{benefit.label}:</span>{" "}
            <span className="font-medium text-gray-800">{benefit.value}</span>
          </p>
        ))}
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
      <h4 className="font-semibold text-gray-800">Applied coupons and loyalty points</h4>
      <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {benefits.map((benefit) => (
          <div key={benefit.label} className="flex flex-wrap justify-between gap-x-2">
            <dt className="text-gray-600">{benefit.label}</dt>
            <dd className="font-semibold text-gray-900">{benefit.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
