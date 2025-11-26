"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  country: string | null;
  dateOfBirth: string | null;
  role: string;
  ryderCash: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Entry {
  id: string;
  competitionId: string;
  competition: {
    title: string;
    ticketPrice: number;
  };
  quantity: number;
  totalCost: number;
  paymentMethod: string;
  ryderCashUsed: number;
  paymentStatus: string;
  createdAt: string;
}

interface RyderCashTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  reference: string | null;
  createdAt: string;
}

export default function UserDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [transactions, setTransactions] = useState<RyderCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    if (userId) {
      fetchUserDetails();
    }
  }, [session, status, router, userId]);

  const fetchUserDetails = async () => {
    try {
      // Fetch user details
      const userResponse = await fetch(`/api/admin/users/${userId}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      } else {
        setError("Failed to fetch user details");
      }

      // Fetch user entries
      const entriesResponse = await fetch(`/api/user/entries?userId=${userId}`);
      if (entriesResponse.ok) {
        const entriesData = await entriesResponse.json();
        setEntries(entriesData);
      }

      // Fetch RyderCash transactions
      const transactionsResponse = await fetch(`/api/user/rydercash-transactions?userId=${userId}`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
      }

    } catch (error) {
      console.error("Failed to fetch user details:", error);
      setError("Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  const handleRyderCashAdjustment = async (amount: number, description: string) => {
    try {
      const response = await fetch('/api/admin/rydercash/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount,
          description,
          reference: `Admin adjustment for user ${user?.email}`
        })
      });

      if (response.ok) {
        fetchUserDetails(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('RyderCash adjustment error:', error);
      alert('Failed to adjust RyderCash');
    }
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

  if (error) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Error</h1>
        <p className="text-gray-400">{error}</p>
        <Link href="/admin/users" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
          ← Back to Users
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <h1 className="text-3xl font-bold text-white mb-4">User Not Found</h1>
        <Link href="/admin/users" className="text-primary-400 hover:text-primary-300">
          ← Back to Users
        </Link>
      </div>
    );
  }

  const totalSpent = entries.reduce((sum, entry) => sum + entry.totalCost, 0);
  const totalEntries = entries.length;
  const totalRyderCashUsed = entries.reduce((sum, entry) => sum + entry.ryderCashUsed, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link href="/admin/users" className="text-primary-400 hover:text-primary-300 text-sm mb-2 inline-block">
            ← Back to Users
          </Link>
          <h1 className="text-4xl font-bold gradient-text">User Details</h1>
          <p className="text-gray-300">Comprehensive user information and activity</p>
        </div>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-400">Name</label>
              <div className="text-white font-medium">{user.name || "Not provided"}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Email</label>
              <div className="text-white font-medium">{user.email}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Phone</label>
              <div className="text-white font-medium">{user.phone || "Not provided"}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Date of Birth</label>
              <div className="text-white font-medium">
                {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not provided"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Address</label>
              <div className="text-white font-medium">
                {user.addressLine1 ? (
                  <div>
                    <div>{user.addressLine1}</div>
                    {user.addressLine2 && <div>{user.addressLine2}</div>}
                    <div>{user.city} {user.county} {user.postcode}</div>
                    <div>{user.country}</div>
                  </div>
                ) : (
                  "Not provided"
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Account Status</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-400">Role</label>
              <div className="text-white font-medium capitalize">{user.role}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Email Notifications</label>
              <div className={`font-medium ${user.emailNotifications ? 'text-green-400' : 'text-red-400'}`}>
                {user.emailNotifications ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Member Since</label>
              <div className="text-white font-medium">{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">Last Updated</label>
              <div className="text-white font-medium">{new Date(user.updatedAt).toLocaleDateString()}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-400">RyderCash Balance</label>
              <div className="text-2xl font-bold text-primary-400">£{user.ryderCash.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Total Spent</h3>
          <p className="text-3xl font-bold text-green-400">£{totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Competition Entries</h3>
          <p className="text-3xl font-bold text-blue-400">{totalEntries}</p>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">RyderCash Used</h3>
          <p className="text-3xl font-bold text-yellow-400">£{totalRyderCashUsed.toFixed(2)}</p>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Current Balance</h3>
          <p className="text-3xl font-bold text-primary-400">£{user.ryderCash.toFixed(2)}</p>
        </div>
      </div>

      {/* RyderCash Management */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
        <h2 className="text-2xl font-bold text-white mb-4">RyderCash Management</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              const amount = prompt("Enter amount to add:");
              const description = prompt("Enter description:");
              if (amount && description) {
                handleRyderCashAdjustment(parseFloat(amount), description);
              }
            }}
            className="bg-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Add RyderCash
          </button>
          <button
            onClick={() => {
              const amount = prompt("Enter amount to remove:");
              const description = prompt("Enter description:");
              if (amount && description) {
                handleRyderCashAdjustment(-parseFloat(amount), description);
              }
            }}
            className="bg-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Remove RyderCash
          </button>
        </div>
      </div>

      {/* Competition Entries */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-primary-500/20 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Competition Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-900/50">
              <tr>
                <th className="text-left p-4 text-gray-300 font-semibold">Competition</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Tickets</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Total Cost</th>
                <th className="text-left p-4 text-gray-300 font-semibold">RyderCash Used</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-700 hover:bg-secondary-900/30">
                  <td className="p-4 text-white font-medium">{entry.competition.title}</td>
                  <td className="p-4 text-gray-300">{entry.quantity}</td>
                  <td className="p-4 text-gray-300">£{entry.totalCost.toFixed(2)}</td>
                  <td className="p-4 text-gray-300">£{entry.ryderCashUsed.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      entry.paymentStatus === 'completed' 
                        ? "bg-green-600/20 text-green-400" 
                        : entry.paymentStatus === 'pending'
                          ? "bg-yellow-600/20 text-yellow-400"
                          : "bg-red-600/20 text-red-400"
                    }`}>
                      {entry.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{new Date(entry.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No competition entries found</p>
            </div>
          )}
        </div>
      </div>

      {/* RyderCash Transactions */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-primary-500/20 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">RyderCash Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-900/50">
              <tr>
                <th className="text-left p-4 text-gray-300 font-semibold">Type</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Amount</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Description</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Reference</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-700 hover:bg-secondary-900/30">
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      transaction.type === "credit" ? "bg-green-600/20 text-green-400" :
                      transaction.type === "debit" ? "bg-red-600/20 text-red-400" :
                      "bg-blue-600/20 text-blue-400"
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">
                    <span className={transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
                      {transaction.type === 'credit' ? '+' : '-'}£{Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{transaction.description}</td>
                  <td className="p-4 text-gray-300">{transaction.reference || '-'}</td>
                  <td className="p-4 text-gray-300">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No RyderCash transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
