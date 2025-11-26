"use client";
import { useState } from "react";

interface Competition {
  id: string;
  title: string;
  isActive: boolean;
  winnerId?: string | null;
}

interface Props {
  competition: Competition;
  onDrawComplete: () => void;
}

interface DrawResult {
  success: boolean;
  drawId: string;
  totalTickets: number;
  totalParticipants: number;
  winningTicket: {
    number: number;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  drawTimestamp: string;
  message: string;
}

export default function WinnerPicker({ competition, onDrawComplete }: Props) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [error, setError] = useState("");

  const conductDraw = async () => {
    if (!competition.isActive || competition.winnerId) return;

    setIsDrawing(true);
    setError("");
    setDrawResult(null);

    try {
      const response = await fetch(`/api/admin/competitions/${competition.id}/draw-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to conduct draw");
      }

      setDrawResult(data);
      onDrawComplete();
    } catch (err: any) {
      setError(err.message || "An error occurred during the draw");
    } finally {
      setIsDrawing(false);
    }
  };

  if (competition.winnerId) {
    return (
      <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-green-400 mb-4">🏆 Winner Selected!</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-800/20 rounded-lg p-4">
            <div className="text-sm text-gray-300">Winner</div>
            <div className="text-lg font-bold text-white">
              {competition.winner?.name || "Anonymous Winner"}
            </div>
            <div className="text-sm text-gray-400">
              {competition.winner?.email || "Email not available"}
            </div>
          </div>
          <div className="bg-green-800/20 rounded-lg p-4">
            <div className="text-sm text-gray-300">Winning Ticket</div>
            <div className="text-2xl font-bold text-green-400">
              #{competition.winningTicketNumber || "N/A"}
            </div>
            <div className="text-sm text-gray-400">Lucky number drawn</div>
          </div>
          <div className="bg-green-800/20 rounded-lg p-4">
            <div className="text-sm text-gray-300">Draw Date</div>
            <div className="text-lg font-bold text-green-400">
              {competition.drawTimestamp ? 
                new Date(competition.drawTimestamp).toLocaleDateString() : 
                "Date not available"
              }
            </div>
            <div className="text-sm text-gray-400">
              {competition.drawTimestamp ? 
                new Date(competition.drawTimestamp).toLocaleTimeString() : 
                "Time not available"
              }
            </div>
          </div>
        </div>

        <div className="text-center p-4 bg-green-800/10 rounded-lg">
          <p className="text-gray-300">
            🎉 Congratulations to <span className="font-bold text-green-400">
              {competition.winner?.name || competition.winner?.email || "the winner"}
            </span>!
          </p>
          <p className="text-sm text-gray-400 mt-2">
            This competition has been concluded and the prize has been awarded.
          </p>
        </div>
      </div>
    );
  }

  if (!competition.isActive) {
    return (
      <div className="bg-gray-900/20 border border-gray-600/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-400 mb-2">Competition Inactive</h3>
        <p className="text-gray-300">This competition is not active for drawing.</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
      <h3 className="text-xl font-bold text-white mb-4">🎲 Conduct Fair Draw</h3>
      
      {/* Draw Button */}
      <div className="mb-6">
        <button
          onClick={conductDraw}
          disabled={isDrawing}
          className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDrawing ? "🎲 Drawing Winner..." : "🎲 Draw Winner Now"}
        </button>
      </div>

      {/* Explanation */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
        <h4 className="font-bold text-blue-400 mb-2">How the Draw Works:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• All individual ticket numbers are collected</li>
          <li>• One ticket number is randomly selected</li>
          <li>• The owner of that ticket wins the prize</li>
          <li>• More tickets = higher chance to win (fair system)</li>
          <li>• Results are transparent and verifiable</li>
        </ul>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-red-400 font-medium">❌ {error}</p>
        </div>
      )}

      {/* Draw Results */}
      {drawResult && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
          <h4 className="text-xl font-bold text-green-400 mb-4">🎉 Winner Drawn!</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-800/20 rounded-lg p-4">
              <div className="text-sm text-gray-300">Winning Ticket</div>
              <div className="text-2xl font-bold text-green-400">#{drawResult.winningTicket.number}</div>
            </div>
            <div className="bg-green-800/20 rounded-lg p-4">
              <div className="text-sm text-gray-300">Winner</div>
              <div className="text-lg font-bold text-white">{drawResult.winningTicket.user.name}</div>
              <div className="text-sm text-gray-400">{drawResult.winningTicket.user.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-400">{drawResult.totalTickets}</div>
              <div className="text-sm text-gray-400">Total Tickets</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-400">{drawResult.totalParticipants}</div>
              <div className="text-sm text-gray-400">Participants</div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Draw ID: {drawResult.drawId} | Time: {new Date(drawResult.drawTimestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}