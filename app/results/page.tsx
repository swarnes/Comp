"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DrawResult {
  id: string;
  title: string;
  description: string;
  image: string | null;
  ticketPrice: number;
  maxTickets: number;
  prizeValue?: number | null;
  winningTicketNumber: number | null;
  drawId: string | null;
  drawTimestamp: string | null;
  endDate: string;
  winner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export default function DrawResultsPage() {
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDrawResults();
  }, []);

  const fetchDrawResults = async () => {
    try {
      const response = await fetch("/api/competitions/draw-results");
      if (response.ok) {
        const data = await response.json();
        setDrawResults(data);
      } else {
        throw new Error("Failed to fetch draw results");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching results");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white mb-4">Loading Draw Results...</div>
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Error Loading Results</h1>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={fetchDrawResults}
          className="mt-4 bg-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">🏆 Draw Results</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          View all completed competition draws, winners, and prize details
        </p>
      </div>

      {/* Statistics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
          <div className="text-3xl font-bold text-green-600">{drawResults.length}</div>
          <div className="text-gray-600">Completed Draws</div>
        </div>
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
          <div className="text-3xl font-bold text-blue-600">
            £{drawResults.reduce((total, result) => total + (result.ticketPrice * result.maxTickets), 0).toLocaleString()}
          </div>
          <div className="text-gray-600">Total Prize Value</div>
        </div>
        <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
          <div className="text-3xl font-bold text-purple-600">
            {drawResults.reduce((total, result) => total + result.maxTickets, 0).toLocaleString()}
          </div>
          <div className="text-gray-600">Total Tickets Sold</div>
        </div>
      </div>

      {/* Draw Results */}
      {drawResults.length === 0 ? (
        <div className="text-center py-16 bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-primary-500/20">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-white mb-4">No Draw Results Yet</h2>
          <p className="text-gray-400 mb-6">
            Competition draws will appear here once they're completed.
          </p>
          <Link 
            href="/"
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            View Active Competitions
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {drawResults.map((result, index) => (
            <div 
              key={result.id} 
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Competition Image & Details */}
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                      #{drawResults.length - index}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{result.title}</h3>
                      <p className="text-sm text-gray-500">
                        Draw completed: {result.drawTimestamp ? new Date(result.drawTimestamp).toLocaleDateString() : 'Date not available'}
                      </p>
                    </div>
                  </div>
                  
                  <img 
                    src={result.image || "/images/default.jpg"} 
                    alt={result.title}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {result.description}
                  </p>
                </div>

                {/* Winner Information */}
                <div className="p-6 bg-green-50">
                  <h4 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                    🏆 Winner Details
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-green-600 font-medium">Winner</div>
                      <div className="text-lg font-bold text-green-800">
                        {result.winner?.name || "Anonymous Winner"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.winner?.email || "Email not disclosed"}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="text-sm text-green-600 font-medium">Winning Ticket</div>
                      <div className="text-2xl font-bold text-green-800">
                        #{result.winningTicketNumber || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Out of {result.maxTickets.toLocaleString()} tickets
                      </div>
                    </div>

                    {result.drawId && (
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="text-xs text-green-600 font-medium">Draw ID</div>
                        <div className="text-xs font-mono text-gray-600 break-all">
                          {result.drawId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prize Information */}
                <div className="p-6 bg-blue-50">
                  <h4 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                    💎 Prize Details
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="text-sm text-blue-600 font-medium">Prize Value</div>
                      <div className="text-2xl font-bold text-blue-800">
                        £{(result.prizeValue || result.ticketPrice * result.maxTickets).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total prize worth
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="text-sm text-blue-600 font-medium">Ticket Price</div>
                      <div className="text-lg font-bold text-blue-800">
                        £{result.ticketPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Per entry
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="text-sm text-blue-600 font-medium">Total Tickets</div>
                      <div className="text-lg font-bold text-blue-800">
                        {result.maxTickets.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Available tickets
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Draw Verification Footer */}
              <div className="bg-gray-100 px-6 py-4 border-t">
                <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>✅ Verified Draw</span>
                    <span>🔒 Transparent Process</span>
                    <span>📊 Fair Random Selection</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {result.drawTimestamp ? (
                      `Drawn: ${new Date(result.drawTimestamp).toLocaleString()}`
                    ) : (
                      `Ended: ${new Date(result.endDate).toLocaleDateString()}`
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Call to Action */}
      {drawResults.length > 0 && (
        <div className="text-center bg-gradient-primary rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Want to be the next winner?
          </h2>
          <p className="text-white/90 mb-6">
            Check out our active competitions and get your tickets today!
          </p>
          <Link 
            href="/"
            className="bg-white text-primary-600 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            View Active Competitions
          </Link>
        </div>
      )}
    </div>
  );
}
