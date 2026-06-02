"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LuSend,
  LuUser,
  LuTrash2,
  LuPlus,
  LuClock,
  LuX,
  LuMessageSquare,
} from "react-icons/lu";
import { AiFillAliwangwang } from "react-icons/ai";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  sendMessage,
  createChat,
  listChats,
  getChat,
  deleteChat,
} from "@/backend/ai-chatbot/chatbot";
import type { ChatMessage, ChatListItem } from "@/backend/ai-chatbot/chatbot";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const SUGGESTIONS = [
  "Which products are slow-moving and should be discounted?",
  "How can I improve my profit margins?",
  "Suggest bundles for my top-selling category",
  "What inventory is at risk of expiring soon?",
  "How do I optimize my reorder points?",
  "What seasonal promotions should I plan?",
];

export default function AIChatbotPage() {
  const { data: session } = useSession();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showGreeting, setShowGreeting] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userImage = session?.user?.image;
  const userName = session?.user?.name;
  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "OP";

  useEffect(() => {
    loadChatList().finally(() => setInitialLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + "px";
    }
  }, [input]);

  async function loadChatList() {
    const chats = await listChats();
    setChatList(chats);
  }

  const startNewChat = useCallback(async () => {
    const id = await createChat();
    setChatId(id);
    setMessages([]);
    setShowGreeting(true);
    setShowHistory(false);
    await loadChatList();
  }, []);

  const selectChat = useCallback(async (id: string) => {
    setChatId(id);
    const chat = await getChat(id);
    if (chat) {
      setMessages(chat.messages);
      setShowGreeting(false);
    }
    setShowHistory(false);
  }, []);

  const handleDeleteChat = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      await deleteChat(id);
      if (chatId === id) {
        setChatId(null);
        setMessages([]);
        setShowGreeting(true);
      }
      await loadChatList();
    },
    [chatId],
  );

  async function handleSend(content: string) {
    if (!content.trim() || isLoading) return;

    setShowGreeting(false);

    let currentChatId = chatId;
    if (!currentChatId) {
      currentChatId = await createChat();
      setChatId(currentChatId);
    }

    const userContent = content.trim();
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userContent }]);

    try {
      const result = await sendMessage(currentChatId, userContent);
      setMessages((prev) => [
        ...prev.filter(
          (m) => !(m.role === "user" && m.content === userContent && !m.id),
        ),
        result.userMessage,
        result.assistantMessage,
      ]);
      await loadChatList();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  const showSuggestions = messages.length === 0 && !isLoading && !showGreeting;

  return (
    <div className="relative flex flex-col h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="shrink-0">
        <div className="mx-auto max-w-5xl flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-(--clr-yellow) p-2">
              <AiFillAliwangwang className="h-5 w-5 text-(--clr-charcoal)" />
            </div>
            <h1 className="font-naston text-xl md:text-2xl text-(--clr-fg) leading-tight">
              OptiBot
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 rounded-full bg-(--clr-yellow) px-3 py-1.5 text-xs font-semibold text-(--clr-charcoal) hover:bg-(--clr-yellow-dim) transition-colors active:scale-[0.97]"
            >
              <LuPlus className="h-3.5 w-3.5" />
              New chat
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 rounded-full bg-(--clr-teal-dim) px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity active:scale-[0.97]"
            >
              <LuClock className="h-3.5 w-3.5" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="mx-auto max-w-5xl space-y-4 pb-20">
          {/* Greeting */}
          {showGreeting && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="flex flex-col items-center justify-center min-h-[24rem] text-center px-4"
            >
              <div className="inline-flex rounded-2xl bg-(--clr-yellow)/10 p-4 mb-4">
                <AiFillAliwangwang className="h-10 w-10 text-(--clr-yellow)" />
              </div>
              <h2 className="text-xl font-naston text-(--clr-fg) mb-2">
                How can I help you today?
              </h2>
              <p className="text-sm text-(--clr-fg-muted) max-w-sm mx-auto mb-6">
                Ask about inventory optimization, sales strategy, pricing, or
                anything about your store.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-xs text-(--clr-fg-muted) px-3 py-2 rounded-xl border border-(--clr-border) bg-(--clr-surface2) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors active:scale-[0.97]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Suggestions after first message cleared */}
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
              className="flex flex-wrap justify-center gap-2 pt-4"
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs text-(--clr-fg-muted) px-3 py-2 rounded-xl border border-(--clr-border) bg-(--clr-surface2) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors active:scale-[0.97]"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id ?? msg.content.slice(0, 20)}
              message={msg}
              userImage={userImage}
              userInitials={userInitials}
            />
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-full bg-(--clr-yellow)/80 flex items-center justify-center shadow-sm">
                <AiFillAliwangwang className="h-4 w-4 text-(--clr-charcoal)" />
              </div>
              <div className="rounded-2xl bg-(--clr-surface2) px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full bg-(--clr-fg-dim) animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="h-2 w-2 rounded-full bg-(--clr-fg-dim) animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 rounded-full bg-(--clr-fg-dim) animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pt-3 pb-3 bg-transparent">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl flex items-center gap-2 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about sales, inventory, pricing..."
              rows={1}
              className="flex-1 resize-none rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-dim) focus:outline-none min-h-[40px] max-h-[120px] leading-relaxed"
              style={{ fieldSizing: "content" as any }}
            />

            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-(--clr-yellow) text-(--clr-charcoal) hover:bg-(--clr-yellow-dim) disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.9]"
            >
              <LuSend className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* History overlay sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setShowHistory(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col border-l border-(--clr-border) bg-(--clr-surface) shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-(--clr-border) px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-(--clr-fg)">
                  <LuMessageSquare className="h-4 w-4" />
                  Chat History
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-(--clr-fg-muted) hover:bg-(--clr-surface2) transition-all"
                >
                  <LuX className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                {initialLoading ? (
                  <div className="space-y-2 p-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-14 rounded-xl bg-(--clr-surface) animate-pulse"
                      />
                    ))}
                  </div>
                ) : chatList.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <LuClock className="h-8 w-8 mx-auto text-(--clr-fg-dim) mb-3" />
                    <p className="text-sm text-(--clr-fg-muted)">
                      No chat history yet
                    </p>
                    <p className="text-xs text-(--clr-fg-dim) mt-1">
                      Start a conversation to see it here
                    </p>
                  </div>
                ) : (
                  chatList.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => selectChat(chat.id)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors group ${
                        chat.id === chatId
                          ? "bg-(--clr-yellow)/10 border border-(--clr-yellow)/20"
                          : "hover:bg-(--clr-surface2) border border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-(--clr-fg) truncate leading-tight block flex-1">
                          {chat.title}
                        </span>
                        <button
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-(--clr-surface) text-(--clr-fg-dim) hover:text-rose-400"
                        >
                          <LuTrash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-(--clr-fg-dim)">
                          {formatTime(chat.updatedAt)}
                        </span>
                        <span className="text-[11px] text-(--clr-fg-dim)">
                          ·
                        </span>
                        <span className="text-[11px] text-(--clr-fg-dim)">
                          {chat.messageCount} msgs
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function MessageBubble({
  message,
  userImage,
  userInitials,
}: {
  message: ChatMessage;
  userImage?: string | null;
  userInitials: string;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center shadow-sm overflow-hidden ${
          isUser ? "bg-(--clr-teal-dim)" : "bg-(--clr-yellow)/80"
        }`}
      >
        {isUser ? (
          userImage ? (
            <img
              src={userImage}
              alt={userInitials}
              className="w-full h-full object-cover"
            />
          ) : (
            <LuUser className="h-4 w-4 text-white" />
          )
        ) : (
          <AiFillAliwangwang className="h-4 w-4 text-(--clr-charcoal)" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`rounded-2xl px-5 py-4 max-w-[80%] md:max-w-[70%] text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-(--clr-teal-dim) text-white"
            : "bg-(--clr-surface2) text-(--clr-fg)"
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}
