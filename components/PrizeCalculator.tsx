"use client";

import { useState, useEffect, useMemo } from "react";

export interface TierConfig {
  name: string;
  percentage: number; // % of instant pot
  prizeValue: number; // £ value per prize
  prizeType: "CASH" | "RYDER_CASH";
}

export interface PrizePoolConfig {
  rtp: number; // 0.45 - 0.55
  instantPotPercentage: number; // 0.95 - 0.98
  tiers: TierConfig[];
}

export interface GeneratedPrize {
  name: string;
  prizeType: "CASH" | "RYDER_CASH";
  value: number;
  totalWins: number;
}

interface Props {
  maxTickets: number;
  ticketPrice: number;
  mode: "create" | "edit";
  competitionId?: string;
  onConfigChange?: (config: PrizePoolConfig, prizes: GeneratedPrize[]) => void;
  onGenerate?: () => void;
}

const DEFAULT_TIERS: TierConfig[] = [
  { name: "Big Prize", percentage: 5, prizeValue: 20, prizeType: "CASH" },
  { name: "Medium Prize", percentage: 25, prizeValue: 5, prizeType: "RYDER_CASH" },
  { name: "Small Prize", percentage: 70, prizeValue: 2, prizeType: "RYDER_CASH" },
];

export default function PrizeCalculator({
  maxTickets,
  ticketPrice,
  mode,
  competitionId,
  onConfigChange,
  onGenerate,
}: Props) {
  const [rtp, setRtp] = useState(0.5); // 50% default
  const [instantPotPercentage, setInstantPotPercentage] = useState(0.96); // 96% default
  const [tiers, setTiers] = useState<TierConfig[]>(DEFAULT_TIERS);
  const [showCustomize, setShowCustomize] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Calculate prize pool values
  const calculations = useMemo(() => {
    const totalPrizePool = maxTickets * ticketPrice * rtp;
    const instantPot = totalPrizePool * instantPotPercentage;
    const endDrawPot = totalPrizePool * (1 - instantPotPercentage);
    const instantWinners = Math.round(maxTickets * 0.0175); // 1.75% win rate

    return {
      totalPrizePool,
      instantPot,
      endDrawPot,
      instantWinners,
    };
  }, [maxTickets, ticketPrice, rtp, instantPotPercentage]);

  // Generate prize breakdown from tiers
  const generatedPrizes = useMemo(() => {
    const prizes: GeneratedPrize[] = [];
    
    for (const tier of tiers) {
      const tierBudget = calculations.instantPot * (tier.percentage / 100);
      const prizeCount = Math.max(1, Math.floor(tierBudget / tier.prizeValue));
      
      if (prizeCount > 0) {
        prizes.push({
          name: `£${tier.prizeValue} ${tier.name}`,
          prizeType: tier.prizeType,
          value: tier.prizeValue,
          totalWins: prizeCount,
        });
      }
    }

    return prizes;
  }, [tiers, calculations.instantPot]);

  // Total prizes count
  const totalPrizes = useMemo(() => {
    return generatedPrizes.reduce((sum, p) => sum + p.totalWins, 0);
  }, [generatedPrizes]);

  // Actual instant pot used
  const actualInstantPotUsed = useMemo(() => {
    return generatedPrizes.reduce((sum, p) => sum + (p.value * p.totalWins), 0);
  }, [generatedPrizes]);

  // Notify parent of config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(
        { rtp, instantPotPercentage, tiers },
        generatedPrizes
      );
    }
  }, [rtp, instantPotPercentage, tiers, generatedPrizes, onConfigChange]);

  const updateTier = (index: number, field: keyof TierConfig, value: any) => {
    setTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addTier = () => {
    setTiers((prev) => [
      ...prev,
      { name: "New Tier", percentage: 10, prizeValue: 1, prizeType: "RYDER_CASH" },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleGenerate = async () => {
    if (mode === "create") {
      // In create mode, just notify parent
      onGenerate?.();
      return;
    }

    // In edit mode, call API directly
    if (!competitionId) {
      setError("Competition ID required");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/competitions/${competitionId}/generate-prize-pool`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rtp,
            instantPotPercentage,
            tiers,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Generated ${data.stats.totalPrizes} prizes with ${data.stats.totalTickets} winning tickets!`);
        onGenerate?.();
      } else {
        setError(data.message || "Failed to generate prizes");
      }
    } catch (err) {
      setError("Failed to generate prizes");
    } finally {
      setGenerating(false);
    }
  };

  // Don't show if no tickets/price set
  if (!maxTickets || !ticketPrice) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🎯</span>
          <h3 className="text-xl font-bold text-white">Prize Pool Calculator</h3>
        </div>
        <p className="text-yellow-400">
          Set max tickets and ticket price first to calculate prizes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border border-yellow-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h3 className="text-xl font-bold text-white">Prize Pool Calculator</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowCustomize(!showCustomize)}
          className="text-sm text-yellow-400 hover:text-yellow-300"
        >
          {showCustomize ? "Hide Options" : "Customize"}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-secondary-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400">Max Tickets</div>
          <div className="text-lg font-bold text-white">{maxTickets.toLocaleString()}</div>
        </div>
        <div className="bg-secondary-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400">Ticket Price</div>
          <div className="text-lg font-bold text-white">£{ticketPrice.toFixed(2)}</div>
        </div>
        <div className="bg-secondary-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400">Max Revenue</div>
          <div className="text-lg font-bold text-white">
            £{(maxTickets * ticketPrice).toLocaleString()}
          </div>
        </div>
        <div className="bg-secondary-800/50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400">RTP</div>
          <div className="text-lg font-bold text-yellow-400">{(rtp * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* RTP Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-300">
            Return to Player (RTP)
          </label>
          <span className="text-yellow-400 font-bold">{(rtp * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.40"
          max="0.60"
          step="0.01"
          value={rtp}
          onChange={(e) => setRtp(parseFloat(e.target.value))}
          className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>40%</span>
          <span>50%</span>
          <span>60%</span>
        </div>
      </div>

      {/* Prize Pool Breakdown */}
      <div className="bg-secondary-800/50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Prize Pool Breakdown</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Prize Pool:</span>
            <span className="font-bold text-white">
              £{calculations.totalPrizePool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between pl-4">
            <span className="text-gray-400">
              ├─ Instant Pot ({(instantPotPercentage * 100).toFixed(0)}%):
            </span>
            <span className="font-bold text-yellow-400">
              £{calculations.instantPot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between pl-4">
            <span className="text-gray-400">
              └─ End-Draw Pot ({((1 - instantPotPercentage) * 100).toFixed(0)}%):
            </span>
            <span className="font-bold text-green-400">
              £{calculations.endDrawPot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Customization Options */}
      {showCustomize && (
        <div className="bg-secondary-800/50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Instant Pot Split</h4>
          
          {/* Instant Pot Percentage */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Instant Pot %</label>
              <span className="text-sm text-white">{(instantPotPercentage * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.90"
              max="0.99"
              step="0.01"
              value={instantPotPercentage}
              onChange={(e) => setInstantPotPercentage(parseFloat(e.target.value))}
              className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>

          {/* Tier Configuration */}
          <h4 className="text-sm font-medium text-gray-300 mb-3">Prize Tiers</h4>
          <div className="space-y-3">
            {tiers.map((tier, index) => (
              <div key={index} className="flex items-center gap-2 bg-secondary-900/50 p-2 rounded">
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => updateTier(index, "name", e.target.value)}
                  className="flex-1 px-2 py-1 bg-secondary-700 rounded text-sm text-white"
                  placeholder="Tier name"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={tier.percentage}
                    onChange={(e) => updateTier(index, "percentage", parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 bg-secondary-700 rounded text-sm text-white text-center"
                    min="1"
                    max="100"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">£</span>
                  <input
                    type="number"
                    value={tier.prizeValue}
                    onChange={(e) => updateTier(index, "prizeValue", parseFloat(e.target.value) || 1)}
                    className="w-16 px-2 py-1 bg-secondary-700 rounded text-sm text-white text-center"
                    min="1"
                    step="1"
                  />
                </div>
                <select
                  value={tier.prizeType}
                  onChange={(e) => updateTier(index, "prizeType", e.target.value)}
                  className="px-2 py-1 bg-secondary-700 rounded text-sm text-white"
                >
                  <option value="RYDER_CASH">RyderCash</option>
                  <option value="CASH">Cash</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="p-1 text-red-400 hover:text-red-300"
                  disabled={tiers.length <= 1}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addTier}
            className="mt-2 text-sm text-yellow-400 hover:text-yellow-300"
          >
            + Add Tier
          </button>
        </div>
      )}

      {/* Generated Prizes Preview */}
      <div className="bg-secondary-800/50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium text-gray-300">Generated Prizes Preview</h4>
          <span className="text-xs text-gray-400">
            {totalPrizes.toLocaleString()} winning tickets
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="pb-2">Prize</th>
                <th className="pb-2 text-center">Type</th>
                <th className="pb-2 text-right">Value</th>
                <th className="pb-2 text-right">Count</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {generatedPrizes.map((prize, index) => (
                <tr key={index} className="border-t border-gray-700">
                  <td className="py-2">{prize.name}</td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      prize.prizeType === "CASH" 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {prize.prizeType === "CASH" ? "Cash" : "RyderCash"}
                    </span>
                  </td>
                  <td className="py-2 text-right">£{prize.value.toFixed(2)}</td>
                  <td className="py-2 text-right">{prize.totalWins.toLocaleString()}</td>
                  <td className="py-2 text-right font-medium">
                    £{(prize.value * prize.totalWins).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-yellow-500/30 font-bold">
                <td className="py-2">Total</td>
                <td></td>
                <td></td>
                <td className="py-2 text-right">{totalPrizes.toLocaleString()}</td>
                <td className="py-2 text-right text-yellow-400">
                  £{actualInstantPotUsed.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Win Rate Info */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-6">
        <div className="flex items-start gap-2">
          <span className="text-blue-400">ℹ️</span>
          <div className="text-sm">
            <p className="text-blue-300">
              <strong>Expected Win Rate:</strong> ~{((totalPrizes / (maxTickets * 2)) * 100).toFixed(2)}% per ticket
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Based on {totalPrizes.toLocaleString()} winning tickets in a pool of {(maxTickets * 2).toLocaleString()} possible numbers
            </p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4 text-green-400">
          {success}
        </div>
      )}

      {/* Generate Button (edit mode only) */}
      {mode === "edit" && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || totalPrizes === 0}
          className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold py-3 px-6 rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? "Generating..." : "🚀 Generate Prize Pool & Tickets"}
        </button>
      )}

      {mode === "create" && (
        <p className="text-xs text-gray-500 text-center">
          Prizes will be generated automatically when you create the competition.
        </p>
      )}
    </div>
  );
}

