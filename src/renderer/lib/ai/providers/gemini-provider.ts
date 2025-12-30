/**
 * Google Gemini Provider
 * Implements AI operations using Google Gemini models
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AIProviderInterface, AIMessage, ChatResponse, EmbeddingResponse } from '../ai-service';

export class GeminiProvider implements AIProviderInterface {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private embeddingModel: GenerativeModel | null = null;
  private apiKey: string = '';
  private modelName: string = 'gemini-1.5-flash';
  private embeddingModelName: string = 'text-embedding-004';

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.modelName });
      this.embeddingModel = this.genAI.getGenerativeModel({ model: this.embeddingModelName });
    } else {
      this.genAI = null;
      this.model = null;
      this.embeddingModel = null;
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.genAI && this.model);
  }

  async validateKey(): Promise<boolean> {
    if (!this.model) return false;
    
    try {
      // Make a minimal API call to validate key
      await this.model.generateContent('Hi');
      return true;
    } catch (error) {
      console.error('Gemini key validation failed:', error);
      return false;
    }
  }

  getModelName(): string {
    return this.modelName;
  }

  async chat(messages: AIMessage[], options?: { maxTokens?: number }): Promise<ChatResponse> {
    if (!this.model) {
      throw new Error('Gemini model not configured');
    }

    try {
      // Convert messages to Gemini format
      // Gemini uses a different format - combine messages into a prompt
      const systemMessage = messages.find(m => m.role === 'system');
      const chatMessages = messages.filter(m => m.role !== 'system');
      
      let prompt = '';
      if (systemMessage) {
        prompt += `System Instructions: ${systemMessage.content}\n\n`;
      }
      
      // Format conversation history
      for (const msg of chatMessages) {
        if (msg.role === 'user') {
          prompt += `User: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          prompt += `Assistant: ${msg.content}\n`;
        }
      }
      prompt += 'Assistant:';

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 2048,
        },
      });

      const response = result.response;
      const content = response.text() || '';
      
      // Gemini doesn't directly expose token count in the same way
      // Estimate based on characters (rough approximation)
      const tokensUsed = Math.ceil((prompt.length + content.length) / 4);

      return {
        content,
        tokensUsed,
        model: this.modelName,
      };
    } catch (error: any) {
      console.error('Gemini chat error:', error);
      throw new Error(`Gemini error: ${error.message || 'Unknown error'}`);
    }
  }

  async embed(text: string): Promise<EmbeddingResponse> {
    if (!this.genAI) {
      throw new Error('Gemini not configured');
    }

    try {
      const embeddingModel = this.genAI.getGenerativeModel({ model: this.embeddingModelName });
      const result = await embeddingModel.embedContent(text);
      
      return {
        embedding: result.embedding.values,
        tokensUsed: Math.ceil(text.length / 4), // Rough estimate
      };
    } catch (error: any) {
      console.error('Gemini embedding error:', error);
      throw new Error(`Gemini embedding error: ${error.message || 'Unknown error'}`);
    }
  }
}
