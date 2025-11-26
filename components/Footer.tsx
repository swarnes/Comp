export default function Footer() {
  return (
    <footer className="bg-secondary-900 border-t border-primary-500/20 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Social Media Section */}
        <div className="text-center mb-8 bg-amber-50 rounded-2xl p-6 mx-4">
          <div className="flex justify-center space-x-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
              <span className="text-white font-bold">f</span>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
              <span className="text-white font-bold">📷</span>
            </div>
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
              <span className="text-white font-bold">▶</span>
            </div>
          </div>
        </div>

                    {/* Footer Links */}
            <div className="text-center mb-8 bg-stone-100 rounded-2xl p-6 mx-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 max-w-5xl mx-auto mb-6">
                <a href="/winners" className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-medium">
                  Winners
                </a>
                <a href="/terms" className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-medium">
                  Terms & Conditions
                </a>
                <a href="/acceptable-use" className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-medium">
                  Acceptable Use
                </a>
                <a href="/responsible-gaming" className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-medium">
                  Responsible Gaming Policy
                </a>
                <a href="/privacy" className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-medium">
                  Privacy Policy
                </a>
                <a href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-medium">
                  Contact Us
                </a>
                <a href="/about" className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-medium">
                  About Us
                </a>
                <a href="/faqs" className="text-gray-700 hover:text-primary-600 transition-colors text-sm font-medium">
                  FAQs
                </a>
              </div>
              
              {/* Call to Action */}
              <div className="border-t border-gray-300 pt-6">
                <div className="text-lg font-bold text-gray-800 mb-3">Ready to Win Big?</div>
                <div className="flex justify-center space-x-4">
                  <a href="/auth/register" className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                    Sign Up Now
                  </a>
                  <a href="/auth/signin" className="border-2 border-red-600 text-red-600 px-8 py-3 rounded-xl font-semibold hover:bg-red-600 hover:text-white transition-all">
                    Sign In
                  </a>
                </div>
                <div className="text-sm text-gray-600 mt-3">Join thousands of winners today!</div>
              </div>
            </div>

        {/* Copyright */}
        <div className="text-center bg-neutral-200 rounded-2xl p-6 mx-4">
          <div className="text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} RydrComps. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
