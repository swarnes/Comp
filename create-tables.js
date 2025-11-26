const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres:YyKQcCHPH0EYcSjYvnZVVV3tsfJciWA8Y9IaCChqltyeOPVo5U5z04WzKxozLlZP@149.102.155.46:5433/postgres"
    }
  }
});

async function checkAndCreateTables() {
  try {
    console.log('Checking NextAuth tables...');

    // Check if tables exist by trying to count records
    const checks = await Promise.allSettled([
      prisma.account.count(),
      prisma.session.count(),
      prisma.verificationToken.count()
    ]);

    const accountExists = checks[0].status === 'fulfilled';
    const sessionExists = checks[1].status === 'fulfilled';
    const verificationExists = checks[2].status === 'fulfilled';

    console.log('Account table exists:', accountExists);
    console.log('Session table exists:', sessionExists);
    console.log('VerificationToken table exists:', verificationExists);

    if (!accountExists || !sessionExists || !verificationExists) {
      console.log('Creating NextAuth tables...');

      // Create tables using raw SQL
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Account" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "provider" TEXT NOT NULL,
          "providerAccountId" TEXT NOT NULL,
          "refresh_token" TEXT,
          "access_token" TEXT,
          "expires_at" INTEGER,
          "token_type" TEXT,
          "scope" TEXT,
          "id_token" TEXT,
          "session_state" TEXT,

          CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
        );
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Session" (
          "id" TEXT NOT NULL,
          "sessionToken" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
        );
      `;

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "VerificationToken" (
          "identifier" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expires" TIMESTAMP(3) NOT NULL
        );
      `;

      // Create indexes
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
      `;

      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
      `;

      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
      `;

      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
      `;

      // Create foreign key constraints
      await prisma.$executeRaw`
        ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;

      await prisma.$executeRaw`
        ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `;

      console.log('NextAuth tables created successfully!');
    } else {
      console.log('All NextAuth tables already exist.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateTables();
