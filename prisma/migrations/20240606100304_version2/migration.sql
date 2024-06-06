/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phoneNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `haves` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isWhatsApp` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `newsletter` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `occupation` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wishes` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
DROP COLUMN "skills",
ADD COLUMN     "haves" JSONB NOT NULL,
ADD COLUMN     "isWhatsApp" BOOLEAN NOT NULL,
ADD COLUMN     "newsletter" BOOLEAN NOT NULL,
ADD COLUMN     "occupation" TEXT NOT NULL,
ADD COLUMN     "wishes" JSONB NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "Task";

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
