"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Winner {
  id: string;
  slug?: string;
  title: string;
  description: string;
  image: string | null;
  endDate: string;
  ticketPrice: number;
  maxTickets: number;
  prizeValue?: number | null;
  winnerId: string | null;
  winningTicketNumber: number | null;
  drawId: string | null;
  drawTimestamp: string | null;
  winner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'value'>('recent');

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      const response = await fetch("/api/competitions/past-winners");
      if (response.ok) {
        const data = await response.json();
        setWinners(data);
      }
    } catch (error) {
      console.error("Failed to fetch winners:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedWinners = winners
    .filter(winner => 
      winner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      winner.winner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      winner.drawId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.drawTimestamp || b.endDate).getTime() - new Date(a.drawTimestamp || a.endDate).getTime();
        case 'oldest':
          return new Date(a.drawTimestamp || a.endDate).getTime() - new Date(b.drawTimestamp || b.endDate).getTime();
        case 'value':
          return (b.prizeValue || b.ticketPrice * b.maxTickets) - (a.prizeValue || a.ticketPrice * a.maxTickets);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading winners...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-bold gradient-text mb-4">🏆 Winners Gallery</h1>
        <p className="text-gray-300 text-lg">Celebrating our lucky winners and their amazing prizes</p>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-primary rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-white">{winners.length}</div>
          <div className="text-white/80">Total Winners</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-white">
            £{winners.reduce((sum, winner) => sum + (winner.prizeValue || winner.ticketPrice * winner.maxTickets), 0).toLocaleString()}
          </div>
          <div className="text-white/80">Total Prizes</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-white">
            £{winners.length > 0 ? Math.max(...winners.map(winner => winner.prizeValue || winner.ticketPrice * winner.maxTickets)).toLocaleString() : '0'}
          </div>
          <div className="text-white/80">Highest Prize</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-2">
              Search Winners
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by competition, winner, or draw ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-300 mb-2">
              Sort By
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-600 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="value">Highest Value</option>
            </select>
          </div>
        </div>
      </div>

      {/* Winners Grid */}
      {filteredAndSortedWinners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedWinners.map((winner) => (
            <div key={winner.id} className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-primary-500/20 hover:border-primary-500/40 transition-all">
              {/* Competition Image */}
              {winner.image && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={winner.image}
                    alt={winner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    WINNER
                  </div>
                </div>
              )}

              <div className="p-6 space-y-4">
                {/* Competition Title */}
                <h3 className="text-xl font-bold text-white line-clamp-2">
                  {winner.title}
                </h3>

                {/* Winner Info */}
                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Winner</span>
                    <span className="text-sm text-gray-400">
                      Ticket #{winner.winningTicketNumber || "N/A"}
                    </span>
                  </div>
                  <div className="font-bold text-green-400">
                    {winner.winner?.name || "Anonymous Winner"}
                  </div>
                </div>

                {/* Draw Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Prize Value</div>
                    <div className="font-bold text-primary-400">£{(winner.prizeValue || winner.ticketPrice * winner.maxTickets).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Draw Date</div>
                    <div className="font-bold text-white">
                      {winner.drawTimestamp 
                        ? new Date(winner.drawTimestamp).toLocaleDateString()
                        : new Date(winner.endDate).toLocaleDateString()
                      }
                    </div>
                  </div>
                </div>

                {/* Draw ID */}
                {winner.drawId && (
                  <div className="border-t border-gray-600/30 pt-4">
                    <div className="text-xs text-gray-400">Draw ID</div>
                    <div className="font-mono text-xs text-gray-300 bg-secondary-700/50 px-2 py-1 rounded">
                      {winner.drawId}
                    </div>
                  </div>
                )}

                {/* Competition Link */}
                <Link
                  href={`/competition/${winner.slug || winner.id}`}
                  className="block w-full text-center bg-secondary-700 hover:bg-secondary-600 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  View Competition
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-6">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {searchTerm ? "No winners found" : "No winners yet"}
          </h2>
          <p className="text-gray-400 mb-8">
            {searchTerm 
              ? "Try adjusting your search criteria"
              : "Check back soon for our first competition winners!"
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="bg-gradient-primary hover:scale-105 text-white font-semibold py-3 px-6 rounded-lg transition-transform"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-gradient-primary rounded-2xl p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Want to Be Our Next Winner?</h2>
        <p className="text-white/80 mb-6">
          Join thousands of members competing for amazing prizes every week!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-white text-red-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Browse Competitions
          </Link>
          <Link
            href="/auth/register"
            className="border-2 border-white text-white hover:bg-white hover:text-red-600 font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Sign Up Free
          </Link>
        </div>
      </div>
    </div>
  );
}
