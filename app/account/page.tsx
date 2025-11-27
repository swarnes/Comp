"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  ryderCash: number;
  cashBalance: number; // Withdrawable cash from instant wins
  // Address Information
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  country: string | null;
  // Contact Information
  phone: string | null;
  dateOfBirth: string | null;
  // Preferences
  emailNotifications: boolean;

  marketingEmails: boolean;
}

interface RyderCashTransaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  paymentMethod: string;
  createdAt: string;
  processedAt: string | null;
  rejectionReason: string | null;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<RyderCashTransaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'preferences' | 'rydercash'>('profile');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  // Withdrawal modal state
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalMethod, setWithdrawalMethod] = useState<"bank_transfer" | "paypal">("bank_transfer");
  const [withdrawalDetails, setWithdrawalDetails] = useState({
    accountName: "",
    sortCode: "",
    accountNumber: "",
    paypalEmail: ""
  });
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState("");
  const [withdrawalSuccess, setWithdrawalSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    county: "",
    postcode: "",
    country: "United Kingdom",
    emailNotifications: true,

    marketingEmails: true
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchProfile();
    fetchTransactions();
    fetchWithdrawalRequests();
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : "",
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          city: data.city || "",
          county: data.county || "",
          postcode: data.postcode || "",
          country: data.country || "United Kingdom",
          emailNotifications: data.emailNotifications ?? true,

          marketingEmails: data.marketingEmails ?? true
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/user/rydercash-transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const response = await fetch("/api/user/withdrawal-request");
      if (response.ok) {
        const data = await response.json();
        setWithdrawalRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch withdrawal requests:", error);
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawalError("");
    setWithdrawalSuccess("");
    setWithdrawalLoading(true);

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawalError("Please enter a valid amount");
      setWithdrawalLoading(false);
      return;
    }

    let paymentDetails;
    if (withdrawalMethod === "bank_transfer") {
      if (!withdrawalDetails.accountName || !withdrawalDetails.sortCode || !withdrawalDetails.accountNumber) {
        setWithdrawalError("Please fill in all bank details");
        setWithdrawalLoading(false);
        return;
      }
      paymentDetails = {
        accountName: withdrawalDetails.accountName,
        sortCode: withdrawalDetails.sortCode,
        accountNumber: withdrawalDetails.accountNumber
      };
    } else {
      if (!withdrawalDetails.paypalEmail) {
        setWithdrawalError("Please enter your PayPal email");
        setWithdrawalLoading(false);
        return;
      }
      paymentDetails = {
        paypalEmail: withdrawalDetails.paypalEmail
      };
    }

    try {
      const response = await fetch("/api/user/withdrawal-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          paymentMethod: withdrawalMethod,
          paymentDetails
        })
      });

      // Try to parse JSON, handle non-JSON responses
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        data = { message: "Server error - please try again" };
      }

      if (response.ok) {
        setWithdrawalSuccess("Withdrawal request submitted successfully! We'll process it within 2-3 business days.");
        // Reset form
        setWithdrawalAmount("");
        setWithdrawalDetails({
          accountName: "",
          sortCode: "",
          accountNumber: "",
          paypalEmail: ""
        });
        // Refresh data
        fetchProfile();
        fetchWithdrawalRequests();
        // Close modal after delay
        setTimeout(() => {
          setShowWithdrawalModal(false);
          setWithdrawalSuccess("");
        }, 3000);
      } else {
        setWithdrawalError(data.message || "Failed to submit withdrawal request");
      }
    } catch (error: any) {
      console.error("Withdrawal request error:", error);
      setWithdrawalError(error.message || "Something went wrong. Please try again.");
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Profile updated successfully!");
        setProfile(data);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading account...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to sign in
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">My Account</h1>
        <p className="text-gray-300">Manage your profile and preferences</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-1 border border-primary-500/20">
        <div className="grid grid-cols-4 gap-1">
          {[
            { key: 'profile', label: 'Profile', icon: '👤' },
            { key: 'address', label: 'Address', icon: '🏠' },
            { key: 'preferences', label: 'Preferences', icon: '⚙️' },
            { key: 'rydercash', label: 'RyderCash', icon: '💰' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-primary text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-secondary-700/50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RyderCash Balance */}
        <div className="bg-gradient-primary rounded-2xl p-6 text-center">
          <div className="text-white/80 text-sm font-medium">Site Credit</div>
          <div className="text-4xl font-bold text-white">
            £{profile?.ryderCash?.toFixed(2) || '0.00'}
          </div>
          <div className="text-white/80 text-sm">RyderCash</div>
          <p className="text-xs text-white/60 mt-2">Use for competition entries</p>
        </div>

        {/* Cash Balance */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-center">
          <div className="text-white/80 text-sm font-medium">Withdrawable Cash</div>
          <div className="text-4xl font-bold text-white">
            £{profile?.cashBalance?.toFixed(2) || '0.00'}
          </div>
          <div className="text-white/80 text-sm">From Instant Wins</div>
          {(profile?.cashBalance || 0) > 0 && (
            withdrawalRequests.some(r => r.status === 'PENDING') ? (
              <div className="mt-3 text-white/80 text-sm">
                Withdrawal pending...
              </div>
            ) : (
              <button 
                onClick={() => setShowWithdrawalModal(true)}
                className="mt-3 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Request Withdrawal
              </button>
            )
          )}
        </div>
      </div>

      {/* Withdrawal Modal - Using Portal to render at body level */}
      {showWithdrawalModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-secondary-800 rounded-2xl p-6 max-w-md w-full border border-primary-500/30 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Request Withdrawal</h3>
              <button 
                onClick={() => {
                  setShowWithdrawalModal(false);
                  setWithdrawalError("");
                  setWithdrawalSuccess("");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
              {/* Available Balance */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                <div className="text-sm text-green-400">Available Balance</div>
                <div className="text-2xl font-bold text-green-400">
                  £{profile?.cashBalance?.toFixed(2) || '0.00'}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Withdrawal Amount (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="5"
                  max={profile?.cashBalance || 0}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter amount (min £5)"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawalMethod("bank_transfer")}
                    className={`p-3 rounded-lg border transition-colors ${
                      withdrawalMethod === "bank_transfer"
                        ? "bg-primary-500/20 border-primary-500 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    🏦 Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawalMethod("paypal")}
                    className={`p-3 rounded-lg border transition-colors ${
                      withdrawalMethod === "paypal"
                        ? "bg-primary-500/20 border-primary-500 text-white"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    💳 PayPal
                  </button>
                </div>
              </div>

              {/* Bank Transfer Details */}
              {withdrawalMethod === "bank_transfer" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={withdrawalDetails.accountName}
                      onChange={(e) => setWithdrawalDetails(prev => ({ ...prev, accountName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-600 placeholder-gray-400 text-white bg-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Sort Code
                      </label>
                      <input
                        type="text"
                        value={withdrawalDetails.sortCode}
                        onChange={(e) => setWithdrawalDetails(prev => ({ ...prev, sortCode: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-600 placeholder-gray-400 text-white bg-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="00-00-00"
                        maxLength={8}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={withdrawalDetails.accountNumber}
                        onChange={(e) => setWithdrawalDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-600 placeholder-gray-400 text-white bg-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="12345678"
                        maxLength={8}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PayPal Details */}
              {withdrawalMethod === "paypal" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    PayPal Email
                  </label>
                  <input
                    type="email"
                    value={withdrawalDetails.paypalEmail}
                    onChange={(e) => setWithdrawalDetails(prev => ({ ...prev, paypalEmail: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-600 placeholder-gray-400 text-white bg-secondary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="your@email.com"
                  />
                </div>
              )}

              {/* Error/Success Messages */}
              {withdrawalError && (
                <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                  {withdrawalError}
                </div>
              )}
              
              {withdrawalSuccess && (
                <div className="text-green-400 text-sm text-center bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                  {withdrawalSuccess}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={withdrawalLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-white"
              >
                {withdrawalLoading ? "Processing..." : "Submit Withdrawal Request"}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Withdrawals are processed within 2-3 business days. Minimum withdrawal is £5.
              </p>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Tab Content */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-400 border-b border-primary-500/30 pb-3">
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="07123 456789"
                  />
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Address Tab */}
          {activeTab === 'address' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-400 border-b border-primary-500/30 pb-3">
                Address Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-300 mb-2">
                    Address Line 1
                  </label>
                  <input
                    id="addressLine1"
                    name="addressLine1"
                    type="text"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-300 mb-2">
                    Address Line 2
                  </label>
                  <input
                    id="addressLine2"
                    name="addressLine2"
                    type="text"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="London"
                    />
                  </div>

                  <div>
                    <label htmlFor="county" className="block text-sm font-medium text-gray-300 mb-2">
                      County
                    </label>
                    <input
                      id="county"
                      name="county"
                      type="text"
                      value={formData.county}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Greater London"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="postcode" className="block text-sm font-medium text-gray-300 mb-2">
                      Postcode
                    </label>
                    <input
                      id="postcode"
                      name="postcode"
                      type="text"
                      value={formData.postcode}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="SW1A 1AA"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Ireland">Ireland</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-400 border-b border-primary-500/30 pb-3">
                Communication Preferences
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <input
                    id="emailNotifications"
                    name="emailNotifications"
                    type="checkbox"
                    checked={formData.emailNotifications}
                    onChange={handleChange}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-600 rounded bg-secondary-800 mt-1"
                  />
                  <div className="ml-3">
                    <label htmlFor="emailNotifications" className="block text-base font-medium text-gray-300">
                      Email Notifications
                    </label>
                    <p className="text-sm text-gray-400">
                      Receive email updates about your entries, competition results, and account activity.
                    </p>
                  </div>
                </div>



                <div className="flex items-start">
                  <input
                    id="marketingEmails"
                    name="marketingEmails"
                    type="checkbox"
                    checked={formData.marketingEmails}
                    onChange={handleChange}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-600 rounded bg-secondary-800 mt-1"
                  />
                  <div className="ml-3">
                    <label htmlFor="marketingEmails" className="block text-base font-medium text-gray-300">
                      Marketing Emails
                    </label>
                    <p className="text-sm text-gray-400">
                      Stay updated on new competitions, special offers, and exclusive promotions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RyderCash Tab */}
          {activeTab === 'rydercash' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-400 border-b border-primary-500/30 pb-3">
                RyderCash History
              </h2>
              
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-secondary-700/30 rounded-lg p-4 border border-gray-600/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-white">{transaction.description}</div>
                          <div className="text-sm text-gray-400">
                            {new Date(transaction.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${
                            transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.amount >= 0 ? '+' : ''}£{Math.abs(transaction.amount).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-400">
                            Balance: £{transaction.balance.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg">No transactions yet</div>
                    <p className="text-gray-500 mt-2">Your RyderCash activity will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button - Only show for editable tabs */}
          {activeTab !== 'rydercash' && (
            <>
              {error && (
                <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-400 text-sm text-center bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                  {success}
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-gray-600/30">
                <Link 
                  href="/dashboard"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Back to Dashboard
                </Link>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
