/**
 * Deepseek API Client for Kimi 2.5 and Kimi models
 * Provides chat completion interface compatible with OpenClaw agent system
 */

export interface DeepseekMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface DeepseekRequest {
  model: "deepseek-coder-2.5" | "deepseek-reasoner";
  messages: DeepseekMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  thinking?: {
    type: "enabled";
    budget_tokens: number;
  };
}

export interface DeepseekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      thinking?: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepseekClient {
  private apiKey: string;
  private baseUrl = "https://api.deepseek.com/chat/completions";
  private model: "deepseek-coder-2.5" | "deepseek-reasoner";

  constructor(apiKey: string, model: "deepseek-coder-2.5" | "deepseek-reasoner" = "deepseek-coder-2.5") {
    if (!apiKey) {
      throw new Error("DEEPSEEK_API_KEY environment variable is required");
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async createChatCompletion(request: DeepseekRequest): Promise<DeepseekResponse> {
    const body = {
      model: request.model || this.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      top_p: request.top_p ?? 0.95,
      max_tokens: request.max_tokens ?? 4000,
      ...(request.thinking && {
        thinking: {
          type: "enabled",
          budget_tokens: request.thinking.budget_tokens || 2000,
        },
      }),
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deepseek API error: ${response.status} - ${error}`);
    }

    return (await response.json()) as DeepseekResponse;
  }

  async generateCode(
    prompt: string,
    context?: string,
    maxTokens?: number
  ): Promise<{ code: string; thinking?: string; tokensUsed: number }> {
    const messages: DeepseekMessage[] = [];

    if (context) {
      messages.push({
        role: "system",
        content: context,
      });
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    const response = await this.createChatCompletion({
      model: "deepseek-coder-2.5",
      messages,
      max_tokens: maxTokens || 4000,
      temperature: 0.7,
    });

    const choice = response.choices[0];
    return {
      code: choice.message.content,
      thinking: choice.message.thinking,
      tokensUsed: response.usage.total_tokens,
    };
  }

  async analyzeSecurityThreat(
    description: string,
    context?: string,
    budgetTokens?: number
  ): Promise<{ analysis: string; thinking?: string; tokensUsed: number }> {
    const messages: DeepseekMessage[] = [];

    const systemPrompt = `You are a security expert. Analyze the following security concern thoroughly.
Use deep reasoning to identify potential vulnerabilities, attack vectors, and mitigation strategies.
Format your response with:
1. Threat Assessment
2. Vulnerability Analysis
3. Risk Level
4. Mitigation Strategies
5. Compliance Implications`;

    messages.push({
      role: "system",
      content: systemPrompt + (context ? `\n\nContext:\n${context}` : ""),
    });

    messages.push({
      role: "user",
      content: description,
    });

    const response = await this.createChatCompletion({
      model: "deepseek-reasoner",
      messages,
      max_tokens: 8000,
      temperature: 0.5,
      thinking: {
        type: "enabled",
        budget_tokens: budgetTokens || 8000,
      },
    });

    const choice = response.choices[0];
    return {
      analysis: choice.message.content,
      thinking: choice.message.thinking,
      tokensUsed: response.usage.total_tokens,
    };
  }

  getModel(): string {
    return this.model;
  }

  setModel(model: "deepseek-coder-2.5" | "deepseek-reasoner"): void {
    this.model = model;
  }
}

export default DeepseekClient;
