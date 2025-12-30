/**
 * Anthropic Provider
 * Implements AI operations using Claude models
 */

import Anthropic from '@anthropic-ai/sdk';
import { AIProviderInterface, AIMessage, ChatResponse, EmbeddingResponse } from '../ai-service';

export class AnthropicProvider implements AIProviderInterface {
  private client: Anthropic | null = null;
  private apiKey: string = '';
  private model: string = 'claude-3-haiku-20240307';

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    if (apiKey) {
      this.client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
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
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch (error) {
      console.error('Anthropic key validation failed:', error);
      return false;
    }
  }

  getModelName(): string {
    return this.model;
  }

  async chat(messages: AIMessage[], options?: { maxTokens?: number }): Promise<ChatResponse> {
    if (!this.client) {
      throw new Error('Anthropic client not configured');
    }

    try {
      // Separate system message from other messages
      const systemMessage = messages.find(m => m.role === 'system');
      const chatMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || 2048,
        system: systemMessage?.content,
        messages: chatMessages,
      });

      const content = response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : '';
      
      const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      return {
        content,
        tokensUsed,
        model: this.model,
      };
    } catch (error: any) {
      console.error('Anthropic chat error:', error);
      throw new Error(`Anthropic error: ${error.message || 'Unknown error'}`);
    }
  }

  async embed(_text: string): Promise<EmbeddingResponse> {
    // Anthropic doesn't have a public embedding API yet
    // Fall back to a simple approach or throw error
    throw new Error('Anthropic does not support embeddings. Please use OpenAI or Gemini for embedding features.');
  }
}
