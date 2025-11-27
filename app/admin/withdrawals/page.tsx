"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  paymentMethod: string;
  paymentDetails: string;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  processedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    cashBalance: number;
  };
}

export default function AdminWithdrawalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    withdrawal: WithdrawalRequest | null;
    action: 'approve' | 'reject' | null;
  }>({ isOpen: false, withdrawal: null, action: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user?.role || session.user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchWithdrawals();
  }, [session, status, router]);

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch("/api/admin/withdrawals");
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data);
      } else {
        console.error("Failed to fetch withdrawals");
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal.withdrawal || !actionModal.action) return;

    setProcessingId(actionModal.withdrawal.id);

    try {
      const response = await fetch(`/api/admin/withdrawals/${actionModal.withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModal.action,
          rejectionReason: actionModal.action === 'reject' ? rejectionReason : undefined,
          notes: adminNotes || undefined
        })
      });

      if (response.ok) {
        fetchWithdrawals();
        closeModal();
        alert(`Withdrawal ${actionModal.action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      } else {
        const data = await response.json();
        alert(`Failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert("Error processing withdrawal");
    } finally {
      setProcessingId(null);
    }
  };

  const openModal = (withdrawal: WithdrawalRequest, action: 'approve' | 'reject') => {
    setActionModal({ isOpen: true, withdrawal, action });
    setRejectionReason("");
    setAdminNotes("");
  };

  const closeModal = () => {
    setActionModal({ isOpen: false, withdrawal: null, action: null });
    setRejectionReason("");
    setAdminNotes("");
  };

  const parsePaymentDetails = (details: string) => {
    try {
      return JSON.parse(details);
    } catch {
      return {};
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (statusFilter === "all") return true;
    return w.status === statusFilter;
  });

  const pendingCount = withdrawals.filter(w => w.status === 'PENDING').length;
  const totalPendingAmount = withdrawals
    .filter(w => w.status === 'PENDING')
    .reduce((sum, w) => sum + w.amount, 0);

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-4">Withdrawal Requests</h1>
          <p className="text-gray-300">Manage user payout requests</p>
        </div>
        <Link 
          href="/admin"
          className="bg-secondary-700 px-6 py-3 rounded-xl font-semibold hover:bg-secondary-600 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Total Requests</h3>
          <p className="text-3xl font-bold text-primary-400">{withdrawals.length}</p>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-400">{pendingCount}</p>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Pending Amount</h3>
          <p className="text-3xl font-bold text-yellow-400">£{totalPendingAmount.toFixed(2)}</p>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-400">
            {withdrawals.filter(w => w.status === 'COMPLETED' || w.status === 'APPROVED').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-primary-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-900/50">
              <tr>
                <th className="text-left p-4 text-gray-300 font-semibold">User</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Amount</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Payment Method</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Payment Details</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Requested</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600/30">
              {filteredWithdrawals.map((withdrawal) => {
                const details = parsePaymentDetails(withdrawal.paymentDetails);
                return (
                  <tr key={withdrawal.id} className="hover:bg-secondary-700/30">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-white">
                          {withdrawal.user.name || "No name"}
                        </div>
                        <div className="text-sm text-gray-400">{withdrawal.user.email}</div>
                        <div className="text-xs text-gray-500">
                          Balance: £{withdrawal.user.cashBalance.toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xl font-bold text-green-400">
                        £{withdrawal.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white capitalize">
                        {withdrawal.paymentMethod === 'bank_transfer' ? '🏦 Bank Transfer' : '💳 PayPal'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-300">
                        {withdrawal.paymentMethod === 'bank_transfer' ? (
                          <>
                            <div><span className="text-gray-500">Name:</span> {details.accountName}</div>
                            <div><span className="text-gray-500">Sort:</span> {details.sortCode}</div>
                            <div><span className="text-gray-500">Acc:</span> {details.accountNumber}</div>
                          </>
                        ) : (
                          <div><span className="text-gray-500">PayPal:</span> {details.paypalEmail}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        withdrawal.status === 'PENDING' 
                          ? "bg-yellow-600/20 text-yellow-400 border border-yellow-500/20"
                          : withdrawal.status === 'APPROVED' || withdrawal.status === 'COMPLETED'
                          ? "bg-green-600/20 text-green-400 border border-green-500/20"
                          : "bg-red-600/20 text-red-400 border border-red-500/20"
                      }`}>
                        {withdrawal.status}
                      </span>
                      {withdrawal.rejectionReason && (
                        <div className="text-xs text-red-400 mt-1">
                          Reason: {withdrawal.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-300">
                        {new Date(withdrawal.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {withdrawal.processedAt && (
                        <div className="text-xs text-gray-500">
                          Processed: {new Date(withdrawal.processedAt).toLocaleDateString('en-GB')}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {withdrawal.status === 'PENDING' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(withdrawal, 'approve')}
                            disabled={processingId === withdrawal.id}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => openModal(withdrawal, 'reject')}
                            disabled={processingId === withdrawal.id}
                            className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredWithdrawals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No withdrawal requests found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {actionModal.isOpen && actionModal.withdrawal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-secondary-800 rounded-2xl p-6 max-w-md w-full border border-primary-500/30 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {actionModal.action === 'approve' ? '✓ Approve Withdrawal' : '✕ Reject Withdrawal'}
            </h3>

            <div className="bg-secondary-700/50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-400">User</div>
              <div className="text-white font-medium">{actionModal.withdrawal.user.name || actionModal.withdrawal.user.email}</div>
              <div className="text-sm text-gray-400 mt-2">Amount</div>
              <div className="text-2xl font-bold text-green-400">£{actionModal.withdrawal.amount.toFixed(2)}</div>
            </div>

            {actionModal.action === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Enter reason for rejection..."
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-4 py-3 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
                placeholder="Any notes..."
              />
            </div>

            {actionModal.action === 'approve' && (
              <div className="bg-yellow-600/20 border border-yellow-500/20 rounded-lg p-3 mb-4">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Make sure you have sent the payment before approving!
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionModal.action === 'reject' && !rejectionReason}
                className={`flex-1 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 ${
                  actionModal.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {actionModal.action === 'approve' ? 'Approve & Mark Paid' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

