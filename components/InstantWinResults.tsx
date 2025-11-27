"use client";

import { useEffect, useState } from "react";

interface InstantWin {
  ticketNumber: number;
  result: "NONE" | "WIN";
  prizeId?: string;
  prizeName?: string;
  prizeType?: "CASH" | "RYDER_CASH";
  value?: number;
}

interface Props {
  wins: InstantWin[];
  totalCashWon: number;
  totalRyderCashWon: number;
  onClose?: () => void;
}

export default function InstantWinResults({ 
  wins, 
  totalCashWon, 
  totalRyderCashWon, 
  onClose 
}: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
    
    // Show confetti effect
    if (wins.length > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [wins.length]);

  if (wins.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {/* Confetti animation overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#FFD700', '#FFA500', '#FF6347', '#00FF00', '#00BFFF', '#FF1493'][Math.floor(Math.random() * 6)],
              }}
            />
          ))}
        </div>
      )}

      <div 
        className={`
          relative max-w-lg w-full bg-gradient-to-br from-yellow-500/10 via-secondary-800 to-amber-600/10 
          rounded-3xl p-8 border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20
          transform transition-all duration-500
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 blur-xl -z-10" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
            INSTANT WIN!
          </h2>
          <p className="text-gray-300 mt-2">
            Congratulations! You won {wins.length} instant prize{wins.length > 1 ? 's' : ''}!
          </p>
        </div>

        {/* Prize list */}
        <div className="space-y-3 mb-6">
          {wins.map((win, index) => (
            <div
              key={index}
              className="bg-secondary-700/60 rounded-xl p-4 border border-yellow-500/30 flex items-center justify-between"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {win.prizeType === "CASH" ? "💷" : "🎫"}
                </span>
                <div>
                  <div className="font-semibold text-white">{win.prizeName}</div>
                  <div className="text-sm text-gray-400">Ticket #{win.ticketNumber}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-yellow-400">
                  £{win.value?.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">
                  {win.prizeType === "CASH" ? "Cash" : "Ryder Cash"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-secondary-900/60 rounded-xl p-4 space-y-2 mb-6">
          {totalCashWon > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-300">💷 Total Cash Won:</span>
              <span className="text-xl font-bold text-green-400">£{totalCashWon.toFixed(2)}</span>
            </div>
          )}
          {totalRyderCashWon > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🎫 Total Ryder Cash Won:</span>
              <span className="text-xl font-bold text-primary-400">£{totalRyderCashWon.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Info text */}
        <p className="text-xs text-gray-500 text-center mb-6">
          {totalCashWon > 0 && "Cash prizes have been added to your withdrawable balance. "}
          {totalRyderCashWon > 0 && "Ryder Cash is site credit and can be used for future entries."}
        </p>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold py-3 px-6 rounded-xl hover:from-yellow-400 hover:to-amber-500 transition-all duration-300 transform hover:scale-105"
        >
          Awesome! Continue
        </button>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          width: 10px;
          height: 10px;
          animation: confetti 3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}

