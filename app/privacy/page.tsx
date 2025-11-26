"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">Privacy Policy</h1>
        <p className="text-gray-300">Effective Date: 20 August 2025</p>
      </div>

      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20 space-y-6">
        <p className="text-gray-300">
          RydrComps ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. 
          This Privacy Policy explains how we collect, use, and safeguard information when you use our website, 
          mobile apps, and services (collectively, the "Services").
        </p>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">1. Information We Collect</h2>
          <p className="text-gray-300 mb-4">When you use RydrComps, we may collect the following types of information:</p>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">a) Personal Information</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Name, email address, phone number</li>
                <li>Billing and payment information (via Stripe or other payment processors)</li>
                <li>Competition entries, usernames, and profile data</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">b) Non-Personal Information</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>IP addresses, browser type, device information</li>
                <li>Cookies and analytics data</li>
                <li>Usage patterns, pages visited, and time spent on the site</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-300 mb-4">We use the information we collect to:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Operate, maintain, and improve our Services</li>
            <li>Process competition entries and payments</li>
            <li>Communicate with you about competitions, promotions, and updates</li>
            <li>Prevent fraud and comply with legal obligations</li>
            <li>Analyze usage trends to improve user experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">3. Sharing Your Information</h2>
          <p className="text-gray-300 mb-4">We do not sell your personal information. We may share information with:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li><strong>Service Providers:</strong> Payment processors (e.g., Stripe), hosting providers, email services</li>
            <li><strong>Legal Authorities:</strong> If required by law, regulation, or legal process</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">4. Cookies and Tracking Technologies</h2>
          <p className="text-gray-300 mb-4">RydrComps uses cookies and similar technologies to enhance your experience:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Essential cookies for website functionality</li>
            <li>Analytics cookies to monitor website usage</li>
            <li>Marketing cookies (only with your consent)</li>
          </ul>
          <p className="text-gray-300 mt-4">
            You can manage or disable cookies through your browser settings, but some features may not function properly if cookies are disabled.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">5. Data Retention</h2>
          <p className="text-gray-300">
            Personal data is retained only as long as necessary to fulfill the purposes described above, comply with legal obligations, 
            or resolve disputes. Competition entries and winner information may be retained for record-keeping and legal compliance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">6. Your Rights</h2>
          <p className="text-gray-300 mb-4">Depending on your jurisdiction, you may have the following rights:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Access and receive a copy of your personal data</li>
            <li>Request correction or deletion of your personal data</li>
            <li>Object to or restrict processing</li>
            <li>Withdraw consent at any time</li>
            <li>Lodge a complaint with a supervisory authority (e.g., ICO in the UK)</li>
          </ul>
          <p className="text-gray-300 mt-4">
            To exercise your rights, please contact us at: <span className="text-primary-400">privacy@rydrcomps.com</span>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">7. Security</h2>
          <p className="text-gray-300">
            We implement reasonable technical, administrative, and physical safeguards to protect your personal data. 
            However, no method of transmission over the internet or electronic storage is completely secure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">8. Contact Us</h2>
          <p className="text-gray-300">
            If you have questions or concerns about this Privacy Policy or our data practices, contact us at:
          </p>
          <div className="mt-4 text-gray-300">
            <p><strong>RydrComps</strong></p>
            <p>Email: <span className="text-primary-400">privacy@rydrcomps.com</span></p>
          </div>
        </section>
      </div>
    </div>
  );
}