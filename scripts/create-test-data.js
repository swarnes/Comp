const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createTestData() {
  console.log("🔄 Creating test data for RydrComps...");

  try {
    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const adminUser = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@rydrcomps.com",
        password: hashedPassword,
        role: "admin"
      }
    });
    console.log("✅ Created admin user");

    // Create regular user
    const userPassword = await bcrypt.hash("user123", 12);
    const regularUser = await prisma.user.create({
      data: {
        name: "John Doe",
        email: "john@example.com",
        password: userPassword,
        role: "user"
      }
    });
    console.log("✅ Created regular user");

    // Create competitions
    const competition1 = await prisma.competition.create({
      data: {
        title: "Kawasaki Ninja ZX-10R",
        description: "Win this stunning Kawasaki Ninja ZX-10R - 200hp superbike with advanced traction control and quick shifter!",
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ticketPrice: 3.0,
        maxTickets: 5000,
        image: "/images/Bikes/61qIUO5qd0L.jpg"
      }
    });

    const competition2 = await prisma.competition.create({
      data: {
        title: "Yamaha YZF-R1M",
        description: "Enter to win the ultimate track machine - Yamaha YZF-R1M with carbon fiber bodywork and Öhlins suspension!",
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        ticketPrice: 5.0,
        maxTickets: 3000,
        image: "/images/Bikes/713SBgN271L._AC_SL1500_.jpg"
      }
    });

    const competition3 = await prisma.competition.create({
      data: {
        title: "Honda CBR1000RR-R Fireblade",
        description: "Win the most advanced Honda superbike ever - CBR1000RR-R Fireblade with MotoGP-derived technology!",
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        ticketPrice: 4.0,
        maxTickets: 4000,
        image: "/images/Bikes/71aoQ3xWbpL._AC_SL1500_.jpg"
      }
    });

    console.log("✅ Created 3 competitions");

    // Create sample entries for testing progress tracking
    await prisma.entry.create({
      data: {
        userId: regularUser.id,
        competitionId: competition1.id,
        ticketNumbers: [1, 2, 3],
        quantity: 3,
        totalCost: 9.0,
        paymentStatus: "completed"
      }
    });

    await prisma.entry.create({
      data: {
        userId: regularUser.id,
        competitionId: competition2.id,
        ticketNumbers: [1, 2, 3, 4, 5],
        quantity: 5,
        totalCost: 25.0,
        paymentStatus: "completed"
      }
    });

    console.log("✅ Created sample entries for testing");

    console.log("\n🎉 Test data created successfully!");
    console.log("📝 Login credentials:");
    console.log("   Admin: admin@rydrcomps.com / admin123");
    console.log("   User:  john@example.com / user123");
    console.log("\n🚀 Run 'npm run dev' and test the application!");

  } catch (error) {
    console.error("❌ Error creating test data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
