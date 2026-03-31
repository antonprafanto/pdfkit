import { beforeEach, describe, expect, it } from 'vitest';
import { usePDFStore } from './pdf-store';

describe('PDF Store view modes', () => {
  beforeEach(() => {
    usePDFStore.getState().closeAllTabs();
  });

  it('should migrate legacy facing mode to book when creating a tab', () => {
    const tabId = usePDFStore.getState().addTab({
      currentPage: 1,
      totalPages: 6,
      viewMode: 'facing' as any,
    });

    const tab = usePDFStore.getState().getTabById(tabId);
    expect(tab?.viewMode).toBe('book');
    expect(usePDFStore.getState().viewMode).toBe('book');
  });

  it('should advance spreads in two-page mode', () => {
    usePDFStore.getState().addTab({
      currentPage: 1,
      totalPages: 6,
      viewMode: 'two-page',
    });

    usePDFStore.getState().nextPage();
    expect(usePDFStore.getState().currentPage).toBe(3);

    usePDFStore.getState().nextPage();
    expect(usePDFStore.getState().currentPage).toBe(5);

    usePDFStore.getState().previousPage();
    expect(usePDFStore.getState().currentPage).toBe(3);
  });

  it('should treat the first page as a cover in book mode navigation', () => {
    usePDFStore.getState().addTab({
      currentPage: 1,
      totalPages: 7,
      viewMode: 'book',
    });

    usePDFStore.getState().nextPage();
    expect(usePDFStore.getState().currentPage).toBe(2);

    usePDFStore.getState().nextPage();
    expect(usePDFStore.getState().currentPage).toBe(4);

    usePDFStore.getState().previousPage();
    expect(usePDFStore.getState().currentPage).toBe(2);

    usePDFStore.getState().previousPage();
    expect(usePDFStore.getState().currentPage).toBe(1);
  });
});
