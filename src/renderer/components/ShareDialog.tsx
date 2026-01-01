/**
 * Share Dialog Component
 * Shows options to share the PDF Kit application link
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from './ui';
import { QRCodeSVG } from 'qrcode.react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHARE_URL = 'https://github.com/antonprafanto/pdfkit/releases';
const WHATSAPP_MESSAGE = encodeURIComponent('Check out PDF Kit - A comprehensive offline PDF toolkit! 📄\n\n' + SHARE_URL);

export function ShareDialog({ isOpen, onClose }: ShareDialogProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsAppShare = () => {
    window.electronAPI.openExternal(`https://wa.me/?text=${WHATSAPP_MESSAGE}`);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={t('share.title', 'Share PDF Kit')}
      description={t('share.description', 'Share this app with your friends and colleagues')}
    >
      <div className="space-y-6">
        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
          <QRCodeSVG 
            value={SHARE_URL} 
            size={160}
            level="H"
            includeMargin={true}
          />
          <p className="mt-3 text-xs text-gray-500 text-center">
            {t('share.scanQR', 'Scan QR code to open')}
          </p>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border transition-all ${
              copied 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400' 
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{t('share.copied', 'Link copied!')}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('share.copyLink', 'Copy Link')}</span>
              </>
            )}
          </button>

          {/* WhatsApp Share Button */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#25D366] hover:bg-[#128C7E] text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span className="font-medium">WhatsApp</span>
          </button>
        </div>

        {/* URL Display */}
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
          <code className="text-xs text-gray-600 dark:text-gray-400 break-all">{SHARE_URL}</code>
        </div>
      </div>
    </Dialog>
  );
}
