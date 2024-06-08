-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "session" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
