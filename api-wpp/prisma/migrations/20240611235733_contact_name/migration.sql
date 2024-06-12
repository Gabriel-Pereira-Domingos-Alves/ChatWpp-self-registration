/*
  Warnings:

  - Added the required column `contactName` to the `send_messages` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_send_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    CONSTRAINT "send_messages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_send_messages" ("clientId", "createdAt", "id", "message", "phoneNumber") SELECT "clientId", "createdAt", "id", "message", "phoneNumber" FROM "send_messages";
DROP TABLE "send_messages";
ALTER TABLE "new_send_messages" RENAME TO "send_messages";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
