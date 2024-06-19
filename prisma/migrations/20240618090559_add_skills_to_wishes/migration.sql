-- AlterTable
ALTER TABLE "User" ALTER COLUMN "isWhatsApp" SET DEFAULT false,
ALTER COLUMN "newsletter" SET DEFAULT false,
ALTER COLUMN "occupation" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Wish" ADD COLUMN     "skills" TEXT[];
