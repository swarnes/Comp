import { prisma } from "@/lib/prisma";
import CompetitionCard from "@/components/CompetitionCard";

// Force dynamic rendering - don't prerender at build time
export const dynamic = 'force-dynamic';

export default async function Home() {
  const competitions = await prisma.competition.findMany({ 
    where: { 
      endDate: { gte: new Date() },
      isActive: true 
    },
    orderBy: { createdAt: 'desc' } // Newest competitions first
  });

  return (
    <div className="space-y-12">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg text-center">
          <div className="text-3xl font-bold text-primary-600">£75K+</div>
          <div className="text-gray-600">Prizes Given Away</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg text-center">
          <div className="text-3xl font-bold text-primary-600">350+</div>
          <div className="text-gray-600">Happy Winners</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg text-center">
          <div className="text-3xl font-bold text-primary-600">2,800+</div>
          <div className="text-gray-600">Community Members</div>
        </div>
      </div>

      {/* Competitions Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold gradient-text mb-4">
            Our Competitions
          </h2>
          <div className="w-32 h-1 bg-gradient-primary mx-auto rounded-full"></div>
        </div>

        {/* Competition Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {competitions.map((c: any) => (
            <CompetitionCard 
              key={c.id} 
              id={c.id}
              slug={c.slug}
              title={c.title} 
              image={c.image || undefined} 
              endDate={c.endDate.toISOString()}
              ticketPrice={c.ticketPrice}
              description={c.description}
            />
          ))}
        </div>

        {competitions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No active competitions at the moment.</p>
            <p className="text-gray-500">Check back soon for exciting new prizes!</p>
          </div>
        )}
      </section>
    </div>
  );
}
