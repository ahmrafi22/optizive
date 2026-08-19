import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AiHistoryMessage = { role: string; content: string };

async function callOpenRouter(history: AiHistoryMessage[]) {
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

async function callOpenCodeCompatible(history: AiHistoryMessage[]) {
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

async function callGemini(history: AiHistoryMessage[]) {
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

export async function callAi(history: AiHistoryMessage[]): Promise<string> {
  const aiUse = process.env.AI_USE;
  if (aiUse === "2") {
    return callOpenCodeCompatible(history);
  } else if (aiUse === "3") {
    return callGemini(history);
  }
  return callOpenRouter(history);
}