"use client";

import { useState } from "react";
import Link from "next/link";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // RyderCash Questions
  {
    id: "what-is-rydercash",
    question: "What is RyderCash?",
    answer: "RyderCash is our virtual currency that can be used to purchase competition tickets on RyderComps. It's a convenient way to manage your spending and participate in multiple competitions. RyderCash never expires and can be topped up at any time.",
    category: "RyderCash"
  },
  {
    id: "how-to-get-rydercash",
    question: "How do I get RyderCash?",
    answer: "You can purchase RyderCash directly through your account dashboard or during the checkout process. We accept all major credit and debit cards, Apple Pay, and Google Pay. RyderCash is added to your account instantly after payment.",
    category: "RyderCash"
  },
  {
    id: "rydercash-vs-direct-payment",
    question: "Can I pay directly for tickets without RyderCash?",
    answer: "Yes! You can either use RyderCash or pay directly with your card during checkout. RyderCash offers convenience for frequent players, while direct payment is perfect for one-off purchases.",
    category: "RyderCash"
  },
  {
    id: "rydercash-refunds",
    question: "Can I get a refund for unused RyderCash?",
    answer: "RyderCash is non-refundable once purchased, but it never expires. You can use your RyderCash balance for any future competitions on our platform.",
    category: "RyderCash"
  },

  // Competition Questions
  {
    id: "how-competitions-work",
    question: "How do the competitions work?",
    answer: "Each competition features a prize (like a premium bike) with a limited number of tickets available. When all tickets are sold or the competition end date is reached, we conduct a fair and transparent draw to select the winner. Every ticket has an equal chance of winning.",
    category: "Competitions"
  },
  {
    id: "when-are-draws-conducted",
    question: "When are winners drawn?",
    answer: "Winners are drawn either when all tickets are sold out or when the competition end date is reached, whichever comes first. The draw is conducted using a provably fair random selection process.",
    category: "Competitions"
  },
  {
    id: "can-buy-multiple-tickets",
    question: "Can I buy multiple tickets for the same competition?",
    answer: "Yes! You can purchase as many tickets as you want in a single transaction for any competition. Each ticket gives you an additional chance to win, so more tickets = better odds!",
    category: "Competitions"
  },
  {
    id: "ticket-limit",
    question: "Is there a limit to how many tickets I can buy?",
    answer: "You can buy as many tickets as you want for each competition in a single transaction, as long as tickets are still available. There are no limits on the number of tickets you can purchase per transaction or in total.",
    category: "Competitions"
  },
  {
    id: "competition-transparency",
    question: "How do I know the draws are fair?",
    answer: "All our draws are conducted transparently using a random number generator. Each ticket is assigned a unique number, and we randomly select one winning number. The entire process is auditable and fair.",
    category: "Competitions"
  },

  // Prize Claiming
  {
    id: "how-to-claim-prize",
    question: "How do I claim my prize if I win?",
    answer: "If you win, we'll contact you immediately via email and phone using the details from your account. You'll need to verify your identity and provide a delivery address. Prizes are typically delivered within 7-14 business days.",
    category: "Prize Claiming"
  },
  {
    id: "prize-delivery-cost",
    question: "Do I have to pay for delivery?",
    answer: "No! All prizes are delivered completely free of charge anywhere in the UK. For international winners, we'll work with you to arrange the most cost-effective delivery option.",
    category: "Prize Claiming"
  },
  {
    id: "prize-alternatives",
    question: "Can I choose a cash alternative instead of the prize?",
    answer: "In most cases, yes! We typically offer a cash alternative equal to 70-80% of the prize's retail value. This option will be discussed when we contact you about your win.",
    category: "Prize Claiming"
  },
  {
    id: "winner-announcement",
    question: "Will my win be announced publicly?",
    answer: "Winners are featured on our Winners page (with their permission) and may be shared on our social media. If you prefer to remain anonymous, just let us know when we contact you.",
    category: "Prize Claiming"
  },
  {
    id: "unclaimed-prizes",
    question: "What happens if a prize goes unclaimed?",
    answer: "Winners have 30 days to claim their prize after we make contact. If unclaimed, the prize may be re-drawn or donated to charity, depending on the competition terms.",
    category: "Prize Claiming"
  },

  // Account & Payments
  {
    id: "create-account",
    question: "Do I need an account to participate?",
    answer: "Yes, you need to create a free account to purchase tickets and participate in competitions. This helps us track your entries, manage your RyderCash, and contact you if you win.",
    category: "Account & Payments"
  },
  {
    id: "payment-security",
    question: "Is it safe to make payments on your site?",
    answer: "Absolutely! All payments are processed through Stripe, a world-leading secure payment processor. We use 256-bit SSL encryption and never store your card details on our servers.",
    category: "Account & Payments"
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards (Visa, Mastercard, American Express), Apple Pay, Google Pay, and various digital wallets through our secure Stripe integration.",
    category: "Account & Payments"
  },
  {
    id: "change-account-details",
    question: "Can I change my account details?",
    answer: "Yes! You can update your name, email, phone number, and address in your account settings at any time. It's important to keep these details current in case you win.",
    category: "Account & Payments"
  },
  {
    id: "forgot-password",
    question: "I forgot my password, what do I do?",
    answer: "Use the 'Forgot Password' link on the sign-in page. We'll send you a secure reset link to your registered email address.",
    category: "Account & Payments"
  },

  // General
  {
    id: "age-requirements",
    question: "What's the minimum age to participate?",
    answer: "You must be 18 or over to create an account and participate in competitions. We take age verification seriously and may request ID for winners.",
    category: "General"
  },
  {
    id: "geographic-restrictions",
    question: "Can people outside the UK participate?",
    answer: "Yes! We welcome participants from most countries. However, local laws may apply, and delivery costs for international winners will be discussed on a case-by-case basis.",
    category: "General"
  },
  {
    id: "customer-support",
    question: "How can I contact customer support?",
    answer: "You can reach us through our Contact page or email us at support@rydercomps.co.uk. We aim to respond to all queries within 24 hours.",
    category: "General"
  },
  {
    id: "responsible-gaming",
    question: "Do you promote responsible gaming?",
    answer: "Yes! We're committed to responsible gaming. You can set spending limits on your account, and we provide resources for anyone concerned about their gaming habits. Please visit our Responsible Gaming page for more information.",
    category: "General"
  },
  {
    id: "technical-issues",
    question: "What if I experience technical issues during checkout?",
    answer: "If you encounter any technical problems, please contact our support team immediately. We'll investigate the issue and ensure your transaction is processed correctly or refunded if necessary.",
    category: "General"
  }
];

