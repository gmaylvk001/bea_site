// utils/tracking.js
export const trackAddToCart = ({  user, product }) => {
  if (typeof window !== "undefined" && window._em_event) {
    window._em_event.track({
      event: "btnClick",
      action: "addToCart",
      user_info: {
        user_name:  user?.name,
        phone:  user?.phone,
        email:  user?.email,
      },
      product_info: {
        product_id: product?.id,
        product_name: product?.name,
        price: product?.price,
        product_link: product?.link,
        image: product?.image,
        qty: product?.qty,
        currency: product?.currency || "INR",
      },
    });
  } else {
    console.warn("Event tracking not loaded yet");
  }
};

export const trackCheckout = ({  user, product }) => {
  if (typeof window !== "undefined" && window._em_event) {
    window._em_event.track({
      event: "btnClick",
      action: "checkOut",
      user_info: {
         user_name:  user?.name,
        phone:  user?.phone,
        email:  user?.email,
      },
      product_info: {
        product_id: product?.id,
        product_name: product?.name,
        price: product?.price,
        product_link: product?.link,
        image: product?.image,
        qty: product?.qty,
        currency: product?.currency || "INR",
      },
    });
  } else {
    console.warn("Event tracking not loaded yet");
  }
};