-- CreateTable
CREATE TABLE "DappGen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt1" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DappGen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenSteps" (
    "id" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "command" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "genId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "GenSteps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "systemPrompt" TEXT,
    "modelName" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GenSteps" ADD CONSTRAINT "GenSteps_genId_fkey" FOREIGN KEY ("genId") REFERENCES "DappGen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenSteps" ADD CONSTRAINT "GenSteps_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
