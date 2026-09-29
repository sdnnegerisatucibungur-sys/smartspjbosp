import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  School,
  UserCheck,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Upload,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sparkles,
  Edit3,
  ShieldCheck,
  Lock,
  Hammer,
  Wrench,
  Archive,
  History,
  FolderArchive,
  Calendar,
  Layers,
  Database,
  Download,
  Clock,
  Copy,
  Code,
} from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabaseClient';
import {
  AppSettings,
  GuruItem,
  TukangItem,
  BkuItem,
  RkasItem,
  TaxRecord,
  BukuPembantuPajakItem,
  RekapPajakItem,
} from '../types';
import { initialSettings } from '../data/initialData';
import {
  TriwulanBackupPackage,
  RestoreSelectionOptions,
  getSavedBackups,
  TRIWULAN_OPTIONS,
  downloadBackupAsJson,
} from '../utils/backupHelper';
import { BackupRestoreModal } from './BackupRestoreModal';
import { formatRupiah } from '../utils/formatters';
import {
  Cloud,
  CloudOff,
} from 'lucide-react';
import {
  LOGO_PEMKAB_LEBAK,
  LOGO_TUT_WURI,
  LOGO_KKG_PRESET,
  LOGO_MKKS_PRESET,
  processUploadedLogo,
} from '../utils/logoPresets';

interface PengaturanTabProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetAllData: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  cloudSyncStatus?: 'saved' | 'saving' | 'error' | 'offline';
  lastCloudSyncTime?: string | null;
  onManualSync?: () => void;
  bkuData?: BkuItem[];
  rkasData?: RkasItem[];
  taxRecords?: TaxRecord[];
  bppItems?: BukuPembantuPajakItem[];
  rekapItems?: RekapPajakItem[];
  selectedPeriode?: string;
  onRestoreData?: (backup: TriwulanBackupPackage, options: RestoreSelectionOptions) => void;
}

