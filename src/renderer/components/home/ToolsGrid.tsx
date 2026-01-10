
import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Sheet, Image, Globe, Lock, Unlock, FileSignature, 
  Files, Split, RotateCw, Trash2, ArrowUpDown, Copy, 
  Stamp, Minimize2, Type, Search 
} from 'lucide-react';

export type ToolAction = 
  // Convert
  | 'office-to-pdf' | 'images-to-pdf' | 'webpage-to-pdf' | 'pdf-to-word' | 'pdf-to-excel' | 'extract-images'
  // Organize
  | 'merge' | 'split' | 'rotate' | 'reorder' | 'delete-pages' | 'duplicate-page' | 'extract-pages'
  // Edit
  | 'overlay' | 'add-page-numbers' | 'ocr' | 'metadata'
  // Security
  | 'encrypt' | 'unlock' | 'sign' | 'watermark' | 'bulk-encrypt'
  // Optimize
  | 'compress';

interface ToolsGridProps {
  onAction: (action: ToolAction) => void;
}

export const ToolsGrid: React.FC<ToolsGridProps> = ({ onAction }) => {
  const { t } = useTranslation();

  const toolCategories = [
    {
      title: t('tools.categoryConvert', 'Convert'),
      tools: [
        {
          id: 'office-to-pdf',
          icon: <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          title: t('landing.officeToPdf', 'Office to PDF'),
          desc: t('landing.officeToPdfDesc', 'Convert Word, Excel, PowerPoint to PDF')
        },
        {
          id: 'images-to-pdf',
          icon: <Image className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          title: t('landing.imagesToPdf', 'Images to PDF'),
          desc: t('landing.imagesToPdfDesc', 'Convert JPG, PNG images to PDF')
        },
        {
          id: 'webpage-to-pdf',
          icon: <Globe className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
          bg: 'bg-cyan-50 dark:bg-cyan-900/20',
          title: t('landing.webpageToPdf', 'Webpage to PDF'),
          desc: t('landing.webpageToPdfDesc', 'Convert websites to PDF')
        },
        {
          id: 'pdf-to-word',
          icon: <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
          bg: 'bg-indigo-50 dark:bg-indigo-900/20',
          title: t('landing.pdfToWord', 'PDF to Word'),
          desc: t('landing.pdfToWordDesc', 'Convert PDF to Word (.docx)')
        },
        {
          id: 'pdf-to-excel',
          icon: <Sheet className="w-6 h-6 text-green-600 dark:text-green-400" />,
          bg: 'bg-green-50 dark:bg-green-900/20',
          title: t('landing.pdfToExcel', 'PDF to Excel'),
          desc: t('landing.pdfToExcelDesc', 'Convert PDF tables to Excel (.xlsx)')
        },
        {
          id: 'extract-images',
          icon: <Image className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          title: t('landing.extractImages', 'Extract Images'),
          desc: t('landing.extractImagesDesc', 'Extract all images from PDF')
        }
      ]
    },
    {
      title: t('tools.categoryOrganize', 'Organize'),
      tools: [
        {
          id: 'merge',
          icon: <Files className="w-6 h-6 text-violet-600 dark:text-violet-400" />,
          bg: 'bg-violet-50 dark:bg-violet-900/20',
          title: t('landing.mergePdfs', 'Merge PDF'),
          desc: t('landing.mergePdfsDesc', 'Combine multiple PDFs into one')
        },
        {
          id: 'split',
          icon: <Split className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          title: t('landing.splitPdf', 'Split PDF'),
          desc: t('landing.splitPdfDesc', 'Split PDF into separate files')
        },
        {
          id: 'rotate',
          icon: <RotateCw className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
          bg: 'bg-teal-50 dark:bg-teal-900/20',
          title: t('landing.rotate', 'Rotate Pages'),
          desc: t('landing.rotateDesc', 'Rotate specific pages')
        },
        {
          id: 'reorder',
          icon: <ArrowUpDown className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />,
          bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',
          title: t('landing.reorder', 'Reorder Pages'),
          desc: t('landing.reorderDesc', 'Change page order')
        },
        {
          id: 'delete-pages',
          icon: <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />,
          bg: 'bg-red-50 dark:bg-red-900/20',
          title: t('landing.deletePages', 'Delete Pages'),
          desc: t('landing.deletePagesDesc', 'Remove pages from PDF')
        },
        {
          id: 'extract-pages',
          icon: <Copy className="w-6 h-6 text-sky-600 dark:text-sky-400" />,
          bg: 'bg-sky-50 dark:bg-sky-900/20',
          title: t('landing.extractPages', 'Extract Pages'),
          desc: t('landing.extractPagesDesc', 'Extract pages to new PDF')
        },
        {
          id: 'duplicate-page',
          icon: <Copy className="w-6 h-6 text-lime-600 dark:text-lime-400" />,
          bg: 'bg-lime-50 dark:bg-lime-900/20',
          title: t('landing.duplicatePage', 'Duplicate Page'),
          desc: t('landing.duplicatePageDesc', 'Duplicate specific pages')
        }
      ]
    },
    {
      title: t('tools.categoryEdit', 'Edit & Optimize'),
      tools: [
        {
          id: 'compress',
          icon: <Minimize2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
          bg: 'bg-rose-50 dark:bg-rose-900/20',
          title: t('landing.compress', 'Compress PDF'),
          desc: t('landing.compressDesc', 'Reduce file size')
        },
        {
          id: 'overlay',
          icon: <Stamp className="w-6 h-6 text-pink-600 dark:text-pink-400" />,
          bg: 'bg-pink-50 dark:bg-pink-900/20',
          title: t('landing.overlayPdf', 'Overlay PDF'),
          desc: t('landing.overlayPdfDesc', 'Add watermark/overlay')
        },
        {
          id: 'add-page-numbers',
          icon: <Type className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          title: t('landing.addPageNumbers', 'Page Numbers'),
          desc: t('landing.addPageNumbersDesc', 'Add page numbers to PDF')
        },
        {
          id: 'ocr',
          icon: <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          title: t('landing.ocr', 'OCR PDF'),
          desc: t('landing.ocrDesc', 'Make PDF text searchable')
        }
      ]
    },
    {
      title: t('tools.categorySecurity', 'Security'),
      tools: [
        {
          id: 'encrypt',
          icon: <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />,
          bg: 'bg-red-50 dark:bg-red-900/20',
          title: t('landing.encrypt', 'Protect PDF'),
          desc: t('landing.encryptDesc', 'Add password protection')
        },
        {
          id: 'unlock',
          icon: <Unlock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          title: t('landing.unlock', 'Unlock PDF'),
          desc: t('landing.unlockDesc', 'Remove password')
        },
        {
          id: 'sign',
          icon: <FileSignature className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          title: t('landing.sign', 'Sign PDF'),
          desc: t('landing.signDesc', 'Add digital signature')
        },
        {
          id: 'watermark',
          icon: <Stamp className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          title: t('landing.watermark', 'Watermark'),
          desc: t('landing.watermarkDesc', 'Add text watermark')
        },
        {
          id: 'bulk-encrypt',
          icon: <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
          bg: 'bg-indigo-50 dark:bg-indigo-900/20',
          title: t('landing.bulkEncrypt', 'Bulk Encrypt'),
          desc: 'Encrypt multiple files'
        }
      ]
    }
  ];

  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter tools based on search query
  const filteredCategories = searchQuery.trim() === ''
    ? toolCategories
    : toolCategories.map(category => ({
        ...category,
        tools: category.tools.filter(tool =>
          tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.tools.length > 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20">
      {/* Search Input */}
      <div className="mb-8 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('tools.searchPlaceholder', 'Search tools...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('tools.noResults', 'No tools found matching "{{query}}"', { query: searchQuery })}</p>
        </div>
      ) : (
        filteredCategories.map((category, idx) => (
          <div key={idx} className="mb-12 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
            <h2 className="text-xl font-semibold mb-6 text-foreground border-b pb-2 border-border/50">
              {category.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {category.tools.map((tool, _) => (
                <button
                  key={tool.id}
                  onClick={() => onAction(tool.id as ToolAction)}
                  className="group flex flex-col p-5 bg-card hover:bg-accent/50 border border-border rounded-xl transition-all duration-200 hover:shadow-md hover:border-primary/30 text-left h-full"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`p-2.5 rounded-lg ${tool.bg} ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 transition-transform duration-200`}>
                      {tool.icon}
                    </div>
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground pl-[3.25rem] leading-relaxed">
                    {tool.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
