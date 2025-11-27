const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Set a known password for testing
  const testPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  
  const updated = await prisma.user.update({
    where: { email: 'hello@rydercomps.co.uk' },
    data: { password: hashedPassword }
  });
  
  console.log('Updated admin password for:', updated.email);
  console.log('New password: admin123');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

