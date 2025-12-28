/**
 * Environment Variables Utility
 * Provides type-safe access to environment variables
 */

export const ENV = {
  // App Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',

  // Development Settings
  VITE_DEV_PORT: parseInt(process.env.VITE_DEV_PORT || '5173', 10),
  ELECTRON_DEV_TOOLS: process.env.ELECTRON_DEV_TOOLS === 'true',

  // Connectivity Check URLs
  CONNECTIVITY_CHECK_URLS: [
    process.env.CONNECTIVITY_CHECK_URL_1 || 'https://www.google.com',
    process.env.CONNECTIVITY_CHECK_URL_2 || 'https://www.cloudflare.com',
    process.env.CONNECTIVITY_CHECK_URL_3 || 'https://1.1.1.1',
  ],

  // Feature Flags
  FEATURES: {
    AI_ENABLED: process.env.FEATURE_AI_ENABLED !== 'false',
    OCR_ENABLED: process.env.FEATURE_OCR_ENABLED !== 'false',
    PLUGINS_ENABLED: process.env.FEATURE_PLUGINS_ENABLED !== 'false',
  },
} as const;

// Type for feature flags
export type FeatureFlags = typeof ENV.FEATURES;

// Helper to check if a feature is enabled
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return ENV.FEATURES[feature];
}
