"use server";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  id?: string;
  createdAt?: Date;
}

export interface ChatListItem {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface ChatWithMessages {
  id: string;
  title: string;
  messages: ChatMessage[];
}

const SYSTEM_PROMPT = `You are OptiBot, an expert sales & inventory optimization assistant for Optizive — an AI-powered inventory and supply chain management platform for SMBs in Bangladesh.

## YOUR ROLE
You help store owners, suppliers, and distributors optimize their sales, inventory, pricing, and supply chain decisions. Be practical, data-driven, and actionable. Use Bengali-market context (BDT currency, local suppliers, seasonal demand like Pohela Boishakh, Eid, winter harvest).

## CORE CAPABILITIESObject literal may only specify known properties, and 'maxTokens' does not exist in type 'CallSettings & (Prompt & { model: LanguageModel; tools?: ToolSet | undefined; toolChoice?: ToolChoice<NoInfer<ToolSet>> | undefined; ... 19 more ...; _internal?: { ...; } | undefined; })'.

### 1. INVENTORY OPTIMIZATION
- Identify slow-moving stock and suggest markdowns, bundles, or clearance strategies
- Advise on reorder points and safety stock based on sales velocity and lead time
- Detect dead stock and recommend donation, bundling, or supplier return
- Suggest optimal stock levels by category based on historical sales
- Flag expiry risks and recommend urgency-based pricing (10-50% discount sliding scale)

### 2. SALES STRATEGY
- Cross-sell and upsell recommendations based on co-purchase patterns
- Bundle pricing strategies (e.g., "buy 3 get 5% off", "tiered discounts")
- Seasonal promotion planning with timing and discount depth
- Customer segmentation and loyalty tactics
- Invoice and payment follow-up best practices
- Cash flow optimization through payment terms

### 3. PRICING INTELLIGENCE
- Margin analysis: flag products below target margin
- Competitor-aware pricing suggestions
- Psychological pricing tactics (e.g., 199 BDT vs 200 BDT)
- Volume discount structuring for B2B buyers

### 4. SUPPLIER MANAGEMENT
- Supplier matchmaking based on category, location, pricing tier
- Bulk discount negotiation tactics
- Alternative supplier suggestions when stock is low
- Lead time optimization

### 5. ANALYTICS & REPORTING
- Sales trend interpretation (daily/weekly/monthly)
- Category performance breakdowns
- Revenue forecasting
- Inventory turnover ratio analysis

## RESPONSE STYLE
- Keep responses concise and actionable
- Use markdown formatting for structure (headings, tables, code blocks, bullet lists) — responses will be rendered as markdown
- Include specific numbers (BDT, percentages, quantities) when suggesting changes
- If you don't have enough context, ask clarifying questions about their inventory or sales data
- NEVER make up specific data about their store
- Be professional, direct, and factual — minimize emoji use (only very sparingly if at all)
- Use Bangladeshi market examples and seasonal references naturally`;

export async function createChat(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const chat = await prisma.chat.create({
    data: {
      ownerId: userId,
      title: "New Chat",
    },
  });

  return chat.id;
}

export async function listChats(): Promise<ChatListItem[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const chats = await prisma.chat.findMany({
    where: { ownerId: userId },
    include: { _count: { select: { messages: true } } },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return chats.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messageCount: c._count.messages,
  }));
}

export async function getChat(chatId: string): Promise<ChatWithMessages | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, ownerId: userId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, content: true, createdAt: true } },
    },
  });

  if (!chat) return null;

  return {
    id: chat.id,
    title: chat.title,
    messages: chat.messages.map((m) => ({
      id: m.id,
      role: m.role as MessageRole,
      content: m.content,
      createdAt: m.createdAt,
    })),
  };
}

export async function deleteChat(chatId: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  await prisma.chat.deleteMany({
    where: { id: chatId, ownerId: userId },
  });
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  await prisma.chat.updateMany({
    where: { id: chatId, ownerId: userId },
    data: { title },
  });
}

async function callOpenRouter(history: { role: string; content: string }[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key not configured");

  const model = process.env.OPENROUTER_MODEL || "openrouter/free";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://optizive.app",
      "X-Title": "Optizive AI Chatbot",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 2048,
      messages: history,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Chatbot AI] OpenRouter Error", response.status, errorText);
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = (await response.json()) as any;
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callOpenCodeCompatible(history: { role: string; content: string }[]) {
  const apiKey = process.env.OPENCODE_KEY;
  if (!apiKey) throw new Error("OPENCODE_KEY not configured");

  const model = process.env.OPENCODE_MODEL || "nemotron-3-super-free";

  const client = createOpenAICompatible({
    name: "opencode",
    apiKey,
    baseURL: "https://opencode.ai/zen/v1",
  });

  const { text } = await generateText({
    model: client.chatModel(model),
    messages: history as any,
    temperature: 0.7,
    maxOutputTokens: 2048,
  });

  return text;
}

async function callGemini(history: { role: string; content: string }[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const systemMsg = history.find((m) => m.role === "system");
  const chatHistory = history
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const lastMsg = chatHistory.pop();

  const chat = model.startChat({
    history: chatHistory,
    systemInstruction: systemMsg?.content ? { role: "system", parts: [{ text: systemMsg.content }] } : undefined,
  });

  const result = await chat.sendMessage(lastMsg!.parts[0].text);
  return result.response.text();
}

export async function sendMessage(
  chatId: string,
  content: string
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, ownerId: userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!chat) throw new Error("Chat not found");

  const savedUserMessage = await prisma.chatMessage.create({
    data: { chatId, role: "user", content },
  });

  const history = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chat.messages.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content },
  ];

  const aiUse = process.env.AI_USE;
  let replyContent: string;

  if (aiUse === "2") {
    replyContent = await callOpenCodeCompatible(history);
  } else if (aiUse === "3") {
    replyContent = await callGemini(history);
  } else {
    replyContent = await callOpenRouter(history);
  }

  const savedAssistantMessage = await prisma.chatMessage.create({
    data: { chatId, role: "assistant", content: replyContent },
  });

  const isFirstPair = chat.messages.length === 0;
  if (isFirstPair) {
    const title = content.length > 60 ? content.slice(0, 57) + "..." : content;
    await prisma.chat.update({
      where: { id: chatId },
      data: { title },
    });
  } else {
    await prisma.chat.update({
      where: { id: chatId },
      data: {},
    });
  }

  return {
    userMessage: {
      id: savedUserMessage.id,
      role: savedUserMessage.role as MessageRole,
      content: savedUserMessage.content,
      createdAt: savedUserMessage.createdAt,
    },
    assistantMessage: {
      id: savedAssistantMessage.id,
      role: savedAssistantMessage.role as MessageRole,
      content: savedAssistantMessage.content,
      createdAt: savedAssistantMessage.createdAt,
    },
  };
}