const categories = ["All", "RyderCash", "Competitions", "Prize Claiming", "Account & Payments", "General"];

export default function FAQsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const filteredFAQs = selectedCategory === "All" 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (id: string) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold gradient-text">Frequently Asked Questions</h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Everything you need to know about RyderComps, competitions, RyderCash, and winning prizes
        </p>
      </div>

      {/* Quick Contact */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Can't find what you're looking for?</h2>
          <p className="text-gray-300">Our support team is here to help!</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/contact"
              className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              📧 Contact Support
            </Link>
            <a 
              href="mailto:support@rydercomps.co.uk"
              className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              ✉️ Email Us
            </a>

          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white text-center">Filter by Category</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-gradient-primary text-white hover:scale-105"
                    : "bg-secondary-700 text-gray-300 hover:bg-secondary-600 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => (
          <div 
            key={faq.id}
            className="bg-secondary-800/50 backdrop-blur-sm rounded-xl border border-primary-500/20 overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(faq.id)}
              className="w-full p-6 text-left hover:bg-secondary-700/30 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-primary-600/20 text-primary-400 rounded-full text-sm font-medium">
                      {faq.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white pr-8">
                    {faq.question}
                  </h3>
                </div>
                <div className={`text-2xl text-primary-400 transition-transform ${
                  openFAQ === faq.id ? "rotate-45" : ""
                }`}>
                  +
                </div>
              </div>
            </button>
            
            {openFAQ === faq.id && (
              <div className="px-6 pb-6">
                <div className="border-t border-gray-600/30 pt-4">
                  <p className="text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20">
          <h3 className="text-2xl font-bold text-white mb-4">📖 More Information</h3>
          <div className="space-y-3">
            <Link href="/terms" className="block text-primary-400 hover:text-primary-300 transition-colors">
              → Terms & Conditions
            </Link>
            <Link href="/privacy" className="block text-primary-400 hover:text-primary-300 transition-colors">
              → Privacy Policy
            </Link>
            <Link href="/responsible-gaming" className="block text-primary-400 hover:text-primary-300 transition-colors">
              → Responsible Gaming
            </Link>
            <Link href="/acceptable-use" className="block text-primary-400 hover:text-primary-300 transition-colors">
              → Acceptable Use Policy
            </Link>
          </div>
        </div>

        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20">
          <h3 className="text-2xl font-bold text-white mb-4">🎯 Quick Links</h3>
          <div className="space-y-3">
            <Link href="/dashboard" className="block text-primary-400 hover:text-primary-300 transition-colors">
              → My Dashboard
            </Link>
            <Link href="/account" className="block text-primary-400 hover:text-primary-300 transition-colors">
              → Account Settings
            </Link>
            <Link href="/winners" className="block text-primary-400 hover:text-primary-300 transition-colors">
              → Recent Winners
            </Link>
            <Link href="/results" className="block text-primary-400 hover:text-primary-300 transition-colors">
              → Competition Results
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center bg-gradient-primary/10 border border-primary-500/20 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Competing?</h2>
        <p className="text-gray-300 mb-6">
          Join thousands of players competing for amazing prizes every day!
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/"
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            🏆 Browse Competitions
          </Link>
          <Link 
            href="/auth/register"
            className="bg-gradient-primary px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            🚀 Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
