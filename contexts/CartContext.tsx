"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: string;
  competitionId: string;
  competitionTitle: string;
  competitionImage?: string;
  ticketPrice: number;
  quantity: number;
  maxTickets: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('rydrcomps-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('rydrcomps-cart', JSON.stringify(items));
  }, [items]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.ticketPrice * item.quantity), 0);

  const addToCart = async (newItem: Omit<CartItem, 'id'>) => {
    // Check current competition stats to validate ticket availability
    try {
      const response = await fetch(`/api/competitions/${newItem.competitionId}/stats`);
      if (!response.ok) {
        throw new Error('Failed to check ticket availability');
      }
      
      const stats = await response.json();
      
      // Check if competition is still active (not ended)
      if (!stats.isActive) {
        throw new Error('This competition has ended and is no longer accepting entries.');
      }
      
      const availableTickets = stats.remainingTickets;
      
      // Check if competition is sold out
      if (availableTickets <= 0) {
        throw new Error('This competition is sold out!');
      }
      
      // Check existing cart items for this competition
      const existingItem = items.find(item => item.competitionId === newItem.competitionId);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const totalRequestedQuantity = currentCartQuantity + newItem.quantity;
      
      // Validate total quantity doesn't exceed available tickets
      if (totalRequestedQuantity > availableTickets) {
        throw new Error(
          `Only ${availableTickets} tickets remaining for this competition. ` +
          (currentCartQuantity > 0 ? `You already have ${currentCartQuantity} in your cart.` : '')
        );
      }
      
      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + newItem.quantity;
        updateQuantity(existingItem.id, newQuantity);
      } else {
        // Add new item
        const item: CartItem = {
          ...newItem,
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          quantity: newItem.quantity
        };
        setItems(prev => [...prev, item]);
      }
    } catch (error) {
      // Re-throw the error so it can be handled by the calling component
      throw error;
    }
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantity: quantity
        };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{
      items,
      totalItems,
      totalPrice,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
