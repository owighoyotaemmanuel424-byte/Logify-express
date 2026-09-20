import crypto from "node:crypto";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password: string, salt: string) {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@logify.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be set and contain at least 12 characters");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { name: "Logify Super Admin", role: UserRole.SUPER_ADMIN, status: "ACTIVE", passwordHash, salt },
    create: {
      id: "super-admin-1",
      email,
      name: "Logify Super Admin",
      role: UserRole.SUPER_ADMIN,
      status: "ACTIVE",
      passwordHash,
      salt,
      phone: null,
    },
  });

  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      data: {
        companyName: "Logify Logistics Ltd.",
        contactEmail: "support@logify.com",
        contactPhone: "+1 (800) 555-LOGI",
        pricing: { basePrice: 15, pricePerKg: 3.5, pricePerKm: 0.8 },
        isSiteActive: true,
        showCookieBanner: true,
        enableLiveChat: true,
      },
    },
  });

  console.log(`Seeded administrator: ${admin.email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
