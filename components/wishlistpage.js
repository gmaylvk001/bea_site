"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { FaShoppingCart } from "react-icons/fa";
import { useWishlist } from '@/context/WishlistContext';
import { ToastContainer, toast } from 'react-toastify';
import { CiCircleRemove } from "react-icons/ci";
import Addtocart from "@/components/AddToCart";
import Link from "next/link";
// Custom Confirm Modal
const ConfirmModal = ({ show, onClose, onConfirm }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Remove item?</h3>
          <p className="text-gray-500 mb-4">Are you sure you want to delete this item from your wishlist?</p>
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              onClick={onConfirm}
            >
              Yes, Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Custom Success Modal
const SuccessModal = ({ show, message, onClose }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-green-600 mb-2">Success!</h3>
          <p className="text-gray-500 mb-4">{message}</p>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={onClose}
          >
            OK
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const WishlistPage = () => {
  const { wishlistItems: contextWishlist, updateWishlist } = useWishlist();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/wishlist/get", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      // console.log("wishlist data is :", data);
      setWishlistItems(data.items || []);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist(contextWishlist);
  }, [contextWishlist]);

  const confirmRemove = (productId) => {
    setItemToDelete(productId);
    setShowConfirmModal(true);
  };

  const handleRemove = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        // headers: {
        //   "Content-Type": "application/json",
        //   Authorization: `Bearer ${token}`,
        // },
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: itemToDelete }),
      });

      const data = await res.json();
      console.log(data);

      if (res.ok) {
        setWishlistItems((prev) =>
          prev.filter((item) => item.productId !== itemToDelete)
        );
        updateWishlist(data.items, data.count);
        setShowConfirmModal(false);
        setItemToDelete(null);
        setShowSuccessModal(true);
      } else {
        alert(data.message || "Failed to remove item.");
      }
    } catch (err) {
      console.error("Error removing wishlist item:", err);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <ConfirmModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleRemove}
      />

      <SuccessModal
        show={showSuccessModal}
        message="Item removed from wishlist!"
        onClose={() => setShowSuccessModal(false)}
      />

      <div className="bg-blue-50 py-6 px-8 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Wishlist</h2>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">🏠 Home</span>
          <span className="text-gray-500">›</span>
          <span className="text-orange-500 font-semibold">Wishlist</span>
        </div>
      </div>

     <div className="max-w-7xl mx-auto flex flex-col gap-6 p-4 sm:p-6">
  {loading ? (
    <div className="text-center text-gray-500">Loading wishlist...</div>
  ) : wishlistItems.length === 0 ? (
    <div className="text-center text-gray-600">Your wishlist is empty.</div>
  ) : (
    <>
      {/* Desktop Table Layout */}
      <div className="hidden sm:block rounded-lg border overflow-x-auto mb-10">
        <table className="w-full mt-4 border-collapse">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="py-3 px-4 text-center font-semibold text-sm">Delete</th>
              <th className="py-3 px-4 font-semibold text-sm">Product Name</th>
              <th className="py-3 px-4 text-center font-semibold text-sm">Unit Price</th>
              <th className="py-3 px-4 text-center font-semibold text-sm">Stock Status</th>
              <th className="py-3 px-4 text-center font-semibold text-sm">Action</th>
            </tr>
          </thead>
          <tbody>
            {wishlistItems.map((item, index) => (
              <motion.tr
                key={item.id}
                className="border-b hover:bg-gray-50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <td className="py-4 px-4 text-center">
                  <button
                    className="text-black hover:text-red-700 flex items-center gap-1 justify-center text-sm"
                    onClick={() => confirmRemove(item.productId)}
                  >
                    <CiCircleRemove size={18} /> Remove
                  </button>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-4">
                    <Image
                      src={`/uploads/products/${item.image}`}
                      alt={item.name}
                      width={70}
                      height={70}
                      className="rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm hover:text-orange-500 cursor-pointer">
                        {item.name.length > 50 ? `${item.name.substring(0, 50)}...` : item.name}
                      </p>
                      {/* <div className="text-xs text-gray-500 mt-1">
                        <span className="text-yellow-500">⭐ {item.rating}</span>
                        <span className="ml-2">| {item.reviews} Reviews</span>
                      </div> */}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-center font-semibold text-sm">
                  Rs. {item.price.toFixed(2)}
                </td>
                {/* {console.log('Quantity:', item.quantity)} */}

              <td className={`py-4 px-4 text-center font-semibold text-sm ${
                Number(item.quantity) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Number(item.quantity) > 0 ? 'In Stock' : 'Out of Stock'}
              </td>


                <td className="py-4 px-4 text-center">
                  <Addtocart stockQuantity={item.quantity}  special_price={item.special_price} productId={item.productId} className="w-full text-xs sm:text-sm py-1.5"/>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden space-y-4">
        {wishlistItems.map((item, index) => (
          <motion.div
            key={item.productId}
            className="bg-white rounded-lg shadow p-4 flex flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className="flex gap-4">
              <Image
                src={`/uploads/products/${item.image}`}
                alt={item.name}
                width={90}
                height={90}
                className="rounded-md object-cover"
              />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {item.name.length > 40 ? `${item.name.slice(0, 40)}...` : item.name}
                </h3>
                {/* <p className="text-xs text-gray-500 mt-1">⭐ {item.rating} | {item.reviews} reviews</p> */}
                <p className="text-sm font-semibold text-customBlue mt-1">Rs. {item.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                className="text-red-500 flex items-center gap-1 text-sm"
                onClick={() => confirmRemove(item.productId)}
              >
                <CiCircleRemove size={18} /> Remove
              </button>
              <div className="text-green-600 text-sm font-medium">{item.stockStatus}</div>
                  <div className="text-xs">
                    <Addtocart stockQuantity={item.quantity}  special_price={item.special_price} productId={item.productId} className="w-full text-xs sm:text-sm py-1.5"/>
                  </div>
                    
            </div>
          </motion.div>
        ))}
      </div>
    </>
  )}
</div>
<ToastContainer />
    </div>
    
  );
};

export default WishlistPage;
