// "use client";

// import { useState, useEffect } from 'react';
// import { Heart } from 'lucide-react';

// const WishlistButton = ({ productId, onWishlistUpdate,wishliststatus }) => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [showAuthModal, setShowAuthModal] = useState(false);
//   const [authError, setAuthError] = useState('');
//   const [isWishlisted, setIsWishlisted] = useState(false);

  
//   useEffect(() => {
//     if (wishliststatus !== '' && wishliststatus !== null) {
//       setIsWishlisted(wishliststatus);
//     }
//   }, [wishliststatus]);
  

//   const handleWishlist = async () => {
//     setIsLoading(true);
//     setAuthError('');
    
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         setShowAuthModal(true);
//         return;
//       }

//       const method = isWishlisted ? 'DELETE' : 'POST';
//       const methodurl =(method=='POST') ? 'post' : 'delete';
//       const response = await fetch('/api/wishlist/'+methodurl, {
//         method,
//         headers: { 
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify({ productId }),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to update wishlist');
//       }

//       // Toggle the wishlist status
//       setIsWishlisted(!isWishlisted);
      
//       // Notify parent component about the update
//       if (onWishlistUpdate) {
//         onWishlistUpdate();
//       }

//     } catch (error) {
//       console.error('Wishlist error:', error);
//       setAuthError(error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <>
//       <div className="absolute top-2 right-2 z-10">
//         <button 
//           className={`p-1 rounded-full bg-white shadow ${isWishlisted ? 'text-red-500' : 'hover:text-red-500'}`}
//           onClick={handleWishlist}
//           disabled={isLoading}
//         >
//           <Heart 
//             size={18} 
//             fill={isWishlisted ? 'currentColor' : 'none'} 
//           />
//         </button>
//       </div>

//       {showAuthModal && (
//         <AuthModal 
//           onClose={() => setShowAuthModal(false)}
//           onSuccess={() => {
//             setShowAuthModal(false);
//             handleWishlist();
//           }}
//           error={authError}
//         />
//       )}
//     </>
//   );
// };


// export default WishlistButton;

// components/AddToWishlistButton.jsx
"use client";
import { useModal } from '@/context/ModalContext';
import { useState,useEffect  } from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { Heart } from 'lucide-react';
import {AuthModal} from '@/components/AuthModal';
const AddToWishlistButton = ({ productId }) => {
  const { openAuthModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const { wishlistCount, wishlistItems, isInWishlist, updateWishlist } = useWishlist();
  const [isWishlisted, setIsWishlisted] = useState(isInWishlist(productId));

  useEffect(() => {
    setIsWishlisted(isInWishlist(productId));
  }, [productId, wishlistItems, isInWishlist]);

  const handleWishlistAction = async () => {
    setIsLoading(true);
    setAuthError('');
    
    try {
      const token = localStorage.getItem('token');
    
      // Check authentication
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      
      const data = await response.json();
       
     if (!data.loggedIn) {
        openAuthModal(() => {
          handleWishlistAction(); // Retry after login
        }, 'You must be logged in to add to wishlist.');
        return;
      }

      // Determine if we're adding or removing
      const isCurrentlyWishlisted = isInWishlist(productId);
      const method = isCurrentlyWishlisted ? 'DELETE' : 'POST';

      // API call
      const wishlistResponse = await fetch('/api/wishlist', {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId }),
      });

      if (!wishlistResponse.ok) {
        throw new Error(`Failed to ${isCurrentlyWishlisted ? 'remove from' : 'add to'} wishlist`);
      }
      
      const responseData = await wishlistResponse.json();
      updateWishlist(responseData.items, responseData.count);
      
    } catch (error) {
      // console.error('Wishlist error:', error);
      setAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
       <button className={`p-1 rounded-full bg-white shadow ${isWishlisted ? 'text-red-500' : 'hover:text-red-500'}`} onClick={handleWishlistAction} disabled={isLoading}
        >
          <Heart size={18}  fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

      {/* AuthModal remains the same */}
      {/* {showAuthModal && (
        <div className="fixed inset-0 z-[9999]">
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            handleWishlistAction();
          }}
          error={authError}
        />
        </div>
      )} */}
    </>
  );
};

// AuthModal component remains the same as your original code



export default AddToWishlistButton;