"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderLog {
  id: string;
  ticketNumbers: string;
  quantity: number;
  totalCost: number;
  paymentMethod: string;
  paymentStatus: string;
  ryderCashUsed: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  competition: {
    id: string;
    title: string;
    endDate: string;
    isActive: boolean;
  };
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [competitionFilter, setCompetitionFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user?.role || session.user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchOrders();
  }, [session, status, router]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        console.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique competitions for filter
  const competitions = Array.from(new Set(orders.map(o => o.competition.title)))
    .map(title => orders.find(o => o.competition.title === title)!)
    .map(o => ({ id: o.competition.id, title: o.competition.title }));

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.competition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.paymentStatus === statusFilter;
    const matchesCompetition = competitionFilter === "all" || order.competition.id === competitionFilter;
    const matchesPaymentMethod = paymentMethodFilter === "all" || order.paymentMethod === paymentMethodFilter;
    
    return matchesSearch && matchesStatus && matchesCompetition && matchesPaymentMethod;
  });

  const parseTicketNumbers = (ticketNumbersString: string): number[] => {
    try {
      return JSON.parse(ticketNumbersString);
    } catch {
      return [];
    }
  };

  const totalRevenue = filteredOrders
    .filter(o => o.paymentStatus === "completed")
    .reduce((sum, o) => sum + o.totalCost, 0);

  const totalTickets = filteredOrders
    .filter(o => o.paymentStatus === "completed")
    .reduce((sum, o) => sum + o.quantity, 0);

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading orders...</div>
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
          <h1 className="text-4xl font-bold gradient-text mb-2">Order Logs</h1>
          <p className="text-gray-300">Monitor all competition entries and ticket sales</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by user, competition, or order ID..."
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment Status</label>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Competition</label>
            <select
              value={competitionFilter}
              onChange={(e) => setCompetitionFilter(e.target.value)}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Competitions</option>
              {competitions.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.title.length > 30 ? comp.title.substring(0, 30) + "..." : comp.title}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Methods</option>
              <option value="card">Card</option>
              <option value="ryderCash">RyderCash</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-primary-400">{filteredOrders.length}</div>
          <div className="text-gray-300">Total Orders</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-green-400">£{totalRevenue.toFixed(2)}</div>
          <div className="text-gray-300">Total Revenue</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-blue-400">{totalTickets}</div>
          <div className="text-gray-300">Tickets Sold</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-yellow-400">{filteredOrders.filter(o => o.paymentStatus === "completed").length}</div>
          <div className="text-gray-300">Completed</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-primary-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Competition</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Tickets</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600/30">
              {filteredOrders.map((order) => {
                const ticketNumbers = parseTicketNumbers(order.ticketNumbers);
                return (
                  <tr key={order.id} className="hover:bg-secondary-700/30">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-gray-300">
                        {order.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{order.user.name || "No Name"}</div>
                        <div className="text-sm text-gray-400">{order.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">
                          {order.competition.title.length > 25 
                            ? order.competition.title.substring(0, 25) + "..." 
                            : order.competition.title}
                        </div>
                        <div className="text-sm text-gray-400">
                          Ends: {new Date(order.competition.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-blue-400">{order.quantity} tickets</div>
                        <div className="text-xs text-gray-400">
                          {ticketNumbers.length > 0 && (
                            <>#{ticketNumbers[0]}{ticketNumbers.length > 1 ? ` - #${ticketNumbers[ticketNumbers.length - 1]}` : ""}</>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-green-400">£{order.totalCost.toFixed(2)}</div>
                        {order.ryderCashUsed > 0 && (
                          <div className="text-xs text-yellow-400">
                            £{order.ryderCashUsed.toFixed(2)} RyderCash
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.paymentMethod === "card" 
                          ? "bg-blue-600/20 text-blue-400"
                          : order.paymentMethod === "ryderCash"
                          ? "bg-yellow-600/20 text-yellow-400"
                          : "bg-purple-600/20 text-purple-400"
                      }`}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.paymentStatus === "completed" 
                          ? "bg-green-600/20 text-green-400"
                          : order.paymentStatus === "failed"
                          ? "bg-red-600/20 text-red-400"
                          : "bg-yellow-600/20 text-yellow-400"
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No orders found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
