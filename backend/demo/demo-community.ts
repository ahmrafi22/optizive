import { getDemoStore } from "./demo-store";
import { DEMO_USER_ID } from "@/lib/demo-constants";
import type {
  PostQuery,
  PostListItem,
  PostDetail,
  CommentItem,
  FulfillmentItem,
  CreatePostPayload,
  CreateFulfillmentPayload,
} from "@/backend/community/community";

function authorOf(id: string) {
  const u = getDemoStore().users.find((x) => x.id === id);
  return {
    id: u?.id ?? id,
    name: u?.name ?? "Unknown",
    profileImage: u?.profileImage ?? null,
    businessName: u?.businessName ?? null,
  };
}

function tagsOf(post: any) {
  const store = getDemoStore();
  return (post.tags ?? [])
    .map((tagId: string) => store.tags.find((t) => t.id === tagId))
    .filter(Boolean)
    .map((t: any) => ({ id: t.id, name: t.name, slug: t.slug }));
}

function serializePost(post: any): PostListItem {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    type: post.type,
    status: post.status,
    budget: post.budget ?? null,
    needByDate: post.needByDate ? post.needByDate.toISOString() : null,
    image: post.image ?? null,
    upvoteCount: post.upvoteCount,
    downvoteCount: post.downvoteCount,
    commentCount: post.commentCount ?? post.comments?.length ?? 0,
    createdAt: post.createdAt.toISOString(),
    author: authorOf(post.authorId),
    categories: post.categories ?? [],
    tags: tagsOf(post),
    userVote:
      post.votes?.find((v: any) => v.userId === DEMO_USER_ID)?.type ?? null,
  };
}

function serializeComment(c: any): CommentItem {
  return {
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    author: authorOf(c.authorId),
  };
}

function serializeFulfillment(f: any): FulfillmentItem {
  return {
    id: f.id,
    message: f.message,
    price: f.price ?? null,
    estimatedDelivery: f.estimatedDelivery ? f.estimatedDelivery.toISOString() : null,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    supplier: authorOf(f.supplierId),
  };
}

let postSeq = { n: 10 };
let commentSeq = { n: 19 };
let voteSeq = { n: 30 };
let fulfillmentSeq = { n: 6 };

export function demoGetPosts(query: PostQuery): { posts: PostListItem[]; total: number } {
  let posts = getDemoStore().posts.slice();

  if (query.search) {
    const q = query.search.toLowerCase();
    posts = posts.filter(
      (p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q),
    );
  }
  if (query.type && query.type !== "ALL") posts = posts.filter((p) => p.type === query.type);
  if (query.status && query.status !== "ALL") posts = posts.filter((p) => p.status === query.status);
  if (query.category && query.category !== "ALL")
    posts = posts.filter((p) => (p.categories ?? []).includes(query.category));
  if (query.tag) posts = posts.filter((p) => tagsOf(p).some((t: any) => t.slug === query.tag));

  if (query.sort === "oldest") posts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  else if (query.sort === "popular") posts.sort((a, b) => b.upvoteCount - a.upvoteCount);
  else if (query.sort === "active") posts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  else posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const total = posts.length;
  const page = posts.slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 20));
  return { posts: page.map(serializePost), total };
}

export function demoGetPostById(postId: string): PostDetail | null {
  const post = getDemoStore().posts.find((p) => p.id === postId);
  if (!post) return null;
  return {
    ...serializePost(post),
    updatedAt: post.updatedAt.toISOString(),
    fulfillments: (post.fulfillments ?? [])
      .slice()
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(serializeFulfillment),
  };
}

export function demoCreatePost(payload: CreatePostPayload): PostListItem {
  const store = getDemoStore();
  const now = new Date();
  const post = {
    id: `demo-post-${++postSeq.n}`,
    createdAt: now,
    updatedAt: now,
    authorId: DEMO_USER_ID,
    title: payload.title,
    content: payload.content,
    type: payload.type,
    status: "OPEN",
    budget: payload.budget ?? null,
    needByDate: payload.needByDate ? new Date(payload.needByDate) : null,
    image: payload.image ?? null,
    upvoteCount: 0,
    downvoteCount: 0,
    commentCount: 0,
    categories: payload.categories ?? [],
    tags: (payload.tagNames ?? []).map((name) => {
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      let tag = store.tags.find((t) => t.slug === slug);
      if (!tag) {
        tag = { id: `demo-tag-${Math.random().toString(16).slice(2, 8)}`, name, slug };
        store.tags.push(tag);
      }
      return tag.id;
    }),
    comments: [],
    votes: [],
    fulfillments: [],
  };
  store.posts.push(post);
  return serializePost(post);
}

export function demoUpdatePostStatus(postId: string, status: string): void {
  const post = getDemoStore().posts.find((p) => p.id === postId && p.authorId === DEMO_USER_ID);
  if (!post) throw new Error("Post not found");
  post.status = status;
  post.updatedAt = new Date();
}

export function demoDeletePost(postId: string): void {
  const store = getDemoStore();
  const idx = store.posts.findIndex((p) => p.id === postId && p.authorId === DEMO_USER_ID);
  if (idx === -1) throw new Error("Post not found");
  store.posts.splice(idx, 1);
}

