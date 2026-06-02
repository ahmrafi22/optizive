"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { Prisma, Category, PostType, PostStatus, VoteType, FulfillmentStatus } from "@/prisma/generated/prisma/client";

export type CommunityPostStatus = "OPEN" | "FILLED" | "CLOSED";
export type CommunityPostType = "PROCUREMENT" | "GENERAL";

export interface PostQuery {
  search?: string;
  type?: CommunityPostType | "ALL";
  status?: CommunityPostStatus | "ALL";
  category?: Category | "ALL";
  tag?: string;
  sort?: "newest" | "oldest" | "popular" | "active";
  limit?: number;
  offset?: number;
}

export interface PostListItem {
  id: string;
  title: string;
  content: string;
  type: CommunityPostType;
  status: CommunityPostStatus;
  budget: number | null;
  needByDate: string | null;
  image: string | null;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profileImage: string | null;
    businessName: string | null;
  };
  categories: string[];
  tags: { id: string; name: string; slug: string }[];
  userVote: VoteType | null;
}

export interface PostDetail extends PostListItem {
  updatedAt: string;
  fulfillments: FulfillmentItem[];
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profileImage: string | null;
    businessName: string | null;
  };
}

export interface FulfillmentItem {
  id: string;
  message: string;
  price: number | null;
  estimatedDelivery: string | null;
  status: FulfillmentStatus;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    profileImage: string | null;
    businessName: string | null;
  };
}

export interface CreatePostPayload {
  title: string;
  content: string;
  type: CommunityPostType;
  budget?: number | null;
  needByDate?: string | null;
  image?: string | null;
  categories?: Category[];
  tagNames?: string[];
}

export interface CreateFulfillmentPayload {
  message: string;
  price?: number | null;
  estimatedDelivery?: string | null;
}

function serializePost(post: any, userId?: string): PostListItem {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    type: post.type as CommunityPostType,
    status: post.status as CommunityPostStatus,
    budget: post.budget,
    needByDate: post.needByDate?.toISOString() ?? null,
    image: post.image,
    upvoteCount: post.upvoteCount,
    downvoteCount: post.downvoteCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    author: {
      id: post.author.id,
      name: post.author.name,
      profileImage: post.author.profileImage,
      businessName: post.author.businessName,
    },
    categories: post.categories?.map((pc: any) => pc.category) ?? [],
    tags: post.postTags?.map((pt: any) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      slug: pt.tag.slug,
    })) ?? [],
    userVote: post.votes?.[0]?.type ?? null,
  };
}

async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

function buildPostInclude(userId: string) {
  return {
    author: { select: { id: true, name: true, profileImage: true, businessName: true } },
    categories: { select: { category: true } },
    postTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
    votes: {
      where: { userId },
      select: { type: true },
      take: 1,
    },
  } satisfies Prisma.PostInclude;
}

export async function getPosts(query: PostQuery): Promise<{ posts: PostListItem[]; total: number }> {
  const userId = await getCurrentUserId();

  const where: Prisma.PostWhereInput = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { content: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.type && query.type !== "ALL") {
    where.type = query.type as PostType;
  }

  if (query.status && query.status !== "ALL") {
    where.status = query.status as PostStatus;
  }

  if (query.category && query.category !== "ALL") {
    where.categories = { some: { category: query.category as Category } };
  }

  if (query.tag) {
    where.postTags = { some: { tag: { slug: query.tag } } };
  }

  let orderBy: Prisma.PostOrderByWithRelationInput = { createdAt: "desc" };
  if (query.sort === "oldest") orderBy = { createdAt: "asc" };
  else if (query.sort === "popular") orderBy = { upvoteCount: "desc" };
  else if (query.sort === "active") orderBy = { updatedAt: "desc" };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: query.offset ?? 0,
      take: query.limit ?? 20,
      include: buildPostInclude(userId),
    }),
    prisma.post.count({ where }),
  ]);

  return { posts: posts.map((p) => serializePost(p, userId)), total };
}

