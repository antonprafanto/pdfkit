/**
 * OpenAI Provider
 * Implements AI operations using OpenAI GPT models
 */

import OpenAI from 'openai';
import { AIProviderInterface, AIMessage, ChatResponse, EmbeddingResponse } from '../ai-service';

export class OpenAIProvider implements AIProviderInterface {
  private client: OpenAI | null = null;
  private apiKey: string = '';
  private model: string = 'gpt-4o-mini';
  private embeddingModel: string = 'text-embedding-3-small';

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Required for browser environment
      });
    } else {
      this.client = null;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.client);
  }

  async validateKey(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      // Make a minimal API call to validate key
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI key validation failed:', error);
      return false;
    }
  }

  getModelName(): string {
    return this.model;
  }

  async chat(messages: AIMessage[], options?: { maxTokens?: number }): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        max_tokens: options?.maxTokens || 2048,
      });

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed,
        model: this.model,
      };
    } catch (error: any) {
      console.error('OpenAI chat error:', error);
      throw new Error(`OpenAI error: ${error.message || 'Unknown error'}`);
    }
  }

  async embed(text: string): Promise<EmbeddingResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not configured');
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      return {
        embedding: response.data[0].embedding,
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch (error: any) {
      console.error('OpenAI embedding error:', error);
      throw new Error(`OpenAI embedding error: ${error.message || 'Unknown error'}`);
    }
  }
}
