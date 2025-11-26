"use client";

import { useCart } from "../contexts/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CartSidebar() {
  const { 
    items, 
    totalItems, 
    totalPrice, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart 
  } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const handleCheckout = () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (items.length === 0) return;
    
    setIsCartOpen(false);
    router.push('/checkout');
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-secondary-900 border-l border-primary-500/20 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-primary-500/20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Shopping Cart</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🛒</div>
              <div className="text-xl font-bold text-white mb-2">Your cart is empty</div>
              <div className="text-gray-400 mb-6">Add some competition tickets to get started!</div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="bg-gradient-primary hover:scale-105 text-white font-semibold py-3 px-6 rounded-lg transition-transform"
              >
                Browse Competitions
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-secondary-800/50 rounded-lg p-4 border border-primary-500/20">
                  {/* Competition Info */}
                  <div className="flex items-start space-x-3 mb-3">
                    {item.competitionImage && (
                      <img
                        src={item.competitionImage}
                        alt={item.competitionTitle}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm line-clamp-2">
                        {item.competitionTitle}
                      </h3>
                      <div className="text-primary-400 font-bold">
                        £{item.ticketPrice.toFixed(2)} per ticket
                      </div>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-secondary-700 hover:bg-secondary-600 text-white flex items-center justify-center transition-colors"
                      >
                        −
                      </button>
                      <span className="text-white font-bold w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-secondary-700 hover:bg-secondary-600 text-white flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="font-bold text-white">
                        £{(item.ticketPrice * item.quantity).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 text-lg"
                        title="Remove from cart"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-primary-500/20 p-6 space-y-4">
            {/* Total */}
            <div className="flex justify-between items-center text-xl font-bold">
              <span className="text-white">Total:</span>
              <span className="text-primary-400">£{totalPrice.toFixed(2)}</span>
            </div>

            {session ? (
              /* Logged in - show checkout button */
              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-primary text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
              >
                Proceed to Checkout
              </button>
            ) : (
              /* Not logged in - show sign in/register options */
              <div className="space-y-3">
                <div className="text-center text-gray-400 text-sm mb-2">
                  Create an account or sign in to complete your purchase
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/auth/register');
                  }}
                  className="w-full bg-gradient-primary text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
                >
                  Create Account & Checkout
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    router.push('/auth/signin');
                  }}
                  className="w-full border border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Continue Shopping */}
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-full bg-secondary-700 hover:bg-secondary-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
