"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import WinnerPicker from "@/components/WinnerPicker";

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
  isActive: boolean;
  winnerId?: string | null;
  winner?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface CompetitionStats {
  competitionId: string;
  maxTickets: number;
  soldTickets: number;
  progressPercentage: number;
  totalRevenue: number;
  totalParticipants: number;
}

export default function ManageCompetition() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [stats, setStats] = useState<CompetitionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    fetchCompetitionData();
  }, [session, status, router, params?.id]);

  const fetchCompetitionData = async () => {
    try {
      // Fetch competition details
      const competitionRes = await fetch(`/api/competitions/${params?.id}`);
      if (competitionRes.ok) {
        const competitionData = await competitionRes.json();
        setCompetition(competitionData);
      }

      // Fetch competition stats
      const statsRes = await fetch(`/api/competitions/${params?.id}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          ...statsData,
          totalRevenue: statsData.soldTickets * (competition?.ticketPrice || 0),
          totalParticipants: 0 // Will need to calculate this separately if needed
        });
      }
    } catch (error) {
      setError("Failed to load competition data");
    } finally {
      setLoading(false);
    }
  };

  const handleDrawComplete = () => {
    // Refresh competition data after draw
    fetchCompetitionData();
  };

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading competition...</div>
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400">You need admin privileges to access this page.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Error</h1>
        <p className="text-gray-400">{error}</p>
        <Link href="/admin" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
          ← Back to Admin Dashboard
        </Link>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-white mb-4">Competition Not Found</h1>
        <Link href="/admin" className="text-primary-400 hover:text-primary-300">
          ← Back to Admin Dashboard
        </Link>
      </div>
    );
  }

  const isEnded = new Date(competition.endDate) <= new Date();
  const daysUntilEnd = Math.ceil((new Date(competition.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin" className="text-primary-400 hover:text-primary-300 mb-4 inline-block">
          ← Back to Admin Dashboard
        </Link>
        <h1 className="text-4xl font-bold gradient-text mb-4">Manage Competition</h1>
        <p className="text-gray-300">Competition management and winner drawing</p>
      </div>

      {/* Competition Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Competition Details */}
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">{competition.title}</h2>
          
          <div className="flex items-center space-x-4 mb-4">
            <img 
              src={competition.image || "/images/default.jpg"} 
              alt={competition.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div>
              <div className="text-gray-300">{competition.description}</div>
              <div className="text-sm text-gray-400 mt-2">
                Prize Value: £{(competition.prizeValue || competition.ticketPrice * competition.maxTickets).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Ticket Price:</span>
              <div className="text-white font-bold">£{competition.ticketPrice.toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-400">Max Tickets:</span>
              <div className="text-white font-bold">{competition.maxTickets.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-gray-400">Start Date:</span>
              <div className="text-white">{new Date(competition.startDate).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="text-gray-400">End Date:</span>
              <div className="text-white">{new Date(competition.endDate).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <div className={`font-bold ${competition.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {competition.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Time Remaining:</span>
              <div className="text-white">
                {isEnded ? 'Ended' : `${daysUntilEnd} days`}
              </div>
            </div>
          </div>
        </div>

        {/* Competition Stats */}
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h2 className="text-2xl font-bold text-white mb-4">Sales Statistics</h2>
          
          {stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.soldTickets}</div>
                  <div className="text-sm text-gray-400">Tickets Sold</div>
                </div>
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.progressPercentage}%</div>
                  <div className="text-sm text-gray-400">Sold</div>
                </div>
              </div>
              
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">£{(stats.soldTickets * competition.ticketPrice).toLocaleString()}</div>
                <div className="text-sm text-gray-400">Total Revenue</div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="progress-bar h-3 rounded-full"
                  style={{ width: `${stats.progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-400">
                {stats.soldTickets} / {stats.maxTickets} tickets sold
              </div>
            </div>
          ) : (
            <div className="text-gray-400">Loading statistics...</div>
          )}
        </div>
      </div>

      {/* Winner Drawing Section */}
      <div>
        <WinnerPicker 
          competition={competition} 
          onDrawComplete={handleDrawComplete} 
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
        <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link 
            href={`/competition/${competition.id}`}
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            View Public Page
          </Link>
          <Link 
            href={`/admin/competitions/${competition.id}/edit`}
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Edit Competition
          </Link>
          <button
            onClick={() => {
              // Add more quick actions here if needed
              window.location.reload();
            }}
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
