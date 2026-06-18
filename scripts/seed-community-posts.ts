import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, Category, PostType, PostStatus, VoteType } from "../prisma/generated/prisma/client.js";

const DEFAULT_USER_ID = "7ec7d944-66ce-4e20-bb6d-2872e5347bbf";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const userId = getArgValue("--user") || process.env.SEED_USER_ID || DEFAULT_USER_ID;
const force = process.argv.includes("--force");

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

const adapter = new PrismaNeon(
  { connectionString: process.env.DATABASE_URL },
  { schema: process.env.DATABASE_SCHEMA ?? "public" },
);
const prisma = new PrismaClient({ adapter });

interface PostDef {
  title: string;
  content: string;
  type: PostType;
  budget?: number;
  needByDays?: number;
  categories: Category[];
  tags: string[];
}

const POSTS: PostDef[] = [
  // 1 - PROCUREMENT
  {
    title: "Looking for bulk rice supply – Miniket 5kg",
    content: "We need a regular supplier for Miniket rice (5kg packs). Looking for minimum 200 bags per week. Must be able to deliver to our shop in Dhaka. Quality must be consistent – premium grade only. Please quote your best price for bulk order.",
    type: PostType.PROCUREMENT,
    budget: 65000,
    needByDays: 7,
    categories: [Category.GROCERIES],
    tags: ["rice", "grains", "bulk-supply", "wholesale"],
  },
  // 2 - PROCUREMENT
  {
    title: "Daily fresh vegetable supplier needed – Dhaka",
    content: "Looking for a reliable supplier who can deliver fresh vegetables daily to our grocery store in Mirpur. We need potatoes, onions, tomatoes, green chili, garlic, ginger, and seasonal vegetables. Approx 50kg mix per day. Must be able to commit to daily delivery by 7 AM.",
    type: PostType.PROCUREMENT,
    budget: 35000,
    needByDays: 3,
    categories: [Category.FRESH_PRODUCE],
    tags: ["vegetables", "fresh-produce", "daily-supply", "dhaka"],
  },
  // 3 - PROCUREMENT
  {
    title: "Wanted: Soybean oil 5L – 100 bottles weekly",
    content: "We need a consistent supply of soybean oil in 5L bottles. Looking for 100 bottles per week minimum. Must be fresh stock with proper batch numbers and expiry dates. Prefer direct from distributor/agency. Delivery to Banani, Dhaka.",
    type: PostType.PROCUREMENT,
    budget: 68000,
    needByDays: 10,
    categories: [Category.AGRO_PRODUCTS],
    tags: ["cooking-oil", "soybean-oil", "bulk", "distributor"],
  },
  // 4 - GENERAL
  {
    title: "Best way to store potatoes long term?",
    content: "We've been having issues with potatoes sprouting too fast in our storage. We buy in bulk (200kg at a time) but lose about 15-20% to sprouting and rot within 2 weeks. Anyone have tips on proper storage temperature, ventilation, or any treatments to extend shelf life? Open to suggestions from experienced grocers.",
    type: PostType.GENERAL,
    categories: [Category.FRESH_PRODUCE, Category.GROCERIES],
    tags: ["storage", "potatoes", "tips", "shelf-life"],
  },
  // 5 - GENERAL
  {
    title: "Where to find quality dry fish (Shutki) suppliers?",
    content: "We're looking to expand our inventory and add dry fish (shutki) to our product range. Does anyone know reliable suppliers for loitta shutki, shukna chingri, and other varieties? Quality and proper drying process are our main concerns. Also looking for wholesale pricing info.",
    type: PostType.GENERAL,
    categories: [Category.FISHERY_SEAFOOD, Category.GROCERIES],
    tags: ["dry-fish", "shutki", "supplier", "seafood"],
  },
  // 6 - PROCUREMENT
  {
    title: "Need dairy products supplier – Milk, Yogurt, Ghee",
    content: "Starting a dairy section in our grocery store. Need suppliers for fresh pasteurized milk (1L), plain yogurt (500g), and pure ghee (500g). Looking for 3-4 trusted brands that offer wholesale pricing. Monthly requirement: approx 300L milk, 200 pcs yogurt, 50 pcs ghee. Delivery to Gulshan, Dhaka.",
    type: PostType.PROCUREMENT,
    budget: 95000,
    needByDays: 14,
    categories: [Category.DAIRY],
    tags: ["dairy", "milk", "yogurt", "ghee", "wholesale"],
  },
  // 7 - GENERAL
  {
    title: "Digital inventory management tips for small grocery stores",
    content: "We're running a medium-sized grocery shop and currently tracking inventory manually. It's getting difficult to manage stock levels, especially with perishable items. Has anyone here implemented a digital/barcode system? What software or tools do you recommend for a small store? Looking for affordable options.",
    type: PostType.GENERAL,
    categories: [Category.GROCERIES],
    tags: ["inventory", "management", "software", "digital"],
  },
  // 8 - PROCUREMENT (from target user 7ec7d944)
  {
    title: "Immediate requirement: Chicken eggs 500 trays per week",
    content: "URGENT: We need a regular supplier for farm-fresh chicken eggs. Requirement is 500 trays (30 eggs each) per week. Must be fresh (max 2 days old when delivered). Looking for competitive rates. Delivery to our store in Motijheel, Dhaka. Long-term contract available for reliable supplier.",
    type: PostType.PROCUREMENT,
    budget: 180000,
    needByDays: 2,
    categories: [Category.DAIRY, Category.GROCERIES],
    tags: ["eggs", "poultry", "bulk-supply", "urgent"],
  },
];

