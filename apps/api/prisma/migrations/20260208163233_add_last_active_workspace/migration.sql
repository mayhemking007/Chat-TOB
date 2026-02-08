-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActiveWorkspaceId" TEXT;

-- CreateIndex
CREATE INDEX "User_lastActiveWorkspaceId_idx" ON "User"("lastActiveWorkspaceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lastActiveWorkspaceId_fkey" FOREIGN KEY ("lastActiveWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
