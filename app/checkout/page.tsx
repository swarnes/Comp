"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "../../contexts/CartContext";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "../../components/PaymentForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Generate a cart hash to detect if cart has changed
const getCartHash = (items: any[]) => {
  return items.map(i => `${i.competitionId}-${i.quantity}`).sort().join('|');
};

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ryderCashBalance, setRyderCashBalance] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "rydercash" | "mixed">("card");
  const [paymentIntentReady, setPaymentIntentReady] = useState(false);

  // Fetch RyderCash balance
  const fetchRyderCashBalance = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch("/api/user/rydercash/balance");
      if (response.ok) {
        const data = await response.json();
        setRyderCashBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch RyderCash balance:", error);
    }
  };

  // Try to restore cached payment intent on mount
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (items.length === 0) {
      router.push("/");
      return;
    }

    // Fetch RyderCash balance
    fetchRyderCashBalance();
    
    // Try to restore cached payment intent
    const cached = sessionStorage.getItem('paymentIntent');
    if (cached) {
      try {
        const { secret, intentId, cartHash, method } = JSON.parse(cached);
        const currentHash = getCartHash(items);
        
        // If cart hasn't changed and we have valid cached data, use it
        if (cartHash === currentHash && secret && intentId) {
          console.log("Restoring cached payment intent");
          setClientSecret(secret);
          setPaymentIntentId(intentId);
          setPaymentMethod(method || "card");
          setPaymentIntentReady(true);
          return;
        }
      } catch (e) {
        console.log("Could not restore cached payment intent");
      }
    }
    
    // Create new payment intent if no valid cache
    createPaymentIntent();
  }, [session, status, router, items.length]);

  // Handle payment method changes - update instead of recreating
  useEffect(() => {
    if (!paymentIntentReady || !session || items.length === 0) return;
    
    // For rydercash-only, we don't need a payment intent
    if (paymentMethod === "rydercash") {
      return;
    }
    
    // For card or mixed, check if we need to update the amount
    const currentCardAmount = paymentMethod === "mixed" ? totalPrice - ryderCashBalance : totalPrice;
    
    // Only recreate if the payment method actually requires a different amount
    // and we don't already have a valid intent
    if (currentCardAmount > 0 && !clientSecret) {
      createPaymentIntent();
    }
  }, [paymentMethod]);

  const createPaymentIntent = async () => {
    if (!session || items.length === 0) return;
    
    // Skip payment intent creation for pure RyderCash payments
    if (paymentMethod === "rydercash") {
      setPaymentIntentReady(true);
      return;
    }

    console.log("=== CREATING PAYMENT INTENT ===");
    console.log("Session:", session?.user?.email);
    console.log("Items:", items);
    console.log("Payment method:", paymentMethod);
    console.log("Total price:", totalPrice);

    // Calculate the amount to charge to card (use full price initially, RyderCash applied at confirm)
    const cardAmount = totalPrice;
    console.log("Card amount:", cardAmount);

    if (cardAmount <= 0) {
      console.log("No card payment needed");
      setPaymentIntentReady(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          items: items,
          paymentMethod: paymentMethod,
          cardAmount: cardAmount,
          ryderCashAmount: 0
        })
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Failed to create payment intent");
      }

      const data = await response.json();
      console.log("Payment intent data:", data);
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setPaymentIntentReady(true);
      
      // Cache the payment intent in session storage
      const cartHash = getCartHash(items);
      sessionStorage.setItem('paymentIntent', JSON.stringify({
        secret: data.clientSecret,
        intentId: data.paymentIntentId,
        cartHash,
        method: paymentMethod
      }));
    } catch (error) {
      console.error("Failed to create payment intent:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log("=== PAYMENT SUCCESS HANDLER ===");
    console.log("Payment Intent ID:", paymentIntentId);
    console.log("Clearing cart and cache...");
    
    // Clear cached payment intent
    sessionStorage.removeItem('paymentIntent');
    clearCart();
    
    console.log("Redirecting to success page...");
    
    // Use window.location for more reliable redirect
    const successUrl = `/payment-success?payment_intent=${paymentIntentId}`;
    console.log("Success URL:", successUrl);
    
    // Try both methods to ensure redirect works
    window.location.href = successUrl;
    router.push(successUrl);
  };

  const handleRyderCashPayment = async () => {
    if (!session || items.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch("/api/process-rydercash-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          items: items,
          totalAmount: totalPrice,
          paymentMethod: "rydercash"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process RyderCash payment");
      }

      const data = await response.json();
      
      // Clear cart, cache, and redirect to success
      sessionStorage.removeItem('paymentIntent');
      clearCart();
      const successUrl = `/payment-success?rydercash_payment=${data.transactionId}`;
      window.location.href = successUrl;
      router.push(successUrl);

    } catch (error: any) {
      console.error("RyderCash payment failed:", error);
      alert(error.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading...</div>
      </div>
    );
  }

  if (!session || items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">Checkout</h1>
        <p className="text-gray-300">Review your entries and complete your purchase</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="order-2 lg:order-1">
          <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 h-fit max-h-[80vh] overflow-hidden">
            <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>
            
            <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
              {items.map((item) => (
                <div key={item.id} className="bg-secondary-700/30 rounded-lg p-4 border border-gray-600/30">
                  <div className="flex items-start space-x-3">
                    {item.competitionImage && (
                      <img
                        src={item.competitionImage}
                        alt={item.competitionTitle}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white mb-2 text-sm leading-tight">
                        {item.competitionTitle.length > 50 
                          ? `${item.competitionTitle.substring(0, 50)}...` 
                          : item.competitionTitle
                        }
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price per ticket:</span>
                          <span className="font-bold text-primary-400">£{item.ticketPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Quantity:</span>
                          <span className="font-bold text-white">{item.quantity} ticket{item.quantity !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-600/30">
                          <span className="text-gray-400">Subtotal:</span>
                          <span className="font-bold text-white">
                            £{(item.ticketPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div className="mt-6 pt-6 border-t border-gray-600/30">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-white">Total:</span>
                <span className="text-2xl font-bold text-primary-400">£{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="order-1 lg:order-2">
          <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 sticky top-24">
            <h2 className="text-2xl font-bold text-white mb-6">Payment Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-300">Items ({items.reduce((sum, item) => sum + item.quantity, 0)}):</span>
                <span className="text-white">£{totalPrice.toFixed(2)}</span>
              </div>
              
              {paymentMethod === "mixed" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-300">RyderCash Payment:</span>
                    <span className="text-green-400">-£{ryderCashBalance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Card Payment:</span>
                    <span className="text-white">£{(totalPrice - ryderCashBalance).toFixed(2)}</span>
                  </div>
                </>
              )}
              
              {paymentMethod === "rydercash" && (
                <div className="flex justify-between">
                  <span className="text-gray-300">RyderCash Payment:</span>
                  <span className="text-green-400">£{totalPrice.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-300">Processing Fee:</span>
                <span className="text-white">£0.00</span>
              </div>
              
              <div className="border-t border-gray-600/30 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-white">
                    {paymentMethod === "rydercash" ? "Total (RyderCash):" : 
                     paymentMethod === "mixed" ? "Card Total:" : "Total:"}
                  </span>
                  <span className="text-2xl font-bold text-primary-400">
                    {paymentMethod === "rydercash" ? `£${totalPrice.toFixed(2)}` :
                     paymentMethod === "mixed" ? `£${(totalPrice - ryderCashBalance).toFixed(2)}` :
                     `£${totalPrice.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-secondary-700/30 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-white mb-2">Billing Information</h3>
              <div className="text-sm text-gray-300">
                <div>{session.user?.name}</div>
                <div>{session.user?.email}</div>
              </div>
              <Link href="/account" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                Update billing details →
              </Link>
            </div>

            {/* RyderCash Balance & Payment Options */}
            <div className="bg-secondary-700/30 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-white mb-3">Payment Method</h3>
              
              {/* RyderCash Balance */}
              <div className="flex justify-between items-center mb-4 p-3 bg-gradient-primary/10 rounded-lg border border-primary-500/20">
                <span className="text-sm text-gray-300">Your RyderCash Balance:</span>
                <span className="font-bold text-primary-400">£{ryderCashBalance.toFixed(2)}</span>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                {ryderCashBalance >= totalPrice && (
                  <label className="flex items-center p-3 bg-secondary-800/50 rounded-lg border border-gray-600/30 cursor-pointer hover:border-primary-500/50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="rydercash"
                      checked={paymentMethod === "rydercash"}
                      onChange={(e) => setPaymentMethod(e.target.value as "card" | "rydercash" | "mixed")}
                      className="mr-3 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">Pay with RyderCash</div>
                      <div className="text-sm text-gray-400">Use your full RyderCash balance</div>
                    </div>
                    <div className="text-green-400 font-bold">£{totalPrice.toFixed(2)}</div>
                  </label>
                )}

                {ryderCashBalance > 0 && ryderCashBalance < totalPrice && (
                  <label className="flex items-center p-3 bg-secondary-800/50 rounded-lg border border-gray-600/30 cursor-pointer hover:border-primary-500/50 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mixed"
                      checked={paymentMethod === "mixed"}
                      onChange={(e) => setPaymentMethod(e.target.value as "card" | "rydercash" | "mixed")}
                      className="mr-3 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">RyderCash + Card</div>
                      <div className="text-sm text-gray-400">
                        Use £{ryderCashBalance.toFixed(2)} RyderCash + £{(totalPrice - ryderCashBalance).toFixed(2)} card
                      </div>
                    </div>
                  </label>
                )}

                <label className="flex items-center p-3 bg-secondary-800/50 rounded-lg border border-gray-600/30 cursor-pointer hover:border-primary-500/50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value as "card" | "rydercash" | "mixed")}
                    className="mr-3 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white">Pay with Card</div>
                    <div className="text-sm text-gray-400">Use credit or debit card</div>
                  </div>
                  <div className="text-white font-bold">£{totalPrice.toFixed(2)}</div>
                </label>
              </div>
            </div>

            {/* Payment Form */}
            {paymentMethod === "rydercash" ? (
              /* Pure RyderCash Payment */
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium text-green-400">RyderCash Payment</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    You'll pay £{totalPrice.toFixed(2)} using your RyderCash balance.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRyderCashPayment}
                  disabled={loading}
                  className="w-full bg-gradient-primary text-white font-semibold py-4 px-6 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : `Complete Payment with RyderCash`}
                </button>
              </div>
            ) : (
              /* Card or Mixed Payment */
              clientSecret && paymentIntentId ? (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#dc2626',
                        colorBackground: '#1f2937',
                        colorText: '#ffffff',
                        colorDanger: '#dc2626',
                        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                        spacingUnit: '6px',
                        borderRadius: '8px',
                      }
                    },
                    loader: 'auto'
                  }}
                >
                  {paymentMethod === "mixed" && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-2">
                        <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                        <span className="font-medium text-blue-400">Mixed Payment</span>
                      </div>
                      <div className="text-sm text-gray-300">
                        RyderCash: £{ryderCashBalance.toFixed(2)} + Card: £{(totalPrice - ryderCashBalance).toFixed(2)}
                      </div>
                    </div>
                  )}
                  <PaymentForm 
                    clientSecret={clientSecret}
                    paymentIntentId={paymentIntentId}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400">
                    {loading ? "Preparing payment..." : "Unable to load payment form"}
                  </div>
                </div>
              )
            )}

            {/* Continue Shopping */}
            <Link
              href="/"
              className="block w-full text-center bg-gradient-primary text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-transform mt-4"
            >
              Continue Shopping
            </Link>

            {/* Security Notice */}
            <div className="text-xs text-gray-400 text-center mt-4">
              🔒 Your payment information is secure and encrypted with Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