const COMMENT_TEXTS = [
  "I can help with this! I have a reliable supplier for this item. DM me for details.",
  "Great post! We've been looking for similar products. Let me know if you find a good supplier.",
  "We have stock available right now. Can deliver within 24 hours. Please contact us for pricing.",
  "Interested in this. I might have a connection that can help. Will check and get back to you.",
  "We've been using this product for a while. Quality is good but make sure to check batch numbers before accepting delivery.",
  "I can supply this at competitive rates. We're based in Old Dhaka and deliver across the city.",
  "Have you tried contacting the wholesalers in Shyambazar? They usually have better rates for bulk orders.",
  "Great initiative! We need more shops offering these products. Good luck with your search!",
  "We're currently supplying similar products to 5 other stores in Dhaka. Happy to discuss terms.",
  "I would recommend checking the quality thoroughly before committing to a long-term contract. Learned from experience!",
];

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function seed() {
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║        SEEDING COMMUNITY POSTS (Grocery Focus)          ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);

  if (force) {
    console.log(`\n--force: Deleting existing community data...`);
    await prisma.fulfillment.deleteMany({});
    await prisma.vote.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.postTag.deleteMany({});
    await prisma.postCategory.deleteMany({});
    await prisma.post.deleteMany({});
    console.log("Cleared.\n");
  }

  // Check target user
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    console.error(`User ${userId} not found!`);
    process.exit(1);
  }
  console.log(`Target user: ${targetUser.name ?? userId} (${userId})`);

  // Find other users for comments/votes
  const otherUsers = await prisma.user.findMany({
    where: { id: { not: userId } },
    take: 10,
  });

  if (otherUsers.length < 2) {
    console.log("Warning: Only 1 other user found. Need more users for realistic interactions.");
  }
  console.log(`Found ${otherUsers.length} other users for comments & votes.\n`);

  // Create posts
  const createdPosts: { id: string; title: string }[] = [];

  for (let i = 0; i < POSTS.length; i++) {
    const p = POSTS[i];
    const isLast = i === POSTS.length - 1;
    const authorId = isLast ? userId : (otherUsers[i % otherUsers.length]?.id ?? userId);

    // Upsert tags
    const tagRecords = p.tags.length
      ? await Promise.all(
          p.tags.map((name) =>
            prisma.tag.upsert({
              where: { name },
              create: {
                name,
                slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
              },
              update: {},
            }),
          ),
        )
      : [];

    const post = await prisma.post.create({
      data: {
        authorId,
        title: p.title,
        content: p.content,
        type: p.type,
        status: PostStatus.OPEN,
        budget: p.budget ?? null,
        needByDate: p.needByDays ? daysFromNow(p.needByDays) : null,
        categories: {
          create: p.categories.map((cat) => ({ category: cat })),
        },
        postTags: tagRecords.length
          ? { create: tagRecords.map((t) => ({ tagId: t.id })) }
          : undefined,
      },
    });

    createdPosts.push({ id: post.id, title: post.title });
    const num = String(i + 1).padStart(2, " ");
    const typeStr = p.type === PostType.PROCUREMENT ? "PROCUREMENT" : "GENERAL";
    console.log(`  [${num}] [${typeStr}] ${p.title.slice(0, 55).padEnd(55)} ✓`);
  }

  console.log(`\n✅ Created ${createdPosts.length} community posts\n`);

  // Add votes (upvotes) from other users
  console.log("Adding votes...");
  let voteCount = 0;
  for (const post of createdPosts) {
    const voters = otherUsers.filter(() => Math.random() < 0.7);
    for (const voter of voters) {
      const existing = await prisma.vote.findUnique({
        where: { postId_userId: { postId: post.id, userId: voter.id } },
      });
      if (!existing) {
        await prisma.vote.create({
          data: { postId: post.id, userId: voter.id, type: VoteType.UPVOTE },
        });
        await prisma.post.update({
          where: { id: post.id },
          data: { upvoteCount: { increment: 1 } },
        });
        voteCount++;
      }
    }
  }
  console.log(`  Created ${voteCount} votes\n`);

  // Add comments
  console.log("Adding comments...");
  let commentCount = 0;
  for (const post of createdPosts) {
    const commenters = otherUsers.filter(() => Math.random() < 0.6);
    for (const commenter of commenters) {
      const text = COMMENT_TEXTS[Math.floor(Math.random() * COMMENT_TEXTS.length)];
      await prisma.comment.create({
        data: { postId: post.id, authorId: commenter.id, content: text },
      });
      await prisma.post.update({
        where: { id: post.id },
        data: { commentCount: { increment: 1 } },
      });
      commentCount++;
    }
  }
  console.log(`  Created ${commentCount} comments\n`);

  // Summary
  console.log(`╔══════════════════════════════════════════════════════════╗`);
  console.log(`║                    SEED SUMMARY                         ║`);
  console.log(`╠══════════════════════════════════════════════════════════╣`);
  console.log(`║  Posts:     ${String(createdPosts.length).padStart(5)}                             ║`);
  console.log(`║  Votes:     ${String(voteCount).padStart(5)}                             ║`);
  console.log(`║  Comments:  ${String(commentCount).padStart(5)}                             ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);

  const procurement = POSTS.filter((p) => p.type === PostType.PROCUREMENT).length;
  const general = POSTS.filter((p) => p.type === PostType.GENERAL).length;
  console.log(`\n  Post types: ${procurement} PROCUREMENT, ${general} GENERAL`);
  console.log(`  Last post (ID 8) authored by target user: ${userId}\n`);

  console.log(`=== Seeding Complete! ===\n`);
}

try {
  await seed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
