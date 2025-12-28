/**
 * PDF Search Bar Component
 * Search for text within the PDF document
 */

import { useState } from 'react';
import { PDFDocumentProxy } from '../lib/pdf-config';
import { pdfService } from '../lib/pdf-service';
import { SearchHighlight } from './PDFPage';
import { Button, Input, Spinner } from './ui';

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

  const handleSearch = async () => {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2 p-2">
        {/* Search input */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!document || isSearching}
          />
        </div>

        {/* Search button */}
        <Button size="sm" onClick={handleSearch} disabled={!document || isSearching || !searchQuery.trim()}>
          {isSearching ? <Spinner size="sm" /> : 'Search'}
        </Button>

        {/* Results navigation */}
        {results.length > 0 && (
          <>
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <span>
                {currentResultIndex + 1} / {results.length}
              </span>
            </div>

            <Button size="sm" variant="outline" onClick={goToPreviousResult} title="Previous result">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>

            <Button size="sm" variant="outline" onClick={goToNextResult} title="Next result">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setResults([]);
                setSearchQuery('');
                setShowResults(false);
                onHighlightsChange([]);
              }}
              title="Clear search"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
          {results.map((result, index) => (
            <button
              key={`${result.pageNumber}-${index}`}
              onClick={() => {
                setCurrentResultIndex(index);
                onResultSelect(result.pageNumber);
              }}
              className={`w-full border-b border-gray-100 p-2 text-left text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                index === currentResultIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Page {result.pageNumber}</span>
              </div>
              <p className="mt-1 truncate text-gray-600 dark:text-gray-400">{result.text}</p>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults && results.length === 0 && !isSearching && searchQuery && (
        <div className="border-t border-gray-200 p-4 text-center dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">No results found for "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}
