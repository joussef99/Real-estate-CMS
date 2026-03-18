import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.ts";

async function main() {
  const propertyTypes = ["Apartment", "Villa", "Penthouse", "Townhouse", "Studio", "Duplex"];
  const amenities = ["Pool", "Gym", "Parking", "Security", "Garden", "Clubhouse", "Kids Area"];

  for (const name of propertyTypes) {
    await prisma.propertyType.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const name of amenities) {
    await prisma.amenity.upsert({ where: { name }, update: {}, create: { name } });
  }

  const adminUsername = "admin";
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || "admin123";

  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    await prisma.user.create({
      data: { username: adminUsername, password: hashedPassword, role: "admin" },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
