"use client";

import { useState, useMemo } from "react";
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

interface TicketBundle {
  tickets: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
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
  const [quantity, setQuantity] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();

  const remainingTickets = maxTickets - soldTickets;
  const totalCost = quantity * ticketPrice;

  // Generate dynamic bundles based on ticket price
  const bundles: TicketBundle[] = useMemo(() => {
    const baseBundles = [
      { tickets: 10, multiplier: 1 },
      { tickets: 25, multiplier: 1 },
      { tickets: 50, multiplier: 1, popular: true },
      { tickets: 100, multiplier: 1 },
      { tickets: 200, multiplier: 1 },
      { tickets: 500, multiplier: 1, bestValue: true },
    ];

    return baseBundles
      .filter(b => b.tickets <= remainingTickets)
      .map(b => ({
        tickets: b.tickets,
        price: b.tickets * ticketPrice * b.multiplier,
        popular: b.popular,
        bestValue: b.bestValue,
      }));
  }, [ticketPrice, remainingTickets]);

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
      setQuantity(10);
      
      // Open cart sidebar to show item was added
      setIsCartOpen(true);
      
    } catch (error: any) {
      setError(error.message || "Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  const selectBundle = (tickets: number) => {
    setQuantity(Math.min(tickets, remainingTickets));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(parseInt(e.target.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    setQuantity(Math.max(1, Math.min(value, remainingTickets)));
  };

  const incrementQuantity = (amount: number = 1) => {
    setQuantity(prev => Math.min(prev + amount, remainingTickets));
  };

  const decrementQuantity = (amount: number = 1) => {
    setQuantity(prev => Math.max(prev - amount, 1));
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

  // Calculate slider max (cap at reasonable amount or remaining)
  const sliderMax = Math.min(remainingTickets, 1000);

  return (
    <div className="space-y-6">
      {/* Quick Select Bundle Options */}
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-3 text-center">Quick Select</div>
        <div className="grid grid-cols-3 gap-2">
          {bundles.slice(0, 6).map((bundle) => (
            <button
              key={bundle.tickets}
              type="button"
              onClick={() => selectBundle(bundle.tickets)}
              className={`relative p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                quantity === bundle.tickets
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-primary-300'
              }`}
            >
              {bundle.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  POPULAR
                </span>
              )}
              {bundle.bestValue && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  BEST VALUE
                </span>
              )}
              <div className="text-lg font-bold text-gray-900">{bundle.tickets}</div>
              <div className="text-xs text-gray-500">tickets</div>
              <div className="text-sm font-bold text-primary-600 mt-1">£{bundle.price.toFixed(2)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-xs text-gray-400 font-medium">OR CHOOSE AMOUNT</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* Ticket Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Select Tickets</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => decrementQuantity(10)}
              disabled={quantity <= 1}
              className="w-8 h-8 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              -10
            </button>
            <button
              type="button"
              onClick={() => decrementQuantity(1)}
              disabled={quantity <= 1}
              className="w-8 h-8 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <input
              type="number"
              value={quantity}
              onChange={handleInputChange}
              min={1}
              max={remainingTickets}
              className="w-20 text-center text-xl font-bold text-gray-900 border-2 border-gray-200 rounded-lg py-1 focus:border-primary-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => incrementQuantity(1)}
              disabled={quantity >= remainingTickets}
              className="w-8 h-8 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => incrementQuantity(10)}
              disabled={quantity >= remainingTickets}
              className="w-8 h-8 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              +10
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="relative">
          <input
            type="range"
            min={1}
            max={sliderMax}
            value={quantity}
            onChange={handleSliderChange}
            className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(quantity / sliderMax) * 100}%, #e5e7eb ${(quantity / sliderMax) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>{Math.round(sliderMax / 4)}</span>
            <span>{Math.round(sliderMax / 2)}</span>
            <span>{Math.round(sliderMax * 3 / 4)}</span>
            <span>{sliderMax}</span>
          </div>
        </div>
      </div>

      {/* Total Cost Display */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-4 text-center border-2 border-primary-200">
        <div className="text-sm text-primary-700 font-medium">Total Cost</div>
        <div className="text-3xl font-bold text-primary-600">
          £{totalCost.toFixed(2)}
        </div>
        <div className="text-xs text-primary-500 mt-1">
          {quantity} ticket{quantity !== 1 ? 's' : ''} × £{ticketPrice.toFixed(2)}
        </div>
      </div>

      {/* Purchase Button */}
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isLoading || quantity > remainingTickets}
        className="w-full bg-gradient-primary text-white font-bold py-4 px-6 rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg shadow-primary-500/30"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Adding to Cart...
          </span>
        ) : (
          `🎟️ Add ${quantity} Ticket${quantity > 1 ? 's' : ''} to Cart`
        )}
      </button>

      {/* Remaining Tickets */}
      <div className="text-center text-sm text-gray-500">
        <span className="font-semibold text-primary-600">{remainingTickets.toLocaleString()}</span> ticket{remainingTickets !== 1 ? 's' : ''} remaining
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm text-center p-3 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Custom Slider Styles */}
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
