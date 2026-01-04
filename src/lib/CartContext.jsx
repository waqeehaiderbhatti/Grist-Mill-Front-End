import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner'; 

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (service, quantity, isWeightPending = false) => {
    setCart(prev => {
      // Handle Pending Weight Request
      if (isWeightPending) {
        const existingPending = prev.find(item => item.service.id === service.id && item.isWeightPending);
        if (existingPending) {
          toast.error('You already have a wheat pickup request in your cart.');
          return prev;
        }
        return [...prev, { service, quantity: 1, isWeightPending: true }];
      }
  
      // Handle Standard Item
      const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
      const invItem = inventory.find(i => i.id === service.id);
  
      // Check stock only if item is in inventory
      if (invItem) {
        const existingItem = prev.find(item => item.service.id === service.id && !item.isWeightPending);
        const quantityInCart = existingItem ? existingItem.quantity : 0;
  
        if (invItem.currentStock < (quantityInCart + quantity)) {
          toast.error(`Not enough stock for ${service.name}. Only ${invItem.currentStock} available.`);
          return prev;
        }
      }
  
      // Add/update item in cart
      const existingItem = prev.find(item => item.service.id === service.id && !item.isWeightPending);
      if (existingItem) {
        return prev.map(item =>
          item.service.id === service.id && !item.isWeightPending
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { service, quantity, isWeightPending: false }];
    });
  };

  const updateQuantity = (serviceId, quantity) => {
    setCart(prev => {
      // Find the item in cart
      const itemInCart = prev.find(item => item.service.id === serviceId);
      if (!itemInCart || itemInCart.isWeightPending) return prev; // Don't update pending items

      // Check inventory
      const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
      const invItem = inventory.find(i => i.id === serviceId);

      if (invItem && invItem.currentStock < quantity) {
        toast.error(`Not enough stock. Only ${invItem.currentStock} available.`);
        // Set quantity to max available
        return prev.map(item =>
          item.service.id === serviceId ? { ...item, quantity: invItem.currentStock } : item
        );
      }

      if (quantity <= 0) {
        return prev.filter(item => item.service.id !== serviceId);
      }
      return prev.map(item =>
        item.service.id === serviceId ? { ...item, quantity } : item
      );
    });
  };

  const removeFromCart = (serviceId) => {
    setCart(prev => prev.filter(item => item.service.id !== serviceId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      if (item.isWeightPending) {
        return total;
      }
      return total + item.service.price * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getTotalPrice,
        getTotalItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}