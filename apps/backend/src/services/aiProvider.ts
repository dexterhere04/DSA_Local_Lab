import { env } from "../config/env.js";

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export class AiProvider {
  async completeJson(messages: ChatMessage[]) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is missing. Add it in .env to enable AI generation.");
    }

    const response = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.4,
        messages
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AI completion failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI returned empty content");
    }

    return JSON.parse(content) as Record<string, unknown>;
  }
}

export const aiProvider = new AiProvider();
