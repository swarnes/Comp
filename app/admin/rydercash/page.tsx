"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
  ryderCash: number;
}

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  reference: string | null;
  createdBy: string | null;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

export default function AdminRyderCashPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [transactionType, setTransactionType] = useState<string>("credit");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [reference, setReference] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    fetchUsers();
    fetchTransactions();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/admin/rydercash-transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || amount === 0) {
      setError("Please select a user and enter an amount");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/rydercash-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser,
          type: transactionType,
          amount: transactionType === "debit" ? -Math.abs(amount) : Math.abs(amount),
          description: description || `Admin ${transactionType} - ${amount} RyderCash`,
          reference: reference || null
        })
      });

      if (response.ok) {
        setSuccess(`Successfully ${transactionType === "credit" ? "added" : "deducted"} £${amount} ${transactionType === "credit" ? "to" : "from"} user account`);
        
        // Reset form
        setSelectedUser("");
        setAmount(0);
        setDescription("");
        setReference("");
        
        // Refresh data
        fetchUsers();
        fetchTransactions();
      } else {
        const data = await response.json();
        setError(data.message || "Failed to process transaction");
      }
    } catch (error: any) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = transactions.filter(transaction =>
    transaction.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading") {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">RyderCash Management</h1>
        <p className="text-gray-300">Issue and manage RyderCash for users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Issue RyderCash Form */}
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Issue RyderCash</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-300 mb-2">
                Select User *
              </label>
              <select
                id="user"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-600 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Choose a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || "No Name"} ({user.email}) - £{user.ryderCash.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                Transaction Type *
              </label>
              <select
                id="type"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="credit">Credit (Add RyderCash)</option>
                <option value="debit">Debit (Remove RyderCash)</option>
                <option value="bonus">Bonus</option>
                <option value="refund">Refund</option>
                <option value="admin_adjustment">Admin Adjustment</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                Amount (£) *
              </label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
                className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Optional description"
              />
            </div>

            {/* Reference */}
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-300 mb-2">
                Reference
              </label>
              <input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Optional reference (e.g., competition ID)"
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              {loading ? "Processing..." : `${transactionType === "credit" ? "Add" : "Deduct"} RyderCash`}
            </button>
          </form>
        </div>

        {/* User Balances */}
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">User Balances</h2>
          
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-secondary-700/30 rounded-lg p-4 border border-gray-600/30">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{user.name || "No Name"}</div>
                    <div className="text-gray-400 text-sm">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary-400 text-lg">£{user.ryderCash.toFixed(2)}</div>
                    <div className="text-gray-400 text-xs">RyderCash</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Transactions</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600/30">
                <th className="text-left text-gray-300 font-medium p-3">User</th>
                <th className="text-left text-gray-300 font-medium p-3">Type</th>
                <th className="text-left text-gray-300 font-medium p-3">Amount</th>
                <th className="text-left text-gray-300 font-medium p-3">Balance</th>
                <th className="text-left text-gray-300 font-medium p-3">Description</th>
                <th className="text-left text-gray-300 font-medium p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 20).map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-600/20">
                  <td className="p-3">
                    <div className="font-medium text-white">{transaction.user.name || "No Name"}</div>
                    <div className="text-gray-400 text-sm">{transaction.user.email}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.type === "credit" ? "bg-green-600/20 text-green-400" :
                      transaction.type === "debit" ? "bg-red-600/20 text-red-400" :
                      "bg-blue-600/20 text-blue-400"
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`font-bold ${
                      transaction.amount >= 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {transaction.amount >= 0 ? "+" : ""}£{Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-3 text-white font-medium">£{transaction.balance.toFixed(2)}</td>
                  <td className="p-3 text-gray-300">{transaction.description}</td>
                  <td className="p-3 text-gray-400 text-sm">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No transactions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
