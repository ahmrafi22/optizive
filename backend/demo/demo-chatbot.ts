import { getDemoStore } from "./demo-store";
import { DEMO_USER_ID } from "@/lib/demo-constants";
import { callAi } from "@/backend/ai-chatbot/ai-call";
import { SYSTEM_PROMPT } from "@/backend/ai-chatbot/chatbot";
import type { ChatMessage, ChatListItem, ChatWithMessages } from "@/backend/ai-chatbot/chatbot";

function serializeMessage(m: any): ChatMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt,
  };
}

export function demoCreateChat(): string {
  const store = getDemoStore();
  const now = new Date();
  const chat = {
    id: `demo-chat-${store.chats.length + 1}`,
    createdAt: now,
    updatedAt: now,
    ownerId: DEMO_USER_ID,
    title: "New Chat",
    messages: [],
  };
  store.chats.push(chat);
  return chat.id;
}

export function demoListChats(): ChatListItem[] {
  return getDemoStore()
    .chats.filter((c) => c.ownerId === DEMO_USER_ID)
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 50)
    .map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messageCount: c.messages.length,
    }));
}

export function demoGetChat(chatId: string): ChatWithMessages | null {
  const chat = getDemoStore().chats.find((c) => c.id === chatId && c.ownerId === DEMO_USER_ID);
  if (!chat) return null;
  return {
    id: chat.id,
    title: chat.title,
    messages: chat.messages
      .slice()
      .sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(serializeMessage),
  };
}

export function demoDeleteChat(chatId: string): void {
  const store = getDemoStore();
  const idx = store.chats.findIndex((c) => c.id === chatId && c.ownerId === DEMO_USER_ID);
  if (idx === -1) throw new Error("Chat not found");
  store.chats.splice(idx, 1);
}

export function demoUpdateChatTitle(chatId: string, title: string): void {
  const chat = getDemoStore().chats.find((c) => c.id === chatId && c.ownerId === DEMO_USER_ID);
  if (!chat) throw new Error("Chat not found");
  chat.title = title;
  chat.updatedAt = new Date();
}

export async function demoSendMessage(
  chatId: string,
  content: string,
): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  const chat = getDemoStore().chats.find((c) => c.id === chatId && c.ownerId === DEMO_USER_ID);
  if (!chat) throw new Error("Chat not found");

  const now = new Date();
  const userMessage: ChatMessage = {
    id: `demo-cm-${Date.now()}-u`,
    role: "user",
    content,
    createdAt: now,
  };
  chat.messages.push(userMessage as any);

  const history = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chat.messages
      .slice(0, -1)
      .map((m: any) => ({ role: m.role, content: m.content })),
    { role: "user", content },
  ];

  const replyContent = await callAi(history);

  const assistantMessage: ChatMessage = {
    id: `demo-cm-${Date.now()}-a`,
    role: "assistant",
    content: replyContent,
    createdAt: new Date(),
  };
  chat.messages.push(assistantMessage as any);
  chat.updatedAt = new Date();

  const isFirstPair = chat.messages.filter((m: any) => m.role === "user").length === 1;
  if (isFirstPair) {
    chat.title = content.length > 60 ? content.slice(0, 57) + "..." : content;
  }

  return { userMessage, assistantMessage };
}