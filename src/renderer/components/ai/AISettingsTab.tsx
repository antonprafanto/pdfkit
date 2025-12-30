/**
 * AI Settings Tab Component
 * Manages API keys for AI providers, provider selection, and usage stats
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIStore } from '../../store/ai-store';
import { aiService, AIProvider } from '../../lib/ai/ai-service';
import { Button } from '../ui/Button';

interface AISettingsTabProps {
  className?: string;
}

export const AISettingsTab: React.FC<AISettingsTabProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const {
    apiKeys,
    selectedProvider,
    tokenUsage,
    setApiKey,
    setSelectedProvider,
  } = useAIStore();

  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
  });

  const [validationStatus, setValidationStatus] = useState<{
    [key in AIProvider]?: 'idle' | 'validating' | 'valid' | 'invalid';
  }>({});

  const [tempKeys, setTempKeys] = useState({
    openai: apiKeys.openai,
    anthropic: apiKeys.anthropic,
    gemini: apiKeys.gemini,
  });

  const providers: { id: AIProvider; name: string; description: string }[] = [
    { id: 'openai', name: 'OpenAI', description: 'GPT-4o-mini, Embeddings' },
    { id: 'anthropic', name: 'Anthropic', description: 'Claude 3 Haiku' },
    { id: 'gemini', name: 'Google Gemini', description: 'Gemini 1.5 Flash' },
  ];

  const handleKeyChange = (provider: AIProvider, value: string) => {
    setTempKeys((prev) => ({ ...prev, [provider]: value }));
  };

  const handleSaveKey = (provider: AIProvider) => {
    setApiKey(provider, tempKeys[provider]);
    setValidationStatus((prev) => ({ ...prev, [provider]: 'idle' }));
  };

  const handleValidateKey = async (provider: AIProvider) => {
    if (!tempKeys[provider]) {
      setValidationStatus((prev) => ({ ...prev, [provider]: 'invalid' }));
      return;
    }

    setValidationStatus((prev) => ({ ...prev, [provider]: 'validating' }));
    
    // Temporarily set the key for validation
    aiService.setApiKey(provider, tempKeys[provider]);
    const originalProvider = aiService.getProvider();
    aiService.setProvider(provider);

    try {
      const isValid = await aiService.validateKey();
      setValidationStatus((prev) => ({
        ...prev,
        [provider]: isValid ? 'valid' : 'invalid',
      }));
      
      if (isValid) {
        // Save the key if validation passed
        setApiKey(provider, tempKeys[provider]);
      }
    } catch (error) {
      setValidationStatus((prev) => ({ ...prev, [provider]: 'invalid' }));
    }

    // Restore original provider
    aiService.setProvider(originalProvider);
  };

  const toggleShowKey = (provider: AIProvider) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'validating':
        return 'text-yellow-500';
      case 'valid':
        return 'text-green-500';
      case 'invalid':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'validating':
        return t('ai.validating', 'Validating...');
      case 'valid':
        return t('ai.valid', '✓ Valid');
      case 'invalid':
        return t('ai.invalid', '✗ Invalid');
      default:
        return '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Provider Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">
          {t('ai.selectedProvider', 'Active AI Provider')}
        </label>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name} ({provider.description})
            </option>
          ))}
        </select>
      </div>

      {/* API Keys */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
          {t('ai.apiKeys', 'API Keys')}
        </h3>

        {providers.map((provider) => (
          <div key={provider.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                {provider.name}
              </label>
              <span className={`text-xs ${getStatusColor(validationStatus[provider.id])}`}>
                {getStatusText(validationStatus[provider.id])}
              </span>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKeys[provider.id] ? 'text' : 'password'}
                  value={tempKeys[provider.id]}
                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                  placeholder={`${provider.name} API Key`}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(provider.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKeys[provider.id] ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleValidateKey(provider.id)}
                disabled={validationStatus[provider.id] === 'validating' || !tempKeys[provider.id]}
                className="whitespace-nowrap"
              >
                {validationStatus[provider.id] === 'validating' ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                ) : (
                  t('ai.testKey', 'Test')
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {provider.id === 'openai' && (
                <>
                  🔗 <a 
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.electronAPI?.openExternal('https://platform.openai.com/api-keys');
                    }}
                  >
                    platform.openai.com/api-keys
                  </a>
                  <span className="block mt-1 text-muted-foreground/70">
                    {t('ai.openaiSteps', 'Sign up → Dashboard → API Keys → Create new secret key')}
                  </span>
                </>
              )}
              {provider.id === 'anthropic' && (
                <>
                  🔗 <a 
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.electronAPI?.openExternal('https://console.anthropic.com/settings/keys');
                    }}
                  >
                    console.anthropic.com/settings/keys
                  </a>
                  <span className="block mt-1 text-muted-foreground/70">
                    {t('ai.anthropicSteps', 'Sign up → Settings → API Keys → Create Key')}
                  </span>
                </>
              )}
              {provider.id === 'gemini' && (
                <>
                  🔗 <a 
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.electronAPI?.openExternal('https://aistudio.google.com/app/apikey');
                    }}
                  >
                    aistudio.google.com/app/apikey
                  </a>
                  <span className="block mt-1 text-muted-foreground/70">
                    {t('ai.geminiSteps', 'Sign in with Google → Get API key → Create API key')}
                  </span>
                </>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Usage Statistics */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
          {t('ai.usage', 'Token Usage')}
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">{t('ai.todayUsage', 'Today')}</p>
            <p className="text-2xl font-semibold text-foreground">
              {tokenUsage.today.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{t('ai.tokens', 'tokens')}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">{t('ai.totalUsage', 'All Time')}</p>
            <p className="text-2xl font-semibold text-foreground">
              {tokenUsage.total.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{t('ai.tokens', 'tokens')}</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 {t('ai.byokInfo', 'You use your own API keys (BYOK). We never store or send your keys to any server.')}
        </p>
      </div>
    </div>
  );
};
