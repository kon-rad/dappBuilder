/*
  Warnings:

  - Added the required column `status` to the `DappGen` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GenSteps" DROP CONSTRAINT "GenSteps_agentId_fkey";

-- AlterTable
ALTER TABLE "DappGen" ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GenSteps" ALTER COLUMN "agentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL,
    "genId" TEXT NOT NULL,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GenSteps" ADD CONSTRAINT "GenSteps_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_genId_fkey" FOREIGN KEY ("genId") REFERENCES "DappGen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
