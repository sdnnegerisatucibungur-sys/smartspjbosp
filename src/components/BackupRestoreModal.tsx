import React, { useState, useEffect, useRef } from 'react';
import {
  Archive,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  FileJson,
  Layers,
  Database,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AppSettings,
  BkuItem,
  RkasItem,
  TaxRecord,
  BukuPembantuPajakItem,
  RekapPajakItem,
} from '../types';
import {
  TriwulanType,
  TriwulanBackupPackage,
  RestoreSelectionOptions,
  TRIWULAN_OPTIONS,
  getSavedBackups,
  saveBackupPackage,
  deleteBackupPackage,
  createBackupPackage,
  downloadBackupAsJson,
  parseBackupFile,
} from '../utils/backupHelper';
import { formatRupiah } from '../utils/formatters';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'backup' | 'restore' | 'upload';
  settings: AppSettings;
  bkuData: BkuItem[];
  rkasData: RkasItem[];
  taxRecords: TaxRecord[];
  bppItems: BukuPembantuPajakItem[];
  rekapItems: RekapPajakItem[];
  selectedPeriode?: string;
  onRestoreData: (
    backup: TriwulanBackupPackage,
    options: RestoreSelectionOptions
  ) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'backup',
  settings,
  bkuData,
  rkasData,
  taxRecords,
  bppItems,
  rekapItems,
  selectedPeriode,
  onRestoreData,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'upload'>(initialTab);
  const [savedBackups, setSavedBackups] = useState<TriwulanBackupPackage[]>([]);

  // Backup Form State
  const [selectedTriwulan, setSelectedTriwulan] = useState<TriwulanType>('TW1');
  const [tahunAnggaran, setTahunAnggaran] = useState<string>(settings.tahunAnggaran || '2026');
  const [catatan, setCatatan] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Upload & File Restore State
  const [uploadedBackup, setUploadedBackup] = useState<TriwulanBackupPackage | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Restore Confirmation State
  const [pendingRestore, setPendingRestore] = useState<TriwulanBackupPackage | null>(null);
  const [restoreOptions, setRestoreOptions] = useState<RestoreSelectionOptions>({
    restoreBku: true,
    restorePajak: true,
    restoreRkas: false,
    restoreSettings: false,
  });
  const [autoBackupBeforeRestore, setAutoBackupBeforeRestore] = useState<boolean>(true);

  // Reload saved backups when opened or school changes
  useEffect(() => {
    if (isOpen) {
      loadBackups();
      setActiveTab(initialTab);
      // Auto-detect triwulan based on current month
      const currentMonth = new Date().getMonth() + 1;
      if (currentMonth <= 3) setSelectedTriwulan('TW1');
      else if (currentMonth <= 6) setSelectedTriwulan('TW2');
      else if (currentMonth <= 9) setSelectedTriwulan('TW3');
      else setSelectedTriwulan('TW4');
    }
  }, [isOpen, settings.npsn, initialTab]);

  const loadBackups = () => {
    const list = getSavedBackups(settings.npsn);
    setSavedBackups(list);
  };

  if (!isOpen) return null;

  // Total pengeluaran kas saat ini
  const currentTotalKeluar = bkuData.reduce((acc, row) => acc + (Number(row.keluar) || 0), 0);
  const currentTotalTerima = bkuData.reduce((acc, row) => acc + (Number(row.terima) || 0), 0);

  // Handler: Buat Backup
  const handleCreateBackup = (andDownload: boolean = true) => {
    if (bkuData.length === 0) {
      const confirmEmpty = window.confirm(
        'Data BKU saat ini kosong (0 transaksi). Tetap ingin membuat cadangan data kosong?'
      );
      if (!confirmEmpty) return;
    }

    try {
      setIsProcessing(true);
      const pkg = createBackupPackage({
        triwulan: selectedTriwulan,
        tahunAnggaran,
        catatan,
        settings,
        bkuData,
        rkasData,
        taxRecords,
        bppItems,
        rekapItems,
        selectedPeriode,
      });

      // Simpan ke storage lokal
      const saved = saveBackupPackage(pkg);
      if (!saved) {
        throw new Error('Gagal menyimpan cadangan ke memori lokal.');
      }

      // Unduh jika dipilih
      if (andDownload) {
        downloadBackupAsJson(pkg);
      }

      loadBackups();
      showToast(
        `Cadangan ${pkg.triwulanLabel} berhasil disimpan!${
          andDownload ? ' Berkas JSON telah diunduh.' : ''
        }`,
        'success'
      );
      setActiveTab('restore');
    } catch (err: any) {
      showToast(err?.message || 'Gagal membuat cadangan', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Handle Upload File JSON
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      setIsProcessing(true);
      const pkg = await parseBackupFile(file);
      setUploadedBackup(pkg);
      showToast(`Berkas cadangan valid: ${pkg.namaSekolah} (${pkg.triwulanLabel})`, 'success');
    } catch (err: any) {
      setUploadError(err?.message || 'Format berkas cadangan tidak valid');
      setUploadedBackup(null);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handler: Eksekusi Restore
  const executeRestore = (pkg: TriwulanBackupPackage) => {
    // Jika dicentang auto backup data saat ini sebelum ditimpa
    if (autoBackupBeforeRestore && bkuData.length > 0) {
      try {
        const autoPkg = createBackupPackage({
          triwulan: 'SEMUA',
          tahunAnggaran: settings.tahunAnggaran || '2026',
          catatan: `Otomatis sebelum memulihkan ${pkg.triwulanLabel} (${new Date().toLocaleTimeString('id-ID')})`,
          settings,
          bkuData,
          rkasData,
          taxRecords,
          bppItems,
          rekapItems,
          selectedPeriode,
        });
        saveBackupPackage(autoPkg);
      } catch (e) {
        console.error('Gagal auto backup sebelum restore:', e);
      }
    }

    // Jalankan pemulihan data ke state utama
    onRestoreData(pkg, restoreOptions);
    showToast(`Data ${pkg.triwulanLabel} berhasil dipulihkan ke aplikasi!`, 'success');
    setPendingRestore(null);
    onClose();
  };

  // Handler: Hapus Backup
  const handleDeleteBackup = (pkg: TriwulanBackupPackage) => {
    if (window.confirm(`Hapus cadangan ${pkg.triwulanLabel} (${new Date(pkg.createdAt).toLocaleDateString('id-ID')})? Tindakan ini tidak dapat dibatalkan.`)) {
      deleteBackupPackage(settings.npsn, pkg.id);
      loadBackups();
      showToast('Cadangan berhasil dihapus.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs no-print animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg flex items-center justify-center text-slate-950">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-lg text-white">Cadangan & Pemulihan Triwulan</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold rounded-full">
                  BKU & SPJ BOSP
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Simpan data BKU sebelum dihapus setiap 3 bulan (Triwulan), dan pulihkan kembali kapan saja dengan 1 klik.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-4 font-bold text-xs flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>1. Buat Backup Triwulan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`pb-3 px-4 font-bold text-xs flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'restore'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>2. Riwayat Cadangan</span>
            {savedBackups.length > 0 && (
              <span className="px-2 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-full">
                {savedBackups.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-4 font-bold text-xs flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>3. Unggah Berkas JSON</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: BUAT BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 flex items-start space-x-3">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    Alur Kerja Triwulanan BOSP & BKU:
                  </p>
                  <p className="text-blue-800 leading-relaxed text-[11px]">
                    Sebelum Anda mengosongkan BKU untuk memulai pengerjaan 3 bulan berikutnya, simpan cadangan Triwulan yang sedang berjalan. Seluruh data transaksi BKU, pajak, kwitansi, dan saldo akan dibungkus secara aman dan dapat dipulihkan kapan saja.
                  </p>
                </div>
              </div>

              {/* Form Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Triwulan Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Pilih Triwulan yang Dicadangkan:
                  </label>
                  <select
                    value={selectedTriwulan}
                    onChange={(e) => setSelectedTriwulan(e.target.value as TriwulanType)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    {TRIWULAN_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label} — ({opt.bulan})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tahun Anggaran */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Tahun Anggaran:
                  </label>
                  <input
                    type="text"
                    value={tahunAnggaran}
                    onChange={(e) => setTahunAnggaran(e.target.value)}
                    placeholder="2026"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Keterangan / Catatan Tambahan (Opsional):
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder={`Contoh: BKU ${selectedTriwulan} Siap Pemeriksaan SPJ / Sebelum Dikosongkan`}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Data Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ringkasan Data yang Akan Dicadangkan</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {settings.namaSekolah} (NPSN: {settings.npsn})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-semibold block">Transaksi BKU</span>
                    <span className="text-base font-extrabold text-blue-700">{bkuData.length}</span>
                    <span className="text-[10px] text-slate-400 block">baris</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-semibold block">Total Pengeluaran</span>
                    <span className="text-xs font-extrabold text-rose-600 block truncate" title={formatRupiah(currentTotalKeluar)}>
                      {formatRupiah(currentTotalKeluar)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">realisasi belanja</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-semibold block">Data Pajak (BPP)</span>
                    <span className="text-base font-extrabold text-amber-600">{bppItems.length}</span>
                    <span className="text-[10px] text-slate-400 block">transaksi pajak</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-semibold block">Saldo Akhir</span>
                    <span className="text-xs font-extrabold text-emerald-700 block truncate" title={formatRupiah(currentTotalTerima - currentTotalKeluar)}>
                      {formatRupiah(currentTotalTerima - currentTotalKeluar)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">buku kas</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handleCreateBackup(false)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-3 rounded-xl border border-slate-300 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-600" />
                  <span>Simpan ke Browser Saja</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateBackup(true)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Simpan & Unduh Berkas Cadangan (.json)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RIWAYAT CADANGAN & RESTORE */}
          {activeTab === 'restore' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Arsip Cadangan Triwulan Tersimpan</h4>
                  <p className="text-xs text-slate-500">
                    Pilih cadangan Triwulan untuk membuka kembali data BKU, kwitansi, dan pajaknya.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('backup')}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Archive className="w-3 h-3" />
                  <span>+ Buat Cadangan Baru</span>
                </button>
              </div>

              {savedBackups.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-700">Belum Ada Cadangan Tersimpan</h5>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Anda belum pernah membuat cadangan Triwulan untuk sekolah ini. Klik tombol di bawah untuk mencadangkan data BKU sekarang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('backup')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Buat Cadangan Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedBackups.map((pkg) => {
                    const twInfo = TRIWULAN_OPTIONS.find((t) => t.id === pkg.triwulan);
                    const dateFormatted = new Date(pkg.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={pkg.id}
                        className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-extrabold rounded-lg">
                              {pkg.triwulan}
                            </span>
                            <div>
                              <h5 className="font-extrabold text-xs text-slate-900">
                                {pkg.triwulanLabel} — T.A {pkg.tahunAnggaran}
                              </h5>
                              <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Dibuat: {dateFormatted}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => downloadBackupAsJson(pkg)}
                              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                              title="Unduh Berkas JSON (.json)"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBackup(pkg)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Hapus Cadangan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingRestore(pkg)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Pulihkan (Restore)</span>
                            </button>
                          </div>
                        </div>

                        {/* Detail Info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400">Transaksi BKU: </span>
                            <span className="font-bold text-slate-800">{pkg.stats.totalBku} data</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Pengeluaran: </span>
                            <span className="font-bold text-rose-600">{formatRupiah(pkg.stats.totalKeluar)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Saldo Akhir: </span>
                            <span className="font-bold text-emerald-700">{formatRupiah(pkg.stats.saldoAkhir)}</span>
                          </div>
                          {pkg.catatan && (
                            <div className="w-full pt-1 border-t border-slate-200/60 text-slate-500 italic text-[10px]">
                              "{pkg.catatan}"
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UNGGAH BERKAS JSON */}
          {activeTab === 'upload' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center space-y-4 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-blue-600">
                  <FileJson className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">
                    Pilih atau Seret Berkas Cadangan (.json)
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Gunakan fitur ini jika berkas cadangan disimpan di flashdisk, Google Drive, atau dipindahkan dari komputer lain.
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all inline-flex items-center space-x-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih Berkas JSON</span>
                </button>
              </div>

              {uploadError && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-center space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadedBackup && (
                <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-emerald-950">
                          Berkas Cadangan Berhasil Dibaca
                        </h4>
                        <p className="text-xs text-emerald-800">
                          {uploadedBackup.namaSekolah} — {uploadedBackup.triwulanLabel} ({uploadedBackup.tahunAnggaran})
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Transaksi BKU</span>
                      <span className="font-extrabold text-slate-900">{uploadedBackup.stats.totalBku} data</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Total Keluar</span>
                      <span className="font-extrabold text-rose-600">{formatRupiah(uploadedBackup.stats.totalKeluar)}</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Data Pajak</span>
                      <span className="font-extrabold text-amber-700">{uploadedBackup.stats.totalBpp} BPP</span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-200">
                      <span className="text-[10px] text-slate-500 block">Tanggal Dibuat</span>
                      <span className="font-bold text-slate-700 text-[11px]">
                        {new Date(uploadedBackup.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setUploadedBackup(null)}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRestore(uploadedBackup)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Lanjutkan Pemulihan Data Ini</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100/90 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Format cadangan kompatibel 100% dengan standar ARKAS BOSP 2026</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* CONFIRMATION RESTORE MODAL OVERLAY */}
      {pendingRestore && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900">Konfirmasi Pemulihan Data</h4>
                  <p className="text-xs text-slate-500">
                    Memulihkan {pendingRestore.triwulanLabel} (T.A {pendingRestore.tahunAnggaran})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingRestore(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
              <p className="font-bold">Perhatian Penting:</p>
              <p className="leading-relaxed text-[11px]">
                Data yang sedang aktif di layar kerja saat ini akan digantikan dengan data cadangan ini ({pendingRestore.stats.totalBku} transaksi BKU).
              </p>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-800 block">Pilih Bagian yang Dipulihkan:</span>
              
              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                <input
                  type="checkbox"
                  checked={restoreOptions.restoreBku}
                  onChange={(e) =>
                    setRestoreOptions((prev) => ({ ...prev, restoreBku: e.target.checked }))
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-bold">Data Buku Kas Umum (BKU) — {pendingRestore.stats.totalBku} transaksi</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                <input
                  type="checkbox"
                  checked={restoreOptions.restorePajak}
                  onChange={(e) =>
                    setRestoreOptions((prev) => ({ ...prev, restorePajak: e.target.checked }))
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-bold">Data Pembantu Pajak & Rekapitulasi Pajak</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                <input
                  type="checkbox"
                  checked={restoreOptions.restoreRkas}
                  onChange={(e) =>
                    setRestoreOptions((prev) => ({ ...prev, restoreRkas: e.target.checked }))
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Data RKAS (Opsional jika ingin mengganti anggaran referensi)</span>
              </label>

              <label className="flex items-center space-x-2.5 text-xs text-slate-700 cursor-pointer p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                <input
                  type="checkbox"
                  checked={restoreOptions.restoreSettings}
                  onChange={(e) =>
                    setRestoreOptions((prev) => ({ ...prev, restoreSettings: e.target.checked }))
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Pengaturan Profil Sekolah & Pejabat (Opsional)</span>
              </label>
            </div>

            {/* Safety Auto-backup checkbox */}
            <div className="pt-1">
              <label className="flex items-start space-x-2.5 text-[11px] text-blue-900 bg-blue-50/80 p-3 rounded-xl border border-blue-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBackupBeforeRestore}
                  onChange={(e) => setAutoBackupBeforeRestore(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <span className="leading-snug">
                  <strong>Amankan data saat ini:</strong> Buat cadangan otomatis data aktif sekarang sebelum menimpanya, agar tidak ada data yang hilang secara permanen.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingRestore(null)}
                className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeRestore(pendingRestore)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ya, Pulihkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
