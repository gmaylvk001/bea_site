"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useModal } from '@/context/ModalContext';
import { ToastContainer, toast } from 'react-toastify';
import { useHeaderdetails } from '@/context/HeaderContext';
import { trackAddToCart } from "@/utils/nextjs-event-tracking.js";

import { v4 as uuidv4 } from "uuid";

import { FaShoppingCart} from "react-icons/fa";

const AddToCartButton = ({ productId, quantity = 1, warranty, additionalProducts = [],extendedWarranty, selectedFrequentProducts = [], stockQuantity = 1,special_price }) => {
  const { openAuthModal } = useModal();
  const { updateHeaderdetails, setIsLoggedIn, setUserData,setIsAdmin } = useHeaderdetails();
  const [isLoading, setIsLoading] = useState(false);
  // const [showAuthModal, setShowAuthModal] = useState(false);
  // const [authError, setAuthError] = useState('');
  const [cartSuccess, setCartSuccess] = useState(false);
  const isOutOfStock = stockQuantity <= 0;
    // const isprice = special_price <= 0;
  const { cartCount, updateCartCount } = useCart();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const handleAddToCart = async () => {
     if (isOutOfStock) return;

    //  if(isprice){
    //   return;
    //  }
      setIsLoading(true);
      // setAuthError('');
      setCartSuccess(false);
      
      try {
        const token = localStorage.getItem('token');
        // Check authentication
        let isLoggedIn = false;
        let userData = null;
        
        /*
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          }
        });
        */
       if (token) {
      const response = await fetch("/api/auth/check", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      isLoggedIn = data.loggedIn;
      userData = data.user;

          updateHeaderdetails({ user: data.user });
          setIsLoggedIn(true);
          const role = data.role;
          if(role == 'admin'){
            setIsAdmin(true);
          }
        }

        // ✅ If not logged in → use guestCartId
        let guestCartId = null;
        if (!isLoggedIn) {
          guestCartId = localStorage.getItem("guestCartId") || uuidv4();
          localStorage.setItem("guestCartId", guestCartId);
        }
        
        /*
        const data = await response.json();
        
         if (!data.loggedIn) {
          openAuthModal({
            error: 'Please log in to continue.',
            onSuccess: () => handleAddToCart(), // retry on success
          });
          return;
        } */

        /*
        if (data.loggedIn) {
          updateHeaderdetails({ user: data.user });
            setIsLoggedIn(true);
            const role = data.role;
          if(role == 'admin'){
            setIsAdmin(true);
          }
        }
          */

         // ✅ Get product data
    const proresponse             = await fetch(`/api/product/get/${productId}`);
    if (!proresponse.ok) throw new Error(`HTTP error! status: ${proresponse.status}`);
    const productData             = await proresponse.json();
    const original_prod_quantity  = productData.data.quantity;

    // ✅ Add main product to cart
    const cartResponse = await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(isLoggedIn && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        productId,
        original_prod_quantity,
        quantity,
        selectedWarranty: warranty,
        selectedExtendedWarranty: extendedWarranty,
        ...(guestCartId && { guestCartId }), // ✅ include only if guest
      }),
    });

    if(cartResponse.ok) {
      toast.success("Product added!");
    }
    
    if(cartResponse.status == 409) {
      toast.error("Stock limit exceeded!");
      return;
    }

    if (!cartResponse.ok) throw new Error("Failed to add to cart");

    // ✅ Add additional products (if any)
    if (additionalProducts.length > 0) {
      await Promise.all(
        additionalProducts.map(async (additionalId) => {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(isLoggedIn && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              productId: additionalId,
              quantity: 1,
              ...(guestCartId && { guestCartId }),
            }),
          });
          if (!res.ok) throw new Error("Failed to add additional product");
        })
      );
    }

    const responseData = await cartResponse.json();
    updateCartCount(responseData.cart.totalItems + additionalProducts.length);

    // ✅ Track events (skip if guest)
    if (isLoggedIn) {
      trackAddToCart({
        user: {
          name: userData?.name,
          phone: userData?.phone,
          email: userData?.email,
        },
        product: {
          id: productId,
          name: responseData.cart.items[0].name,
          price: responseData.cart.items[0].price,
          link: `${apiUrl}/product/${productData.data.slug}`,
          image: `${apiUrl}/uploads/products/${responseData.cart.items[0].image}`,
          qty: responseData.cart.items[0].quantity,
          currency: "INR",
        },
      });
    }

    // ✅ Store frequently bought together
    if (selectedFrequentProducts?.length > 0) {
      const ids = selectedFrequentProducts.map((p) => p._id);
      localStorage.setItem("selectedFrequentProductIds", JSON.stringify(ids));
    } else {
      localStorage.removeItem("selectedFrequentProductIds");
    }

    setCartSuccess(true);
  } catch (error) {
    console.error("Add to cart error:", error);
  } finally {
    setIsLoading(false);
  }
};
  return (
    <>
  <button
  onClick={handleAddToCart}
  disabled={isLoading || isOutOfStock}
  className={`px-2 py-2 md:px-2 md:py-2 mr-1 rounded-md shadow-md transition duration-300 text-md flex items-center justify-center gap-x-1
    ${isOutOfStock
      ? 'bg-gray-400 cursor-not-allowed text-white'
      : isLoading
      ? 'bg-blue-700 cursor-not-allowed opacity-75'
      : cartSuccess
      ? 'bg-green-500 text-white hover:bg-green-600'
      : 'bg-white text-[#2453D3] hover:bg-[#2453D3] hover:text-white'
    }
    active:scale-95 disabled:active:scale-100
    w-full min-[1400px]:w-[185px]`}
  style={{
    boxShadow:
      "rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgb(209, 213, 219) 0px 0px 0px 1px inset",
  }}
>
  

  {isOutOfStock ? (
        <span>Out of Stock</span>
      ) : isLoading ? (
    <>
      <svg 
        className="animate-spin h-5 w-5" 
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="hidden sm:inline">Adding...</span>
    </>
  ) : cartSuccess ? (
    <>
      <FaShoppingCart />
      <span className="hidden sm:inline">Added to Cart</span>
      <span className="sm:hidden">Added</span>
    </>
  ) : (
    <>


      {/* <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>  */}

      <svg 
         xmlns="http://www.w3.org/2000/svg"
         className="h-5 w-5" 
         viewBox="0 0 32 32"
         fill="currentColor"
      >
      <defs></defs><g id="cart"><path className="cls-1" d="M29.46 10.14A2.94 2.94 0 0 0 27.1 9H10.22L8.76 6.35A2.67 2.67 0 0 0 6.41 5H3a1 1 0 0 0 0 2h3.41a.68.68 0 0 1 .6.31l1.65 3 .86 9.32a3.84 3.84 0 0 0 4 3.38h10.37a3.92 3.92 0 0 0 3.85-2.78l2.17-7.82a2.58 2.58 0 0 0-.45-2.27zM28 11.86l-2.17 7.83A1.93 1.93 0 0 1 23.89 21H13.48a1.89 1.89 0 0 1-2-1.56L10.73 11H27.1a1 1 0 0 1 .77.35.59.59 0 0 1 .13.51z"/><circle className="cls-1" cx="14" cy="26" r="2"/><circle className="cls-1" cx="24" cy="26" r="2"/></g></svg>

      

      <span className="hidden sm:inline" >Add to Cart</span>
      <span className="sm:hidden">Add</span>
    </>
  )}
</button>
{/* 
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            handleAddToCart();
          }}
          error={authError}
        />
      )} */}
    </>
  );
};

// Auth Modal Component


export default AddToCartButton;