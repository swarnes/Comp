"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Countdown from "./Countdown";
import { useCart } from "../contexts/CartContext";

interface Props {
  id: string;
  title: string;
  image?: string;
  endDate: string;
  ticketPrice: number;
  description?: string;
}

interface CompetitionStats {
  soldTickets: number;
  progressPercentage: number;
  remainingTickets: number;
  isActive: boolean;
  maxTickets: number;
}

export default function CompetitionCard({ id, title, image, endDate, ticketPrice, description }: Props) {
  const [stats, setStats] = useState<CompetitionStats | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart, setIsCartOpen } = useCart();
  
  // Calculate days until draw
  const daysUntilDraw = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isEnded = daysUntilDraw <= 0;
  
  // Fetch real stats function
  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/competitions/${id}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch competition stats:", error);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, [id]);

  // Use real progress or fallback to 0
  const progressPercentage = stats?.progressPercentage || 0;
  
  const getDrawDay = () => {
    if (isEnded) return "DRAW COMPLETE";
    if (daysUntilDraw <= 0) return "DRAWING TODAY";
    if (daysUntilDraw === 1) return "DRAW TOMORROW";
    if (daysUntilDraw <= 3) return "DRAW THIS WEEK";
    return `DRAW IN ${daysUntilDraw} DAYS`;
  };

  const handleAddToCart = async () => {
    if (isEnded || !stats?.isActive) return;
    
    setIsAdding(true);
    
    try {
      await addToCart({
        competitionId: id,
        competitionTitle: title,
        competitionImage: image,
        ticketPrice,
        quantity,
        maxTickets: stats?.maxTickets || 10000
      });
      
      // Reset quantity after adding successfully
      setQuantity(1);
      
      // Refresh stats after adding to cart
      fetchStats();
      
      // Optional: Open cart sidebar to show item was added
      setIsCartOpen(true);
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      alert(error.message || "Failed to add tickets to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden card-glow max-w-sm mx-auto">
      {/* Header with draw timing */}
      <div className="bg-black text-white text-center py-3 px-4">
        <h3 className="font-bold text-sm">{getDrawDay()}</h3>
      </div>

      {/* Competition Image */}
      <div className="relative">
        <img 
          src={image || "/images/default.jpg"} 
          alt={title}
          className="w-full h-48 object-cover"
        />
        {/* Progress overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">{progressPercentage}% Sold</span>
            {stats && (
              <span className="text-xs text-gray-300">
                {stats.soldTickets.toLocaleString()} tickets
              </span>
            )}
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div 
              className="progress-bar h-2 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      {!isEnded && (
        <div className="bg-gradient-primary p-4">
          <Countdown endDate={endDate} size="small" />
        </div>
      )}

      {/* Content */}
      <div className="p-6 text-black">
        <h2 className="text-lg font-bold mb-2 line-clamp-2">{title}</h2>
        {description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{description}</p>
        )}
        
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-primary-600">
            £{ticketPrice.toFixed(2)} <span className="text-sm font-normal text-gray-500">PER TICKET</span>
          </div>
        </div>

        {/* Sold Out or Quantity Selector */}
        {!isEnded && stats?.isActive ? (
          stats.remainingTickets <= 0 ? (
            <div className="mb-4 text-center">
              <div className="text-xl font-bold text-red-600 mb-2">SOLD OUT</div>
              <div className="w-full bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl cursor-not-allowed">
                No More Tickets Available
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(stats.remainingTickets, quantity + 1))}
                    disabled={quantity >= stats.remainingTickets}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-600 mb-3">
                Total: £{(ticketPrice * quantity).toFixed(2)}
              </div>
              
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdding || isEnded || !stats?.isActive || quantity > stats.remainingTickets}
                className="w-full font-semibold py-3 px-6 rounded-xl mb-3 hover:scale-105 transition-transform bg-gradient-primary text-white disabled:opacity-50"
              >
                {isAdding 
                  ? "Adding..." 
                  : "🛒 Add to Cart"
                }
              </button>
              
              <div className="text-center text-xs text-gray-500">
                {stats.remainingTickets} tickets remaining
              </div>
            </div>
          )
        ) : null}

        {/* View Details Button */}
        <Link href={`/competition/${id}`}>
          <button type="button" className="w-full bg-gradient-primary text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-transform">
            {isEnded ? "VIEW RESULTS" : "VIEW DETAILS →"}
          </button>
        </Link>
      </div>
    </div>
  );
}