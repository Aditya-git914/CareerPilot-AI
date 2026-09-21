// "use server";  // optional, but keeps you on the server side

// lib/prisma.js
// lib/prisma.js
import { PrismaClient } from "@prisma/client";

// Prevent multiple instances in development (hot reloads)
const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prisma) {
  prisma = new PrismaClient();
  globalForPrisma.prisma = prisma;
} else {
  prisma = globalForPrisma.prisma;
}

export const db = prisma;



// globalThis.prisma: This global variable ensures that the Prisma client instance is
// reused across hot reloads during development. Without this, each time your application
// reloads, a new instance of the Prisma client would be created, potentially leading
// to connection issues.