export function demoVote(
  postId: string,
  type: "UPVOTE" | "DOWNVOTE" | null,
): { upvoteCount: number; downvoteCount: number; userVote: "UPVOTE" | "DOWNVOTE" | null } {
  const store = getDemoStore();
  const post = store.posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");

  const existing = (post.votes ?? []).find((v: any) => v.userId === DEMO_USER_ID);
  const adjust = (prev: string | null, next: string | null) => {
    if (prev === next) return;
    if (prev === "UPVOTE") post.upvoteCount = Math.max(0, post.upvoteCount - 1);
    if (prev === "DOWNVOTE") post.downvoteCount = Math.max(0, post.downvoteCount - 1);
    if (next === "UPVOTE") post.upvoteCount += 1;
    if (next === "DOWNVOTE") post.downvoteCount += 1;
  };

  if (type === null) {
    if (existing) {
      adjust(existing.type, null);
      post.votes = post.votes.filter((v: any) => v.userId !== DEMO_USER_ID);
    }
  } else if (!existing) {
    adjust(null, type);
    post.votes.push({ id: `demo-post-v-${++voteSeq.n}`, userId: DEMO_USER_ID, type });
  } else if (existing.type !== type) {
    adjust(existing.type, type);
    existing.type = type;
  }

  return {
    upvoteCount: post.upvoteCount,
    downvoteCount: post.downvoteCount,
    userVote: type,
  };
}

export function demoGetComments(postId: string): CommentItem[] {
  const post = getDemoStore().posts.find((p) => p.id === postId);
  if (!post) return [];
  return (post.comments ?? [])
    .slice()
    .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(serializeComment);
}

export function demoCreateComment(postId: string, content: string): CommentItem {
  const store = getDemoStore();
  const post = store.posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  const comment = {
    id: `demo-post-c-${++commentSeq.n}`,
    createdAt: new Date(),
    authorId: DEMO_USER_ID,
    content,
  };
  post.comments.push(comment);
  post.commentCount = post.comments.length;
  post.updatedAt = new Date();
  return serializeComment(comment);
}

export function demoDeleteComment(commentId: string): void {
  const store = getDemoStore();
  for (const post of store.posts) {
    const idx = (post.comments ?? []).findIndex(
      (c: any) => c.id === commentId && c.authorId === DEMO_USER_ID,
    );
    if (idx !== -1) {
      post.comments.splice(idx, 1);
      post.commentCount = post.comments.length;
      post.updatedAt = new Date();
      return;
    }
  }
  throw new Error("Comment not found");
}

export function demoGetFulfillments(postId: string): FulfillmentItem[] {
  const post = getDemoStore().posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  return (post.fulfillments ?? [])
    .slice()
    .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(serializeFulfillment);
}

export function demoCreateFulfillment(postId: string, payload: CreateFulfillmentPayload): FulfillmentItem {
  const store = getDemoStore();
  const post = store.posts.find((p) => p.id === postId);
  if (!post) throw new Error("Post not found");
  if (post.authorId === DEMO_USER_ID) throw new Error("Cannot fulfill your own post");
  const fulfillment = {
    id: `demo-post-f-${++fulfillmentSeq.n}`,
    createdAt: new Date(),
    supplierId: DEMO_USER_ID,
    message: payload.message,
    price: payload.price ?? null,
    estimatedDelivery: payload.estimatedDelivery ? new Date(payload.estimatedDelivery) : null,
    status: "PENDING",
  };
  post.fulfillments.push(fulfillment);
  post.updatedAt = new Date();
  return serializeFulfillment(fulfillment);
}

export function demoUpdateFulfillmentStatus(fulfillmentId: string, status: string): void {
  const store = getDemoStore();
  for (const post of store.posts) {
    const f = (post.fulfillments ?? []).find((x: any) => x.id === fulfillmentId);
    if (f) {
      if (post.authorId !== DEMO_USER_ID) throw new Error("Not authorized");
      f.status = status;
      if (status === "ACCEPTED") post.status = "FILLED";
      post.updatedAt = new Date();
      return;
    }
  }
  throw new Error("Fulfillment not found");
}

export function demoGetTags(): { id: string; name: string; slug: string }[] {
  return getDemoStore().tags
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ id: t.id, name: t.name, slug: t.slug }));
}

export function demoGetCategoryOptions(): { value: string; label: string }[] {
  const values = [
    "GROCERIES", "FMCG", "FRESH_PRODUCE", "AGRO_PRODUCTS", "FISHERY_SEAFOOD",
    "MEAT_POULTRY", "DAIRY", "ELECTRONICS", "MOBILE_ACCESSORIES", "CLOTHING",
    "TEXTILES_APPAREL", "FOOTWEAR", "BEAUTY_PERSONAL_CARE", "HOME_APPLIANCE",
    "FURNITURE", "HARDWARE", "CONSTRUCTION_MATERIALS", "AUTO_PARTS", "PHARMACY",
    "STATIONERY", "OFFICE_SUPPLIES", "PACKAGING", "CHEMICALS", "PLASTICS",
    "RESTAURANT_SUPPLY", "HOSPITALITY_SUPPLY", "OTHER",
  ];
  return values.map((value) => ({
    value,
    label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}