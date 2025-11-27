"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Countdown from "./Countdown";

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

        {/* Sold Out Indicator */}
        {!isEnded && stats?.isActive && stats.remainingTickets <= 0 && (
          <div className="mb-4 text-center">
            <div className="text-xl font-bold text-red-600">SOLD OUT</div>
          </div>
        )}

        {/* Enter Now Button */}
        <Link href={`/competition/${id}`}>
          <button type="button" className="w-full bg-gradient-primary text-white font-bold py-4 px-6 rounded-xl hover:scale-105 transition-transform text-lg">
            {isEnded ? "VIEW RESULTS" : "ENTER NOW!"}
          </button>
        </Link>
      </div>
    </div>
  );
}