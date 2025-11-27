"use client";

import { useState, useEffect } from "react";

interface Prize {
  id: string;
  name: string;
  prizeType: "CASH" | "RYDER_CASH";
  value: number;
  totalWins: number;
  remainingWins: number;
  totalTickets: number;
  claimedTickets: number;
  availableTickets: number;
}

interface Ticket {
  id: string;
  ticketNumber: number;
  prizeId: string | null;
  prizeName: string | null;
  prizeType: string | null;
  prizeValue: number | null;
  isClaimed: boolean;
  winnerName: string | null;
  claimedAt: string | null;
}

interface Props {
  competitionId: string;
}

export default function InstantWinTicketGrid({ competitionId }: Props) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [hasInstantWins, setHasInstantWins] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPrize, setSelectedPrize] = useState<string | null>(null);
  const [expandedPrizes, setExpandedPrizes] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0,
  });

  const fetchTickets = async (page: number = 1, prizeId?: string | null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "24",
      });
      if (prizeId) {
        params.append("prizeId", prizeId);
      }

      const response = await fetch(
        `/api/competitions/${competitionId}/instant-tickets?${params}`
      );
      if (response.ok) {
        const data = await response.json();
        setHasInstantWins(data.hasInstantWins);
        setTickets(data.tickets || []);
        setPrizes(data.prizes || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching instant win tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(1, selectedPrize);
  }, [competitionId, selectedPrize]);

  const togglePrize = (prizeId: string) => {
    const newExpanded = new Set(expandedPrizes);
    if (newExpanded.has(prizeId)) {
      newExpanded.delete(prizeId);
      if (selectedPrize === prizeId) {
        setSelectedPrize(null);
      }
    } else {
      newExpanded.add(prizeId);
      setSelectedPrize(prizeId);
    }
    setExpandedPrizes(newExpanded);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      fetchTickets(newPage, selectedPrize);
    }
  };

  if (loading && tickets.length === 0) {
    return null;
  }

  if (!hasInstantWins || prizes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">⚡</span>
        <h3 className="text-xl font-bold text-white">Instant Win Tickets</h3>
      </div>

      {/* Prize Accordions */}
      {prizes.map((prize) => (
        <div
          key={prize.id}
          className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200"
        >
          {/* Prize Header - Clickable */}
          <button
            onClick={() => togglePrize(prize.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              {/* Prize Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {prize.prizeType === "CASH" ? "💷" : "🎫"}
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-800 text-lg">{prize.name}</h4>
                <p className="text-sm text-gray-500">
                  {prize.prizeType === "CASH" ? "Cash Prize" : "Ryder Cash"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                Tickets Left: {prize.availableTickets}
              </div>
              {/* Expand/Collapse Arrow */}
              <div
                className={`w-10 h-10 bg-primary-500 rounded-r-xl flex items-center justify-center text-white transition-transform ${
                  expandedPrizes.has(prize.id) ? "rotate-180" : ""
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </button>

          {/* Ticket Grid - Collapsible */}
          {expandedPrizes.has(prize.id) && selectedPrize === prize.id && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading tickets...
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No tickets generated yet
                </div>
              ) : (
                <>
                  {/* Ticket Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`rounded-lg overflow-hidden border-2 transition-all ${
                          ticket.isClaimed
                            ? "border-gray-200 bg-gray-100"
                            : "border-gray-300 bg-white hover:border-primary-400 hover:shadow-md"
                        }`}
                      >
                        {/* Ticket Number */}
                        <div
                          className={`py-3 px-2 text-center font-bold text-lg ${
                            ticket.isClaimed ? "text-gray-400" : "text-gray-700"
                          }`}
                        >
                          {ticket.ticketNumber}
                        </div>
                        {/* Status Badge */}
                        <div
                          className={`py-2 px-2 text-center text-sm font-medium ${
                            ticket.isClaimed
                              ? "bg-gray-200 text-gray-500"
                              : "bg-primary-500 text-white"
                          }`}
                        >
                          {ticket.isClaimed
                            ? ticket.winnerName || "Claimed"
                            : "Available"}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      <div className="flex items-center gap-1 text-gray-600">
                        <span>{pagination.page}</span>
                        <span>...</span>
                        <span>{pagination.totalPages}</span>
                      </div>

                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}

      <p className="text-xs text-gray-500 text-center mt-4">
        Purchase tickets for a chance to win these instant prizes! Winners are
        selected automatically when matching ticket numbers are purchased.
      </p>
    </div>
  );
}

