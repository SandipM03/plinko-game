import prismaClientPackage from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env["DATABASE_URL"];

const PrismaClient = prismaClientPackage.PrismaClient;

type PrismaClientInstance = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ 
     adapter: new PrismaPg(new Pool({ connectionString })) 
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
