-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "isWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "occupation" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "pincode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Have" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Have_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wish" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" TEXT[],
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Wish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" SERIAL NOT NULL,
    "wishId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishParticipant" (
    "id" SERIAL NOT NULL,
    "wishId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "WishParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- AddForeignKey
ALTER TABLE "Have" ADD CONSTRAINT "Have_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_wishId_fkey" FOREIGN KEY ("wishId") REFERENCES "Wish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey1" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey2" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishParticipant" ADD CONSTRAINT "WishParticipant_wishId_fkey" FOREIGN KEY ("wishId") REFERENCES "Wish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishParticipant" ADD CONSTRAINT "WishParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