export async function getPostById(postId: string): Promise<PostDetail | null> {
  const userId = await getCurrentUserId();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      ...buildPostInclude(userId),
      fulfillments: {
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { id: true, name: true, profileImage: true, businessName: true } },
        },
      },
    },
  });

  if (!post) return null;

  return {
    ...serializePost(post, userId),
    updatedAt: post.updatedAt.toISOString(),
    fulfillments: post.fulfillments.map((f) => ({
      id: f.id,
      message: f.message,
      price: f.price,
      estimatedDelivery: f.estimatedDelivery?.toISOString() ?? null,
      status: f.status,
      createdAt: f.createdAt.toISOString(),
      supplier: {
        id: f.supplier.id,
        name: f.supplier.name,
        profileImage: f.supplier.profileImage,
        businessName: f.supplier.businessName,
      },
    })),
  };
}

export async function createPost(payload: CreatePostPayload): Promise<PostListItem> {
  const userId = await getCurrentUserId();

  const tagRecords = payload.tagNames?.length
    ? await Promise.all(
        payload.tagNames.map((name) =>
          prisma.tag.upsert({
            where: { name },
            create: {
              name,
              slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
            },
            update: {},
          })
        )
      )
    : [];

  const post = await prisma.post.create({
    data: {
      authorId: userId,
      title: payload.title,
      content: payload.content,
      type: payload.type as PostType,
      budget: payload.budget ?? null,
      needByDate: payload.needByDate ? new Date(payload.needByDate) : null,
      image: payload.image ?? null,
      categories: payload.categories?.length
        ? { create: payload.categories.map((cat) => ({ category: cat })) }
        : undefined,
      postTags: tagRecords.length
        ? { create: tagRecords.map((t) => ({ tagId: t.id })) }
        : undefined,
    },
    include: buildPostInclude(userId),
  });

  return serializePost(post, userId);
}

export async function updatePostStatus(postId: string, status: CommunityPostStatus): Promise<void> {
  const userId = await getCurrentUserId();

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== userId) throw new Error("Not authorized");

  await prisma.post.update({
    where: { id: postId },
    data: { status: status as PostStatus },
  });
}

export async function deletePost(postId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== userId) throw new Error("Not authorized");

  await prisma.post.delete({ where: { id: postId } });
}

export async function vote(postId: string, type: VoteType | null): Promise<{ upvoteCount: number; downvoteCount: number; userVote: VoteType | null }> {
  const userId = await getCurrentUserId();

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new Error("Post not found");

  const existing = await prisma.vote.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (type === null) {
    if (existing) {
      await prisma.vote.delete({ where: { id: existing.id } });
      await prisma.post.update({
        where: { id: postId },
        data: {
          upvoteCount: existing.type === "UPVOTE" ? { decrement: 1 } : undefined,
          downvoteCount: existing.type === "DOWNVOTE" ? { decrement: 1 } : undefined,
        },
      });
    }
  } else if (!existing) {
    await prisma.vote.create({ data: { postId, userId, type } });
    await prisma.post.update({
      where: { id: postId },
      data: {
        upvoteCount: type === "UPVOTE" ? { increment: 1 } : undefined,
        downvoteCount: type === "DOWNVOTE" ? { increment: 1 } : undefined,
      },
    });
  } else if (existing.type !== type) {
    await prisma.vote.update({
      where: { id: existing.id },
      data: { type },
    });
    const upvoteDelta = type === "UPVOTE" ? 1 : existing.type === "UPVOTE" ? -1 : 0;
    const downvoteDelta = type === "DOWNVOTE" ? 1 : existing.type === "DOWNVOTE" ? -1 : 0;
    await prisma.post.update({
      where: { id: postId },
      data: {
        upvoteCount: { increment: upvoteDelta },
        downvoteCount: { increment: downvoteDelta },
      },
    });
  }

  const updated = await prisma.post.findUnique({
    where: { id: postId },
    select: { upvoteCount: true, downvoteCount: true },
  });

  return {
    upvoteCount: updated!.upvoteCount,
    downvoteCount: updated!.downvoteCount,
    userVote: type,
  };
}

export async function getComments(postId: string): Promise<CommentItem[]> {
  await getCurrentUserId();

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, profileImage: true, businessName: true } },
    },
  });

  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    author: {
      id: c.author.id,
      name: c.author.name,
      profileImage: c.author.profileImage,
      businessName: c.author.businessName,
    },
  }));
}

