"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log('[SignIn] Form submitted with email:', email, 'password length:', password.length);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });
      console.log('[SignIn] signIn result:', result);

      if (result?.error) {
        setError("Invalid email or password");
      } else if (result?.ok) {
        // Small delay to ensure cookie is set, then fetch session
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try to get session with retries
        let session = await getSession();
        let retries = 0;
        while (!session && retries < 3) {
          await new Promise(resolve => setTimeout(resolve, 200));
          session = await getSession();
          retries++;
        }
        
        console.log('[SignIn] Session after login:', session);
        
        // Redirect based on role
        if (session?.user?.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold gradient-text">
            Sign in to RyderComps
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Access your competition dashboard
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-secondary-800 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link href="/auth/forgot-password" className="text-sm text-primary-400 hover:text-primary-300">
              Forgot your password?
            </Link>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-primary hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-transform"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center">
            <Link href="/auth/register" className="text-primary-400 hover:text-primary-300 text-sm">
              Don't have an account? Sign up
            </Link>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-8 p-4 bg-secondary-800/50 rounded-md border border-primary-500/20">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Demo Accounts:</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Admin: admin@rydrcomps.com / admin123</div>
            <div>User: john@example.com / user123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
