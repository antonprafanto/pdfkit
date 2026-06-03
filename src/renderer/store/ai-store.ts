/**
 * AI Store - State management for AI features
 * Stores API keys, provider selection, token usage, and conversations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AIProvider,
  AIMessage,
  OpenAICompatibleConfig,
  aiService,
} from '../lib/ai/ai-service';

export interface Conversation {
  id: string;
  title: string;
  messages: AIMessage[];
  documentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OpenAICompatibleProfile {
  id: string;
  name: string;
  apiKey: string;
  config: OpenAICompatibleConfig;
}

interface TokenUsage {
  total: number;
  today: number;
  lastReset: string; // ISO date string
}

const defaultOpenAICompatibleConfig: OpenAICompatibleConfig = {
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  customHeaders: {},
};

const defaultOpenAICompatibleProfileId = 'default-openai-compatible';

const cloneOpenAICompatibleConfig = (config: OpenAICompatibleConfig): OpenAICompatibleConfig => ({
  ...config,
  customHeaders: { ...config.customHeaders },
});

const createOpenAICompatibleProfile = (
  name: string,
  apiKey: string,
  config: OpenAICompatibleConfig
): OpenAICompatibleProfile => ({
  id: `openai-compatible-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: name.trim(),
  apiKey,
  config: cloneOpenAICompatibleConfig(config),
});

const defaultOpenAICompatibleProfile: OpenAICompatibleProfile = {
  id: defaultOpenAICompatibleProfileId,
  name: 'Default',
  apiKey: '',
  config: cloneOpenAICompatibleConfig(defaultOpenAICompatibleConfig),
};

interface AIState {
  // API Keys (stored encrypted in localStorage via persist)
  apiKeys: {
    openai: string;
    openaiCompatible: string;
    anthropic: string;
    gemini: string;
  };

  // Provider settings
  selectedProvider: AIProvider;
  openaiCompatibleConfig: OpenAICompatibleConfig;
  openaiCompatibleProfiles: OpenAICompatibleProfile[];
  selectedOpenAICompatibleProfileId: string;

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
  setOpenAICompatibleConfig: (config: Partial<OpenAICompatibleConfig>) => void;
  saveOpenAICompatibleProfile: (
    name: string,
    payload: { apiKey: string; config: OpenAICompatibleConfig }
  ) => string;
  updateOpenAICompatibleProfile: (
    id: string,
    payload: { name: string; apiKey: string; config: OpenAICompatibleConfig }
  ) => void;
  setSelectedOpenAICompatibleProfile: (id: string) => void;
  deleteOpenAICompatibleProfile: (id: string) => void;
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
        openaiCompatible: defaultOpenAICompatibleProfile.apiKey,
        anthropic: '',
        gemini: '',
      },
      selectedProvider: 'openai',
      openaiCompatibleConfig: cloneOpenAICompatibleConfig(defaultOpenAICompatibleProfile.config),
      openaiCompatibleProfiles: [defaultOpenAICompatibleProfile],
      selectedOpenAICompatibleProfileId: defaultOpenAICompatibleProfile.id,
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
          openaiCompatibleProfiles:
            provider === 'openaiCompatible'
              ? state.openaiCompatibleProfiles.map((profile) =>
                  profile.id === state.selectedOpenAICompatibleProfileId
                    ? { ...profile, apiKey: key }
                    : profile
                )
              : state.openaiCompatibleProfiles,
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

        if (provider === 'openaiCompatible') {
          aiService.setOpenAIConfig('openaiCompatible', get().openaiCompatibleConfig);
        }
      },

      setOpenAICompatibleConfig: (config) => {
        const currentConfig = get().openaiCompatibleConfig;
        const nextConfig = {
          ...currentConfig,
          ...config,
          customHeaders: {
            ...currentConfig.customHeaders,
            ...(config.customHeaders || {}),
          },
        };

        set((state) => ({
          openaiCompatibleConfig: nextConfig,
          openaiCompatibleProfiles: state.openaiCompatibleProfiles.map((profile) =>
            profile.id === state.selectedOpenAICompatibleProfileId
              ? {
                  ...profile,
                  config: cloneOpenAICompatibleConfig(nextConfig),
                }
              : profile
          ),
        }));
        aiService.setOpenAIConfig('openaiCompatible', nextConfig);
      },

      saveOpenAICompatibleProfile: (name, payload) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
          return '';
        }

        const newProfile = createOpenAICompatibleProfile(trimmedName, payload.apiKey, payload.config);

        set((state) => ({
          openaiCompatibleProfiles: [...state.openaiCompatibleProfiles, newProfile],
          selectedOpenAICompatibleProfileId: newProfile.id,
          openaiCompatibleConfig: cloneOpenAICompatibleConfig(newProfile.config),
          apiKeys: {
            ...state.apiKeys,
            openaiCompatible: newProfile.apiKey,
          },
        }));

        aiService.setOpenAIConfig('openaiCompatible', newProfile.config);
        aiService.setApiKey('openaiCompatible', newProfile.apiKey);

        return newProfile.id;
      },

      updateOpenAICompatibleProfile: (id, payload) => {
        const trimmedName = payload.name.trim();
        if (!trimmedName) {
          return;
        }

        let updatedProfile: OpenAICompatibleProfile | undefined;
        set((state) => {
          const existing = state.openaiCompatibleProfiles.find((profile) => profile.id === id);
          if (!existing) {
            return state;
          }

          updatedProfile = {
            ...existing,
            name: trimmedName,
            apiKey: payload.apiKey,
            config: cloneOpenAICompatibleConfig(payload.config),
          };

          return {
            openaiCompatibleProfiles: state.openaiCompatibleProfiles.map((profile) =>
              profile.id === id ? (updatedProfile as OpenAICompatibleProfile) : profile
            ),
            selectedOpenAICompatibleProfileId: id,
            openaiCompatibleConfig: cloneOpenAICompatibleConfig(updatedProfile.config),
            apiKeys: {
              ...state.apiKeys,
              openaiCompatible: payload.apiKey,
            },
          };
        });

        if (updatedProfile) {
          aiService.setOpenAIConfig('openaiCompatible', updatedProfile.config);
          aiService.setApiKey('openaiCompatible', updatedProfile.apiKey);
        }
      },

      setSelectedOpenAICompatibleProfile: (id) => {
        const profile = get().openaiCompatibleProfiles.find((item) => item.id === id);
        if (!profile) {
          return;
        }

        set((state) => ({
          selectedOpenAICompatibleProfileId: id,
          openaiCompatibleConfig: cloneOpenAICompatibleConfig(profile.config),
          apiKeys: {
            ...state.apiKeys,
            openaiCompatible: profile.apiKey,
          },
        }));

        aiService.setOpenAIConfig('openaiCompatible', profile.config);
        aiService.setApiKey('openaiCompatible', profile.apiKey);
      },

      deleteOpenAICompatibleProfile: (id) => {
        set((state) => {
          if (state.openaiCompatibleProfiles.length <= 1) {
            return state;
          }

          const remaining = state.openaiCompatibleProfiles.filter((profile) => profile.id !== id);
          if (remaining.length === state.openaiCompatibleProfiles.length) {
            return state;
          }

          const nextSelectedId =
            state.selectedOpenAICompatibleProfileId === id
              ? remaining[0].id
              : state.selectedOpenAICompatibleProfileId;
          const selectedProfile =
            remaining.find((profile) => profile.id === nextSelectedId) || remaining[0];

          return {
            openaiCompatibleProfiles: remaining,
            selectedOpenAICompatibleProfileId: selectedProfile.id,
            openaiCompatibleConfig: cloneOpenAICompatibleConfig(selectedProfile.config),
            apiKeys: {
              ...state.apiKeys,
              openaiCompatible: selectedProfile.apiKey,
            },
          };
        });

        const nextSelected = get().openaiCompatibleProfiles.find(
          (profile) => profile.id === get().selectedOpenAICompatibleProfileId
        );
        if (nextSelected) {
          aiService.setOpenAIConfig('openaiCompatible', nextSelected.config);
          aiService.setApiKey('openaiCompatible', nextSelected.apiKey);
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
                  title:
                    conv.messages.length === 0 && message.role === 'user'
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
            state.activeConversationId === conversationId ? null : state.activeConversationId,
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
        openaiCompatibleConfig: state.openaiCompatibleConfig,
        openaiCompatibleProfiles: state.openaiCompatibleProfiles,
        selectedOpenAICompatibleProfileId: state.selectedOpenAICompatibleProfileId,
        tokenUsage: state.tokenUsage,
        // Don't persist conversations to keep localStorage small
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AIState>;
        const persistedProfiles = (persisted.openaiCompatibleProfiles || []).map((profile) => ({
          ...profile,
          config: {
            ...defaultOpenAICompatibleConfig,
            ...(profile.config || {}),
            customHeaders: {
              ...defaultOpenAICompatibleConfig.customHeaders,
              ...(profile.config?.customHeaders || {}),
            },
          },
        }));
        const mergedProfiles = persistedProfiles.length
          ? persistedProfiles
          : [
              {
                id: defaultOpenAICompatibleProfileId,
                name: 'Default',
                apiKey: persisted.apiKeys?.openaiCompatible || '',
                config: {
                  ...defaultOpenAICompatibleConfig,
                  ...(persisted.openaiCompatibleConfig || {}),
                  customHeaders: {
                    ...defaultOpenAICompatibleConfig.customHeaders,
                    ...(persisted.openaiCompatibleConfig?.customHeaders || {}),
                  },
                },
              },
            ];
        const selectedProfileId = mergedProfiles.some(
          (profile) => profile.id === persisted.selectedOpenAICompatibleProfileId
        )
          ? (persisted.selectedOpenAICompatibleProfileId as string)
          : mergedProfiles[0].id;
        const selectedProfile =
          mergedProfiles.find((profile) => profile.id === selectedProfileId) || mergedProfiles[0];

        return {
          ...currentState,
          ...persisted,
          apiKeys: {
            ...currentState.apiKeys,
            ...(persisted.apiKeys || {}),
            openaiCompatible: selectedProfile.apiKey,
          },
          openaiCompatibleConfig: cloneOpenAICompatibleConfig(selectedProfile.config),
          openaiCompatibleProfiles: mergedProfiles,
          selectedOpenAICompatibleProfileId: selectedProfileId,
        };
      },
    }
  )
);

// Initialize AI service with stored keys on app load
export const initializeAIService = () => {
  const state = useAIStore.getState();
  const {
    apiKeys,
    selectedProvider,
    openaiCompatibleConfig,
    openaiCompatibleProfiles,
    selectedOpenAICompatibleProfileId,
  } = state;
  const selectedCompatibleProfile = openaiCompatibleProfiles.find(
    (profile) => profile.id === selectedOpenAICompatibleProfileId
  );
  const effectiveOpenAICompatibleConfig = selectedCompatibleProfile?.config || openaiCompatibleConfig;
  const effectiveOpenAICompatibleKey = selectedCompatibleProfile?.apiKey || apiKeys.openaiCompatible;

  aiService.setOpenAIConfig('openaiCompatible', effectiveOpenAICompatibleConfig);

  // Set the current provider
  aiService.setProvider(selectedProvider);

  // Set API keys for all providers
  Object.entries({
    ...apiKeys,
    openaiCompatible: effectiveOpenAICompatibleKey,
  }).forEach(([provider, key]) => {
    if (key) {
      aiService.setApiKey(provider as AIProvider, key);
    }
  });
};
