"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCompetition() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    startDate: "",
    endDate: "",
    ticketPrice: 3.0,
    maxTickets: 10000,
    prizeValue: 30000.0,
    isActive: true
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user?.role !== "admin") {
      router.push("/auth/signin");
      return;
    }

    // Set default dates
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    setFormData(prev => ({
      ...prev,
      startDate: now.toISOString().slice(0, 16),
      endDate: nextWeek.toISOString().slice(0, 16)
    }));
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Competition created successfully!");
        setTimeout(() => {
          router.push("/admin");
        }, 2000);
      } else {
        setError(data.message || "Failed to create competition");
      }
    } catch (error: any) {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : 
              type === "checkbox" ? (e.target as HTMLInputElement).checked : 
              value
    }));
  };

  if (status === "loading") {
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
        <p className="text-gray-400">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="text-primary-400 hover:text-primary-300 mb-4 inline-block">
          ← Back to Admin Dashboard
        </Link>
        <h1 className="text-4xl font-bold gradient-text mb-4">Create New Competition</h1>
        <p className="text-gray-300">Add a new competition to the platform</p>
      </div>

      {/* Form */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-8 border border-primary-500/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Competition Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter competition title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter competition description"
            />
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-2">
              Image URL
            </label>
            <input
              type="text"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="/images/competitions/example.jpg"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                required
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                required
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Prize Value */}
          <div>
            <label htmlFor="prizeValue" className="block text-sm font-medium text-gray-300 mb-2">
              Prize Value (£)
            </label>
            <input
              type="number"
              id="prizeValue"
              name="prizeValue"
              required
              min="0"
              step="0.01"
              value={formData.prizeValue}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="50000.00"
            />
            <p className="text-sm text-gray-400 mt-1">
              The total value of the prize that the winner will receive
            </p>
          </div>

          {/* Price and Max Tickets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-300 mb-2">
                Ticket Price (£)
              </label>
              <input
                type="number"
                id="ticketPrice"
                name="ticketPrice"
                required
                min="0"
                step="0.01"
                value={formData.ticketPrice}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="3.00"
              />
              <p className="text-sm text-gray-400 mt-1">
                Cost per individual ticket entry
              </p>
            </div>

            <div>
              <label htmlFor="maxTickets" className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Tickets
              </label>
              <input
                type="number"
                id="maxTickets"
                name="maxTickets"
                required
                min="1"
                value={formData.maxTickets}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="10000"
              />
              <p className="text-sm text-gray-400 mt-1">
                Total number of tickets available for sale
              </p>
            </div>
          </div>

          {/* Prize Calculation Helper */}
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-400 mb-2">📊 Competition Economics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Prize Value</div>
                <div className="font-bold text-white">£{formData.prizeValue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Max Revenue</div>
                <div className="font-bold text-white">£{(formData.ticketPrice * formData.maxTickets).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-gray-400">Revenue Ratio</div>
                <div className="font-bold text-white">
                  {formData.prizeValue > 0 ? 
                    `${((formData.ticketPrice * formData.maxTickets / formData.prizeValue) * 100).toFixed(1)}%` : 
                    'N/A'
                  }
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Revenue ratio shows how much of the maximum revenue the prize represents. 
              Higher ratios mean more revenue coverage.
            </p>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 text-primary-600 bg-secondary-700 border-gray-600 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-300">Competition is active</span>
            </label>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded">{error}</div>
          )}

          {success && (
            <div className="text-green-400 text-sm bg-green-900/20 p-3 rounded">{success}</div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Creating..." : "Create Competition"}
            </button>

            <Link
              href="/admin"
              className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
