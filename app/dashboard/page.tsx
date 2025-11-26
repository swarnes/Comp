"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CompetitionCard from "@/components/CompetitionCard";

interface Competition {
  id: string;
  title: string;
  description: string;
  image: string | null;
  startDate: string;
  endDate: string;
  ticketPrice: number;
  maxTickets: number;
  prizeValue?: number | null;
  isActive: boolean;
  winner?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface Entry {
  id: string;
  ticketNumbers: string;
  quantity: number;
  totalCost: number;
  paymentStatus: string;
  createdAt: string;
  competition: Competition;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeCompetitions, setActiveCompetitions] = useState<Competition[]>([]);
  const [userEntries, setUserEntries] = useState<Entry[]>([]);
  const [pastWinners, setPastWinners] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Dashboard: Session status:", status, "Session:", session?.user?.email);

    // Wait for session to load
    if (status === "loading") {
      console.log("Dashboard: Session is loading, waiting...");
      return;
    }

    // Check if user is authenticated
    if (status === "unauthenticated") {
      console.log("Dashboard: User is unauthenticated, redirecting to signin");
      router.push("/auth/signin");
      return;
    }

    if (!session) {
      console.log("Dashboard: No session found but status is:", status);
      return;
    }

    console.log("Dashboard: User is authenticated, fetching data");

    const fetchData = async () => {
      try {
        // Fetch active competitions
        const competitionsRes = await fetch("/api/competitions", {
          credentials: "include"
        });
        if (competitionsRes.ok) {
          const competitions = await competitionsRes.json();
          setActiveCompetitions(competitions);
        }

        // Fetch user entries
        const entriesRes = await fetch("/api/user/entries", {
          credentials: "include"
        });
        if (entriesRes.ok) {
          const entries = await entriesRes.json();
          setUserEntries(entries);
        }

        // Fetch past winners
        const winnersRes = await fetch("/api/competitions/past-winners", {
          credentials: "include"
        });
        if (winnersRes.ok) {
          const winners = await winnersRes.json();
          setPastWinners(winners);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl font-bold text-white">Loading dashboard...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to sign in
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">Your Dashboard</h1>
        <p className="text-gray-300">Track your entries and discover new competitions</p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-primary-400">{userEntries.length}</div>
          <div className="text-gray-300">Active Entries</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-primary-400">{activeCompetitions.length}</div>
          <div className="text-gray-300">Live Competitions</div>
        </div>
        <div className="bg-secondary-800/50 backdrop-blur-sm rounded-2xl p-6 border border-primary-500/20 text-center">
          <div className="text-3xl font-bold text-primary-400">0</div>
          <div className="text-gray-300">Wins</div>
        </div>
      </div>

      {/* Active Competitions */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Active Competitions</h2>
          <div className="w-16 h-1 bg-gradient-primary rounded-full"></div>
        </div>
        
        {activeCompetitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCompetitions.map((c: any) => (
              <CompetitionCard 
                key={c.id} 
                id={c.id} 
                title={c.title} 
                image={c.image || undefined} 
                endDate={c.endDate}
                ticketPrice={c.ticketPrice}
                description={c.description}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No active competitions at the moment.</p>
          </div>
        )}
      </section>

      {/* Your Entries */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Your Entries</h2>
          <div className="w-16 h-1 bg-gradient-primary rounded-full"></div>
        </div>
        
        {userEntries.length > 0 ? (
          <div className="grid gap-4">
            {userEntries.map((entry: any) => {
              // Parse ticket numbers from JSON string
              let ticketNumbers: number[] = [];
              try {
                ticketNumbers = JSON.parse(entry.ticketNumbers);
              } catch (error) {
                console.error("Error parsing ticket numbers:", error);
                ticketNumbers = [];
              }

              return (
                <div key={entry.id} className="bg-secondary-800/50 backdrop-blur-sm rounded-xl p-6 border border-primary-500/20">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{entry.competition.title}</h3>
                      <p className="text-gray-400 text-sm">Entered on {new Date(entry.createdAt).toLocaleDateString()}</p>
                      <p className="text-primary-400 font-medium">
                        {entry.quantity} ticket{entry.quantity !== 1 ? 's' : ''} • £{entry.totalCost ? entry.totalCost.toFixed(2) : (entry.quantity * entry.competition.ticketPrice).toFixed(2)} total
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Status</div>
                      <div className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
                        {entry.paymentStatus === 'completed' ? 'Active' : 'Pending'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ticket Numbers */}
                  <div className="bg-secondary-700/30 rounded-lg p-4 border border-gray-600/30">
                    <div className="text-sm text-gray-300 mb-2">Your Ticket Numbers:</div>
                    <div className="flex flex-wrap gap-2">
                      {ticketNumbers.length > 0 ? (
                        ticketNumbers.map((number) => (
                          <span key={number} className="bg-primary-600 text-white px-3 py-1 rounded text-sm font-bold">
                            #{number}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No ticket numbers available</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-secondary-800/30 rounded-2xl border border-primary-500/10">
            <p className="text-gray-400 mb-4">You haven't entered any competitions yet!</p>
            <p className="text-gray-500 text-sm">Browse our active competitions above to get started.</p>
          </div>
        )}
      </section>

      {/* Past Competitions & Winners */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Recent Winners</h2>
          <div className="w-16 h-1 bg-gradient-primary rounded-full"></div>
        </div>
        
        {pastWinners.length > 0 ? (
          <div className="grid gap-4">
            {pastWinners.map((c: any) => (
              <div key={c.id} className="bg-secondary-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-600/20">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-300">{c.title}</h3>
                    <p className="text-sm text-gray-500">Draw completed {new Date(c.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Winner</div>
                    <div className="text-yellow-400 font-bold">
                      {c.winner ? c.winner.name || c.winner.email : "To be announced"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No past competitions yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
