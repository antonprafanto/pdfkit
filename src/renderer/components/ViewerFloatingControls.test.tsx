import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ViewerFloatingControls } from './ViewerFloatingControls';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

describe('ViewerFloatingControls', () => {
  it('shows the live zoom percentage in the fit-to-screen pill', () => {
    render(
      <ViewerFloatingControls
        shellMode="slideshow"
        scale={1.25}
        isVisible
        currentPage={1}
        totalPages={2}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onFitToScreen={vi.fn()}
        onExit={vi.fn()}
        onInteract={vi.fn()}
      />
    );

    expect(screen.getByTitle('Fit to Screen')).toHaveTextContent('125%');
  });
});
