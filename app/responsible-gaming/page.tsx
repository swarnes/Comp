"use client";

export default function ResponsibleGamingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">Responsible Play</h1>
        <p className="text-gray-300">Promoting safe and fair participation in all our competitions</p>
      </div>

      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20 space-y-6">
        <p className="text-gray-300 text-lg">
          At RydrComps, we are committed to promoting safe, fair, and responsible participation in all our competitions. 
          While we make entering competitions fun and exciting, it's important that all participants play responsibly.
        </p>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">Our Commitment</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-green-400 text-xl mt-1">✓</span>
              <span className="text-gray-300">We ensure that all competitions are transparent and fair.</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-400 text-xl mt-1">✓</span>
              <span className="text-gray-300">We provide clear rules and entry requirements so participants can make informed decisions.</span>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-green-400 text-xl mt-1">✓</span>
              <span className="text-gray-300">We monitor activities to prevent misuse, fraud, or exploitation of the platform.</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">Guidelines for Responsible Participation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-secondary-700/30 rounded-lg p-6 border border-gray-600/30">
              <h3 className="font-bold text-white mb-3 flex items-center">
                <span className="text-primary-400 mr-2">💰</span>
                Set Limits
              </h3>
              <p className="text-gray-300 text-sm">Participate within your means. Only spend what you can afford and avoid chasing losses.</p>
            </div>
            
            <div className="bg-secondary-700/30 rounded-lg p-6 border border-gray-600/30">
              <h3 className="font-bold text-white mb-3 flex items-center">
                <span className="text-primary-400 mr-2">🔞</span>
                Age Requirements
              </h3>
              <p className="text-gray-300 text-sm">All participants must meet the minimum legal age for entering competitions in their jurisdiction.</p>
            </div>
            
            <div className="bg-secondary-700/30 rounded-lg p-6 border border-gray-600/30">
              <h3 className="font-bold text-white mb-3 flex items-center">
                <span className="text-primary-400 mr-2">⚖️</span>
                Balanced Participation
              </h3>
              <p className="text-gray-300 text-sm">Competitions should be a source of entertainment, not stress or financial strain.</p>
            </div>
            
            <div className="bg-secondary-700/30 rounded-lg p-6 border border-gray-600/30">
              <h3 className="font-bold text-white mb-3 flex items-center">
                <span className="text-primary-400 mr-2">🆘</span>
                Seek Help if Needed
              </h3>
              <p className="text-gray-300 text-sm">If you feel participation is becoming problematic, we encourage you to pause, take breaks, or seek professional advice.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">Support and Resources</h2>
          <p className="text-gray-300 mb-4">
            If you or someone you know may need support related to responsible gaming or competition participation, 
            we recommend reaching out to local organizations such as:
          </p>
          
          <div className="bg-secondary-700/30 rounded-lg p-6 border border-gray-600/30 space-y-4">
            <div>
              <h3 className="font-bold text-white mb-2">🇬🇧 GamCare (UK)</h3>
              <p className="text-gray-300 text-sm mb-1">Website: <a href="https://www.gamcare.org.uk" className="text-primary-400 hover:text-primary-300" target="_blank" rel="noopener noreferrer">https://www.gamcare.org.uk</a></p>
              <p className="text-gray-300 text-sm">Helpline: 0808 8020 133</p>
            </div>
            
            <div>
              <h3 className="font-bold text-white mb-2">🌍 Gambling Therapy (International)</h3>
              <p className="text-gray-300 text-sm">Website: <a href="https://www.gamblingtherapy.org" className="text-primary-400 hover:text-primary-300" target="_blank" rel="noopener noreferrer">https://www.gamblingtherapy.org</a></p>
            </div>
          </div>
        </section>

        <section className="bg-green-900/20 border border-green-600/30 rounded-lg p-6">
          <h2 className="text-xl font-bold text-green-400 mb-4">Our Promise</h2>
          <p className="text-gray-300">
            At RydrComps, we want every competition to be fun, exciting, and safe. By playing responsibly, 
            you help ensure a positive experience for yourself and the community.
          </p>
        </section>

        <div className="text-center text-gray-400 text-sm">
          <p>If you have concerns about your participation or need support, please contact us at:</p>
          <p className="text-primary-400 mt-2">support@rydercomps.co.uk</p>
        </div>
      </div>
    </div>
  );
}