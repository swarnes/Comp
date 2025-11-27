import '../styles/globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SessionProvider from '@/components/SessionProvider'
import { CartProvider } from '@/contexts/CartContext'
import CartSidebar from '@/components/CartSidebar'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export const metadata = {
  title: 'RyderComps',
  description: 'Premium Car & Bike Competitions',
  icons: {
    icon: '/images/Bikes/logo.png',
    shortcut: '/images/Bikes/logo.png',
    apple: '/images/Bikes/logo.png',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  return (
        <html lang="en">
      <body className="bg-gradient-dark text-white min-h-screen">
        <SessionProvider session={session}>
          <CartProvider>
            <Navbar />
            {/* Logo Section */}
            <div className="flex flex-col md:flex-row items-center justify-center py-6 md:py-8 px-4 border-b border-primary-500/20 gap-4 md:gap-8 bg-gray-50">
              <img
                src="/images/Bikes/logo.png"
                alt="RyderComps Logo"
                className="h-72 md:h-64 lg:h-80 w-auto drop-shadow-xl logo-pulse cursor-pointer transition-all duration-300"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.3))'
                }}
              />
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold gradient-text">RyderComps</h1>
                <p className="text-base md:text-xl lg:text-3xl text-gray-600 mt-2 md:mt-4 lg:mt-6">Premium Car & Bike Competitions</p>
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
