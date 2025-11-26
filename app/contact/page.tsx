"use client";

import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    inquiryType: "general"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      setSuccess("Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        inquiryType: "general"
      });
    } catch (err: any) {
      setError(err.message || "An error occurred while sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">Contact Us</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Have a question about our competitions? Need help with your account? We're here to help!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20">
          <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your email address"
              />
            </div>

            {/* Inquiry Type */}
            <div>
              <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-300 mb-2">
                Inquiry Type
              </label>
              <select
                id="inquiryType"
                name="inquiryType"
                value={formData.inquiryType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="general">General Inquiry</option>
                <option value="account">Account Issues</option>
                <option value="payment">Payment Problems</option>
                <option value="competition">Competition Questions</option>
                <option value="technical">Technical Support</option>
                <option value="partnership">Partnership/Business</option>
                <option value="complaint">Complaint</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Brief description of your inquiry"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 bg-secondary-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Please provide as much detail as possible about your inquiry..."
              />
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-primary text-white font-semibold py-3 px-6 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending Message..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="space-y-8">
          {/* Quick Contact */}
          <div className="bg-white rounded-2xl p-8 shadow-lg text-black">
            <h2 className="text-2xl font-bold text-primary-600 mb-6">Get in Touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📧</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Email Support</h3>
                  <p className="text-gray-600">support@rydrcomps.com</p>
                  <p className="text-sm text-gray-500">We respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📞</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Phone Support</h3>
                  <p className="text-gray-600">+44 20 7946 0958</p>
                  <p className="text-sm text-gray-500">Mon-Fri, 9am-6pm GMT</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">💬</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Live Chat</h3>
                  <p className="text-gray-600">Available on website</p>
                  <p className="text-sm text-gray-500">Mon-Fri, 9am-8pm GMT</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📍</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Address</h3>
                  <p className="text-gray-600">
                    RydrComps Ltd<br />
                    123 Competition Street<br />
                    London, SW1A 1AA<br />
                    United Kingdom
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Response Times */}
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
            <h3 className="text-lg font-bold text-amber-800 mb-4">📋 Response Times</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-700">General Inquiries:</span>
                <span className="font-medium text-amber-800">24 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Account Issues:</span>
                <span className="font-medium text-amber-800">4-6 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Payment Problems:</span>
                <span className="font-medium text-amber-800">2-4 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Technical Support:</span>
                <span className="font-medium text-amber-800">4-8 hours</span>
              </div>
            </div>
          </div>

          {/* FAQ Link */}
          <div className="bg-stone-100 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">❓ Need Quick Answers?</h3>
            <p className="text-gray-600 text-sm mb-4">
              Check our FAQ section for instant answers to common questions.
            </p>
            <a 
              href="/faqs" 
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors inline-block"
            >
              View FAQs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
