const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Create sample competitions
  await prisma.competition.createMany({
    data: [
      {
        title: "Win a BMW M3 Competition",
        description: "Enter to win a brand new BMW M3 Competition - the ultimate driving machine with 503hp!",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        ticketPrice: 5.0,
        image: "/images/default.jpg"
      },
      {
        title: "Kawasaki Ninja H2 Giveaway",
        description: "Win the legendary Kawasaki Ninja H2 - 200hp of pure adrenaline!",
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        ticketPrice: 3.0,
        image: "/images/default.jpg"
      },
      {
        title: "Tesla Model S Plaid",
        description: "Experience the future with this Tesla Model S Plaid - 0-60 in under 2 seconds!",
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        ticketPrice: 10.0,
        image: "/images/default.jpg"
      },
      {
        title: "Classic Ford Mustang 1969",
        description: "Own a piece of automotive history with this restored 1969 Ford Mustang Boss 429!",
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 30 days ago
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Ended yesterday
        ticketPrice: 15.0,
        image: "/images/default.jpg"
      }
    ]
  });

  // Create a sample user
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com"
    }
  });

  // Add some sample entries
  const competitions = await prisma.competition.findMany();
  await prisma.entry.createMany({
    data: [
      {
        userId: user.id,
        competitionId: competitions[0].id
      },
      {
        userId: user.id,
        competitionId: competitions[1].id
      }
    ]
  });

  console.log("✅ Database seeded with sample competitions and entries!");
  console.log(`Created ${competitions.length} competitions and 2 user entries`);
}

main()
  .catch((e) => { 
    console.error("❌ Seed error:", e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });
