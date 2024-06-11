/*
  Warnings:

  - The primary key for the `clients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `send_messages` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `send_messages` table. All the data in the column will be lost.
  - Made the column `clientId` on table `send_messages` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "session" TEXT NOT NULL
);
INSERT INTO "new_clients" ("id", "name", "number", "session") SELECT "id", "name", "number", "session" FROM "clients";
DROP TABLE "clients";
ALTER TABLE "new_clients" RENAME TO "clients";
CREATE TABLE "new_send_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "send_messages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_send_messages" ("clientId", "createdAt", "id", "message", "phoneNumber") SELECT "clientId", "createdAt", "id", "message", "phoneNumber" FROM "send_messages";
DROP TABLE "send_messages";
ALTER TABLE "new_send_messages" RENAME TO "send_messages";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
