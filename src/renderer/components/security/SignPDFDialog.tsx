/**
 * Sign PDF Dialog
 * Allows user to digitally sign PDFs with P12/PFX certificates
 */

import { useState } from 'react';
import { Dialog, Button, Spinner } from '../ui';
import { useEditingStore } from '../../store/editing-store';

interface SignPDFDialogProps {
  open: boolean;
  onClose: () => void;
  onPdfSigned?: (signedPdfBytes: Uint8Array) => void;
}

export function SignPDFDialog({ open, onClose, onPdfSigned }: SignPDFDialogProps) {
  const { modifiedPdfBytes, originalFile } = useEditingStore();
  
  const [certFile, setCertFile] = useState<{ name: string; data: Uint8Array } | null>(null);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSelectCertificate = async () => {
    try {
      const result = await window.electronAPI.openP12FileDialog();
      if (result) {
        setCertFile({ name: result.name, data: result.data });
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load certificate');
    }
  };

  const handleSign = async () => {
    if (!certFile) {
      setError('Please select a certificate file first');
      return;
    }

    if (!password) {
      setError('Please enter the certificate password');
      return;
    }

    // Get PDF bytes
    let pdfBytes: Uint8Array | null = modifiedPdfBytes;
    if (!pdfBytes && originalFile) {
      const buffer = await originalFile.arrayBuffer();
      pdfBytes = new Uint8Array(buffer);
    }

    if (!pdfBytes) {
      setError('No PDF document loaded');
      return;
    }

    setIsSigning(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await window.electronAPI.signPdf(
        pdfBytes,
        certFile.data,
        password,
        reason || undefined,
        location || undefined
      );

      if (result.success && result.outputPath) {
        setSuccess(`✅ PDF signed successfully!\n\nSaved to:\n${result.outputPath}`);
        
        if (result.signedPdfBytes && onPdfSigned) {
          onPdfSigned(result.signedPdfBytes);
        }
      } else {
        setError(result.error || 'Failed to sign PDF');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign PDF');
    }

    setIsSigning(false);
  };

  const handleClose = () => {
    setCertFile(null);
    setPassword('');
    setReason('');
    setLocation('');
    setError(null);
    setSuccess(null);
    setShowHelp(false);
    onClose();
  };

  const hasPdf = !!(modifiedPdfBytes || originalFile);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="✍️ Sign PDF with Certificate"
      description="Digitally sign your PDF with a P12/PFX certificate"
      footer={
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setShowHelp(!showHelp)}>
            {showHelp ? '◀ Back' : '❓ How to Sign?'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSign} 
              disabled={!certFile || !password || isSigning || !hasPdf || showHelp}
            >
              {isSigning ? <><Spinner size="sm" /> Signing...</> : '🔏 Sign PDF'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {showHelp ? (
          /* HELP SECTION */
          <div className="space-y-4">
            <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
              <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-3">📖 Panduan Lengkap Digital Signature</h3>
              
              <div className="space-y-4 text-sm text-blue-700 dark:text-blue-300">
                {/* Apa itu Digital Signature */}
                <div>
                  <h4 className="font-semibold mb-1">🔐 Apa itu Digital Signature?</h4>
                  <p className="text-xs">
                    Digital signature adalah tanda tangan elektronik yang menggunakan teknologi kriptografi. 
                    Berbeda dengan tanda tangan gambar biasa, digital signature membuktikan:
                  </p>
                  <ul className="list-disc pl-4 text-xs mt-1 space-y-0.5">
                    <li><strong>Identitas penandatangan</strong> - Siapa yang menandatangani</li>
                    <li><strong>Keaslian dokumen</strong> - Dokumen tidak diubah setelah ditandatangani</li>
                    <li><strong>Waktu penandatanganan</strong> - Kapan dokumen ditandatangani</li>
                  </ul>
                </div>

                {/* Apa itu P12/PFX */}
                <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                  <h4 className="font-semibold mb-1">📄 Apa itu File P12 / PFX?</h4>
                  <p className="text-xs">
                    File .p12 atau .pfx adalah file sertifikat digital yang berisi:
                  </p>
                  <ul className="list-disc pl-4 text-xs mt-1 space-y-0.5">
                    <li><strong>Private Key</strong> - Kunci rahasia untuk menandatangani</li>
                    <li><strong>Sertifikat</strong> - Identitas Anda yang diverifikasi</li>
                    <li><strong>Password</strong> - Proteksi agar tidak bisa dipakai orang lain</li>
                  </ul>
                </div>

                {/* Cara Mendapatkan Sertifikat */}
                <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                  <h4 className="font-semibold mb-1">🛒 Cara Mendapatkan Sertifikat</h4>
                  <p className="text-xs mb-2">Ada 2 jenis sertifikat:</p>
                  
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2 mb-2">
                    <p className="font-medium text-xs">1️⃣ Self-Signed (Gratis, tapi tidak trusted)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Bisa dibuat sendiri menggunakan OpenSSL. PDF reader akan menampilkan "untrusted signature".
                    </p>
                  </div>
                  
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
                    <p className="font-medium text-xs">2️⃣ Trusted Certificate (Berbayar, trusted)</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Beli dari Certificate Authority (CA) seperti:
                    </p>
                    <ul className="list-disc pl-4 text-xs mt-1">
                      <li>DigiCert, GlobalSign, Sectigo</li>
                      <li>Di Indonesia: Privy, PrivyID, Digisign</li>
                    </ul>
                  </div>
                </div>

                {/* Langkah-langkah Sign */}
                <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                  <h4 className="font-semibold mb-1">📝 Langkah-langkah Menandatangani PDF</h4>
                  <ol className="list-decimal pl-4 text-xs space-y-1">
                    <li><strong>Buka PDF</strong> yang ingin ditandatangani</li>
                    <li>Pergi ke <strong>Tools → Sign PDF</strong></li>
                    <li>Klik <strong>Browse</strong> dan pilih file .p12 atau .pfx Anda</li>
                    <li>Masukkan <strong>password sertifikat</strong></li>
                    <li>(Opsional) Isi <strong>Reason</strong> dan <strong>Location</strong></li>
                    <li>Klik tombol <strong>Sign PDF</strong></li>
                    <li>File PDF yang sudah ditandatangani akan disimpan</li>
                  </ol>
                </div>

                {/* Tips */}
                <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                  <h4 className="font-semibold mb-1">💡 Tips Penting</h4>
                  <ul className="list-disc pl-4 text-xs space-y-0.5">
                    <li>Jangan pernah share file .p12/.pfx dan password Anda</li>
                    <li>Backup sertifikat di tempat yang aman</li>
                    <li>Sertifikat memiliki masa berlaku, perlu diperpanjang</li>
                    <li>Verifikasi signature di Adobe Reader atau Foxit</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SIGNING FORM */
          <>
            {!hasPdf && (
              <div className="rounded-md bg-amber-50 p-3 dark:bg-amber-900/20">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  ⚠️ No PDF document loaded. Open a PDF first to sign it.
                </p>
              </div>
            )}

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <span className={`px-2 py-1 rounded ${certFile ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                1. Select Certificate
              </span>
              <span>→</span>
              <span className={`px-2 py-1 rounded ${password ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                2. Enter Password
              </span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-gray-100">
                3. Sign!
              </span>
            </div>

            {/* Certificate Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📁 Step 1: Certificate File (.p12 / .pfx)
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 border rounded-md bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                  {certFile ? `✅ ${certFile.name}` : '❌ No certificate selected'}
                </div>
                <Button variant="outline" onClick={handleSelectCertificate}>
                  Browse...
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Pilih file sertifikat digital Anda (format P12 atau PFX)
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔑 Step 2: Certificate Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password sertifikat Anda"
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password yang Anda buat saat membuat/mendapatkan sertifikat
              </p>
            </div>

            {/* Signature Details (Optional) */}
            <div className="border-t pt-4 border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                📝 Detail Signature (Opsional)
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Alasan Penandatanganan</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Approved, Reviewed"
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Lokasi</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Jakarta, Indonesia"
                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">❌ {error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
                <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-line">{success}</p>
              </div>
            )}

            {/* Quick Info */}
            <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
              <p>💡 <strong>Tidak punya sertifikat?</strong> Klik tombol <strong>"❓ How to Sign?"</strong> untuk panduan lengkap.</p>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
