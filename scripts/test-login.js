const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'hello@rydercomps.co.uk';
  const password = 'admin123';
  
  console.log('Testing login for:', email);
  console.log('With password:', password);
  
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    console.log('ERROR: User not found!');
    return;
  }
  
  console.log('User found:', {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    hasPassword: !!user.password
  });
  
  if (!user.password) {
    console.log('ERROR: User has no password!');
    return;
  }
  
  console.log('Password hash:', user.password);
  
  const isValid = await bcrypt.compare(password, user.password);
  console.log('Password valid:', isValid);
  
  if (isValid) {
    console.log('✓ Login should work!');
  } else {
    console.log('✗ Password mismatch!');
    
    // Try to hash the password and show what it should be
    const newHash = await bcrypt.hash(password, 10);
    console.log('Expected hash pattern:', newHash.substring(0, 7));
    console.log('Current hash pattern:', user.password.substring(0, 7));
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

