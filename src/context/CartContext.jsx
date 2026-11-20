import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

const CART_KEY = 'artfluri_cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  function addToCart(product, quantity = 1, selectedSize = null, customization = null) {
    setCart(prev => {
      const key = `${product.id}-${selectedSize || 'default'}`;
      const existing = prev.find(item => item.cartKey === key);

      if (existing) {
        return prev.map(item =>
          item.cartKey === key
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock) }
            : item
        );
      }

      return [...prev, {
        cartKey: key,
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        category: product.category,
        selectedSize: selectedSize || product.sizes?.[0] || 'Standard',
        quantity,
        stock: product.stock,
        customization,
      }];
    });
  }

  function removeFromCart(cartKey) {
    setCart(prev => prev.filter(item => item.cartKey !== cartKey));
  }

  function updateQuantity(cartKey, newQuantity) {
    if (newQuantity < 1) {
      removeFromCart(cartKey);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.cartKey === cartKey
          ? { ...item, quantity: Math.min(newQuantity, item.stock) }
          : item
      )
    );
  }

  function clearCart() {
    setCart([]);
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartSavings = cart.reduce((total, item) => total + (item.originalPrice - item.price) * item.quantity, 0);
  const shippingCost = cartSubtotal >= 1499 ? 0 : 99;
  const cartTotal = cartSubtotal + shippingCost;

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      cartSubtotal,
      cartSavings,
      shippingCost,
      cartTotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
