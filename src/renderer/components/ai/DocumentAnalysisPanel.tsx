/**
 * Document Analysis Panel
 * UI for summarization, key points, categorization, and translation
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '../ui/Button';
import { useAIStore } from '../../store/ai-store';
import {
  analysisService,
  SummaryLength,
  SupportedLanguage,
  AnalysisResult,
} from '../../lib/ai/analysis-service';

interface DocumentAnalysisPanelProps {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  documentId: string;
}

type AnalysisType = 'summary' | 'keypoints' | 'category' | 'translate';

export const DocumentAnalysisPanel: React.FC<DocumentAnalysisPanelProps> = ({
  pdfDocument,
  documentId,
}) => {
  const { t, i18n } = useTranslation();
  const { apiKeys, selectedProvider, isProcessing, setProcessing, setError } = useAIStore();

  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [targetLanguage, setTargetLanguage] = useState<SupportedLanguage>('id');
  const [results, setResults] = useState<{
    summary?: AnalysisResult;
    keypoints?: AnalysisResult;
    category?: { result: AnalysisResult; category: any };
    translation?: AnalysisResult;
  }>({});
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType | null>(null);

  const isAIConfigured = Boolean(apiKeys[selectedProvider]);
  const languages = analysisService.getSupportedLanguages();

  const handleAnalysis = async (type: AnalysisType) => {
    if (!pdfDocument || !isAIConfigured) return;

    setActiveAnalysis(type);
    setProcessing(true);
    setError(null);

    try {
      switch (type) {
        case 'summary': {
          // Pass current app language for AI output
          const appLanguage = i18n.language === 'id' ? 'Indonesian' : 'English';
          const result = await analysisService.summarize(
            pdfDocument,
            documentId,
            summaryLength,
            appLanguage
          );
          setResults((prev) => ({ ...prev, summary: result }));
          break;
        }
        case 'keypoints': {
          // Pass current app language for AI output
          const keyPointsLanguage = i18n.language === 'id' ? 'Indonesian' : 'English';
          const result = await analysisService.extractKeyPoints(pdfDocument, documentId, keyPointsLanguage);
          setResults((prev) => ({ ...prev, keypoints: result }));
          break;
        }
        case 'category': {
          const result = await analysisService.categorize(pdfDocument, documentId);
          setResults((prev) => ({ ...prev, category: result }));
          break;
        }
        case 'translate': {
          const result = await analysisService.translate(
            pdfDocument,
            documentId,
            targetLanguage
          );
          setResults((prev) => ({ ...prev, translation: result }));
          break;
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setProcessing(false);
      setActiveAnalysis(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isAIConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t('ai.configureFirst', 'Configure AI First')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('ai.configureHint', 'Go to Settings → AI to add your API key')}
        </p>
      </div>
    );
  }

  if (!pdfDocument) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {t('ai.openDocument', 'Open a PDF Document')}
        </h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Summary Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            📝 {t('ai.summarize', 'Summarize')}
          </h3>
          <div className="flex gap-2">
            <select
              value={summaryLength}
              onChange={(e) => setSummaryLength(e.target.value as SummaryLength)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm"
            >
              <option value="short">{t('ai.short', 'Short (2-3 sentences)')}</option>
              <option value="medium">{t('ai.medium', 'Medium (1-2 paragraphs)')}</option>
              <option value="long">{t('ai.long', 'Long (detailed)')}</option>
            </select>
            <Button
              onClick={() => handleAnalysis('summary')}
              disabled={isProcessing}
              size="sm"
            >
              {activeAnalysis === 'summary' ? '...' : t('ai.generate', 'Generate')}
            </Button>
          </div>
          {results.summary && (
            <div className="p-3 rounded-lg bg-secondary text-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-muted-foreground">
                  {results.summary.tokensUsed} tokens
                </span>
                <button
                  onClick={() => copyToClipboard(results.summary!.content)}
                  className="text-xs text-primary hover:underline"
                >
                  📋 Copy
                </button>
              </div>
              <p className="text-foreground whitespace-pre-wrap">{results.summary.content}</p>
            </div>
          )}
        </section>

        {/* Key Points Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            🎯 {t('ai.keyPoints', 'Key Points')}
          </h3>
          <Button
            onClick={() => handleAnalysis('keypoints')}
            disabled={isProcessing}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {activeAnalysis === 'keypoints' ? '...' : t('ai.extractKeyPoints', 'Extract Key Points')}
          </Button>
          {results.keypoints && (
            <div className="p-3 rounded-lg bg-secondary text-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-muted-foreground">
                  {results.keypoints.tokensUsed} tokens
                </span>
                <button
                  onClick={() => copyToClipboard(results.keypoints!.content)}
                  className="text-xs text-primary hover:underline"
                >
                  📋 Copy
                </button>
              </div>
              <div className="text-foreground whitespace-pre-wrap">{results.keypoints.content}</div>
            </div>
          )}
        </section>

        {/* Category Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            🏷️ {t('ai.categorize', 'Categorize')}
          </h3>
          <Button
            onClick={() => handleAnalysis('category')}
            disabled={isProcessing}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {activeAnalysis === 'category' ? '...' : t('ai.detectCategory', 'Detect Category')}
          </Button>
          {results.category && (
            <div className="p-3 rounded-lg bg-secondary">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded bg-primary text-primary-foreground text-sm font-medium">
                  {results.category.category.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{results.category.category.reason}</p>
            </div>
          )}
        </section>

        {/* Translation Section */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            🌐 {t('ai.translate', 'Translate')}
          </h3>
          <div className="flex gap-2">
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value as SupportedLanguage)}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <Button
              onClick={() => handleAnalysis('translate')}
              disabled={isProcessing}
              size="sm"
            >
              {activeAnalysis === 'translate' ? '...' : t('ai.translateDoc', 'Translate')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('ai.translateNote', 'Translates first 5 pages')}
          </p>
          {results.translation && (
            <div className="p-3 rounded-lg bg-secondary text-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-muted-foreground">
                  {results.translation.tokensUsed} tokens
                </span>
                <button
                  onClick={() => copyToClipboard(results.translation!.content)}
                  className="text-xs text-primary hover:underline"
                >
                  📋 Copy
                </button>
              </div>
              <div className="text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                {results.translation.content}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
