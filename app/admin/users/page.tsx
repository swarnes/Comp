"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  ryderCash: number;
  phone: string | null;
  createdAt: string;
  _count: {
    entries: number;
    ryderCashTransactions: number;
  };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user?.role || session.user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      } else {
        alert("Failed to update user role");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Error updating user role");
    }
  };

  const handleRyderCashAdjustment = async (userId: string, amount: number, description: string) => {
    try {
      const response = await fetch("/api/admin/rydercash-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          amount,
          description,
          type: amount > 0 ? "credit" : "debit"
        }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      } else {
        alert("Failed to adjust RyderCash");
      }
    } catch (error) {
      console.error("Error adjusting RyderCash:", error);
      alert("Error adjusting RyderCash");
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof User];
      let bValue = b[sortBy as keyof User];
      
      if (sortBy === "_count.entries") {
        aValue = a._count.entries;
        bValue = b._count.entries;
      }
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading users...</div>
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
          <h1 className="text-4xl font-bold gradient-text mb-2">User Management</h1>
          <p className="text-gray-300">Manage user accounts, roles, and RyderCash balances</p>
        </div>
        <Link
          href="/admin"
          className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform text-white"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search Users</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role Filter</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="createdAt">Join Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="ryderCash">RyderCash Balance</option>
              <option value="_count.entries">Entry Count</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-primary-400">{users.length}</div>
          <div className="text-gray-300">Total Users</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-green-400">{users.filter(u => u.role === "admin").length}</div>
          <div className="text-gray-300">Admins</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-blue-400">{users.filter(u => u._count.entries > 0).length}</div>
          <div className="text-gray-300">Active Players</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-yellow-400">£{users.reduce((sum, u) => sum + u.ryderCash, 0).toFixed(2)}</div>
          <div className="text-gray-300">Total RyderCash</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-primary-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Role</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">RyderCash</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Entries</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600/30">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-secondary-700/30">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-white">{user.name || "No Name"}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                      {user.phone && (
                        <div className="text-xs text-gray-500">{user.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin" 
                          ? "bg-red-600/20 text-red-400 border border-red-600/30" 
                          : "bg-green-600/20 text-green-400 border border-green-600/30"
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-yellow-400">£{user.ryderCash.toFixed(2)}</div>
                    <div className="text-xs text-gray-400">{user._count.ryderCashTransactions} transactions</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-blue-400">{user._count.entries}</div>
                    <div className="text-xs text-gray-400">competition entries</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const amount = prompt("Enter RyderCash amount (positive to add, negative to remove):");
                          const description = prompt("Enter description for this adjustment:");
                          if (amount && description) {
                            handleRyderCashAdjustment(user.id, parseFloat(amount), description);
                          }
                        }}
                        className="bg-gradient-primary px-3 py-1 rounded-xl font-semibold hover:scale-105 transition-transform text-white text-xs"
                      >
                        Adjust Cash
                      </button>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="bg-gradient-primary px-3 py-1 rounded-xl font-semibold hover:scale-105 transition-transform text-white text-xs"
                      >
                        View Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No users found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
