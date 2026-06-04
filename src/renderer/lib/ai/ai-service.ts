/**
 * AI Service - Main AI orchestration layer
 * Provides unified interface for multiple AI providers
 */

import { OpenAIProvider } from './providers/openai-provider';
import { AnthropicProvider } from './providers/anthropic-provider';
import { GeminiProvider } from './providers/gemini-provider';

export type AIProvider = 'openai' | 'anthropic' | 'gemini';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  tokensUsed: number;
}

export interface SummaryOptions {
  length: 'short' | 'medium' | 'long';
  language?: string;
}

export interface TranslationOptions {
  targetLanguage: string;
  preserveFormatting?: boolean;
}

export interface AIProviderInterface {
  chat(messages: AIMessage[], options?: { maxTokens?: number }): Promise<ChatResponse>;
  embed(text: string): Promise<EmbeddingResponse>;
  isConfigured(): boolean;
  validateKey(): Promise<boolean>;
  getModelName(): string;
}

class AIService {
  private providers: Map<AIProvider, AIProviderInterface> = new Map();
  private currentProvider: AIProvider = 'openai';

  constructor() {
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('gemini', new GeminiProvider());
  }

  /**
   * Set API key for a provider
   */
  setApiKey(provider: AIProvider, apiKey: string): void {
    const providerInstance = this.providers.get(provider);
    if (providerInstance && 'setApiKey' in providerInstance) {
      (providerInstance as any).setApiKey(apiKey);
    }
  }

  /**
   * Set the active provider
   */
  setProvider(provider: AIProvider): void {
    this.currentProvider = provider;
  }

  /**
   * Get current provider
   */
  getProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Get provider instance
   */
  private getProviderInstance(): AIProviderInterface {
    const provider = this.providers.get(this.currentProvider);
    if (!provider) {
      throw new Error(`Provider ${this.currentProvider} not found`);
    }
    return provider;
  }

  /**
   * Check if current provider is configured
   */
  isConfigured(): boolean {
    return this.getProviderInstance().isConfigured();
  }

  /**
   * Validate API key for current provider
   */
  async validateKey(): Promise<boolean> {
    return this.getProviderInstance().validateKey();
  }

  /**
   * Send chat message
   */
  async chat(messages: AIMessage[], options?: { maxTokens?: number }): Promise<ChatResponse> {
    if (!this.isConfigured()) {
      throw new Error(`Please configure API key for ${this.currentProvider}`);
    }
    return this.getProviderInstance().chat(messages, options);
  }

  /**
   * Generate embeddings for text
   */
  async embed(text: string): Promise<EmbeddingResponse> {
    if (!this.isConfigured()) {
      throw new Error(`Please configure API key for ${this.currentProvider}`);
    }
    return this.getProviderInstance().embed(text);
  }

  /**
   * Summarize text
   */
  async summarize(text: string, options: SummaryOptions = { length: 'medium' }): Promise<ChatResponse> {
    const lengthInstructions = {
      short: 'Provide a very brief summary in 2-3 sentences.',
      medium: 'Provide a comprehensive summary in 1-2 paragraphs.',
      long: 'Provide a detailed summary covering all main points.',
    };

    const systemPrompt = `You are a document summarization assistant. ${lengthInstructions[options.length]} ${options.language ? `Respond in ${options.language}.` : ''}`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please summarize the following text:\n\n${text}` },
    ]);
  }

  /**
   * Extract key points from text
   */
  async extractKeyPoints(text: string, language?: string): Promise<ChatResponse> {
    const systemPrompt = `You are an information extraction assistant. Extract the key points and important information from the provided text. Format as a bulleted list. ${language ? `Respond in ${language}.` : ''}`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Extract key points from:\n\n${text}` },
    ]);
  }

  /**
   * Categorize document
   */
  async categorize(text: string): Promise<ChatResponse> {
    const systemPrompt = `You are a document classification assistant. Classify the document into one of these categories: Legal, Financial, Technical, Academic, Business, Personal, Medical, Government, or Other. Provide only the category name and a brief reason.`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Classify this document:\n\n${text.substring(0, 2000)}` },
    ]);
  }

  /**
   * Translate text
   */
  async translate(text: string, options: TranslationOptions): Promise<ChatResponse> {
    const systemPrompt = `You are a professional translator. Translate the following text to ${options.targetLanguage}. ${options.preserveFormatting ? 'Preserve the original formatting.' : ''} Only provide the translation, no explanations.`;

    return this.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ]);
  }

  /**
   * Answer question about document with context
   */
  async answerWithContext(
    question: string,
    context: string,
    conversationHistory: AIMessage[] = [],
    language?: string
  ): Promise<ChatResponse> {
    const languageInstruction = language ? `Always respond in ${language}.` : '';
    const systemPrompt = `You are a helpful assistant answering questions about a PDF document. Use ONLY the provided context to answer. If the answer is not in the context, say "I couldn't find that information in the document." Always cite the page numbers when possible. ${languageInstruction}`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: `Context from document:\n${context}\n\nQuestion: ${question}` },
    ];

    return this.chat(messages);
  }

  /**
   * Get model name for current provider
   */
  getModelName(): string {
    return this.getProviderInstance().getModelName();
  }
}

// Singleton instance
export const aiService = new AIService();
