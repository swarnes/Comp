const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Seeding MongoDB database...");

  let adminUser, regularUser;

  // Create admin user (handle duplicates gracefully)
  try {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    adminUser = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@rydrcomps.com",
        password: hashedPassword,
        role: "admin"
      }
    });
    console.log("✅ Created admin user");
  } catch (error) {
    if (error.code === 'P2002') {
      adminUser = await prisma.user.findUnique({ where: { email: "admin@rydrcomps.com" } });
      console.log("📝 Admin user already exists");
    } else {
      throw error;
    }
  }

  // Create regular user (handle duplicates gracefully)
  try {
    const userPassword = await bcrypt.hash("user123", 12);
    regularUser = await prisma.user.create({
      data: {
        name: "John Doe",
        email: "john@example.com",
        password: userPassword,
        role: "user"
      }
    });
    console.log("✅ Created regular user");
  } catch (error) {
    if (error.code === 'P2002') {
      regularUser = await prisma.user.findUnique({ where: { email: "john@example.com" } });
      console.log("📝 Regular user already exists");
    } else {
      throw error;
    }
  }

  // Create sample competitions with real bike images
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

  const competition4 = await prisma.competition.create({
    data: {
      title: "Ducati Panigale V4 S",
      description: "Experience Italian excellence with this Ducati Panigale V4 S - 214hp of pure racing heritage!",
      startDate: new Date(),
      endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      ticketPrice: 6.0,
      maxTickets: 2500,
      image: "/images/Bikes/71t0YRdm3IL._AC_SL1500_.jpg"
    }
  });

  // Add some sample entries
  await prisma.entry.create({
    data: {
      userId: regularUser.id,
      competitionId: competition1.id,
      ticketNumbers: JSON.stringify([1, 2, 3]),
      quantity: 3,
      totalCost: 9.0,
      paymentStatus: "completed"
    }
  });

  await prisma.entry.create({
    data: {
      userId: regularUser.id,
      competitionId: competition2.id,
      ticketNumbers: JSON.stringify([1, 2]),
      quantity: 2,
      totalCost: 10.0,
      paymentStatus: "completed"
    }
  });

  console.log("✅ Database seeded with sample competitions and entries!");
  console.log("Admin user: admin@rydrcomps.com / admin123");
  console.log("Test user: john@example.com / user123");
  console.log("Created 4 competitions with real ticket tracking");
}

main()
  .catch((e) => { 
    console.error("❌ Seed error:", e); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });
