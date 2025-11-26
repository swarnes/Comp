"use client";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">About RydrComps</h1>
        <p className="text-gray-300 text-lg">Your ultimate destination for exciting car and bike competitions!</p>
      </div>

      <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-8 border border-primary-500/20 space-y-8">
        <section>
          <p className="text-gray-300 text-lg leading-relaxed">
            At RydrComps, we believe that winning amazing vehicles shouldn't just be a dream—it should be an experience. 
            That's why we bring together car and motorbike enthusiasts from all over to participate in fun, fair, and transparent competitions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">Our Mission</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <span className="text-primary-400 text-2xl">🎯</span>
              <div>
                <h3 className="font-bold text-white mb-2">Make competitions thrilling and accessible</h3>
                <p className="text-gray-300">Everyone should have a chance to drive away with their dream ride.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <span className="text-primary-400 text-2xl">🤝</span>
              <div>
                <h3 className="font-bold text-white mb-2">Connect the community</h3>
                <p className="text-gray-300">Whether you're a car lover, a bike fan, or both, RydrComps brings people together.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <span className="text-primary-400 text-2xl">🔒</span>
              <div>
                <h3 className="font-bold text-white mb-2">Provide transparency and trust</h3>
                <p className="text-gray-300">Every competition is run fairly, and winners are chosen honestly and publicly.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-secondary-700/30 rounded-lg p-6 border border-gray-600/30">
              <span className="text-primary-400 text-3xl block mb-3">🏆</span>
              <h3 className="font-bold text-white mb-2">Exciting Competitions</h3>
              <p className="text-gray-300 text-sm">From sleek sports cars to iconic motorcycles, our competitions feature a wide range of vehicles.</p>
            </div>
            <div className="bg-secondary-700/30 rounded-lg p-6 border border-gray-600/30">
              <span className="text-primary-400 text-3xl block mb-3">⚡</span>
              <h3 className="font-bold text-white mb-2">Easy Participation</h3>
              <p className="text-gray-300 text-sm">Entering is quick, simple, and secure.</p>
            </div>
            <div className="bg-secondary-700/30 rounded-lg p-6 border border-gray-600/30">
              <span className="text-primary-400 text-3xl block mb-3">📊</span>
              <h3 className="font-bold text-white mb-2">Up-to-Date Updates</h3>
              <p className="text-gray-300 text-sm">Track competitions, entries, and winners through our intuitive dashboard.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-primary-400 mb-4">Why Choose RydrComps?</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-green-400 text-xl">✓</span>
              <span className="text-white"><strong>Fair Play</strong> – We operate with integrity, ensuring every entry is valid and every winner is genuine.</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-400 text-xl">✓</span>
              <span className="text-white"><strong>Passion for Vehicles</strong> – Our team shares your love for cars and bikes, making every competition special.</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-green-400 text-xl">✓</span>
              <span className="text-white"><strong>Community Focused</strong> – We value our members and provide a platform where enthusiasts can engage, compete, and celebrate.</span>
            </div>
          </div>
        </section>

        <section className="bg-gradient-primary rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Join Us Today!</h2>
          <p className="text-white mb-6">
            Whether you're here to win your dream car, your favorite motorcycle, or simply to join a community of like-minded enthusiasts, 
            RydrComps is the place for you. Start exploring our competitions, track your entries, and get ready to ride into your next adventure!
          </p>
          <p className="text-xl font-bold text-white">RydrComps – Where Dreams Hit the Road.</p>
        </section>
      </div>
    </div>
  );
}