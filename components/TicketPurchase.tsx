"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "../contexts/CartContext";

interface Props {
  competitionId: string;
  competitionTitle: string;
  competitionImage?: string | null;
  ticketPrice: number;
  maxTickets: number;
  soldTickets: number;
  onPurchaseComplete?: () => void;
}

export default function TicketPurchase({ 
  competitionId,
  competitionTitle,
  competitionImage,
  ticketPrice, 
  maxTickets, 
  soldTickets,
  onPurchaseComplete 
}: Props) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();

  const remainingTickets = maxTickets - soldTickets;
  const totalCost = quantity * ticketPrice;

  const handlePurchase = async () => {
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await addToCart({
        competitionId,
        competitionTitle,
        competitionImage: competitionImage ?? undefined,
        ticketPrice,
        quantity,
        maxTickets
      });

      // Reset quantity after successful add
      setQuantity(1);
      
      // Open cart sidebar to show item was added
      setIsCartOpen(true);
      
    } catch (error: any) {
      setError(error.message || "Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < remainingTickets) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Check if competition is sold out
  const isSoldOut = remainingTickets <= 0;

  // If sold out, show sold out message
  if (isSoldOut) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-2">SOLD OUT</div>
          <div className="text-sm text-gray-600">This competition has reached maximum capacity</div>
        </div>
        <div className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl cursor-not-allowed text-center">
          No More Tickets Available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ticket Selection */}
      <div className="flex items-center justify-center space-x-4">
        <button 
          type="button"
          onClick={decrementQuantity}
          disabled={quantity <= 1}
          className="w-10 h-10 bg-gradient-primary text-white rounded-full font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
        <div className="text-2xl font-bold text-black min-w-[50px] text-center">
          {quantity}
        </div>
        <button 
          type="button"
          onClick={incrementQuantity}
          disabled={quantity >= remainingTickets}
          className="w-10 h-10 bg-gradient-primary text-white rounded-full font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      {/* Price Display */}
      <div className="text-center">
        <div className="text-sm text-gray-600">Total Cost</div>
        <div className="text-xl font-bold text-primary-600">
          £{totalCost.toFixed(2)}
        </div>
      </div>

      {/* Purchase Button */}
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isLoading || quantity > remainingTickets}
        className="w-full bg-gradient-primary text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Adding to Cart..." : `Add ${quantity} Ticket${quantity > 1 ? 's' : ''} to Cart`}
      </button>

      {/* Remaining Tickets */}
      <div className="text-center text-sm text-gray-500">
        {remainingTickets.toLocaleString()} ticket{remainingTickets !== 1 ? 's' : ''} remaining
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-400 text-sm text-center p-2 bg-red-900/20 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
