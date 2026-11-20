import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext(null);

const WISHLIST_KEY = 'artfluri_wishlist';

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  function toggleWishlist(product) {
    setWishlist(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: product.category,
        rating: product.rating,
        stock: product.stock,
        sizes: product.sizes,
      }];
    });
  }

  function isInWishlist(productId) {
    return wishlist.some(item => item.id === productId);
  }

  function removeFromWishlist(productId) {
    setWishlist(prev => prev.filter(item => item.id !== productId));
  }

  return (
    <WishlistContext.Provider value={{
      wishlist,
      wishlistCount: wishlist.length,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside WishlistProvider');
  return context;
}
