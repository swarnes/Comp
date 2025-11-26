"use client";

import { useState } from "react";

export default function SetupPage() {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createSampleCompetition = async () => {
    setIsLoading(true);
    setStatus("");

    try {
      const response = await fetch("/api/admin/create-sample-competition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("✅ " + data.message);
      } else {
        setStatus("❌ " + data.message);
      }
    } catch (error: any) {
      setStatus("❌ Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text mb-4">RyderComps Setup</h1>
          <p className="text-gray-300">Quick setup for testing the application</p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Create Accounts */}
          <div className="bg-secondary-800/50 rounded-xl p-6 border border-primary-500/20">
            <h2 className="text-xl font-bold text-white mb-4">Step 1: Create Test Accounts</h2>
            <div className="space-y-3">
              <div className="text-sm text-gray-300">
                <div className="font-semibold">Go to: <a href="/auth/register" className="text-primary-400 hover:underline">/auth/register</a></div>
                <div className="mt-2">Create these accounts:</div>
                <div className="ml-4 space-y-1 text-xs">
                  <div>• Admin: admin@rydrcomps.com / admin123 (Account Type: Admin)</div>
                  <div>• User: john@example.com / user123 (Account Type: User)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Create Sample Competition */}
          <div className="bg-secondary-800/50 rounded-xl p-6 border border-primary-500/20">
            <h2 className="text-xl font-bold text-white mb-4">Step 2: Create Sample Competition</h2>
            <button
              onClick={createSampleCompetition}
              disabled={isLoading}
              className="w-full bg-gradient-primary px-4 py-2 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Sample Competition"}
            </button>
            {status && (
              <div className="mt-3 text-sm">{status}</div>
            )}
          </div>

          {/* Step 3: Test Application */}
          <div className="bg-secondary-800/50 rounded-xl p-6 border border-primary-500/20">
            <h2 className="text-xl font-bold text-white mb-4">Step 3: Test the Application</h2>
            <div className="space-y-2 text-sm text-gray-300">
              <div>• <a href="/" className="text-primary-400 hover:underline">Home</a> - View competitions</div>
              <div>• <a href="/auth/signin" className="text-primary-400 hover:underline">Sign In</a> - Test authentication</div>
              <div>• <a href="/dashboard" className="text-primary-400 hover:underline">Dashboard</a> - User dashboard (requires login)</div>
              <div>• <a href="/admin" className="text-primary-400 hover:underline">Admin</a> - Admin panel (requires admin login)</div>
            </div>
          </div>

          {/* Features Ready */}
          <div className="bg-green-600/20 rounded-xl p-6 border border-green-500/20">
            <h2 className="text-xl font-bold text-white mb-4">🎉 Features Ready to Test:</h2>
            <div className="space-y-1 text-sm text-gray-300">
              <div>✅ User Authentication (Login/Logout)</div>
              <div>✅ Role-based Access (Admin/User)</div>
              <div>✅ Real Ticket Purchasing</div>
              <div>✅ Live Progress Tracking</div>
              <div>✅ Admin Competition Management</div>
              <div>✅ Responsive Design</div>
              <div>✅ MongoDB Integration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
