import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileSpreadsheet, RefreshCw, Key, HelpCircle, AlertCircle, ExternalLink, CheckCircle2, Download, Share2 } from 'lucide-react';
import { SheetsConfig } from '../types';

interface SheetsPanelProps {
  config: SheetsConfig;
  onSync: (token: string) => Promise<void>;
  onCreateSheets: (token: string) => Promise<void>;
  onConnectExisting?: (token: string, spreadsheetId: string) => Promise<void>;
  onExportCsv: () => void;
  syncing: boolean;
}

export default function SheetsPanel({
  config,
  onSync,
  onCreateSheets,
  onConnectExisting,
  onExportCsv,
  syncing,
}: SheetsPanelProps) {
  const [googleToken, setGoogleToken] = useState('');
  const [existingSpreadsheetId, setExistingSpreadsheetId] = useState(() => {
    return config.spreadsheetId || '1it6jrqgdr9suvVZk81qYQKLToxxxNE8JaDRlzYH4n5I';
  });
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleCopySetupLink = () => {
    if (!config.spreadsheetId) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}?sid=${encodeURIComponent(config.spreadsheetId)}&u1=${encodeURIComponent(config.user1Name || 'Ry')}&u2=${encodeURIComponent(config.user2Name || 'Partner')}`;
    navigator.clipboard.writeText(url);
    setSuccessMessage('Sukses! Tautan pengaturan disalin ke papan klip. Bagikan tautan ini ke device pasangan Anda untuk menyamakan nama pengguna dan database secara otomatis.');
  };

  const handleAction = async (action: 'sync' | 'create' | 'connect') => {
    if (!googleToken) {
      setErrorMessage('Token Google Access diperlukan. Silakan lihat panduan di bawah.');
      setShowTokenInput(true);
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    try {
      if (action === 'create') {
        await onCreateSheets(googleToken);
        setSuccessMessage('Berhasil membuat Google Sheets baru! File tersimpan di Google Drive Anda.');
      } else if (action === 'connect') {
        if (onConnectExisting) {
          await onConnectExisting(googleToken, existingSpreadsheetId);
          setSuccessMessage('Berhasil menyambungkan Spreadsheet Anda yang sudah ada!');
        }
      } else {
        await onSync(googleToken);
        setSuccessMessage('Sinkronisasi selesai! Data spreadsheet berhasil diperbarui.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal tersambung dengan Google Sheets API.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Spreadsheet Integration</h3>
          <p className="text-xs text-slate-400">Database Cadangan Google Sheets</p>
        </div>
      </div>

      {/* Integration Badge / Status */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">STATUS KONEKSI</span>
          {config.connected ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              TERHUBUNG
            </span>
          ) : (
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              OFFLINE / LOKAL
            </span>
          )}
        </div>

        {config.connected ? (
          <div className="space-y-2">
            <div>
              <div className="text-xs font-semibold text-slate-500">Nama File Spreadsheet:</div>
              <div className="text-sm font-bold text-slate-900 truncate">Money Tracker - Akun Bersama</div>
            </div>
            {config.spreadsheetUrl && (
              <a
                href={config.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
              >
                Buka Spreadsheet di Tab Baru
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {config.lastSyncedAt && (
              <div className="text-[11px] text-slate-400 font-medium">
                Sinkronisasi Terakhir: {new Date(config.lastSyncedAt).toLocaleString('id-ID')}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 leading-relaxed font-medium">
            Database utama disimpan di Cloud Run Server internal dalam format JSON. Anda dapat menghubungkan ke Google Sheets pribadi Anda sebagai mirror real-time.
          </div>
        )}
      </div>

      {/* Manual Token input for developer safety given iframe constraints */}
      <div className="space-y-3">
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] p-3 rounded-lg flex gap-1.5 leading-relaxed font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] p-3 rounded-lg flex gap-1.5 leading-relaxed font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {config.connected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleAction('sync')}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-950 hover:bg-slate-900 active:scale-[0.99] transition-all text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Mensinkronkan...' : 'Sinkronisasi Sekarang'}
            </button>
            <button
              onClick={handleCopySetupLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-indigo-600/10"
            >
              <Share2 className="w-4 h-4" />
              Bagikan Tautan Setup
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (existingSpreadsheetId.trim()) {
                handleAction('connect');
              } else {
                handleAction('create');
              }
            }}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-emerald-600/10"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {existingSpreadsheetId.trim() ? 'Hubungkan / Sinkron Spreadsheet ID' : '+ Buat Sheets Otomatis'}
          </button>
        )}

        <button
          onClick={onExportCsv}
          className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200"
        >
          <Download className="w-4 h-4" />
          Ekspor CSV / Unduh Data
        </button>
      </div>

      {/* Setup instructions & Custom Access Token Input */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowTokenInput(!showTokenInput)}
          className="w-full text-slate-500 hover:text-slate-800 text-[11px] font-bold tracking-wider uppercase text-left flex items-center justify-between cursor-pointer"
        >
          {showTokenInput ? '🙈 Sembunyikan Pengaturan Google API' : '⚙️ Pengaturan / Sambungkan Manual (Token Google & Spreadsheet ID)'}
        </button>

        {showTokenInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-1"
          >
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Google Spreadsheet ID / ID Spreadsheet (Sudah Pre-fill)
              </label>
              <div className="relative mb-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={existingSpreadsheetId}
                  onChange={(e) => setExistingSpreadsheetId(e.target.value)}
                  placeholder="Contoh: 1it6jrqgdr9suvVZk81qYQKLToxxxNE8JaDRlzYH4n5I"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 focus:bg-white text-xs rounded-lg text-slate-800 transition-colors placeholder:text-slate-400 font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-normal mb-3">
                Tempel ID Google Spreadsheet di atas jika sudah ada, atau kosongkan untuk otomatis membuat spreadsheet baru di Google Drive Anda.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Google OAuth Access Token
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={googleToken}
                  onChange={(e) => setGoogleToken(e.target.value)}
                  placeholder="ya29.a0Acv..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 focus:bg-white text-xs rounded-lg text-slate-800 transition-colors placeholder:text-slate-400 font-mono"
                />
              </div>
            </div>

            {/* Quick Helper Guide */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2 text-xs text-slate-500 leading-relaxed font-medium">
              <div className="font-bold text-slate-800">💡 Cara Menghubungkan Google Sheet Anda:</div>
              <ol className="list-decimal list-inside space-y-1">
                <li>Buka <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google OAuth Playground</a>.</li>
                <li>Pada kotak input scope di kiri, masukkan:
                  <code className="block bg-slate-200 text-slate-800 text-[10px] p-1 rounded my-1 font-mono break-all select-all">https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file</code>
                </li>
                <li>Klik <strong>Authorize APIs</strong> dan pilih akun Google Anda.</li>
                <li>Klik <strong>Exchange authorization code for tokens</strong>.</li>
                <li>Salin isi kotak <strong>Access Token</strong> dan tempel di atas, lalu klik <strong>Buat Sheets Otomatis</strong>!</li>
              </ol>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
