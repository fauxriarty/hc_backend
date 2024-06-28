/*
  Warnings:

  - Added the required column `senderId` to the `Invite` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_userId_fkey2";

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "senderId" INTEGER NOT NULL;

-- RenameForeignKey
ALTER TABLE "Invite" RENAME CONSTRAINT "Invite_userId_fkey1" TO "Invite_userId_fkey";

-- RenameForeignKey
ALTER TABLE "Request" RENAME CONSTRAINT "Request_userId_fkey1" TO "Request_userId_fkey";

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
