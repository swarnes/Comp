const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function addUsers() {
  console.log("🔄 Adding test users...");

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@rydrcomps.com" }
    });

    if (!existingAdmin) {
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
      console.log("✅ Created admin user: admin@rydrcomps.com");
    } else {
      console.log("📝 Admin user already exists");
    }

    // Check if regular user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "john@example.com" }
    });

    if (!existingUser) {
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
      console.log("✅ Created regular user: john@example.com");
    } else {
      console.log("📝 Regular user already exists");
    }

    console.log("\n🎉 Users ready!");
    console.log("📝 Login credentials:");
    console.log("   Admin: admin@rydrcomps.com / admin123");
    console.log("   User:  john@example.com / user123");

  } catch (error) {
    console.error("❌ Error adding users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addUsers();
