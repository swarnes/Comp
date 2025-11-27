"use client";

import { useState, useEffect } from "react";

interface InstantPrize {
  id: string;
  name: string;
  prizeType: "CASH" | "RYDER_CASH";
  value: number;
  totalWins: number;
  remainingWins: number;
  claimed: number;
}

interface Props {
  competitionId: string;
}

export default function InstantPrizesDisplay({ competitionId }: Props) {
  const [prizes, setPrizes] = useState<InstantPrize[]>([]);
  const [hasInstantWins, setHasInstantWins] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const response = await fetch(`/api/competitions/${competitionId}/instant-prizes`);
        if (response.ok) {
          const data = await response.json();
          setHasInstantWins(data.hasInstantWins);
          setPrizes(data.prizes || []);
        }
      } catch (error) {
        console.error("Error fetching instant prizes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrizes();
  }, [competitionId]);

  if (loading) {
    return null;
  }

  if (!hasInstantWins || prizes.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">⚡</span>
        <h3 className="text-xl font-bold text-white">Instant Win Prizes</h3>
      </div>
      
      <p className="text-sm text-gray-300 mb-4">
        Every ticket has a chance to win instantly! Prizes are awarded immediately after purchase.
      </p>

      <div className="grid gap-3">
        {prizes.map((prize) => (
          <div
            key={prize.id}
            className="bg-secondary-800/60 rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {prize.prizeType === "CASH" ? "💷" : "🎫"}
                  </span>
                  <span className="font-semibold text-white">{prize.name}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {prize.prizeType === "CASH" 
                    ? `£${prize.value.toFixed(2)} Cash (Withdrawable)`
                    : `£${prize.value.toFixed(2)} Ryder Cash (Site Credit)`
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  {prize.remainingWins} / {prize.totalWins}
                </div>
                <div className="text-xs text-gray-500">remaining</div>
              </div>
            </div>
            
            {/* Progress bar showing claimed prizes */}
            <div className="mt-3">
              <div className="w-full bg-secondary-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (prize.claimed / prize.totalWins) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Ryder Cash is site credit only and cannot be withdrawn or transferred.
      </p>
    </div>
  );
}

