"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PaymentLog {
  id: string;
  paymentIntentId: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  entries: {
    id: string;
    quantity: number;
    competition: {
      id: string;
      title: string;
    };
  }[];
}

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user?.role || session.user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchPayments();
  }, [session, status, router]);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/admin/payments");
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        console.error("Failed to fetch payments");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.paymentIntentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    let matchesDate = true;
    if (dateRange !== "all") {
      const paymentDate = new Date(payment.createdAt);
      const now = new Date();
      
      switch (dateRange) {
        case "today":
          matchesDate = paymentDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalRevenue = filteredPayments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading payments...</div>
      </div>
    );
  }

  if (!session?.user?.role || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Payment Logs</h1>
          <p className="text-gray-300">Monitor all payment transactions and revenue</p>
        </div>
        <Link
          href="/admin"
          className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform text-white"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user, email, or payment ID..."
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-primary-400">{filteredPayments.length}</div>
          <div className="text-gray-300">Total Payments</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-green-400">£{totalRevenue.toFixed(2)}</div>
          <div className="text-gray-300">Total Revenue</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-blue-400">{filteredPayments.filter(p => p.status === "completed").length}</div>
          <div className="text-gray-300">Successful</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-red-400">{filteredPayments.filter(p => p.status === "failed").length}</div>
          <div className="text-gray-300">Failed</div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-primary-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Payment ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Method</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Items</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600/30">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-secondary-700/30">
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm text-gray-300">
                      {payment.paymentIntentId.substring(0, 20)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{payment.user.name || "No Name"}</div>
                      <div className="text-sm text-gray-400">{payment.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-green-400">£{payment.amount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs font-medium">
                      {payment.method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      payment.status === "completed" 
                        ? "bg-green-600/20 text-green-400"
                        : payment.status === "failed"
                        ? "bg-red-600/20 text-red-400"
                        : "bg-yellow-600/20 text-yellow-400"
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {payment.entries.map((entry, index) => (
                        <div key={entry.id} className="text-gray-300">
                          {entry.quantity}x {entry.competition.title.substring(0, 30)}
                          {entry.competition.title.length > 30 && "..."}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">
                      {new Date(payment.createdAt).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No payments found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
