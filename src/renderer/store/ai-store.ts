/**
 * AI Store - State management for AI features
 * Stores API keys, provider selection, token usage, and conversations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIProvider, AIMessage, aiService } from '../lib/ai/ai-service';

export interface Conversation {
  id: string;
  title: string;
  messages: AIMessage[];
  documentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TokenUsage {
  total: number;
  today: number;
  lastReset: string; // ISO date string
}

interface AIState {
  // API Keys (stored encrypted in localStorage via persist)
  apiKeys: {
    openai: string;
    anthropic: string;
    gemini: string;
  };
  
  // Provider settings
  selectedProvider: AIProvider;
  
  // Token tracking
  tokenUsage: TokenUsage;
  
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  
  // Loading states
  isProcessing: boolean;
  lastError: string | null;
  
  // Actions
  setApiKey: (provider: AIProvider, key: string) => void;
  setSelectedProvider: (provider: AIProvider) => void;
  addTokenUsage: (tokens: number) => void;
  resetDailyUsage: () => void;
  
  // Conversation actions
  createConversation: (documentId?: string) => string;
  addMessage: (conversationId: string, message: AIMessage) => void;
  deleteConversation: (conversationId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  clearConversations: () => void;
  
  // Processing states
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      // Initial state
      apiKeys: {
        openai: '',
        anthropic: '',
        gemini: '',
      },
      selectedProvider: 'openai',
      tokenUsage: {
        total: 0,
        today: 0,
        lastReset: new Date().toISOString().split('T')[0],
      },
      conversations: [],
      activeConversationId: null,
      isProcessing: false,
      lastError: null,

      // Set API key for a provider
      setApiKey: (provider, key) => {
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: key },
        }));
        // Also update the AI service
        aiService.setApiKey(provider, key);
      },

      // Set selected provider
      setSelectedProvider: (provider) => {
        set({ selectedProvider: provider });
        aiService.setProvider(provider);
        // Initialize the provider with stored key
        const key = get().apiKeys[provider];
        if (key) {
          aiService.setApiKey(provider, key);
        }
      },

      // Add token usage
      addTokenUsage: (tokens) => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const shouldReset = state.tokenUsage.lastReset !== today;
          
          return {
            tokenUsage: {
              total: state.tokenUsage.total + tokens,
              today: shouldReset ? tokens : state.tokenUsage.today + tokens,
              lastReset: today,
            },
          };
        });
      },

      // Reset daily usage
      resetDailyUsage: () => {
        set((state) => ({
          tokenUsage: {
            ...state.tokenUsage,
            today: 0,
            lastReset: new Date().toISOString().split('T')[0],
          },
        }));
      },

      // Create a new conversation
      createConversation: (documentId) => {
        const id = `conv_${Date.now()}`;
        const newConversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          documentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }));
        
        return id;
      },

      // Add message to conversation
      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: new Date(),
                  // Update title from first user message
                  title: conv.messages.length === 0 && message.role === 'user'
                    ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
                    : conv.title,
                }
              : conv
          ),
        }));
      },

      // Delete conversation
      deleteConversation: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== conversationId),
          activeConversationId:
            state.activeConversationId === conversationId
              ? null
              : state.activeConversationId,
        }));
      },

      // Set active conversation
      setActiveConversation: (conversationId) => {
        set({ activeConversationId: conversationId });
      },

      // Clear all conversations
      clearConversations: () => {
        set({ conversations: [], activeConversationId: null });
      },

      // Set processing state
      setProcessing: (isProcessing) => {
        set({ isProcessing });
      },

      // Set error
      setError: (error) => {
        set({ lastError: error });
      },
    }),
    {
      name: 'ai-storage',
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        selectedProvider: state.selectedProvider,
        tokenUsage: state.tokenUsage,
        // Don't persist conversations to keep localStorage small
      }),
    }
  )
);

// Initialize AI service with stored keys on app load
export const initializeAIService = () => {
  const state = useAIStore.getState();
  const { apiKeys, selectedProvider } = state;
  
  // Set the current provider
  aiService.setProvider(selectedProvider);
  
  // Set API keys for all providers
  Object.entries(apiKeys).forEach(([provider, key]) => {
    if (key) {
      aiService.setApiKey(provider as AIProvider, key);
    }
  });
};
