import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MergeDialog } from './MergeDialog';
import { pdfManipulationService } from '../../lib/pdf-manipulation.service';
import { useEditingStore } from '../../store/editing-store';
import { usePDFStore } from '../../store/pdf-store';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'merge.title': 'Merge PDFs',
        'merge.description': 'Combine multiple PDF files into one',
        'merge.addFiles': 'Add Files',
        'merge.dragDrop': 'Drag and drop files here',
        'merge.dropHint': 'or click Add Files to choose more PDFs',
        'merge.reorderHint': 'Drag files to reorder merge order',
        'merge.invalidDrop': 'Only PDF files can be added here',
        'merge.mergeButton': 'Merge PDFs',
        'common.cancel': 'Cancel',
      };

      return translations[key] ?? key;
    },
  }),
}));

vi.mock('../../lib/pdf-manipulation.service', () => ({
  pdfManipulationService: {
    getPageCount: vi.fn(),
    mergePDFs: vi.fn(),
  },
}));

const getPageCountMock = vi.mocked(pdfManipulationService.getPageCount);

const createDataTransfer = (files: File[] = [], types: string[] = ['Files']) => ({
  files,
  types,
  dropEffect: 'move',
  effectAllowed: 'all',
  setData: vi.fn(),
  getData: vi.fn(),
});

const createFile = (name: string, type = 'application/pdf') => {
  return new File(['file-content'], name, { type });
};

const getRenderedFileNames = () => {
  return screen.getAllByText(/\.pdf$/).map((element) => element.textContent);
};

describe('MergeDialog', () => {
  beforeEach(() => {
    getPageCountMock.mockReset();
    getPageCountMock.mockResolvedValue(1);

    useEditingStore.getState().reset();
    usePDFStore.setState({
      document: null,
      fileName: null,
      totalPages: 0,
    });
  });

  it('appends dropped PDF files to the merge list', async () => {
    render(<MergeDialog open onClose={vi.fn()} />);

    const dropZone = screen.getByLabelText('Drag and drop files here');
    const alpha = createFile('alpha.pdf');
    const beta = createFile('beta.pdf');

    fireEvent.dragEnter(dropZone, { dataTransfer: createDataTransfer([alpha, beta]) });
    fireEvent.drop(dropZone, { dataTransfer: createDataTransfer([alpha, beta]) });

    expect(await screen.findByText('alpha.pdf')).not.toBeNull();
    expect(await screen.findByText('beta.pdf')).not.toBeNull();
    expect(getPageCountMock).toHaveBeenCalledTimes(2);
  });

  it('shows an error when the drop contains no PDF files', async () => {
    render(<MergeDialog open onClose={vi.fn()} />);

    const dropZone = screen.getByLabelText('Drag and drop files here');
    const textFile = createFile('notes.txt', 'text/plain');

    fireEvent.drop(dropZone, { dataTransfer: createDataTransfer([textFile]) });

    expect(await screen.findByText('Only PDF files can be added here')).not.toBeNull();
    expect(screen.queryByText('notes.txt')).toBeNull();
    expect(getPageCountMock).not.toHaveBeenCalled();
  });

  it('reorders uploaded files via drag and drop without re-adding them', async () => {
    render(<MergeDialog open onClose={vi.fn()} />);

    const dropZone = screen.getByLabelText('Drag and drop files here');
    const alpha = createFile('alpha.pdf');
    const beta = createFile('beta.pdf');

    fireEvent.drop(dropZone, { dataTransfer: createDataTransfer([alpha, beta]) });
    await screen.findByText('alpha.pdf');
    await screen.findByText('beta.pdf');

    const alphaRow = screen.getByText('alpha.pdf').closest('[draggable="true"]');
    const betaRow = screen.getByText('beta.pdf').closest('[draggable="true"]');

    expect(alphaRow).not.toBeNull();
    expect(betaRow).not.toBeNull();

    fireEvent.dragStart(alphaRow as HTMLElement, {
      dataTransfer: createDataTransfer([], ['text/plain']),
    });
    fireEvent.dragOver(betaRow as HTMLElement, {
      dataTransfer: createDataTransfer([], ['text/plain']),
    });
    fireEvent.drop(betaRow as HTMLElement, {
      dataTransfer: createDataTransfer([], ['text/plain']),
    });
    fireEvent.dragEnd(alphaRow as HTMLElement, {
      dataTransfer: createDataTransfer([], ['text/plain']),
    });

    await waitFor(() => {
      expect(getRenderedFileNames()).toEqual(['beta.pdf', 'alpha.pdf']);
    });

    expect(getPageCountMock).toHaveBeenCalledTimes(2);
  });

  it('appends a dropped PDF when it lands on an existing file row', async () => {
    render(<MergeDialog open onClose={vi.fn()} />);

    const dropZone = screen.getByLabelText('Drag and drop files here');
    const alpha = createFile('alpha.pdf');
    const beta = createFile('beta.pdf');

    fireEvent.drop(dropZone, { dataTransfer: createDataTransfer([alpha]) });
    await screen.findByText('alpha.pdf');

    const alphaRow = screen.getByText('alpha.pdf').closest('[draggable="true"]');
    expect(alphaRow).not.toBeNull();

    fireEvent.dragOver(alphaRow as HTMLElement, {
      dataTransfer: createDataTransfer([beta]),
    });
    fireEvent.drop(alphaRow as HTMLElement, {
      dataTransfer: createDataTransfer([beta]),
    });

    expect(await screen.findByText('beta.pdf')).not.toBeNull();
    expect(getRenderedFileNames()).toEqual(['alpha.pdf', 'beta.pdf']);
    expect(getPageCountMock).toHaveBeenCalledTimes(2);
  });

  it('keeps arrow-button reordering working after drag support is added', async () => {
    render(<MergeDialog open onClose={vi.fn()} />);

    const dropZone = screen.getByLabelText('Drag and drop files here');
    const alpha = createFile('alpha.pdf');
    const beta = createFile('beta.pdf');

    fireEvent.drop(dropZone, { dataTransfer: createDataTransfer([alpha, beta]) });
    await screen.findByText('alpha.pdf');
    await screen.findByText('beta.pdf');

    fireEvent.click(screen.getAllByTitle('Move down')[0]);

    await waitFor(() => {
      expect(getRenderedFileNames()).toEqual(['beta.pdf', 'alpha.pdf']);
    });
  });
});