export async function createComment(postId: string, content: string): Promise<CommentItem> {
  const userId = await getCurrentUserId();

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) throw new Error("Post not found");

  const comment = await prisma.comment.create({
    data: { postId, authorId: userId, content },
    include: {
      author: { select: { id: true, name: true, profileImage: true, businessName: true } },
    },
  });

  await prisma.post.update({
    where: { id: postId },
    data: { commentCount: { increment: 1 } },
  });

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.author.id,
      name: comment.author.name,
      profileImage: comment.author.profileImage,
      businessName: comment.author.businessName,
    },
  };
}

export async function deleteComment(commentId: string): Promise<void> {
  const userId = await getCurrentUserId();

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true },
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.authorId !== userId) throw new Error("Not authorized");

  await prisma.comment.delete({ where: { id: commentId } });

  await prisma.post.update({
    where: { id: comment.postId },
    data: { commentCount: { decrement: 1 } },
  });
}

export async function getFulfillments(postId: string): Promise<FulfillmentItem[]> {
  const userId = await getCurrentUserId();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) throw new Error("Post not found");

  const isOwner = post.authorId === userId;
  const isSupplier = true;

  if (!isOwner && !isSupplier) {
    const ownFulfillment = await prisma.fulfillment.findFirst({
      where: { postId, supplierId: userId },
    });
    if (!ownFulfillment) throw new Error("Not authorized");
  }

  const fulfillments = await prisma.fulfillment.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    include: {
      supplier: { select: { id: true, name: true, profileImage: true, businessName: true } },
    },
  });

  return fulfillments.map((f) => ({
    id: f.id,
    message: f.message,
    price: f.price,
    estimatedDelivery: f.estimatedDelivery?.toISOString() ?? null,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    supplier: {
      id: f.supplier.id,
      name: f.supplier.name,
      profileImage: f.supplier.profileImage,
      businessName: f.supplier.businessName,
    },
  }));
}

export async function createFulfillment(postId: string, payload: CreateFulfillmentPayload): Promise<FulfillmentItem> {
  const userId = await getCurrentUserId();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, type: true, authorId: true },
  });
  if (!post) throw new Error("Post not found");
  if (post.authorId === userId) throw new Error("Cannot fulfill your own post");

  const fulfillment = await prisma.fulfillment.create({
    data: {
      postId,
      supplierId: userId,
      message: payload.message,
      price: payload.price ?? null,
      estimatedDelivery: payload.estimatedDelivery ? new Date(payload.estimatedDelivery) : null,
    },
    include: {
      supplier: { select: { id: true, name: true, profileImage: true, businessName: true } },
    },
  });

  return {
    id: fulfillment.id,
    message: fulfillment.message,
    price: fulfillment.price,
    estimatedDelivery: fulfillment.estimatedDelivery?.toISOString() ?? null,
    status: fulfillment.status,
    createdAt: fulfillment.createdAt.toISOString(),
    supplier: {
      id: fulfillment.supplier.id,
      name: fulfillment.supplier.name,
      profileImage: fulfillment.supplier.profileImage,
      businessName: fulfillment.supplier.businessName,
    },
  };
}

export async function updateFulfillmentStatus(fulfillmentId: string, status: FulfillmentStatus): Promise<void> {
  const userId = await getCurrentUserId();

  const fulfillment = await prisma.fulfillment.findUnique({
    where: { id: fulfillmentId },
    include: { post: { select: { authorId: true } } },
  });
  if (!fulfillment) throw new Error("Fulfillment not found");
  if (fulfillment.post.authorId !== userId) throw new Error("Not authorized");

  await prisma.fulfillment.update({
    where: { id: fulfillmentId },
    data: { status },
  });
}

export async function getTags(): Promise<{ id: string; name: string; slug: string }[]> {
  await getCurrentUserId();

  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug }));
}

export async function getCategoryOptions(): Promise<{ value: Category; label: string }[]> {
  await getCurrentUserId();

  return Object.values(Category).map((value) => ({
    value: value as Category,
    label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}