export const PengaturanTab: React.FC<PengaturanTabProps> = ({
  settings,
  onSaveSettings,
  onResetAllData,
  showToast,
  cloudSyncStatus = 'saved',
  lastCloudSyncTime,
  onManualSync,
  bkuData = [],
  rkasData = [],
  taxRecords = [],
  bppItems = [],
  rekapItems = [],
  selectedPeriode,
  onRestoreData,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupModalTab, setBackupModalTab] = useState<'backup' | 'restore' | 'upload'>('backup');
  const [savedBackups, setSavedBackups] = useState<TriwulanBackupPackage[]>([]);
  const [editingGuru, setEditingGuru] = useState<GuruItem | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isCopiedSql, setIsCopiedSql] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsCopiedSql(true);
    showToast('Script SQL Editor Supabase berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setIsCopiedSql(false), 3000);
  };

  useEffect(() => {
    if (settings.npsn) {
      setSavedBackups(getSavedBackups(settings.npsn));
    }
  }, [settings.npsn, isBackupModalOpen]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputKkgRef = useRef<HTMLInputElement>(null);
  const fileInputMkksRef = useRef<HTMLInputElement>(null);

  const [newGuru, setNewGuru] = useState<Partial<GuruItem>>({
    nama: '',
    nip: '-',
    jabatan: 'Guru Kelas',
    gol: '-',
    status: 'Honorer',
  });

  const [editingTukang, setEditingTukang] = useState<TukangItem | null>(null);
  const [newTukang, setNewTukang] = useState<Partial<TukangItem>>({
    nama: '',
    kualifikasi: 'Kepala Tukang',
    gajiPerHari: 120000,
    nik: '-',
    keahlian: '',
  });

  const handleChange = (field: keyof AppSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    try {
      setIsProcessingLogo(true);
      const optimizedLogo = await processUploadedLogo(file);
      setFormData((prev) => ({ ...prev, logoSekolah: optimizedLogo }));
      showToast('Logo berhasil diunggah! Jangan lupa klik Simpan Perubahan.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal memproses gambar logo', 'error');
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleSetPresetLogo = (presetUrl: string, name: string) => {
    setFormData((prev) => ({ ...prev, logoSekolah: presetUrl }));
    showToast(`Logo ${name} dipilih!`, 'info');
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoSekolah: '' }));
    showToast('Logo dihapus.', 'info');
  };

  const handleProcessKkgLogo = async (file: File) => {
    try {
      const processedUrl = await processUploadedLogo(file);
      setFormData((prev) => ({
        ...prev,
        kopKkg: {
          ...(prev.kopKkg || initialSettings.kopKkg!),
          logo: processedUrl,
        },
      }));
      showToast('Logo KKG berhasil diunggah & diperbarui!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal memproses logo KKG', 'error');
    }
  };

  const handleProcessMkksLogo = async (file: File) => {
    try {
      const processedUrl = await processUploadedLogo(file);
      setFormData((prev) => ({
        ...prev,
        kopMkks: {
          ...(prev.kopMkks || initialSettings.kopMkks!),
          logo: processedUrl,
        },
      }));
      showToast('Logo MKKS berhasil diunggah & diperbarui!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal memproses logo MKKS', 'error');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Kunci Nama Sekolah dan NPSN agar tidak dapat diubah (1 Akun 1 Sekolah)
    const lockedData: AppSettings = {
      ...formData,
      namaSekolah: settings.namaSekolah,
      npsn: settings.npsn,
    };
    onSaveSettings(lockedData);
    showToast('Pengaturan sekolah berhasil disimpan!', 'success');
  };

  const handleAddGuru = () => {
    if (!newGuru.nama?.trim()) {
      showToast('Masukkan nama guru/pegawai.', 'error');
      return;
    }

    const item: GuruItem = {
      id: `g-${Date.now()}`,
      nama: newGuru.nama.trim(),
      nip: newGuru.nip?.trim() || '-',
      jabatan: newGuru.jabatan || 'Guru Kelas',
      gol: newGuru.gol || '-',
      status: (newGuru.status as 'PNS' | 'PPPK' | 'Honorer') || 'Honorer',
    };

    const updated = {
      ...formData,
      guruList: [...formData.guruList, item],
    };

    setFormData(updated);
    onSaveSettings(updated);

    setNewGuru({
      nama: '',
      nip: '-',
      jabatan: 'Guru Kelas',
      gol: '-',
      status: 'Honorer',
    });

    showToast(`Pegawai ${item.nama} ditambahkan dan disinkronkan.`, 'info');
  };

  const handleRemoveGuru = (id: string | number) => {
    const updated = {
      ...formData,
      guruList: formData.guruList.filter((g) => g.id !== id),
    };
    setFormData(updated);
    onSaveSettings(updated);
    showToast('Pegawai dihapus dari daftar.', 'info');
  };

  const handleStartEditGuru = (guru: GuruItem) => {
    setEditingGuru({ ...guru });
  };

  const handleSaveEditedGuru = () => {
    if (!editingGuru || !editingGuru.nama.trim()) {
      showToast('Nama pegawai tidak boleh kosong.', 'error');
      return;
    }

    const updated = {
      ...formData,
      guruList: formData.guruList.map((g) => (g.id === editingGuru.id ? editingGuru : g)),
    };

    setFormData(updated);
    onSaveSettings(updated);

    setEditingGuru(null);
    showToast(`Data jabatan & pegawai ${editingGuru.nama} berhasil diperbarui dan disinkronkan!`, 'success');
  };

  const handleAddTukang = () => {
    if (!newTukang.nama || !newTukang.nama.trim()) {
      showToast('Nama pekerja / tukang wajib diisi.', 'error');
      return;
    }

    const item: TukangItem = {
      id: `tk-${Date.now()}`,
      nama: newTukang.nama.trim(),
      kualifikasi: newTukang.kualifikasi || 'Tukang',
      gajiPerHari: Number(newTukang.gajiPerHari) || 100000,
      nik: newTukang.nik || '-',
      keahlian: newTukang.keahlian || '',
    };

    const currentList = formData.tukangList || [];
    const updated = {
      ...formData,
      tukangList: [...currentList, item],
    };

    setFormData(updated);
    onSaveSettings(updated);

    setNewTukang({
      nama: '',
      kualifikasi: 'Tukang',
      gajiPerHari: 100000,
      nik: '-',
      keahlian: '',
    });

    showToast(`Pekerja ${item.nama} berhasil ditambahkan ke pengaturan.`, 'success');
  };

  const handleRemoveTukang = (id: string | number) => {
    const currentList = formData.tukangList || [];
    const updated = {
      ...formData,
      tukangList: currentList.filter((t) => t.id !== id),
    };
    setFormData(updated);
    onSaveSettings(updated);
    showToast('Data pekerja tukang dihapus dari pengaturan.', 'info');
  };

  const handleStartEditTukang = (item: TukangItem) => {
    setEditingTukang({ ...item });
  };

  const handleSaveEditedTukang = () => {
    if (!editingTukang || !editingTukang.nama.trim()) {
      showToast('Nama tukang tidak boleh kosong.', 'error');
      return;
    }

    const currentList = formData.tukangList || [];
    const updated = {
      ...formData,
      tukangList: currentList.map((t) => (t.id === editingTukang.id ? editingTukang : t)),
    };

    setFormData(updated);
    onSaveSettings(updated);

    setEditingTukang(null);
    showToast(`Data pekerja ${editingTukang.nama} berhasil diperbarui!`, 'success');
  };

  return (
    <div id="tab-pengaturan-view" className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
            Master Data Satuan Pendidikan
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            Pengaturan Profil Sekolah & Pejabat Penandatangan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Informasi di halaman ini otomatis diterapkan pada seluruh kop surat, kwitansi, SPTJM, SPPD, dan berkas BKU
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setBackupModalTab('backup');
              setIsBackupModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Cadangkan BKU Triwulan Ini Sebelum Dihapus"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Backup Triwulan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBackupModalTab('restore');
              setIsBackupModalOpen(true);
            }}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-indigo-200 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Buka / Pulihkan Arsip Triwulan Lalu"
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Restore Triwulan</span>
            {savedBackups.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-indigo-200 text-indigo-900 rounded-full text-[10px] font-extrabold">
                {savedBackups.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onResetAllData}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-rose-200 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data Awal</span>
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {/* Cloud Sync Status Card */}
      <div className="bg-gradient-to-r from-[#093262] via-[#0b4382] to-[#072449] p-5 rounded-2xl text-white shadow-xs border border-[#0d417d]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Cloud className="w-3 h-3 text-emerald-400" />
                Tersinkron Otomatis
              </span>
              {formData.npsn && (
                <span className="text-xs text-blue-200 font-mono">
                  NPSN: {formData.npsn}
                </span>
              )}
            </div>
            <h4 className="text-base font-extrabold text-white tracking-tight">
              Sinkronisasi Database {formData.namaSekolah || settings.namaSekolah || 'Sekolah'}
            </h4>
            <div className="text-xs text-blue-200/90 flex items-center gap-2 pt-0.5">
              <span>Status Terakhir:</span>
              <span className="font-semibold text-emerald-300">
                {cloudSyncStatus === 'saving'
                  ? 'Sedang menyimpan ke database...'
                  : cloudSyncStatus === 'error'
                  ? 'Gagal menyimpan (Cek koneksi internet)'
                  : lastCloudSyncTime
                  ? `Tersinkron Otomatis (${lastCloudSyncTime})`
                  : 'Tersinkron Otomatis'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              id="btn-sql-script-pengaturan"
              onClick={() => setIsSqlModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-blue-200 hover:text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
              title="Lihat & Salin Script SQL Editor Supabase"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Script SQL Supabase</span>
            </button>

            {onManualSync && (
              <button
                type="button"
                id="btn-manual-sync-pengaturan"
                onClick={onManualSync}
                disabled={cloudSyncStatus === 'saving'}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${cloudSyncStatus === 'saving' ? 'animate-spin' : ''}`}
                />
                <span>
                  {cloudSyncStatus === 'saving' ? 'Menyimpan...' : 'Sinkronkan Sekarang'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pusat Cadangan & Pemulihan Data Triwulan (BKU & SPJ) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Archive className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-extrabold text-sm text-slate-900">
                  Cadangan & Pemulihan Data Triwulan (BKU & SPJ)
                </h4>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                  Arsip BOSP Triwulanan
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Pengerjaan SPJ BOSP dilakukan setiap 3 bulan sekali. Sebelum BKU dikosongkan/dihapus untuk triwulan baru, cadangkan datanya agar saat ingin membuka triwulan sebelumnya tinggal dipulihkan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBackupModalTab('upload');
                setIsBackupModalOpen(true);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Unggah JSON</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBackupModalTab('backup');
                setIsBackupModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>+ Buat Cadangan Triwulan</span>
            </button>
          </div>
        </div>

        {/* 4 Kartu Triwulan (TW 1 s/d TW 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {TRIWULAN_OPTIONS.filter((t) => t.id !== 'SEMUA').map((opt) => {
            const backup = savedBackups.find((b) => b.triwulan === opt.id);
            const hasBackup = !!backup;

            return (
              <div
                key={opt.id}
                className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 ${
                  hasBackup
                    ? 'bg-gradient-to-b from-emerald-50/40 to-white border-emerald-200/90 shadow-2xs hover:shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
                        hasBackup
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        hasBackup ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {hasBackup ? '✓ Tersimpan' : 'Belum Ada'}
                    </span>
                  </div>

                  <h5 className="font-extrabold text-xs text-slate-900">{opt.label}</h5>
                  <p className="text-[11px] text-slate-500">{opt.bulan}</p>
                </div>

                {hasBackup ? (
                  <div className="space-y-2 pt-2 border-t border-emerald-100 text-[11px]">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Transaksi BKU:</span>
                      <span className="font-bold text-slate-900">{backup.stats.totalBku} data</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Total Belanja:</span>
                      <span className="font-bold text-rose-600 truncate max-w-[110px]" title={formatRupiah(backup.stats.totalKeluar)}>
                        {formatRupiah(backup.stats.totalKeluar)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(backup.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setBackupModalTab('restore');
                          setIsBackupModalOpen(true);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-2 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Pulihkan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadBackupAsJson(backup)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-emerald-100/60 rounded-xl transition-colors cursor-pointer border border-emerald-200"
                        title="Unduh Berkas JSON"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-700" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Cadangkan saat pengerjaan {opt.label} selesai atau sebelum reset BKU.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setBackupModalTab('backup');
                        setIsBackupModalOpen(true);
                      }}
                      className="w-full bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] py-1.5 px-2 rounded-xl border border-slate-300 transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                    >
                      <Archive className="w-3 h-3 text-slate-500" />
                      <span>Cadangkan Data</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 0: Logo Sekolah & Lambang Daerah (Terintegrasi Global) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Logo Satuan Pendidikan & Lambang Daerah
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Terintegrasi otomatis pada Menu Sidebar, Header, Kwitansi, Nota, Tanda Terima Honor, SPPD, dan Berkas SPJ
                </p>
              </div>
            </div>

            {formData.logoSekolah && (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full self-start sm:self-auto">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Logo Aktif Terintegrasi</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Logo Live Preview Frame */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-center">
              <div className="relative group">
                <div className="w-28 h-32 bg-white rounded-2xl border-2 border-slate-300 shadow-sm flex items-center justify-center p-2 overflow-hidden transition-all group-hover:border-blue-400">
                  {formData.logoSekolah ? (
                    <img
                      src={formData.logoSekolah}
                      alt="Logo Satuan Pendidikan"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <ImageIcon className="w-10 h-10 mx-auto stroke-[1.5] mb-1 text-slate-300" />
                      <span className="text-[10px] font-semibold block leading-tight">Belum Ada Logo</span>
                    </div>
                  )}
                </div>

                {formData.logoSekolah && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    title="Hapus Logo"
                    className="absolute -top-2 -right-2 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-md cursor-pointer transition-transform hover:scale-110"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-3 text-center">
                <p className="text-xs font-bold text-slate-800">
                  {formData.namaSekolah || 'SDN 1 CIBUNGUR'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Pratinjau Kop & Dokumen Resmi
                </p>
              </div>
            </div>

            {/* Upload Area & Quick Presets */}
            <div className="md:col-span-8 space-y-4">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/60 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50 bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                    {isProcessingLogo ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    ) : (
                      <Upload className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {isProcessingLogo ? (
                        'Memproses dan mengoptimalkan gambar...'
                      ) : (
                        <>
                          <span className="text-blue-600 underline">Klik untuk pilih berkas</span> atau seret gambar logo ke sini
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Mendukung format PNG, JPG, JPEG, SVG, WebP (Ukuran optimal transparan/persegi)
                    </p>
                  </div>
                </div>
              </div>

              {/* Preset Buttons for Instant Selection */}
              <div>
                <div className="flex items-center space-x-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Pilihan Cepat Lambang Resmi:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetPresetLogo(LOGO_PEMKAB_LEBAK, 'Pemkab Lebak')}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 transition-all cursor-pointer bg-white"
                  >
                    <img src={LOGO_PEMKAB_LEBAK} alt="Lebak" className="w-5 h-6 object-contain" />
                    <span>Lambang Pemkab Lebak (Resmi)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetPresetLogo(LOGO_TUT_WURI, 'Tut Wuri Handayani')}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-slate-700 transition-all cursor-pointer bg-white"
                  >
                    <img src={LOGO_TUT_WURI} alt="Tut Wuri" className="w-5 h-5 object-contain" />
                    <span>Tut Wuri Handayani (Kemdikbud)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Profil Sekolah */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <School className="w-5 h-5 text-blue-600" />
            <h4 className="font-extrabold text-sm text-slate-900">
              Identitas Lembaga Satuan Pendidikan
            </h4>
          </div>

          {/* Pemberitahuan Kunci Lisensi 1 Akun 1 Sekolah */}
          <div className="flex items-center justify-between p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-xs">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Kebijakan 1 Sekolah 1 Akun:</strong> Nama Satuan Pendidikan dan NPSN dikunci permanen sesuai lisensi akun terdaftar dan tidak dapat diubah dari menu pengaturan.
              </span>
            </div>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
              <ShieldCheck className="w-3 h-3 text-amber-600" />
              <span>Terkunci Akun Resmi</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Nama Satuan Pendidikan *</label>
                <span className="inline-flex items-center space-x-1 text-[10px] text-slate-500 font-semibold">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Terkunci</span>
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={formData.namaSekolah}
                title="Nama Sekolah dikunci permanen sesuai akun pendaftaran"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-100/90 text-slate-700 font-bold rounded-xl cursor-not-allowed select-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">NPSN *</label>
                <span className="inline-flex items-center space-x-1 text-[10px] text-slate-500 font-semibold">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Terkunci</span>
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={formData.npsn}
                title="NPSN dikunci permanen sesuai akun pendaftaran (1 Sekolah 1 Akun)"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-100/90 text-slate-700 font-mono font-bold rounded-xl cursor-not-allowed select-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tahun Anggaran</label>
              <input
                type="text"
                value={formData.tahunAnggaran}
                onChange={(e) => handleChange('tahunAnggaran', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap / Jalan</label>
              <input
                type="text"
                value={formData.alamat}
                onChange={(e) => handleChange('alamat', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Desa / Kelurahan</label>
              <input
                type="text"
                value={formData.desaKelurahan}
                onChange={(e) => handleChange('desaKelurahan', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kecamatan</label>
              <input
                type="text"
                value={formData.kecamatan}
                onChange={(e) => handleChange('kecamatan', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                value={formData.kabupaten}
                onChange={(e) => handleChange('kabupaten', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kota Tempat Titimangsa SPJ</label>
              <input
                type="text"
                value={formData.kotaTanggal}
                onChange={(e) => handleChange('kotaTanggal', e.target.value)}
                placeholder="Cigemblong"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section Khusus: Pengaturan Kop & Logo KKG & MKKS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Kop & Logo Khusus Administrasi Organisasi (KKG & MKKS)
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Atur logo dan teks kop khusus untuk kegiatan KKG dan MKKS. Format kegiatan lain otomatis mengikuti Kop Sekolah (Kop Tanda Terima).
                </p>
              </div>
            </div>
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Logo & Kop Dinamis</span>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KARTU KOP KKG */}
            <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                <span className="font-black text-xs text-emerald-950 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>Kop & Logo KKG (Kelompok Kerja Guru)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900">
                  Format Khusus
                </span>
              </div>

              {/* Logo KKG preview & uploader */}
              <div className="flex items-center space-x-4 bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                <div className="w-14 h-18 bg-emerald-50/50 rounded-lg border border-emerald-300 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  <img
                    src={formData.kopKkg?.logo || initialSettings.kopKkg?.logo || LOGO_KKG_PRESET}
                    alt="Logo KKG"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputKkgRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleProcessKkgLogo(f);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputKkgRef.current?.click()}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Logo KKG Baru</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          kopKkg: { ...(prev.kopKkg || initialSettings.kopKkg!), logo: LOGO_KKG_PRESET },
                        }))
                      }
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-1 px-1.5 border border-slate-200 rounded-md text-[10px] cursor-pointer"
                    >
                      Emblem KKG
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          kopKkg: { ...(prev.kopKkg || initialSettings.kopKkg!), logo: LOGO_TUT_WURI },
                        }))
                      }
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-1 px-1.5 border border-slate-200 rounded-md text-[10px] cursor-pointer"
                    >
                      Tut Wuri
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          kopKkg: { ...(prev.kopKkg || initialSettings.kopKkg!), logo: LOGO_PEMKAB_LEBAK },
                        }))
                      }
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-1 px-1.5 border border-slate-200 rounded-md text-[10px] cursor-pointer"
                    >
                      Pemkab
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Input Kop KKG */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Organisasi KKG (Teks Tebal Utama)</label>
                  <input
                    type="text"
                    value={formData.kopKkg?.namaOrganisasi || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        kopKkg: { ...(prev.kopKkg || initialSettings.kopKkg!), namaOrganisasi: e.target.value },
                      }))
                    }
                    placeholder="KELOMPOK KERJA GURU (KKG) GUGUS 02"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sub Organisasi / Wilayah / Gugus</label>
                  <input
                    type="text"
                    value={formData.kopKkg?.subOrganisasi || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        kopKkg: { ...(prev.kopKkg || initialSettings.kopKkg!), subOrganisasi: e.target.value },
                      }))
                    }
                    placeholder="KECAMATAN CIGEMBLONG"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Sekretariat</label>
                  <input
                    type="text"
                    value={formData.kopKkg?.alamatSekretariat || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        kopKkg: { ...(prev.kopKkg || initialSettings.kopKkg!), alamatSekretariat: e.target.value },
                      }))
                    }
                    placeholder="Sekretariat: SDN 1 Cibungur, Kp. Pasarkupa RT 02/03"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kontak Sekretariat & Email</label>
                  <input
                    type="text"
                    value={formData.kopKkg?.kontakSekretariat || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        kopKkg: { ...(prev.kopKkg || initialSettings.kopKkg!), kontakSekretariat: e.target.value },
                      }))
                    }
                    placeholder="Desa Cibungur, Kec. Cigemblong 42395 | Email: kkg.cigemblong@gmail.com"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* KARTU KOP MKKS */}
            <div className="p-5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                <span className="font-black text-xs text-blue-950 uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>Kop & Logo MKKS / K3S (Kepala Sekolah)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-200/70 text-blue-900">
                  Format Khusus
                </span>
              </div>

              {/* Logo MKKS preview & uploader */}
              <div className="flex items-center space-x-4 bg-white p-3.5 rounded-xl border border-blue-200 shadow-2xs">
                <div className="w-14 h-18 bg-blue-50/50 rounded-lg border border-blue-300 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                  <img
                    src={formData.kopMkks?.logo || initialSettings.kopMkks?.logo || LOGO_MKKS_PRESET}
                    alt="Logo MKKS"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputMkksRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleProcessMkksLogo(f);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputMkksRef.current?.click()}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-1 px-3 rounded-lg text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Logo MKKS Baru</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          kopMkks: { ...(prev.kopMkks || initialSettings.kopMkks!), logo: LOGO_MKKS_PRESET },
                        }))
                      }
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-1 px-1.5 border border-slate-200 rounded-md text-[10px] cursor-pointer"
                    >
                      Emblem MKKS
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          kopMkks: { ...(prev.kopMkks || initialSettings.kopMkks!), logo: LOGO_TUT_WURI },
                        }))
                      }
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-1 px-1.5 border border-slate-200 rounded-md text-[10px] cursor-pointer"
                    >
                      Tut Wuri
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          kopMkks: { ...(prev.kopMkks || initialSettings.kopMkks!), logo: LOGO_PEMKAB_LEBAK },
                        }))
                      }
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-1 px-1.5 border border-slate-200 rounded-md text-[10px] cursor-pointer"
                    >
                      Pemkab
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Input Kop MKKS */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Organisasi MKKS (Teks Tebal Utama)</label>
                  <input
                    type="text"
                    value={formData.kopMkks?.namaOrganisasi || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        kopMkks: { ...(prev.kopMkks || initialSettings.kopMkks!), namaOrganisasi: e.target.value },
                      }))
                    }
                    placeholder="MUSYAWARAH KERJA KEPALA SEKOLAH (MKKS)"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sub Organisasi / Wilayah / Sub Rayon</label>
                  <input
                    type="text"
                    value={formData.kopMkks?.subOrganisasi || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        kopMkks: { ...(prev.kopMkks || initialSettings.kopMkks!), subOrganisasi: e.target.value },
                      }))
                    }
                    placeholder="SUB RAYON / KECAMATAN CIGEMBLONG"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Sekretariat</label>
                  <input
                    type="text"
                    value={formData.kopMkks?.alamatSekretariat || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        kopMkks: { ...(prev.kopMkks || initialSettings.kopMkks!), alamatSekretariat: e.target.value },
                      }))
                    }
                    placeholder="Sekretariat: Kantor K3S / MKKS Kec. Cigemblong"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kontak Sekretariat & Wilayah</label>
                  <input
                    type="text"
                    value={formData.kopMkks?.kontakSekretariat || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        kopMkks: { ...(prev.kopMkks || initialSettings.kopMkks!), kontakSekretariat: e.target.value },
                      }))
                    }
                    placeholder="Kabupaten Lebak, Provinsi Banten | Kode Pos 42395"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Banner Informasi Standarisasi Format Lain */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-3 text-xs text-slate-600">
            <School className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-800">Format Lainnya Mengikuti Pengaturan Sekolah:</strong> Untuk kegiatan Surat Undangan, Daftar Hadir, dan Penerimaan Konsumsi berjenis <span className="font-semibold text-slate-800">Rapat Dinas Sekolah</span>, <span className="font-semibold text-slate-800">KKG Sekolah (Satuan Pendidikan)</span>, <span className="font-semibold text-slate-800">Komunitas Belajar (Kombel)</span>, maupun <span className="font-semibold text-slate-800">Lomba Siswa</span>, kop surat dan logo secara otomatis menggunakan identitas satuan pendidikan (persis seperti format Kop Tanda Terima).
            </p>
          </div>
        </div>

        {/* Section 2: Pejabat Penandatangan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h4 className="font-extrabold text-sm text-slate-900">
              Pejabat Penandatangan SPJ (Kepala Sekolah & Bendahara)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Kepala Sekolah */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h5 className="font-bold text-slate-800 flex items-center text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
                Kepala Sekolah (Penanggung Jawab Mutlak)
              </h5>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={formData.namaKepsek}
                  onChange={(e) => handleChange('namaKepsek', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={formData.nipKepsek}
                  onChange={(e) => handleChange('nipKepsek', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Bendahara */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h5 className="font-bold text-slate-800 flex items-center text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 mr-2"></span>
                Bendahara BOSP Satuan Pendidikan
              </h5>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={formData.namaBendahara}
                  onChange={(e) => handleChange('namaBendahara', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">NIP Bendahara</label>
                <input
                  type="text"
                  value={formData.nipBendahara}
                  onChange={(e) => handleChange('nipBendahara', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Rekening Kas Sekolah */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h4 className="font-extrabold text-sm text-slate-900">
              Rekening Kas Sekolah Penampung Dana BOSP
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Bank Operasional</label>
              <input
                type="text"
                value={formData.namaBank}
                onChange={(e) => handleChange('namaBank', e.target.value)}
                placeholder="Bank BJB / Bank Banten"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Rekening BOSP</label>
              <input
                type="text"
                value={formData.noRekening}
                onChange={(e) => handleChange('noRekening', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Atas Nama Rekening</label>
              <input
                type="text"
                value={formData.rekeningAtasNama}
                onChange={(e) => handleChange('rekeningAtasNama', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Data Guru & Tenaga Kependidikan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">
                Daftar Tenaga Pendidik & Kependidikan (Guru & Tendik)
              </h4>
              <p className="text-xs text-slate-500">
                Digunakan untuk auto-complete pada modul Tanda Terima Honor, Panitia, dan SPPD
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Total {formData.guruList.length} Personel
            </span>
          </div>

          {/* Add Guru Inline Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <p className="font-bold text-slate-700 mb-2">Tambah Pegawai / Guru Baru:</p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                placeholder="Nama Lengkap & Gelar *"
                value={newGuru.nama || ''}
                onChange={(e) => setNewGuru({ ...newGuru, nama: e.target.value })}
                className="sm:col-span-4 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="NIP / - *"
                value={newGuru.nip || ''}
                onChange={(e) => setNewGuru({ ...newGuru, nip: e.target.value })}
                className="sm:col-span-3 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
              <input
                type="text"
                placeholder="Jabatan"
                value={newGuru.jabatan || ''}
                onChange={(e) => setNewGuru({ ...newGuru, jabatan: e.target.value })}
                className="sm:col-span-3 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddGuru}
                className="sm:col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg flex items-center justify-center space-x-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </div>

          {/* Table List of Teachers */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-600">
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Nama Lengkap</th>
                  <th className="py-2.5 px-3">NIP</th>
                  <th className="py-2.5 px-3">Jabatan</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.guruList.map((g, idx) => (
                  <tr key={g.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">{g.nama}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{g.nip}</td>
                    <td className="py-2 px-3 text-slate-700 font-medium">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                        {g.jabatan}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {g.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditGuru(g)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Pegawai & Jabatan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveGuru(g.id)}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Pegawai"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Daftar Tukang / Pekerja Pemeliharaan Sarana (Upah Tukang) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80">
                <Hammer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Daftar Tukang / Pekerja Pemeliharaan Sarana (Upah Tukang)
                </h4>
                <p className="text-xs text-slate-500">
                  Data pekerja tukang yang tersimpan di sini akan otomatis terdeteksi dan diisi ke tanda terima saat transaksi upah tukang (kode 03.04 / 5.1.02.02.01.0013) diunggah di BKU
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
              Total {(formData.tukangList || []).length} Pekerja
            </span>
          </div>

          {/* Form Tambah Tukang */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
            <h5 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>Tambah Pekerja Tukang Baru</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Pekerja / Tukang *
                </label>
                <input
                  type="text"
                  value={newTukang.nama || ''}
                  onChange={(e) => setNewTukang({ ...newTukang, nama: e.target.value })}
                  placeholder="Nama Lengkap..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kualifikasi Pekerjaan
                </label>
                <select
                  value={newTukang.kualifikasi || 'Tukang'}
                  onChange={(e) => setNewTukang({ ...newTukang, kualifikasi: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  <option value="Kepala Tukang">Kepala Tukang</option>
                  <option value="Tukang">Tukang</option>
                  <option value="Tukang Bangunan">Tukang Bangunan</option>
                  <option value="Tukang Kayu / Kusen">Tukang Kayu / Kusen</option>
                  <option value="Tukang Cat & Plafon">Tukang Cat & Plafon</option>
                  <option value="Tukang Listrik / Sanitasi">Tukang Listrik / Sanitasi</option>
                  <option value="Pekerja / Laden">Pekerja / Laden</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Standar Gaji / Hari (Rp)
                </label>
                <input
                  type="number"
                  value={newTukang.gajiPerHari || 100000}
                  onChange={(e) =>
                    setNewTukang({ ...newTukang, gajiPerHari: Number(e.target.value) || 0 })
                  }
                  placeholder="100000"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Keahlian / Spesialisasi
                </label>
                <input
                  type="text"
                  value={newTukang.keahlian || ''}
                  onChange={(e) => setNewTukang({ ...newTukang, keahlian: e.target.value })}
                  placeholder="misal: Cat, Bangunan, Atap"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddTukang}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-lg shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tukang</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabel Tukang */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Nama Pekerja</th>
                  <th className="py-2.5 px-3">Kualifikasi</th>
                  <th className="py-2.5 px-3 text-right">Gaji / Hari (Rp)</th>
                  <th className="py-2.5 px-3">Keahlian</th>
                  <th className="py-2.5 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(formData.tukangList || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      <Hammer className="w-7 h-7 mx-auto mb-2 text-slate-300 stroke-1" />
                      <p className="font-semibold text-slate-600 text-xs">Belum ada data tukang / pekerja</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tambahkan nama tukang di form atas agar lembar tanda terima upah tukang otomatis terisi saat transaksi BKU terdeteksi.
                      </p>
                    </td>
                  </tr>
                ) : (
                  (formData.tukangList || []).map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{t.nama}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-medium rounded-md border border-amber-200 text-[11px]">
                          {t.kualifikasi}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(t.gajiPerHari || 0)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{t.keahlian || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditTukang(t)}
                            className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Pekerja"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTukang(t.id)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Pekerja"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Zona Pemeliharaan & Reset Data */}
        <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-rose-200/60">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div>
              <h4 className="font-extrabold text-sm text-rose-950">
                Zona Pembersihan & Reset Data Aplikasi
              </h4>
              <p className="text-xs text-rose-700">
                Gunakan fitur ini jika ingin mencegah tumpukan data lama dan memulai pembukuan dari lembar bersih 100%
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="text-xs text-slate-600 max-w-xl">
              <p className="font-semibold text-slate-800 mb-0.5">Reset Seluruh Data Pembukuan (RKAS, BKU, & Pajak)</p>
              <p>
                Menghapus data tersimpan di memori lokal peramban Anda. Anda dapat memilih untuk mengosongkan seluruh tabel menjadi 0 baris atau mengembalikan ke data contoh bawaan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer flex-shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Buka Menu Reset Data</span>
            </button>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setBackupModalTab('backup');
                setIsBackupModalOpen(true);
              }}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-200 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Archive className="w-4 h-4 text-emerald-600" />
              <span>Backup Triwulan</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBackupModalTab('restore');
                setIsBackupModalOpen(true);
              }}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-indigo-200 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <History className="w-4 h-4 text-indigo-600" />
              <span>Restore Triwulan</span>
            </button>
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer w-full sm:w-auto justify-center"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Seluruh Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Modal Edit Data Guru & Jabatan */}
      {editingGuru && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Edit Data Pegawai & Jabatan
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Sesuaikan jabatan untuk integrasi otomatis Tanda Terima Honor BOSP
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGuru(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={editingGuru.nama}
                  onChange={(e) => setEditingGuru({ ...editingGuru, nama: e.target.value })}
                  placeholder="misal: KARTANI, S.H / Siti Rohmah, S.Pd"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIP / NUPTK / -
                  </label>
                  <input
                    type="text"
                    value={editingGuru.nip}
                    onChange={(e) => setEditingGuru({ ...editingGuru, nip: e.target.value })}
                    placeholder="1982... atau -"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Kepegawaian
                  </label>
                  <select
                    value={editingGuru.status}
                    onChange={(e) =>
                      setEditingGuru({
                        ...editingGuru,
                        status: e.target.value as 'PNS' | 'PPPK' | 'Honorer',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Honorer">Honorer (GTT / PTT)</option>
                    <option value="PPPK">PPPK</option>
                    <option value="PNS">PNS</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Jabatan Pegawai / Guru *
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    Acuan Tanda Terima Honor
                  </span>
                </div>
                <input
                  type="text"
                  required
                  list="jabatan-master-list"
                  value={editingGuru.jabatan}
                  onChange={(e) => setEditingGuru({ ...editingGuru, jabatan: e.target.value })}
                  placeholder="Pilih atau ketik jabatan..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-blue-900 bg-blue-50/30 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <datalist id="jabatan-master-list">
                  <option value="Guru Kelas" />
                  <option value="Guru Kelas 1" />
                  <option value="Guru Kelas 2" />
                  <option value="Guru Kelas 3" />
                  <option value="Guru Kelas 4" />
                  <option value="Guru Kelas 5" />
                  <option value="Guru Kelas 6" />
                  <option value="Guru PJOK" />
                  <option value="Guru Agama Islam" />
                  <option value="Tenaga Administrasi Sekolah (TAS)" />
                  <option value="Tenaga Kependidikan / Operator" />
                  <option value="Penjaga Sekolah / Satpam" />
                  <option value="Tenaga Kebersihan" />
                  <option value="Bendahara BOSP / Guru Kelas" />
                  <option value="Kepala Sekolah" />
                </datalist>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    'Guru Kelas',
                    'Tenaga Administrasi Sekolah (TAS)',
                    'Tenaga Kependidikan / Operator',
                    'Guru PJOK',
                    'Guru Agama Islam',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditingGuru({ ...editingGuru, jabatan: preset })}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Golongan / Ruang
                  </label>
                  <input
                    type="text"
                    value={editingGuru.gol || '-'}
                    onChange={(e) => setEditingGuru({ ...editingGuru, gol: e.target.value })}
                    placeholder="misal: IX / III/a / -"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Honor Standar per Bulan (Rp)
                  </label>
                  <input
                    type="number"
                    value={editingGuru.honorPerBulan || 0}
                    onChange={(e) =>
                      setEditingGuru({
                        ...editingGuru,
                        honorPerBulan: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="misal: 1000000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                💡 <strong>Catatan Integrasi:</strong> Nama dan jabatan yang Anda simpan di sini akan secara otomatis sinkron dan menjadi acuan utama pada modul Tanda Terima Honor BOSP dan SPPD.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingGuru(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditedGuru}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Perubahan Pegawai</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Tukang */}
      {editingTukang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Hammer className="w-5 h-5 text-amber-600" />
                <h4 className="font-extrabold text-base text-slate-900">
                  Edit Data Pekerja Tukang
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingTukang(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Pekerja / Tukang *
                </label>
                <input
                  type="text"
                  required
                  value={editingTukang.nama}
                  onChange={(e) => setEditingTukang({ ...editingTukang, nama: e.target.value })}
                  placeholder="Nama Lengkap Pekerja..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kualifikasi Pekerjaan
                  </label>
                  <select
                    value={editingTukang.kualifikasi || 'Tukang'}
                    onChange={(e) =>
                      setEditingTukang({
                        ...editingTukang,
                        kualifikasi: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <option value="Kepala Tukang">Kepala Tukang</option>
                    <option value="Tukang">Tukang</option>
                    <option value="Tukang Bangunan">Tukang Bangunan</option>
                    <option value="Tukang Kayu / Kusen">Tukang Kayu / Kusen</option>
                    <option value="Tukang Cat & Plafon">Tukang Cat & Plafon</option>
                    <option value="Tukang Listrik / Sanitasi">Tukang Listrik / Sanitasi</option>
                    <option value="Pekerja / Laden">Pekerja / Laden</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Standar Gaji / Hari (Rp)
                  </label>
                  <input
                    type="number"
                    value={editingTukang.gajiPerHari || 0}
                    onChange={(e) =>
                      setEditingTukang({
                        ...editingTukang,
                        gajiPerHari: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="100000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIK / No. KTP
                  </label>
                  <input
                    type="text"
                    value={editingTukang.nik || ''}
                    onChange={(e) => setEditingTukang({ ...editingTukang, nik: e.target.value })}
                    placeholder="misal: 360212..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Keahlian / Spesialisasi
                  </label>
                  <input
                    type="text"
                    value={editingTukang.keahlian || ''}
                    onChange={(e) => setEditingTukang({ ...editingTukang, keahlian: e.target.value })}
                    placeholder="misal: Cat, Bangunan, Kusen"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
                💡 <strong>Catatan Integrasi:</strong> Data tukang yang disimpan di sini akan otomatis digunakan pada format lembar tanda terima upah tukang saat transaksi terkait terdeteksi di BKU.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTukang(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditedTukang}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Perubahan Tukang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">Reset Data Global Aplikasi</h4>
                  <p className="text-xs text-slate-500">Cegah tumpukan data untuk pembukuan baru</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan membersihkan data yang tersimpan di sistem lokal browser Anda. Silakan pilih opsi pembersihan:
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onResetAllData();
                  setIsResetModalOpen(false);
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset ke Data Contoh Default (Factory Reset)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer text-center"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup & Restore Triwulan Modal */}
      {isBackupModalOpen && onRestoreData && (
        <BackupRestoreModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          initialTab={backupModalTab}
          settings={settings}
          bkuData={bkuData}
          rkasData={rkasData}
          taxRecords={taxRecords}
          bppItems={bppItems}
          rekapItems={rekapItems}
          selectedPeriode={selectedPeriode}
          onRestoreData={onRestoreData}
          showToast={showToast}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: SCRIPT SQL EDITOR SUPABASE */}
      {/* ========================================================= */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700/80 w-full max-w-3xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Script SQL Editor Supabase
                  </h3>
                  <p className="text-xs text-slate-400">
                    Skrip DDL untuk membuat tabel <span className="text-emerald-400 font-mono font-bold">schools</span> &amp; <span className="text-emerald-400 font-mono font-bold">school_workspaces</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Petunjuk Penggunaan */}
            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 space-y-1.5">
              <p className="font-bold text-blue-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Langkah Cepat di Dashboard Supabase:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
                <li>Buka dashboard proyek Anda di <strong>https://supabase.com</strong>.</li>
                <li>Pilih menu <strong>SQL Editor</strong> (ikon <code className="text-amber-300 font-mono">&gt;_</code>) di bilah navigasi kiri.</li>
                <li>Klik tombol <strong>"New query"</strong>.</li>
                <li>Klik tombol <strong>"Salin Semua Script SQL"</strong> di bawah, lalu tempel (Paste) ke editor.</li>
                <li>Klik tombol <strong>"Run"</strong> (tombol hijau) untuk mengeksekusi. Selesai!</li>
              </ol>
            </div>

            {/* Container Code Editor */}
            <div className="flex-1 min-h-0 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-amber-400" />
                  SQL Script (PostgreSQL / Supabase):
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isCopiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Semua Script SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 custom-scrollbar leading-relaxed selection:bg-emerald-700 selection:text-white max-h-[300px]">
                <pre className="whitespace-pre">{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Otomatis mengaktifkan Row Level Security (RLS) &amp; Indexing cepat.
              </span>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
