/*
  Warnings:

  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Message";

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
