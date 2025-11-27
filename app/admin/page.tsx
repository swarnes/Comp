"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WinnerPicker from "@/components/WinnerPicker";

interface Competition {
  id: string;
  slug?: string;
  title: string;
  description: string;
  image: string | null;
  startDate: string;
  endDate: string;
  ticketPrice: number;
  maxTickets: number;
  prizeValue?: number | null;
  isActive: boolean;
  hasInstantWins?: boolean;
  winnerId?: string | null;
  winner?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [competitionToDelete, setCompetitionToDelete] = useState<Competition | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    fetchCompetitions();
  }, [session, status, router]);

  const fetchCompetitions = async () => {
    try {
      const response = await fetch("/api/admin/competitions");
      if (response.ok) {
        const data = await response.json();
        setCompetitions(data);
      }
    } catch (error) {
      console.error("Failed to fetch competitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompetitionStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/competitions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        fetchCompetitions(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to update competition:", error);
    }
  };

  const handleDeleteClick = (competition: Competition) => {
    // Prevent deletion if competition has a winner
    if (competition.winnerId) {
      alert("Cannot delete a competition that already has a winner drawn.");
      return;
    }
    
    setCompetitionToDelete(competition);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!competitionToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/competitions/${competitionToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      const data = await response.json();

      if (response.ok) {
        // Success - refresh competitions list
        fetchCompetitions();
        setDeleteModalOpen(false);
        setCompetitionToDelete(null);
        alert(`Competition "${competitionToDelete.title}" deleted successfully!`);
      } else {
        // Error - show error message
        alert(`Failed to delete competition: ${data.message}`);
      }
    } catch (error) {
      console.error("Failed to delete competition:", error);
      alert("An error occurred while deleting the competition. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setCompetitionToDelete(null);
  };

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading...</div>
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Admin Dashboard</h1>
          <p className="text-gray-300">Manage competitions and monitor sales</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/admin/users"
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            👥 Users
          </Link>
          <Link 
            href="/admin/payments"
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            💳 Payments
          </Link>
          <Link 
            href="/admin/orders"
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            📋 Orders
          </Link>
          <Link 
            href="/admin/rydercash"
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            💰 RyderCash
          </Link>
          <Link 
            href="/admin/withdrawals"
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            💸 Withdrawals
          </Link>
          <Link 
            href="/admin/competitions/new"
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            + New Competition
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Total Competitions</h3>
          <p className="text-3xl font-bold text-primary-400">{competitions.length}</p>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Active</h3>
          <p className="text-3xl font-bold text-green-400">{competitions.filter(c => c.isActive).length}</p>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Inactive</h3>
          <p className="text-3xl font-bold text-red-400">{competitions.filter(c => !c.isActive).length}</p>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">This Month</h3>
          <p className="text-3xl font-bold text-blue-400">
            {competitions.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
          </p>
        </div>
      </div>

      {/* Competitions Table */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-primary-500/20 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">All Competitions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-900/50">
              <tr>
                <th className="text-left p-4 text-gray-300 font-semibold">Competition</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Price</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Max Tickets</th>
                <th className="text-left p-4 text-gray-300 font-semibold">End Date</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Winner</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((competition) => (
                <tr key={competition.id} className="border-b border-gray-700 hover:bg-secondary-900/30">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={competition.image || "/images/default.jpg"} 
                        alt={competition.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {competition.title}
                          {competition.hasInstantWins && (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30" title="Has Instant Wins">
                              ⚡ Instant
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">{competition.description.slice(0, 50)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">£{competition.ticketPrice.toFixed(2)}</td>
                  <td className="p-4 text-gray-300">{competition.maxTickets.toLocaleString()}</td>
                  <td className="p-4 text-gray-300">{new Date(competition.endDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      competition.isActive 
                        ? "bg-green-600/20 text-green-400 border border-green-500/20" 
                        : "bg-red-600/20 text-red-400 border border-red-500/20"
                    }`}>
                      {competition.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    {competition.winnerId ? (
                      <div className="text-green-400 font-medium">
                        <div className="text-sm">🏆 {competition.winner?.name || competition.winner?.email || "Winner Selected"}</div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">No winner yet</div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <Link 
                        href={`/competition/${competition.slug || competition.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/admin/competitions/${competition.id}/edit`}
                        className="text-green-400 hover:text-green-300 text-sm font-medium"
                      >
                        Edit
                      </Link>
                      <Link 
                        href={`/admin/competitions/${competition.id}/manage`}
                        className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                      >
                        Manage
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleCompetitionStatus(competition.id, competition.isActive)}
                        className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                      >
                        {competition.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(competition)}
                        disabled={competition.winnerId !== null}
                        className={`text-sm font-medium ${
                          competition.winnerId 
                            ? "text-gray-500 cursor-not-allowed" 
                            : "text-red-400 hover:text-red-300"
                        }`}
                        title={
                          competition.winnerId 
                            ? "Cannot delete competition with winner" 
                            : "Delete competition"
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {competitions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No competitions found</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && competitionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-secondary-800 rounded-xl p-6 max-w-md w-full mx-4 border border-primary-500/20">
            <h3 className="text-xl font-bold text-white mb-4">Delete Competition</h3>
            <p className="text-gray-300 mb-2">
              Are you sure you want to delete the competition:
            </p>
            <p className="text-primary-400 font-semibold mb-4">
              "{competitionToDelete.title}"
            </p>
            <div className="bg-yellow-600/20 border border-yellow-500/20 rounded-lg p-3 mb-4">
              <p className="text-yellow-300 text-sm">
                ⚠️ <strong>Warning:</strong> This action cannot be undone. You can only delete competitions that have no entries or winners.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}