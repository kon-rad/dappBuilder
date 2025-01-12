import Together from "together-ai";

export class LLMService {
  private together: Together;
  private model: string;

  constructor() {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) throw new Error('TOGETHER_API_KEY is required');

    this.together = new Together({ apiKey });
    this.model = "mistralai/Mixtral-8x7B-Instruct-v0.1";
  }

  async getCompletion(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const completion = await this.together.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          { 
            role: "user", 
            content: userMessage 
          },
        ],
      });

      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('No completion content received');
      }

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('LLM completion error:', error);
      throw new Error('Failed to get LLM completion');
    }
  }
} 