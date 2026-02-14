-- CreateTable
CREATE TABLE "Context" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceBotId" TEXT,
    "sourceFolderPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Context_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotContext" (
    "botId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,

    CONSTRAINT "BotContext_pkey" PRIMARY KEY ("botId","contextId")
);

-- CreateIndex
CREATE INDEX "Context_workspaceId_idx" ON "Context"("workspaceId");

-- CreateIndex
CREATE INDEX "Context_folderId_idx" ON "Context"("folderId");

-- CreateIndex
CREATE INDEX "BotContext_contextId_idx" ON "BotContext"("contextId");

-- AddForeignKey
ALTER TABLE "Context" ADD CONSTRAINT "Context_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Context" ADD CONSTRAINT "Context_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Context" ADD CONSTRAINT "Context_sourceBotId_fkey" FOREIGN KEY ("sourceBotId") REFERENCES "Bot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotContext" ADD CONSTRAINT "BotContext_botId_fkey" FOREIGN KEY ("botId") REFERENCES "Bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotContext" ADD CONSTRAINT "BotContext_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "Context"("id") ON DELETE CASCADE ON UPDATE CASCADE;
