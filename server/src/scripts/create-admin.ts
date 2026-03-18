import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.ts";

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const role = "admin";

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role,
    },
    create: {
      username,
      password: hashedPassword,
      role,
    },
  });

  console.log("Admin user is ready:", { id: user.id, username: user.username, role: user.role });
}

main()
  .catch((err) => {
    console.error("Failed to create admin user:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });