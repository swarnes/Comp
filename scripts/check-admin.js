const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      password: true
    }
  });
  console.log('Admin user:', JSON.stringify(admin, null, 2));
  
  // Check if password is hashed
  if (admin?.password) {
    console.log('Password starts with:', admin.password.substring(0, 10));
    console.log('Password length:', admin.password.length);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

