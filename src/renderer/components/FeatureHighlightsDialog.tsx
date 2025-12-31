/**
 * Feature Highlights Dialog
 * Onboarding carousel that displays when app is first opened
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, Button } from './ui';

interface FeatureHighlightsDialogProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'pdf_kit_feature_highlights_seen';

export function FeatureHighlightsDialog({ open, onClose }: FeatureHighlightsDialogProps) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const features = [
    {
      key: 'viewing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      key: 'editing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      key: 'conversion',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      key: 'security',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      key: 'ai',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      key: 'organization',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onClose();
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    if (currentSlide < features.length - 1) {
      goToSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const currentFeature = features[currentSlide];
  const isLastSlide = currentSlide === features.length - 1;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title=""
      description=""
      size="md"
    >
      <div className="w-full max-w-md mx-auto py-2">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {t('featureHighlights.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('featureHighlights.subtitle')}
          </p>
        </div>

        {/* Feature Card */}
        <div className="rounded-lg border border-border bg-card/50 p-4 mb-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${currentFeature.bgColor} flex items-center justify-center ${currentFeature.color}`}>
              {currentFeature.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-foreground">
                  {t(`featureHighlights.features.${currentFeature.key}.title`)}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {currentSlide + 1}/{features.length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(`featureHighlights.features.${currentFeature.key}.description`)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? 'bg-primary w-4'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            {t('featureHighlights.prev')}
          </Button>

          <div className="flex-1" />

          {isLastSlide ? (
            <Button
              size="sm"
              onClick={handleClose}
            >
              {t('featureHighlights.getStarted')}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={nextSlide}
            >
              {t('featureHighlights.next')}
            </Button>
          )}
        </div>

        {/* Don't Show Again */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border">
          <input
            type="checkbox"
            id="dontShowAgain"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
          />
          <label
            htmlFor="dontShowAgain"
            className="text-xs text-muted-foreground cursor-pointer select-none"
          >
            {t('featureHighlights.dontShowAgain')}
          </label>
        </div>
      </div>
    </Dialog>
  );
}

// Helper to check if highlights should be shown
export function shouldShowFeatureHighlights(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
