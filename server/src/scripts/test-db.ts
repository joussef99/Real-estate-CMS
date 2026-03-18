import "dotenv/config";
import { prisma } from "../lib/prisma.ts";
import { generateSlug } from "../utils/slug.ts";

async function main() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;

  const [users, projects, blogs] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.blog.count(),
  ]);

  console.log("Database connection OK");
  console.log(JSON.stringify({ users, projects, blogs }, null, 2));

  const testSlug = `db-test-${Date.now()}`;
  const created = await prisma.project.create({
    data: {
      name: "DB Health Test Property",
      slug: generateSlug(testSlug),
      price_range: "TEST",
      featured: 0,
      is_featured: 0,
    },
  });

  const updated = await prisma.project.update({
    where: { id: created.id },
    data: { price_range: "TEST-UPDATED" },
  });

  await prisma.project.delete({ where: { id: created.id } });

  console.log("CRUD smoke test OK");
  console.log(JSON.stringify({ createdId: created.id, updatedPriceRange: updated.price_range }, null, 2));
}

main()
  .catch((err) => {
    console.error("Database test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
