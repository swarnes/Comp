"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Countdown from "@/components/Countdown";
import TicketPurchase from "@/components/TicketPurchase";
import InstantPrizesDisplay from "@/components/InstantPrizesDisplay";
import InstantWinTicketGrid from "@/components/InstantWinTicketGrid";

interface Competition {
  id: string;
  title: string;
  description: string;
  image: string | null;
  startDate: string;
  endDate: string;
  ticketPrice: number;
  maxTickets: number;
  prizeValue?: number | null;
}

interface CompetitionStats {
  competitionId: string;
  maxTickets: number;
  soldTickets: number;
  progressPercentage: number;
  remainingTickets: number;
  ticketPrice: number;
  isActive: boolean;
}

export default function CompetitionPage() {
  const params = useParams();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [stats, setStats] = useState<CompetitionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCompetition = async () => {
    if (!params?.id) return;
    try {
      const response = await fetch(`/api/competitions/${params.id}`);
      if (!response.ok) throw new Error("Competition not found");
      const data = await response.json();
      setCompetition(data);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchStats = async () => {
    if (!params?.id) return;
    try {
      const response = await fetch(`/api/competitions/${params.id}/stats`);
      if (!response.ok) throw new Error("Failed to load stats");
      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      console.error("Stats error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchCompetition();
      fetchStats();
    }
  }, [params?.id]);

  const handlePurchaseComplete = () => {
    // Refresh stats after purchase
    fetchStats();
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-white mb-4">Competition Not Found</h1>
        <p className="text-gray-400">The competition you're looking for doesn't exist.</p>
      </div>
    );
  }

  const isEnded = new Date(competition.endDate) <= new Date();
  const progressPercentage = stats?.progressPercentage || 0;
  const soldTickets = stats?.soldTickets || 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column - Competition Image */}
        <div className="space-y-6">
          <div className="bg-gradient-primary rounded-3xl p-1">
            <div className="bg-white rounded-3xl overflow-hidden">
              <img 
                src={competition.image || "/images/default.jpg"} 
                alt={competition.title}
                className="w-full h-96 object-cover"
              />
            </div>
          </div>
          
          {/* Prize Structure */}
          <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20">
            <h3 className="text-xl font-bold text-white mb-4">Prize Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Prize Value:</span>
                <span className="text-primary-400 font-bold">£{(competition.prizeValue || competition.ticketPrice * competition.maxTickets).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Entry Price:</span>
                <span className="text-white font-bold">£{competition.ticketPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Max Tickets:</span>
                <span className="text-white">{competition.maxTickets.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Sold Tickets:</span>
                <span className="text-white font-bold">{soldTickets.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Instant Win Prizes */}
          <InstantPrizesDisplay competitionId={competition.id} />
        </div>

        {/* Right Column - Entry Form */}
        <div className="space-y-6">
          
          {/* Countdown Timer */}
          {!isEnded ? (
            <div className="bg-gradient-primary rounded-2xl p-6 text-center">
              <h2 className="text-white text-xl font-bold mb-4">Time Remaining</h2>
              <Countdown endDate={competition.endDate} size="large" />
            </div>
          ) : (
            <div className="bg-green-600 rounded-2xl p-6 text-center">
              <h2 className="text-white text-xl font-bold">Competition Ended</h2>
              <p className="text-white/90 mt-2">Winner to be announced</p>
            </div>
          )}

          {/* Entry Form */}
          <div className="bg-white rounded-2xl p-6">
            <h1 className="text-2xl font-bold text-black mb-4">{competition.title}</h1>
            <p className="text-gray-600 mb-6">{competition.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-primary-600 font-bold">📊</div>
                <div className="text-sm text-gray-500">{competition.maxTickets.toLocaleString()} Max Tickets</div>
              </div>

              <div className="text-center">
                <div className="text-primary-600 font-bold">⏰</div>
                <div className="text-sm text-gray-500">Ends {new Date(competition.endDate).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Entry Price */}
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-primary-600">
                £{competition.ticketPrice.toFixed(2)} <span className="text-lg text-gray-500">PER TICKET</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{soldTickets.toLocaleString()}/{competition.maxTickets.toLocaleString()}</span>
                <span className="text-primary-600 font-bold">{Math.round((soldTickets / competition.maxTickets) * 100)}% Sold</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="progress-bar h-3 rounded-full" 
                  style={{ width: `${Math.round((soldTickets / competition.maxTickets) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Ticket Purchase Component */}
            {!isEnded && stats ? (
              <TicketPurchase
                competitionId={competition.id}
                competitionTitle={competition.title}
                competitionImage={competition.image}
                ticketPrice={competition.ticketPrice}
                maxTickets={competition.maxTickets}
                soldTickets={soldTickets}
                onPurchaseComplete={handlePurchaseComplete}
              />
            ) : (
              <div className="text-center p-4 bg-red-600/20 rounded-xl border border-red-500/20">
                <p className="text-red-400 font-bold">COMPETITION ENDED</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instant Win Ticket Grid */}
      <InstantWinTicketGrid competitionId={competition.id} />
    </div>
  );
}