import { env } from "../config/env.js";
import type { ValidationResult } from "../types.js";

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export class AiProvider {
  private async call(messages: ChatMessage[], temperature = 0.4): Promise<string> {
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
        temperature,
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

    return content;
  }

  async completeJson(messages: ChatMessage[]): Promise<Record<string, unknown>> {
    const content = await this.call(messages);
    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      const cleaned = content.replace(/```json\s*|\s*```/g, "").trim();
      return JSON.parse(cleaned) as Record<string, unknown>;
    }
  }

  async validateContent(prompt: string): Promise<ValidationResult> {
    const content = await this.call(
      [
        {
          role: "system",
          content: "You are a validator. Return ONLY compact JSON. No explanations."
        },
        { role: "user", content: prompt }
      ],
      0.1
    );

    try {
      const parsed = JSON.parse(content) as ValidationResult;
      return {
        valid: parsed.valid ?? false,
        issues: Array.isArray(parsed.issues) ? parsed.issues : []
      };
    } catch {
      const cleaned = content.replace(/```json\s*|\s*```/g, "").trim();
      const parsed = JSON.parse(cleaned) as ValidationResult;
      return {
        valid: parsed.valid ?? false,
        issues: Array.isArray(parsed.issues) ? parsed.issues : []
      };
    }
  }

  async patchProblem(originalJson: string, issues: string): Promise<Record<string, unknown>> {
    const content = await this.call([
      {
        role: "system",
        content: "You fix JSON. Return ONLY the corrected full JSON. No explanations."
      },
      { role: "user", content: `Original: ${originalJson}\nIssues: ${issues}` }
    ]);

    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch {
      const cleaned = content.replace(/```json\s*|\s*```/g, "").trim();
      return JSON.parse(cleaned) as Record<string, unknown>;
    }
  }
}

export const aiProvider = new AiProvider();
