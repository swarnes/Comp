"use client";

export default function AcceptableUsePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">Acceptable Use Policy</h1>
        <p className="text-gray-300">Rules for using RyderComps services and competitions</p>
      </div>

      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20 space-y-6">
        <p className="text-gray-300">
          This Acceptable Use Policy ("Policy") sets out the rules for using RyderComps ("we," "us," or "our") 
          services, website, and competitions (collectively, the "Services"). By using our Services, 
          you agree to comply with this Policy.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">1. Permitted Use</h2>
          <p className="text-gray-300 mb-4">
            You may use RyderComps Services only for lawful purposes and in accordance with this Policy. 
            Permitted use includes:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Entering competitions in accordance with the rules</li>
            <li>Creating and maintaining a user account</li>
            <li>Accessing, browsing, and interacting with content in a lawful and respectful manner</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">2. Prohibited Conduct</h2>
          <p className="text-gray-300 mb-4">You must not use the Services to:</p>
          
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <h3 className="font-bold text-red-400 mb-2">🚫 Break the Law</h3>
              <p className="text-gray-300 text-sm">Engage in illegal activities or violate any applicable laws or regulations.</p>
            </div>
            
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <h3 className="font-bold text-red-400 mb-2">🎭 Fraud or Misrepresentation</h3>
              <p className="text-gray-300 text-sm">Attempt to cheat, manipulate, or commit fraud in competitions, entries, or payment processes.</p>
            </div>
            
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <h3 className="font-bold text-red-400 mb-2">⚠️ Harm or Harass</h3>
              <p className="text-gray-300 text-sm">Threaten, harass, intimidate, or abuse other users or our staff.</p>
            </div>
            
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <h3 className="font-bold text-red-400 mb-2">🔐 Unauthorized Access</h3>
              <p className="text-gray-300 text-sm">Attempt to gain unauthorized access to accounts, data, systems, or networks.</p>
            </div>
            
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <h3 className="font-bold text-red-400 mb-2">🤖 Disrupt Services</h3>
              <p className="text-gray-300 text-sm">Interfere with or disrupt the Services, including using bots, scripts, or automated tools.</p>
            </div>
            
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <h3 className="font-bold text-red-400 mb-2">💬 Inappropriate Content</h3>
              <p className="text-gray-300 text-sm">Post, upload, or share offensive, obscene, defamatory, or illegal content.</p>
            </div>
            
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <h3 className="font-bold text-red-400 mb-2">📧 Spam or Advertising</h3>
              <p className="text-gray-300 text-sm">Send unsolicited messages, advertising, or promotional material without permission.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">3. Intellectual Property</h2>
          <div className="bg-secondary-700/30 rounded-lg p-6 border border-gray-600/30">
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>All content on RyderComps, including images, text, logos, and designs, is the property of RyderComps or its licensors.</li>
              <li>You may not copy, reproduce, distribute, or create derivative works without prior written permission.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">4. Account Responsibility</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-secondary-700/30 rounded-lg p-4 border border-gray-600/30 text-center">
              <span className="text-primary-400 text-2xl block mb-2">🔒</span>
              <h3 className="font-bold text-white mb-2">Security</h3>
              <p className="text-gray-300 text-sm">Maintain the security of your account credentials</p>
            </div>
            
            <div className="bg-secondary-700/30 rounded-lg p-4 border border-gray-600/30 text-center">
              <span className="text-primary-400 text-2xl block mb-2">🚨</span>
              <h3 className="font-bold text-white mb-2">Report Issues</h3>
              <p className="text-gray-300 text-sm">Notify us immediately of unauthorized account use</p>
            </div>
            
            <div className="bg-secondary-700/30 rounded-lg p-4 border border-gray-600/30 text-center">
              <span className="text-primary-400 text-2xl block mb-2">⚖️</span>
              <h3 className="font-bold text-white mb-2">Consequences</h3>
              <p className="text-gray-300 text-sm">We reserve the right to suspend or terminate violating accounts</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">5. Enforcement</h2>
          <p className="text-gray-300 mb-4">We may take any action we deem necessary to enforce this Policy, including:</p>
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-yellow-400 text-2xl block mb-2">🗑️</span>
                <h3 className="font-bold text-yellow-400 mb-1">Content Removal</h3>
                <p className="text-gray-300 text-sm">Removing inappropriate content</p>
              </div>
              <div>
                <span className="text-yellow-400 text-2xl block mb-2">🚫</span>
                <h3 className="font-bold text-yellow-400 mb-1">Account Action</h3>
                <p className="text-gray-300 text-sm">Suspending or terminating accounts</p>
              </div>
              <div>
                <span className="text-yellow-400 text-2xl block mb-2">👮</span>
                <h3 className="font-bold text-yellow-400 mb-1">Legal Reporting</h3>
                <p className="text-gray-300 text-sm">Reporting illegal activity to authorities</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">6. Changes to This Policy</h2>
          <p className="text-gray-300">
            We may update this Acceptable Use Policy from time to time. Any changes will be posted on this page 
            with the updated effective date. Continued use of RyderComps after changes indicates acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">7. Contact Us</h2>
          <p className="text-gray-300 mb-4">If you have questions about this Policy, contact us:</p>
          <div className="bg-secondary-700/30 rounded-lg p-6 border border-gray-600/30">
            <div className="text-gray-300">
              <p className="font-bold text-white mb-2">RyderComps</p>
              <p>Email: <span className="text-primary-400">support@rydercomps.co.uk</span></p>
              <p className="text-gray-400 text-sm mt-2">Address: [Your business address here]</p>
            </div>
          </div>
        </section>

        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-6 mt-8">
          <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
            <span className="mr-2">ℹ️</span>
            Important Notice
          </h3>
          <p className="text-gray-300 text-sm">
            This Acceptable Use Policy helps ensure a safe, fair, and enjoyable experience for all RyderComps users. 
            Violations may result in immediate account suspension or termination. When in doubt, contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
