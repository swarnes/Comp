"use client";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">Terms & Conditions</h1>
        <p className="text-gray-300">Effective Date: 20 August 2025</p>
      </div>

      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20 space-y-6">
        <p className="text-gray-300">
          These Terms & Conditions ("Terms") govern your use of RydrComps ("we," "us," or "our") website, 
          mobile apps, and services (collectively, the "Services"). By accessing or using our Services, 
          you agree to be bound by these Terms.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">1. Eligibility</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Participants must meet the minimum legal age to enter competitions in their jurisdiction.</li>
            <li>By registering, you confirm you have the legal capacity to enter competitions and accept these Terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">2. User Accounts</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>You must provide accurate and up-to-date information when creating an account.</li>
            <li>You are responsible for maintaining the security and confidentiality of your account credentials.</li>
            <li>You must notify RydrComps immediately of any unauthorized account use.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">3. Competition Rules</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Competitions are conducted in accordance with the specific rules and entry requirements published on the website.</li>
            <li>Entries must be genuine, lawful, and adhere to the rules.</li>
            <li>Fraudulent or invalid entries will be disqualified.</li>
            <li>Winners will be notified via the contact information provided and may be required to verify identity before receiving prizes.</li>
            <li>Prizes are non-transferable, non-refundable, and cannot be exchanged for cash, unless stated otherwise.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">4. Payments and Refunds</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Entry fees (if applicable) are processed securely through our payment partners (e.g., Stripe).</li>
            <li>You agree to pay all fees associated with competition entries.</li>
            <li>Refunds are only issued if explicitly stated in the competition terms or required by law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">5. Acceptable Use</h2>
          <p className="text-gray-300 mb-4">You agree to use RydrComps responsibly and not:</p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Engage in illegal activity, fraud, or misrepresentation</li>
            <li>Harass, abuse, or threaten other users</li>
            <li>Interfere with the website or systems</li>
            <li>Post offensive or inappropriate content</li>
            <li>Attempt unauthorized access to accounts or data</li>
          </ul>
          <p className="text-gray-300 mt-4">
            Refer to our <span className="text-primary-400">Acceptable Use Policy</span> for full details.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">6. Privacy</h2>
          <p className="text-gray-300">
            We respect your privacy and handle personal data according to our Privacy Policy. 
            By using the Services, you consent to our collection, use, and processing of your data 
            as described in the Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">7. Intellectual Property</h2>
          <p className="text-gray-300">
            All content on RydrComps, including logos, images, text, and designs, is the property of RydrComps 
            or its licensors. You may not copy, reproduce, distribute, or create derivative works without 
            prior written permission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">8. Limitation of Liability</h2>
          <p className="text-gray-300">
            To the fullest extent permitted by law, RydrComps is not liable for any indirect, incidental, 
            or consequential losses arising from participation in competitions or use of the Services. 
            We do not guarantee that competitions or services will be uninterrupted or error-free.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">9. Indemnification</h2>
          <p className="text-gray-300">
            You agree to indemnify and hold harmless RydrComps, its officers, employees, and partners 
            from any claims, losses, or damages arising from your violation of these Terms or unlawful conduct.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">10. Termination</h2>
          <p className="text-gray-300">
            We may suspend or terminate your account or access to the Services at our discretion for 
            violations of these Terms. Sections relating to liability, indemnification, intellectual property, 
            and governing law survive termination.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">11. Governing Law</h2>
          <p className="text-gray-300">
            These Terms are governed by the laws of the United Kingdom. Any disputes arising from these Terms 
            or your use of the Services will be subject to the exclusive jurisdiction of the courts of the UK.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">12. Changes to Terms</h2>
          <p className="text-gray-300">
            RydrComps may update these Terms from time to time. Updates will be posted on this page with 
            an updated effective date. Continued use of the Services after changes constitutes acceptance 
            of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">13. Contact Us</h2>
          <p className="text-gray-300">If you have questions about these Terms, contact us:</p>
          <div className="mt-4 text-gray-300">
            <p><strong>RydrComps</strong></p>
            <p>Email: <span className="text-primary-400">support@rydrcomps.com</span></p>
          </div>
        </section>

        <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-6 mt-8">
          <p className="text-blue-400 font-semibold mb-2">Summary</p>
          <p className="text-gray-300 text-sm">
            This Terms & Conditions covers competitions and entries, payments & refunds, user conduct & acceptable use, 
            privacy & data protection, and liability & indemnification governed by UK law.
          </p>
        </div>
      </div>
    </div>
  );
}
