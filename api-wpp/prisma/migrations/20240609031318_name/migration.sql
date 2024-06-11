/*
  Warnings:

  - The primary key for the `clients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `clients` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `send_messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `clientId` on the `send_messages` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `id` on the `send_messages` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Added the required column `name` to the `send_messages` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "session" TEXT NOT NULL
);
INSERT INTO "new_clients" ("id", "name", "number", "session") SELECT "id", "name", "number", "session" FROM "clients";
DROP TABLE "clients";
ALTER TABLE "new_clients" RENAME TO "clients";
CREATE TABLE "new_send_messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" INTEGER,
    CONSTRAINT "send_messages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_send_messages" ("clientId", "createdAt", "id", "message", "phoneNumber") SELECT "clientId", "createdAt", "id", "message", "phoneNumber" FROM "send_messages";
DROP TABLE "send_messages";
ALTER TABLE "new_send_messages" RENAME TO "send_messages";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
