/**
 * Chat with PDF Panel
 * Main UI for RAG-based document Q&A
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '../ui/Button';
import { useAIStore } from '../../store/ai-store';
import { aiService } from '../../lib/ai/ai-service';
import { ragService, RAGResponse, IndexingProgress } from '../../lib/ai/rag-service';

interface ChatWithPDFPanelProps {
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  documentId: string;
  onPageClick?: (pageNumber: number) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { pageNumber: number; text: string; similarity: number }[];
  timestamp: Date;
}

export const ChatWithPDFPanel: React.FC<ChatWithPDFPanelProps> = ({
  pdfDocument,
  documentId,
  onPageClick,
}) => {
  const { t, i18n } = useTranslation();
  const { apiKeys, selectedProvider, isProcessing, setProcessing, setError } = useAIStore();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [indexingProgress, setIndexingProgress] = useState<IndexingProgress | null>(null);
  const [isIndexed, setIsIndexed] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'search'>('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if AI is configured
  const isAIConfigured = Boolean(apiKeys[selectedProvider]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if document is already indexed
  useEffect(() => {
    if (documentId && ragService.getDocumentId() === documentId) {
      setIsIndexed(ragService.isDocumentIndexed());
    } else {
      setIsIndexed(false);
      setMessages([]);
    }
  }, [documentId]);

  const handleIndexDocument = async () => {
    if (!pdfDocument || !isAIConfigured) return;

    setProcessing(true);
    setError(null);

    try {
      await ragService.indexDocument(
        pdfDocument,
        documentId,
        (progress) => setIndexingProgress(progress)
      );
      setIsIndexed(true);
      setIndexingProgress(null);
    } catch (error: any) {
      setError(error.message);
      setIndexingProgress(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing || !isIndexed) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setProcessing(true);
    setError(null);

    try {
      // Build conversation history for context
      const history = messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Pass app language for AI response
      const appLanguage = i18n.language === 'id' ? 'Indonesian' : 'English';
      const response = await ragService.query(userMessage.content, history, appLanguage);

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      setError(error.message);
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `Error: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim() || !isIndexed) return;

    setProcessing(true);
    try {
      const results = await ragService.semanticSearch(searchQuery, 10);
      setSearchResults(results);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Not configured state
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
        <p className="text-sm text-muted-foreground mb-4">
          {t('ai.configureHint', 'Go to Settings → AI to add your API key')}
        </p>
      </div>
    );
  }

  // No document state
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
        <p className="text-sm text-muted-foreground">
          {t('ai.openDocumentHint', 'Open a PDF to start chatting with it')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'chat'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          💬 {t('ai.chat', 'Chat')}
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'search'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary'
          }`}
        >
          🔍 {t('ai.search', 'Search')}
        </button>
      </div>

      {/* Indexing required state */}
      {!isIndexed && !indexingProgress && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t('ai.indexDocument', 'Index Document')}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('ai.indexHint', 'Index the document to enable AI chat and search')}
          </p>
          <Button onClick={handleIndexDocument} disabled={isProcessing}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('ai.startIndexing', 'Start Indexing')}
          </Button>
        </div>
      )}

      {/* Indexing progress */}
      {indexingProgress && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-xs">
            <div className="mb-4 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">
                {indexingProgress.message}
              </p>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{
                  width: `${(indexingProgress.current / indexingProgress.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {indexingProgress.current} / {indexingProgress.total}
            </p>
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {isIndexed && activeTab === 'chat' && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <p>💬 {t('ai.startChatting', 'Start chatting with your document!')}</p>
                <p className="mt-2 text-xs">{t('ai.askAnything', 'Ask any question about the content')}</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs opacity-75 mb-1">📄 {t('ai.sources', 'Sources')}:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.sources.map((source, idx) => (
                          <button
                            key={idx}
                            onClick={() => onPageClick?.(source.pageNumber)}
                            className="text-xs px-2 py-0.5 rounded bg-background/50 hover:bg-background transition-colors"
                            title={source.text}
                          >
                            Page {source.pageNumber}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animation-delay-200" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animation-delay-400" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t('ai.thinking', 'Thinking...')}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('ai.askQuestion', 'Ask a question about the document...')}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={2}
                disabled={isProcessing}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                className="self-end"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Search Tab */}
      {isIndexed && activeTab === 'search' && (
        <>
          <div className="p-3 border-b border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                placeholder={t('ai.semanticSearch', 'Search by meaning...')}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isProcessing}
              />
              <Button onClick={handleSemanticSearch} disabled={isProcessing || !searchQuery.trim()}>
                🔍
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {searchResults.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm">
                {t('ai.searchHint', 'Enter a query to search by meaning, not just keywords')}
              </p>
            ) : (
              searchResults.map((result, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors"
                  onClick={() => onPageClick?.(result.document.metadata.pageNumber)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary">
                      Page {result.document.metadata.pageNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(result.similarity * 100).toFixed(1)}% match
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-3">
                    {result.document.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
