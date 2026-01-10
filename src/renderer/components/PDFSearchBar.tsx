/**
 * PDF Search Bar Component
 * Search for text within the PDF document
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { PDFDocumentProxy } from '../lib/pdf-config';
import { pdfService } from '../lib/pdf-service';
import { SearchHighlight } from './PDFPage';
import { Spinner } from './ui';

interface SearchResult {
  pageNumber: number;
  text: string;
  matchIndex: number;
}

interface PDFSearchBarProps {
  document: PDFDocumentProxy | null;
  scale: number;
  rotation: number;
  onResultSelect: (pageNumber: number) => void;
  onHighlightsChange: (highlights: SearchHighlight[]) => void;
}

export function PDFSearchBar({ document, scale, rotation, onResultSelect, onHighlightsChange }: PDFSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Ref for auto-focus
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Debounced live search - triggers 400ms after user stops typing
  useEffect(() => {
    if (!document || !searchQuery.trim() || searchQuery.length < 2) {
      return;
    }
    
    const debounceTimer = setTimeout(() => {
      handleSearchInternal();
    }, 400);
    
    return () => clearTimeout(debounceTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, document]);

  const handleSearchInternal = useCallback(async () => {
    if (!document || !searchQuery.trim()) return;

    setIsSearching(true);
    setResults([]);
    setCurrentResultIndex(0);

    try {
      const foundResults: SearchResult[] = [];
      const highlights: SearchHighlight[] = [];

      // Search through all pages
      for (let pageNum = 1; pageNum <= document.numPages; pageNum++) {
        const text = await pdfService.extractTextFromPage(document, pageNum);
        const lowerText = text.toLowerCase();
        const lowerQuery = searchQuery.toLowerCase();

        let index = lowerText.indexOf(lowerQuery);
        let matchCount = 0;

        while (index !== -1) {
          // Get context around the match (30 chars before and after)
          const start = Math.max(0, index - 30);
          const end = Math.min(text.length, index + searchQuery.length + 30);
          const context = text.substring(start, end);

          foundResults.push({
            pageNumber: pageNum,
            text: context,
            matchIndex: matchCount,
          });

          matchCount++;
          index = lowerText.indexOf(lowerQuery, index + 1);
        }

        // Get highlight coordinates for this page
        if (matchCount > 0) {
          const rects = await pdfService.searchTextWithCoordinates(
            document,
            pageNum,
            searchQuery,
            scale,
            rotation
          );

          if (rects.length > 0) {
            highlights.push({
              pageNumber: pageNum,
              rects,
            });
          }
        }
      }

      setResults(foundResults);
      setShowResults(foundResults.length > 0);
      onHighlightsChange(highlights);

      // Jump to first result
      if (foundResults.length > 0) {
        onResultSelect(foundResults[0].pageNumber);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [document, searchQuery, scale, rotation, onHighlightsChange, onResultSelect]);
  
  // Manual search handler (for Enter key)
  const handleSearch = () => {
    handleSearchInternal();
  };

  const goToNextResult = () => {
    if (results.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % results.length;
    setCurrentResultIndex(nextIndex);
    onResultSelect(results[nextIndex].pageNumber);
  };

  const goToPreviousResult = () => {
    if (results.length === 0) return;
    const prevIndex = (currentResultIndex - 1 + results.length) % results.length;
    setCurrentResultIndex(prevIndex);
    onResultSelect(results[prevIndex].pageNumber);
  };

  return (
    <div className="absolute top-2 right-2 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Compact search bar */}
      <div className="flex items-center gap-1 p-2">
        {/* Search icon */}
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        
        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
            if (e.key === 'Escape') {
              setResults([]);
              setSearchQuery('');
              setShowResults(false);
              onHighlightsChange([]);
            }
          }}
          disabled={!document || isSearching}
          className="flex-1 px-2 py-1 text-sm bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
        />
        
        {/* Loading indicator */}
        {isSearching && <Spinner size="sm" />}
        
        {/* Results counter */}
        {results.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {currentResultIndex + 1}/{results.length}
          </span>
        )}
        
        {/* Navigation buttons */}
        {results.length > 0 && (
          <>
            <button
              onClick={goToPreviousResult}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Previous (↑)"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={goToNextResult}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Next (↓)"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </>
        )}
        
        {/* Close button */}
        {(searchQuery || results.length > 0) && (
          <button
            onClick={() => {
              setResults([]);
              setSearchQuery('');
              setShowResults(false);
              onHighlightsChange([]);
            }}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Clear (Esc)"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Collapsible results list */}
      {showResults && results.length > 0 && (
        <div className="max-h-40 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
          {results.slice(0, 20).map((result, index) => (
            <button
              key={`${result.pageNumber}-${index}`}
              onClick={() => {
                setCurrentResultIndex(index);
                onResultSelect(result.pageNumber);
              }}
              className={`w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                index === currentResultIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="font-medium">P{result.pageNumber}</span>
              <span className="ml-2 truncate">{result.text.substring(0, 50)}...</span>
            </button>
          ))}
          {results.length > 20 && (
            <div className="px-3 py-1.5 text-xs text-gray-400 text-center">
              +{results.length - 20} more results
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {showResults && results.length === 0 && !isSearching && searchQuery.length >= 2 && (
        <div className="px-3 py-2 text-center border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">No results found</p>
        </div>
      )}
    </div>
  );

}
