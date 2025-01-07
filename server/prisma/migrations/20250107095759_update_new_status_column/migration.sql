-- AlterTable
ALTER TABLE "GenSteps" ADD COLUMN     "endDateTime" TIMESTAMP(3),
ADD COLUMN     "startDateTime" TIMESTAMP(3),
ADD COLUMN     "status" TEXT,
ADD COLUMN     "stepNotes" TEXT,
ADD COLUMN     "terminalCommands" TEXT,
ALTER COLUMN "stepNumber" DROP NOT NULL,
ALTER COLUMN "command" DROP NOT NULL,
ALTER COLUMN "output" DROP NOT NULL,
ALTER COLUMN "classification" DROP NOT NULL;
