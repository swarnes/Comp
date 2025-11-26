"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";

interface Props {
  clientSecret: string;
  paymentIntentId: string;
  onSuccess: (paymentIntentId: string) => void;
}

export default function PaymentForm({ clientSecret, paymentIntentId, onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirm the payment
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Payment failed");
        setLoading(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        console.log("Payment succeeded, confirming with backend...");
        // Payment successful, confirm with our backend
        const response = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id
          })
        });

        console.log("Backend confirmation response:", response.status);
        if (response.ok) {
          console.log("Backend confirmation successful, redirecting...");
          onSuccess(paymentIntent.id);
        } else {
          const errorData = await response.json();
          console.error("Backend confirmation failed:", errorData);
          // Even if backend fails, still redirect to success page with a warning
          console.log("Backend failed but payment succeeded, redirecting anyway...");
          onSuccess(paymentIntent.id);
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="bg-white rounded-lg p-8 min-h-[400px] lg:min-h-[500px]">
        <PaymentElement 
          options={{
            layout: "tabs",
            wallets: {
              applePay: "auto",
              googlePay: "auto"
            }
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-600/30 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full bg-gradient-primary text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </div>
        ) : (
          "Complete Purchase"
        )}
      </button>

      {/* Payment Info */}
      <div className="text-xs text-gray-400 text-center space-y-1">
        <div>💳 We accept all major credit and debit cards</div>
        <div>📱 Apple Pay and Google Pay supported</div>
        <div>🔒 Payments are processed securely by Stripe</div>
        <div>✅ Your transaction is protected by 256-bit SSL encryption</div>
      </div>
    </form>
  );
}
