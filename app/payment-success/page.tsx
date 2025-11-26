"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Entry {
  id: string;
  competitionTitle: string;
  ticketNumbers: number[];
  quantity: number;
  totalCost: number;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get("payment_intent");
  const ryderCashPaymentId = searchParams.get("rydercash_payment");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "rydercash" | "mixed">("card");
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    console.log("=== PAYMENT SUCCESS PAGE LOADED ===");
    console.log("Payment Intent ID from URL:", paymentIntentId);
    console.log("RyderCash Payment ID from URL:", ryderCashPaymentId);
    
    if (paymentIntentId) {
      confirmStripePayment();
    } else if (ryderCashPaymentId) {
      confirmRyderCashPayment();
    } else {
      console.log("No payment information found in URL");
      setError("No payment information found. Please check your email for confirmation.");
      setLoading(false);
    }
  }, [paymentIntentId, ryderCashPaymentId]);

  const confirmStripePayment = async () => {
    try {
      console.log("=== STRIPE PAYMENT CONFIRMATION ===");
      console.log("Confirming payment with ID:", paymentIntentId);
      
      const response = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId
        })
      });

      console.log("Confirmation response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Confirmation successful, entries:", data.entries);
        setEntries(data.entries || []);
        setPaymentMethod(data.paymentMethod || "card");
        setPaymentAmount(data.entries?.reduce((sum: number, entry: any) => sum + entry.totalCost, 0) || 0);
      } else {
        const errorData = await response.json();
        console.error("Confirmation failed:", errorData);
        setError("Failed to confirm payment. Your payment was successful, but we couldn't create your entries automatically. Please contact support - we have your payment ID and will resolve this quickly.");
      }
    } catch (error) {
      console.error("Confirmation error:", error);
      setError("Something went wrong. Your payment was successful, but we couldn't create your entries automatically. Please contact support - we have your payment ID and will resolve this quickly.");
    } finally {
      setLoading(false);
    }
  };

  const confirmRyderCashPayment = async () => {
    try {
      console.log("=== RYDERCASH PAYMENT CONFIRMATION ===");
      console.log("Confirming RyderCash payment with ID:", ryderCashPaymentId);
      
      const response = await fetch(`/api/rydercash-transaction-details?transactionId=${ryderCashPaymentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });

      console.log("RyderCash confirmation response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("RyderCash confirmation successful, entries:", data.entries);
        setEntries(data.entries || []);
        setPaymentMethod("rydercash");
        setPaymentAmount(data.transaction?.amount || 0);
      } else {
        const errorData = await response.json();
        console.error("RyderCash confirmation failed:", errorData);
        setError("Failed to load payment details. Your RyderCash payment was successful and your entries have been created. Please contact support if you need assistance.");
      }
    } catch (error) {
      console.error("RyderCash confirmation error:", error);
      setError("Something went wrong loading your payment details. Your RyderCash payment was successful and your entries have been created. Please contact support if you need assistance.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-white mb-2">Confirming your payment...</h1>
        <p className="text-gray-300">Please wait while we process your entries</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="text-6xl mb-6">❌</div>
        <h1 className="text-3xl font-bold text-red-400 mb-4">Payment Error</h1>
        <p className="text-gray-300 mb-8">{error}</p>
        <div className="space-y-4">
          <Link
            href="/contact"
            className="inline-block bg-gradient-primary hover:scale-105 text-white font-semibold py-3 px-8 rounded-lg transition-transform"
          >
            Contact Support
          </Link>
          <div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalCost = entries.reduce((sum, entry) => sum + entry.totalCost, 0);
  const totalTickets = entries.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="text-8xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold gradient-text mb-4">Payment Successful!</h1>
        <p className="text-gray-300 text-lg">
          Thank you for your purchase. Your competition entries have been confirmed.
        </p>
      </div>

      {/* Purchase Summary */}
      <div className="bg-green-900/20 border border-green-600/30 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">Purchase Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{entries.length}</div>
            <div className="text-gray-300">Competition{entries.length !== 1 ? 's' : ''} Entered</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{totalTickets}</div>
            <div className="text-gray-300">Total Tickets</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">£{totalCost.toFixed(2)}</div>
            <div className="text-gray-300">Total Paid</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {paymentMethod === "rydercash" ? "💰" : 
               paymentMethod === "mixed" ? "🔄" : "💳"}
            </div>
            <div className="text-gray-300">
              {paymentMethod === "rydercash" ? "RyderCash" : 
               paymentMethod === "mixed" ? "Mixed Payment" : "Card Payment"}
            </div>
          </div>
        </div>

        {/* Payment Method Details */}
        {paymentMethod === "rydercash" && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-green-400 mr-2">💰</span>
              <span className="font-medium text-green-400">Paid with RyderCash</span>
            </div>
            <div className="text-center text-gray-300 text-sm">
              Your RyderCash balance was debited £{paymentAmount.toFixed(2)} for this purchase
            </div>
          </div>
        )}

        {paymentMethod === "mixed" && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-blue-400 mr-2">🔄</span>
              <span className="font-medium text-blue-400">Mixed Payment</span>
            </div>
            <div className="text-center text-gray-300 text-sm">
              Combined RyderCash and card payment
            </div>
          </div>
        )}

        {/* Entries Details */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white border-b border-green-600/30 pb-2">Your Entries</h3>
          {entries.map((entry) => (
            <div key={entry.id} className="bg-secondary-800/50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-white text-lg">{entry.competitionTitle}</h4>
                <div className="text-right">
                  <div className="text-green-400 font-bold">£{entry.totalCost.toFixed(2)}</div>
                  <div className="text-gray-400 text-sm">{entry.quantity} ticket{entry.quantity !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div className="bg-secondary-700/30 rounded p-3">
                <div className="text-sm text-gray-300 mb-1">Your Ticket Numbers:</div>
                <div className="flex flex-wrap gap-2">
                  {entry.ticketNumbers.map((number) => (
                    <span key={number} className="bg-green-600 text-white px-2 py-1 rounded text-sm font-bold">
                      #{number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20">
        <h2 className="text-2xl font-bold text-primary-400 mb-6">What's Next?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-primary-400 text-2xl mr-3">📧</span>
              <div>
                <h3 className="font-bold text-white">Confirmation Email</h3>
                <p className="text-gray-300 text-sm">You'll receive a confirmation email with your entry details</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-primary-400 text-2xl mr-3">📱</span>
              <div>
                <h3 className="font-bold text-white">Track Your Entries</h3>
                <p className="text-gray-300 text-sm">Monitor your competitions and entries in your dashboard</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-primary-400 text-2xl mr-3">🎲</span>
              <div>
                <h3 className="font-bold text-white">Draw Updates</h3>
                <p className="text-gray-300 text-sm">We'll notify you when draws take place</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-primary-400 text-2xl mr-3">🏆</span>
              <div>
                <h3 className="font-bold text-white">Winner Announcements</h3>
                <p className="text-gray-300 text-sm">Check our Winners page for results</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/dashboard"
          className="bg-gradient-primary hover:scale-105 text-white font-semibold py-4 px-8 rounded-lg transition-transform text-center"
        >
          View Dashboard
        </Link>
        <Link
          href="/"
          className="border border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white font-semibold py-4 px-8 rounded-lg transition-colors text-center"
        >
          Browse More Competitions
        </Link>
      </div>

      {/* Support */}
      <div className="text-center text-gray-400 text-sm">
        <p>Need help? <Link href="/contact" className="text-primary-400 hover:text-primary-300">Contact our support team</Link></p>
        <p className="mt-2">
          {paymentMethod === "rydercash" ? "Transaction ID" : "Payment ID"}: 
          <span className="font-mono text-xs ml-1">
            {ryderCashPaymentId || paymentIntentId}
          </span>
        </p>
      </div>
    </div>
  );
}
