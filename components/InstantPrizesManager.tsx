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

export default function InstantPrizesManager({ competitionId }: Props) {
  const [prizes, setPrizes] = useState<InstantPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingTickets, setGeneratingTickets] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state for adding/editing prizes
  const [showForm, setShowForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState<InstantPrize | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    prizeType: "RYDER_CASH" as "CASH" | "RYDER_CASH",
    value: 10,
    totalWins: 5,
  });

  useEffect(() => {
    fetchPrizes();
  }, [competitionId]);

  const fetchPrizes = async () => {
    try {
      const response = await fetch(`/api/admin/instant-prizes?competitionId=${competitionId}`);
      if (response.ok) {
        const data = await response.json();
        setPrizes(data);
      }
    } catch (error) {
      console.error("Error fetching prizes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/instant-prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPrize?.id,
          competitionId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(editingPrize ? "Prize updated!" : "Prize added!");
        setShowForm(false);
        setEditingPrize(null);
        resetForm();
        fetchPrizes();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to save prize");
      }
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (prizeId: string) => {
    if (!confirm("Are you sure you want to delete this prize?")) return;

    try {
      const response = await fetch(`/api/admin/instant-prizes/${prizeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Prize deleted!");
        fetchPrizes();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to delete prize");
      }
    } catch (error) {
      setError("Something went wrong");
    }
  };

  const handleGenerateTickets = async () => {
    if (!confirm("This will regenerate all tickets for all prizes. Existing tickets will be deleted. Continue?")) {
      return;
    }

    setGeneratingTickets(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}/generate-instant-tickets`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Generated ${data.stats.totalTickets} tickets for ${data.stats.prizeBreakdown.length} prizes!`);
        fetchPrizes();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.message || "Failed to generate tickets");
      }
    } catch (error) {
      setError("Something went wrong while generating tickets");
    } finally {
      setGeneratingTickets(false);
    }
  };

  const handleEdit = (prize: InstantPrize) => {
    setEditingPrize(prize);
    setFormData({
      name: prize.name,
      prizeType: prize.prizeType,
      value: prize.value,
      totalWins: prize.totalWins,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      prizeType: "RYDER_CASH",
      value: 10,
      totalWins: 5,
    });
    setEditingPrize(null);
  };

  const totalPrizeValue = prizes.reduce((sum, p) => sum + p.value * p.totalWins, 0);
  const totalPrizesRemaining = prizes.reduce((sum, p) => sum + p.remainingWins, 0);
  const totalPrizesClaimed = prizes.reduce((sum, p) => sum + p.claimed, 0);

  return (
    <div className="bg-gradient-to-br from-yellow-500/10 to-amber-600/10 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚡</span> Instant Win Prizes
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Configure instant win prizes for this competition
          </p>
        </div>
        <div className="flex gap-2">
          {prizes.length > 0 && (
            <button
              onClick={handleGenerateTickets}
              disabled={generatingTickets}
              className="bg-green-500 hover:bg-green-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              title="Generate winning tickets for all prizes"
            >
              {generatingTickets ? "Generating..." : "🎫 Generate Tickets"}
            </button>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? "Cancel" : "+ Add Prize"}
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-4 text-red-400 text-sm bg-red-900/20 p-3 rounded">{error}</div>
      )}
      {success && (
        <div className="mb-4 text-green-400 text-sm bg-green-900/20 p-3 rounded">{success}</div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-secondary-800/60 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Prize Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., £10 Ryder Cash"
                className="w-full px-3 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Prize Type
              </label>
              <select
                value={formData.prizeType}
                onChange={(e) => setFormData({ ...formData, prizeType: e.target.value as "CASH" | "RYDER_CASH" })}
                className="w-full px-3 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="RYDER_CASH">🎫 Ryder Cash (Site Credit)</option>
                <option value="CASH">💷 Cash (Withdrawable)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Prize Value (£)
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Total Available
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.totalWins}
                onChange={(e) => setFormData({ ...formData, totalWins: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {editingPrize && editingPrize.claimed > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠️ {editingPrize.claimed} already claimed. Minimum is {editingPrize.claimed}.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingPrize ? "Update Prize" : "Add Prize"}
            </button>
          </div>
        </form>
      )}

      {/* Summary Stats */}
      {prizes.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-secondary-800/40 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-yellow-400">£{totalPrizeValue.toFixed(2)}</div>
            <div className="text-xs text-gray-400">Total Prize Pool</div>
          </div>
          <div className="bg-secondary-800/40 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-400">{totalPrizesRemaining}</div>
            <div className="text-xs text-gray-400">Prizes Remaining</div>
          </div>
          <div className="bg-secondary-800/40 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-primary-400">{totalPrizesClaimed}</div>
            <div className="text-xs text-gray-400">Prizes Claimed</div>
          </div>
        </div>
      )}

      {/* Prizes List */}
      {loading ? (
        <div className="text-center py-4 text-gray-400">Loading prizes...</div>
      ) : prizes.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <span className="text-4xl mb-2 block">🎁</span>
          <p>No instant prizes configured yet</p>
          <p className="text-sm">Add prizes to enable instant wins for this competition</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prizes.map((prize) => (
            <div
              key={prize.id}
              className="bg-secondary-800/60 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {prize.prizeType === "CASH" ? "💷" : "🎫"}
                </span>
                <div>
                  <div className="font-semibold text-white">{prize.name}</div>
                  <div className="text-sm text-gray-400">
                    £{prize.value.toFixed(2)} • {prize.prizeType === "CASH" ? "Cash" : "Ryder Cash"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    {prize.remainingWins} / {prize.totalWins} remaining
                  </div>
                  <div className="w-24 bg-secondary-700 rounded-full h-2 mt-1">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2 rounded-full"
                      style={{ width: `${(prize.claimed / prize.totalWins) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(prize)}
                    className="text-gray-400 hover:text-white p-1 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(prize.id)}
                    className="text-gray-400 hover:text-red-400 p-1 transition-colors"
                    title="Delete"
                    disabled={prize.claimed > 0}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        💡 Tip: The odds of winning are proportional to remaining prizes vs tickets sold. 
        A higher NO_WIN_MULTIPLIER in code means fewer wins overall.
      </p>
    </div>
  );
}

