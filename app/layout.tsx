import '../styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SessionProvider from '@/components/SessionProvider'
import { CartProvider } from '@/contexts/CartContext'
import CartSidebar from '@/components/CartSidebar'

export const metadata = { title: 'RydrComps', description: 'Premium Car & Bike Competitions' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
        <html lang="en">
      <body className="bg-gradient-dark text-white min-h-screen">
        <SessionProvider session={null}>
          <CartProvider>
            <Navbar />
            {/* Logo Section */}
            <div className="flex items-center justify-center pt-4 pb-8 border-b border-primary-500/20 space-x-8 bg-gray-50">
              <img
                src="/images/Bikes/logo.png"
                alt="RydrComps Logo"
                className="h-80 w-auto drop-shadow-xl logo-pulse cursor-pointer transition-all duration-300"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.3))'
                }}
              />
              <div className="text-left">
                <h1 className="text-7xl font-bold gradient-text">RydrComps</h1>
                <p className="text-3xl text-gray-600 mt-6">Premium Car & Bike Competitions</p>
              </div>
            </div>
            <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
            <Footer />
            <CartSidebar />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
