import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAIProvider } from './openai-provider';

const modelsListMock = vi.fn();
const chatCompletionsCreateMock = vi.fn();
const embeddingsCreateMock = vi.fn();
const constructorOptions: Array<Record<string, unknown>> = [];

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation((options: Record<string, unknown>) => {
      constructorOptions.push(options);
      return {
        models: { list: modelsListMock },
        chat: { completions: { create: chatCompletionsCreateMock } },
        embeddings: { create: embeddingsCreateMock },
      };
    }),
  };
});

describe('OpenAIProvider', () => {
  beforeEach(() => {
    constructorOptions.length = 0;
    modelsListMock.mockReset();
    chatCompletionsCreateMock.mockReset();
    embeddingsCreateMock.mockReset();
  });

  it('uses default OpenAI endpoint when setting API key', () => {
    const provider = new OpenAIProvider();

    provider.setApiKey('test-key');

    expect(constructorOptions[0]).toMatchObject({
      apiKey: 'test-key',
      baseURL: 'https://api.openai.com/v1',
      defaultHeaders: {},
      dangerouslyAllowBrowser: true,
    });
  });

  it('applies custom endpoint, model, and headers for OpenAI-compatible providers', () => {
    const provider = new OpenAIProvider({ providerName: 'OpenAI-compatible' });

    provider.setConfig({
      baseURL: 'https://openrouter.ai/api/v1',
      model: 'openrouter/auto',
      customHeaders: {
        Authorization: '******',
        'HTTP-Referer': 'https://example.com',
      },
    });
    provider.setApiKey('test-key');

    expect(provider.getModelName()).toBe('openrouter/auto');
    expect(constructorOptions[0]).toMatchObject({
      apiKey: 'test-key',
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        Authorization: '******',
        'HTTP-Referer': 'https://example.com',
      },
    });
  });

  it('recreates client with updated config after API key is set', () => {
    const provider = new OpenAIProvider();

    provider.setApiKey('test-key');
    provider.setConfig({
      baseURL: 'https://custom.internal/v1',
      customHeaders: { 'X-Proxy': 'enabled' },
    });

    expect(constructorOptions).toHaveLength(2);
    expect(constructorOptions[1]).toMatchObject({
      baseURL: 'https://custom.internal/v1',
      defaultHeaders: { 'X-Proxy': 'enabled' },
    });
  });

  it('returns false when key validation fails', async () => {
    const provider = new OpenAIProvider();
    modelsListMock.mockRejectedValueOnce(new Error('unauthorized'));

    provider.setApiKey('test-key');

    await expect(provider.validateKey()).resolves.toBe(false);
  });
});
