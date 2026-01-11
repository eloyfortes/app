-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('COMMON', 'PREMIUM');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "clientType" "ClientType" NOT NULL DEFAULT 'COMMON';
