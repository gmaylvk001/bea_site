"use client";

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useModal } from '@/context/ModalContext';
import { useHeaderdetails } from '@/context/HeaderContext';
import { ToastContainer, toast } from 'react-toastify';
import { trackAddToCart } from "@/utils/nextjs-event-tracking.js";

import { FaShoppingCart} from "react-icons/fa";

import { v4 as uuidv4 } from "uuid";

const AddToCartButton = ({ productId, quantity = 1, warranty, additionalProducts = [],extendedWarranty, selectedFrequentProducts = [], stockQuantity = 1,special_price }) => {
  const { openAuthModal } = useModal();
  const { updateHeaderdetails, setIsLoggedIn, setUserData, setIsAdmin } = useHeaderdetails();
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  // const [showAuthModal, setShowAuthModal] = useState(false);
  // const [authError, setAuthError] = useState('');
  const [cartSuccess, setCartSuccess] = useState(false);
  const isOutOfStock = stockQuantity <= 0;
  const isprice = special_price <= 0;
  const { cartCount, updateCartCount } = useCart();
  const handleAddToCart = async () => {
     if (isOutOfStock) return;

     if(isprice){
      return;
     }
      setIsLoading(true);
      // setAuthError('');
      setCartSuccess(false);
      
      try {
        const token = localStorage.getItem('token');

        let isLoggedIn = false;
        let userData = null;


        // Check authentication
        /*
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          }
        });
        
        const data = await response.json();
        
         if (!data.loggedIn) {
          openAuthModal({
            error: 'Please log in to continue.',
            onSuccess: () => handleAddToCart(), // retry on success
          });
          return;
        }

      
        if (data.loggedIn) {
          updateHeaderdetails({ user: data.user });
            setIsLoggedIn(true);
            const role = data.role;
          if(role == 'admin'){
            setIsAdmin(true);
          }
        }
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

        const proresponse = await fetch(`/api/product/get/${productId}`);
       
        if (!proresponse.ok) {
          throw new Error(`HTTP error! status: ${proresponse.status}`);
        }
        
        const productData = await proresponse.json();
        const original_prod_quantity = productData.data.quantity;
  
        // Add main product to cart
        /*
        const cartResponse = await fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId, quantity, 
          selectedWarranty: warranty,
          selectedExtendedWarranty: extendedWarranty,}),
        }); */

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
    
        if (!cartResponse.ok) {
          throw new Error('Failed to add to cart');
        }
        
        // console.log(cartResponse);
        // Add additional products if any
        /*
        if (additionalProducts.length > 0) {
          await Promise.all(
            additionalProducts.map(async (additionalId) => {
              const res = await fetch('/api/cart', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: additionalId, quantity: 1 }),
              });
              if (!res.ok) throw new Error('Failed to add additional product');
            })
          );
        }
          */

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
        
        // ✅ Store selected product IDs for persistence
        if (selectedFrequentProducts?.length > 0) {
          const ids = selectedFrequentProducts.map(p => p._id);
          localStorage.setItem("selectedFrequentProductIds", JSON.stringify(ids));
        } else {
          localStorage.removeItem("selectedFrequentProductIds");
        }
  
        setCartSuccess(true);
      } catch (error) {
        console.error('Add to cart error:', error);
        setAuthError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
  return (
    <>
    {stockQuantity > 0 && (
<button
  onClick={handleAddToCart}
  disabled={isLoading || isOutOfStock || isprice}
  className={`w-full px-4 py-3 rounded-md shadow-md transition duration-300 text-md flex items-center justify-center gap-x-3 font-semibold text-center
    ${isOutOfStock
      ? 'bg-gray-400 cursor-not-allowed text-white'
      : isLoading
        ? 'bg-blue-700 cursor-not-allowed opacity-75 text-white'
        : cartSuccess
          ? 'bg-green-500 text-white hover:bg-green-600'
          : 'bg-white hover:bg-customBlue hover:text-white text-customBlue border border-blue-200'
    }
    active:scale-95 disabled:active:scale-100`}
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>
      <span className="hidden sm:inline">Add to Cart</span>
      <span className="sm:hidden">Add</span>
    </>
  )}
</button>
)}


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