-- AlterEnum: Add CLIENT_PREMIUM to UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CLIENT_PREMIUM';

-- Update existing users: Convert PREMIUM clientType to CLIENT_PREMIUM role
UPDATE "users" SET "role" = 'CLIENT_PREMIUM' WHERE "clientType" = 'PREMIUM' AND "role" = 'CLIENT';

-- Drop the clientType column
ALTER TABLE "users" DROP COLUMN "clientType";

-- Drop the ClientType enum
DROP TYPE IF EXISTS "ClientType";
