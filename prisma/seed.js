const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phoneNumber: '1234567890',
      isWhatsApp: true,
      newsletter: false,
      occupation: 'Developer',
      pincode: '123456',
      city: 'Example City',
      state: 'Example State',
      dateOfBirth: new Date('1990-01-01T00:00:00.000Z')
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
