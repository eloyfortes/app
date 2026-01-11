import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEnum() {
  try {
    // Execute SQL directly to add CLIENT_PREMIUM to enum
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumlabel = 'CLIENT_PREMIUM' 
              AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
          ) THEN
              ALTER TYPE "UserRole" ADD VALUE 'CLIENT_PREMIUM';
          END IF;
      END $$;
    `);
    console.log('✅ CLIENT_PREMIUM added to UserRole enum successfully!');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('✅ CLIENT_PREMIUM already exists in UserRole enum');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixEnum();
