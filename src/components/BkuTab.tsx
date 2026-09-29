import React, { useState, useRef, useMemo } from 'react';
import {
  BookOpen,
  RotateCcw,
  Download,
  Search,
  Trash2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Archive,
  History,
  TrendingUp,
  TrendingDown,
  Wallet,
  Layers,
  PlusCircle,
  SlidersHorizontal,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import {
  AppSettings,
  BkuItem,
  RkasItem,
  TaxRecord,
  BukuPembantuPajakItem,
  RekapPajakItem,
} from '../types';
import { initialBkuData } from '../data/initialData';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { exportBkuToExcel, parseBkuExcel } from '../utils/excelHelper';
import {
  TriwulanBackupPackage,
  RestoreSelectionOptions,
} from '../utils/backupHelper';
import { BackupRestoreModal } from './BackupRestoreModal';
import {
  DAFTAR_BULAN,
  filterBkuByMonth,
  mergeBkuMonthly,
  getBkuItemMonth,
  getMonthNameFromDate,
  getTriwulanFromMonth,
  reconcileBkuBalances,
} from '../utils/monthHelper';

interface BkuTabProps {
  settings: AppSettings;
  bkuData: BkuItem[];
  onUpdateBku: (data: BkuItem[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  rkasData?: RkasItem[];
  taxRecords?: TaxRecord[];
  bppItems?: BukuPembantuPajakItem[];
  rekapItems?: RekapPajakItem[];
  selectedPeriode?: string;
  selectedBulan?: string;
  onBulanChange?: (b: string) => void;
  onRestoreData?: (backup: TriwulanBackupPackage, options: RestoreSelectionOptions) => void;
}

export const BkuTab: React.FC<BkuTabProps> = ({
  settings,
  bkuData,
  onUpdateBku,
  showToast,
  rkasData = [],
  taxRecords = [],
  bppItems = [],
  rekapItems = [],
  selectedPeriode,
  selectedBulan = 'Januari',
  onBulanChange,
  onRestoreData,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'terima' | 'keluar' | 'bpu'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupModalTab, setBackupModalTab] = useState<'backup' | 'restore' | 'upload'>('backup');

  // Form New Transaction
  const [formData, setFormData] = useState({
    tgl: new Date().toISOString().split('T')[0],
    tipe: 'keluar' as 'terima' | 'keluar',
    kodeKeg: '',
    kodeRek: '',
    noBukti: '',
    uraian: '',
    nominal: 0,
    tokoName: '',
    penerimaName: '',
  });

  const [viewMode, setViewMode] = useState<'month_only' | 'all_year'>('month_only');
  const effectiveMonth = selectedBulan || 'Januari';
  const isSingleMonth = effectiveMonth !== 'Semua Bulan';

  // Menjaga dan merekonsiliasi saldo BKU sesuai kaidah ARKAS BOSP
  const recomputeBalances = (items: BkuItem[]): BkuItem[] => {
    return reconcileBkuBalances(items);
  };

  // Filter transaksi untuk bulan yang dipilih
  const monthItems = useMemo(() => {
    return isSingleMonth ? filterBkuByMonth(bkuData, effectiveMonth) : bkuData;
  }, [bkuData, effectiveMonth, isSingleMonth]);

  // Transaksi dasar yang ditampilkan berdasarkan toggle view
  const baseData = viewMode === 'month_only' && isSingleMonth ? monthItems : bkuData;

  const totalTerima = bkuData.reduce((acc, curr) => acc + (Number(curr.terima) || 0), 0);
  const totalKeluar = bkuData.reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);
  const saldoAkhirBulan = monthItems.length > 0 ? Number(monthItems[monthItems.length - 1].saldo) || 0 : 0;
  const saldoAkhirTahun = bkuData.length > 0 ? Number(bkuData[bkuData.length - 1].saldo) || 0 : 0;
  const effectiveSaldoAkhir = viewMode === 'month_only' && isSingleMonth ? saldoAkhirBulan : saldoAkhirTahun;
  const lastSaldo = effectiveSaldoAkhir;

  const totalTerimaBulan = monthItems.reduce((acc, curr) => acc + (Number(curr.terima) || 0), 0);
  const totalKeluarBulan = monthItems.reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);

  const countTerima = baseData.filter((b) => (Number(b.terima) || 0) > 0).length;
  const countKeluar = baseData.filter((b) => (Number(b.keluar) || 0) > 0).length;
  const countBpu = baseData.filter((b) => {
    const n = b.noBukti?.trim().toUpperCase();
    return n && n !== '-' && n.startsWith('BPU');
  }).length;
  const countBpuBulan = monthItems.filter((b) => {
    const n = b.noBukti?.trim().toUpperCase();
    return n && n !== '-' && n.startsWith('BPU');
  }).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const parsed = parseBkuExcel(buffer);
        if (parsed.length > 0) {
          if (isSingleMonth) {
            // Gabungkan ke bulan yang sedang aktif tanpa menghapus bulan lain
            const merged = mergeBkuMonthly(bkuData, parsed, effectiveMonth, 'replace_month');
            const reconciled = reconcileBkuBalances(merged);
            onUpdateBku(reconciled);
            const finalSaldo = parsed[parsed.length - 1]?.saldo ?? 0;
            showToast(
              `Upload Berhasil! ${parsed.length} baris BKU disimpan untuk Bulan ${effectiveMonth}. Saldo akhir disesuaikan: ${formatRupiah(finalSaldo)}.`,
              'success'
            );
          } else {
            const reconciled = reconcileBkuBalances(parsed);
            onUpdateBku(reconciled);
            showToast(`Upload Berhasil! ${parsed.length} baris BKU berhasil disimpan ke seluruh periode.`, 'success');
          }
        } else {
          showToast('Tidak ada baris transaksi yang terbaca. Pastikan format tabel BKU valid.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Gagal memproses file Excel BKU.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
  };

  const handleEmptyMonthBku = () => {
    if (isSingleMonth) {
      const remaining = bkuData.filter((item) => getBkuItemMonth(item) !== effectiveMonth);
      const recomputed = recomputeBalances(remaining);
      onUpdateBku(recomputed);
      setIsResetModalOpen(false);
      showToast(`Data BKU Bulan ${effectiveMonth} berhasil dikosongkan. Bulan lain tetap tersimpan.`, 'success');
    } else {
      handleEmptyAllBku();
    }
  };

  const handleEmptyAllBku = () => {
    onUpdateBku([]);
    setIsResetModalOpen(false);
    showToast('Seluruh data BKU berhasil dikosongkan (0 baris). Tampilan bersih 100% siap untuk upload baru.', 'success');
  };

  const handleRestoreDefaultBku = () => {
    onUpdateBku(initialBkuData);
    setIsResetModalOpen(false);
    showToast('Data BKU berhasil dipulihkan ke data contoh standar BOSP.', 'info');
  };

  const handleExport = () => {
    if (bkuData.length === 0) {
      showToast('Tidak ada data BKU untuk diekspor.', 'error');
      return;
    }
    exportBkuToExcel(bkuData, settings.namaSekolah);
    showToast('File Excel BKU berhasil diunduh.', 'success');
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uraian || formData.nominal <= 0) {
      showToast('Uraian dan nominal transaksi wajib diisi valid.', 'error');
      return;
    }

    // Format date to DD-MM-YYYY
    const dParts = formData.tgl.split('-');
    const formattedDate = dParts.length === 3 ? `${dParts[2]}-${dParts[1]}-${dParts[0]}` : formData.tgl;

    const newItem: BkuItem = {
      id: `bku-user-${Date.now()}`,
      tgl: formattedDate,
      kodeKeg: formData.kodeKeg.trim(),
      kodeRek: formData.kodeRek.trim(),
      noBukti: formData.noBukti.trim() || '-',
      uraian: formData.uraian.trim(),
      terima: formData.tipe === 'terima' ? formData.nominal : 0,
      keluar: formData.tipe === 'keluar' ? formData.nominal : 0,
      saldo: 0,
      tokoName: formData.tokoName.trim(),
      penerimaName: formData.penerimaName.trim(),
      bulan: isSingleMonth ? effectiveMonth : getMonthNameFromDate(formattedDate) || 'Januari',
    };

    const updated = recomputeBalances([...bkuData, newItem]);
    onUpdateBku(updated);
    setIsAddModalOpen(false);
    setFormData({
      tgl: new Date().toISOString().split('T')[0],
      tipe: 'keluar',
      kodeKeg: '',
      kodeRek: '',
      noBukti: '',
      uraian: '',
      nominal: 0,
      tokoName: '',
      penerimaName: '',
    });
    showToast('Transaksi BKU baru berhasil ditambahkan.', 'success');
  };

  const handleDeleteItem = (itemIdOrIdx: string | number) => {
    let updated: BkuItem[];
    if (typeof itemIdOrIdx === 'string') {
      updated = bkuData.filter((item) => item.id !== itemIdOrIdx);
    } else {
      updated = [...bkuData];
      updated.splice(itemIdOrIdx, 1);
    }
    const recomputed = recomputeBalances(updated);
    onUpdateBku(recomputed);
    showToast('Transaksi BKU berhasil dihapus.', 'info');
  };

  const filteredData = baseData.filter((item) => {
    if (filterType === 'terima' && (Number(item.terima) || 0) <= 0) return false;
    if (filterType === 'keluar' && (Number(item.keluar) || 0) <= 0) return false;
    if (filterType === 'bpu') {
      const b = item.noBukti?.trim().toUpperCase();
      if (!b || b === '-' || !b.startsWith('BPU')) return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.uraian.toLowerCase().includes(q) ||
      item.noBukti.toLowerCase().includes(q) ||
      item.kodeRek.toLowerCase().includes(q) ||
      item.tgl.includes(q)
    );
  });

  return (
    <div id="tab-bku-view" className="space-y-5">
      {/* Action Header Card - Rapih, Simpel, Interaktif, dengan Warna Background */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-[#072449] via-[#093262] to-[#0c4382] text-white border border-[#0d417d] shadow-lg space-y-4.5">
        {/* Subtle decorative glow elements */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        {/* Top Section: Title & Actions Toolbar */}
        <div className="relative z-1 flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Format Resmi BKU ARKAS 4.1 Kemendikdasmen
              </span>
              {selectedPeriode && (
                <span className="px-2.5 py-0.5 bg-white/10 text-blue-200 border border-white/15 text-[10px] font-medium rounded-full">
                  {selectedPeriode}
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Buku Kas Umum (BKU) {isSingleMonth ? `Bulan ${effectiveMonth}` : '1 Tahun Penuh'} {settings.tahunAnggaran || '2026'}
            </h3>
            <p className="text-xs text-blue-100/80 max-w-2xl font-normal leading-relaxed">
              Pencatatan real-time arus penerimaan dan pengeluaran kas BOSP bulanan yang tersinkronisasi otomatis dengan database Supabase
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Dropdown Pilihan Bulan BKU */}
            {onBulanChange && (
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-white shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-blue-200">Bulan:</span>
                <select
                  value={effectiveMonth}
                  onChange={(e) => onBulanChange(e.target.value)}
                  className="bg-[#072449] text-xs font-black text-white border border-blue-400/40 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                >
                  {DAFTAR_BULAN.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Semua Bulan">Semua Bulan (1 Tahun)</option>
                </select>
              </div>
            )}

            {/* Primary Actions */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:shadow-emerald-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
              title={`Unggah file Excel BKU untuk Bulan ${effectiveMonth} (.xlsx)`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unggah BKU ({effectiveMonth})</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:shadow-blue-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Tambah Transaksi BKU Manual"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Transaksi</span>
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Unduh BKU dalam format Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-blue-200" />
              <span>Unduh Excel</span>
            </button>

            {/* Subtle Divider */}
            <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block" />

            {/* Utility Actions: Backup, Restore, Reset */}
            <button
              type="button"
              onClick={() => {
                setBackupModalTab('backup');
                setIsBackupModalOpen(true);
              }}
              className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs px-3 py-2 rounded-xl border border-white/15 transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Cadangkan Data BKU Triwulan Ini Sebelum Dihapus"
            >
              <Archive className="w-3.5 h-3.5 text-emerald-300" />
              <span>Backup</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBackupModalTab('restore');
                setIsBackupModalOpen(true);
              }}
              className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs px-3 py-2 rounded-xl border border-white/15 transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Pulihkan / Buka BKU Triwulan Sebelumnya"
            >
              <History className="w-3.5 h-3.5 text-indigo-300" />
              <span>Restore</span>
            </button>

            <button
              type="button"
              onClick={handleOpenResetModal}
              className="bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-200 hover:text-white border border-rose-400/30 font-semibold text-xs px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Reset atau Kosongkan Data BKU"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Bottom Section: Search & Quick Interactive Filters */}
        <div className="relative z-1 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-0.5">
          {/* Search Input with Clear Button */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-blue-200/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi / no. BPU / tanggal..."
              className="w-full pl-9 pr-8 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 focus:border-amber-400 text-white placeholder-blue-200/60 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Month vs All-Year Toggle */}
          {isSingleMonth && (
            <div className="flex items-center p-1 bg-white/10 rounded-xl border border-white/15 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('month_only')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'month_only'
                    ? 'bg-amber-400 text-[#072449] shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                Bulan {effectiveMonth} ({monthItems.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all_year')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'all_year'
                    ? 'bg-amber-400 text-[#072449] shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                Semua Bulan 1 Tahun ({bkuData.length})
              </button>
            </div>
          )}

          {/* Interactive Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-blue-200/70 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Filter:</span>
            </span>

            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'all'
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10'
              }`}
            >
              <span>Semua</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterType === 'all' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/15 text-blue-200'
                }`}
              >
                {baseData.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('terima')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'terima'
                  ? 'bg-emerald-400 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10'
              }`}
            >
              <span>Penerimaan</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterType === 'terima' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/15 text-blue-200'
                }`}
              >
                {countTerima}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('keluar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'keluar'
                  ? 'bg-rose-400 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10'
              }`}
            >
              <span>Pengeluaran</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterType === 'keluar' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/15 text-blue-200'
                }`}
              >
                {countKeluar}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('bpu')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'bpu'
                  ? 'bg-blue-300 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10'
              }`}
            >
              <span>Ada BPU</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterType === 'bpu' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/15 text-blue-200'
                }`}
              >
                {countBpu}
              </span>
            </button>

            {(filterType !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterType('all');
                  setSearchQuery('');
                }}
                className="text-[11px] text-amber-300 hover:text-amber-200 underline font-medium ml-1 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards - 4 Komponen dengan Variasi Warna Estetik & Fungsional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Penerimaan */}
        <div className="relative overflow-hidden rounded-2xl p-4.5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xs border border-emerald-400/40 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                PENERIMAAN {isSingleMonth ? `(${effectiveMonth})` : '1 TAHUN'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-emerald-100 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h4 className="text-lg xl:text-xl font-black text-white mt-2 tracking-tight tabular-nums">
              {formatRupiah(isSingleMonth ? totalTerimaBulan : totalTerima)}
            </h4>
          </div>
          <p className="text-[10px] text-emerald-100/90 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />
            <span>{isSingleMonth ? `Total 1 Tahun: ${formatRupiah(totalTerima)}` : 'Termasuk saldo awal kas & bank'}</span>
          </p>
        </div>

        {/* 2. Total Pengeluaran */}
        <div className="relative overflow-hidden rounded-2xl p-4.5 bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 text-white shadow-xs border border-rose-400/40 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-200 flex items-center gap-1.5">
                PENGELUARAN {isSingleMonth ? `(${effectiveMonth})` : '1 TAHUN'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-rose-100 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <h4 className="text-lg xl:text-xl font-black text-white mt-2 tracking-tight tabular-nums">
              {formatRupiah(isSingleMonth ? totalKeluarBulan : totalKeluar)}
            </h4>
          </div>
          <p className="text-[10px] text-rose-100/90 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-300 shrink-0" />
            <span>{isSingleMonth ? `Total 1 Tahun: ${formatRupiah(totalKeluar)}` : 'Realisasi pembelanjaan BOSP'}</span>
          </p>
        </div>

        {/* 3. Saldo Akhir BKU */}
        <div className="relative overflow-hidden rounded-2xl p-4.5 bg-gradient-to-br from-[#093262] via-[#0b4382] to-[#072449] text-white shadow-xs border border-blue-400/40 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-400/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                SALDO AKHIR {isSingleMonth ? `(${effectiveMonth})` : 'KAS SAAT INI'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 backdrop-blur-xs flex items-center justify-center text-amber-300 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <h4 className="text-lg xl:text-xl font-black text-white mt-2 tracking-tight tabular-nums">
              {formatRupiah(lastSaldo)}
            </h4>
          </div>
          <p className="text-[10px] text-blue-200 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span>{isSingleMonth ? `Sesuai BKU Bulan ${effectiveMonth}` : 'Kas Tunai & Saldo Bank'}</span>
          </p>
        </div>

        {/* 4. Jumlah Transaksi */}
        <div className="relative overflow-hidden rounded-2xl p-4.5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-xs border border-indigo-400/40 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                TRANSAKSI {isSingleMonth ? `(${effectiveMonth})` : '1 TAHUN'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-indigo-100 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <h4 className="text-lg xl:text-xl font-black text-white mt-2 tracking-tight tabular-nums">
              {isSingleMonth ? monthItems.length : bkuData.length} Baris BKU
            </h4>
          </div>
          <p className="text-[10px] text-indigo-100/90 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
            <span>{isSingleMonth ? `${countBpuBulan} Bukti BPU Bulan Ini` : `${countBpu} Bukti BPU 1 Tahun`}</span>
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-[#093262] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="font-extrabold text-sm tracking-tight text-white">BUKU KAS UMUM (BKU) TA 2026</h4>
              <p className="text-[11px] text-blue-200">
                NPSN: {settings.npsn} | {settings.namaSekolah}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/10 text-amber-300 border border-white/20 text-xs font-mono font-bold rounded-xl">
            Saldo: {formatRupiah(lastSaldo)}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar max-h-[550px]">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#093262] text-white text-[11px] font-bold uppercase text-center divide-x divide-[#0d417d] border-b border-[#0d417d]">
                <th className="py-2.5 px-3">TANGGAL</th>
                <th className="py-2.5 px-3">KODE KEGIATAN</th>
                <th className="py-2.5 px-3">KODE REKENING</th>
                <th className="py-2.5 px-3">NO. BUKTI</th>
                <th className="py-2.5 px-4 text-left">URAIAN TRANSAKSI</th>
                <th className="py-2.5 px-3 text-right">PENERIMAAN</th>
                <th className="py-2.5 px-3 text-right">PENGELUARAN</th>
                <th className="py-2.5 px-3 text-right">SALDO</th>
                <th className="py-2.5 px-2 text-center w-12 no-print">AKSI</th>
              </tr>
              <tr className="bg-[#072449] text-blue-200 text-[10px] font-semibold italic text-center divide-x divide-[#0b386e]">
                <th className="py-1">1</th>
                <th className="py-1">2</th>
                <th className="py-1">3</th>
                <th className="py-1">4</th>
                <th className="py-1 text-left px-4">5</th>
                <th className="py-1 text-right px-3">6</th>
                <th className="py-1 text-right px-3">7</th>
                <th className="py-1 text-right px-3">8</th>
                <th className="py-1 no-print">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-700 bg-white">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-500 font-medium">
                    {bkuData.length === 0 ? (
                      <div className="max-w-md mx-auto space-y-3 px-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200 shadow-2xs">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-slate-800 text-sm">Buku Kas Umum (BKU) Bersih / Kosong (0 Transaksi)</h5>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Data transaksi telah dikosongkan 100% sehingga tidak ada sisa transaksi lama. Silakan unggah file Excel BKU (.xlsx) terbaru Anda atau muat kembali data contoh.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Unggah File BKU Sekarang</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRestoreDefaultBku}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                            <span>Muat Data Contoh BKU</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <span>Tidak ada transaksi BKU yang cocok dengan pencarian "{searchQuery}".</span>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const isTaxOrTransfer =
                    !item.noBukti ||
                    item.noBukti === '-' ||
                    item.noBukti.toLowerCase().includes('tarik') ||
                    item.noBukti.toLowerCase().includes('saldo');

                  return (
                    <tr
                      key={item.id || idx}
                      className={`hover:bg-blue-50/50 text-xs border-b border-slate-100 ${
                        isTaxOrTransfer ? 'bg-slate-50/60' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-slate-500 font-mono whitespace-nowrap">
                        {item.tgl}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600 text-[11px]">
                        {item.kodeKeg || '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-600 text-[11px]">
                        {item.kodeRek || '-'}
                      </td>
                      <td className="py-2 px-3 text-center font-bold font-mono text-blue-900">
                        {item.noBukti || '-'}
                      </td>
                      <td className="py-2 px-4 font-semibold text-slate-800">{item.uraian}</td>
                      <td className="py-2 px-3 text-right font-medium text-emerald-700 font-mono">
                        {item.terima ? formatNumber(item.terima) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-medium text-rose-700 font-mono">
                        {item.keluar ? formatNumber(item.keluar) : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-extrabold text-slate-900 font-mono">
                        {formatNumber(item.saldo)}
                      </td>
                      <td className="py-2 px-2 text-center no-print">
                        <button
                          onClick={() => handleDeleteItem(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Hapus baris BKU"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 text-white font-extrabold text-xs">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider">
                    Jumlah Total BKU {viewMode === 'month_only' && isSingleMonth ? `(Bulan ${effectiveMonth})` : '1 Tahun'}:
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-mono">
                    {formatRupiah(viewMode === 'month_only' && isSingleMonth ? totalTerimaBulan : totalTerima)}
                  </td>
                  <td className="py-3 px-3 text-right text-rose-300 font-mono">
                    {formatRupiah(viewMode === 'month_only' && isSingleMonth ? totalKeluarBulan : totalKeluar)}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-300 font-mono">{formatRupiah(lastSaldo)}</td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Transaksi BKU</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Transaksi *</label>
                  <input
                    type="date"
                    required
                    value={formData.tgl}
                    onChange={(e) => setFormData({ ...formData, tgl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Arus Kas *</label>
                  <select
                    value={formData.tipe}
                    onChange={(e) => setFormData({ ...formData, tipe: e.target.value as 'terima' | 'keluar' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                  >
                    <option value="keluar">Pengeluaran Kas (Belanja)</option>
                    <option value="terima">Penerimaan Kas (Transfer/Tarik)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Bukti (BPU)</label>
                  <input
                    type="text"
                    value={formData.noBukti}
                    onChange={(e) => setFormData({ ...formData, noBukti: e.target.value })}
                    placeholder="Contoh: BPU57"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.nominal || ''}
                    onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                    placeholder="Contoh: 350000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Kegiatan</label>
                  <input
                    type="text"
                    value={formData.kodeKeg}
                    onChange={(e) => setFormData({ ...formData, kodeKeg: e.target.value })}
                    placeholder="05.08.01."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Rekening</label>
                  <input
                    type="text"
                    value={formData.kodeRek}
                    onChange={(e) => setFormData({ ...formData, kodeRek: e.target.value })}
                    placeholder="5.1.02.01.01.0030"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Uraian Transaksi *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.uraian}
                  onChange={(e) => setFormData({ ...formData, uraian: e.target.value })}
                  placeholder="Contoh: Pembelian Kertas HVS & Tinta Printer (10 Rim)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Toko / Penyedia (Nota)</label>
                  <input
                    type="text"
                    value={formData.tokoName}
                    onChange={(e) => setFormData({ ...formData, tokoName: e.target.value })}
                    placeholder="Toko Buku Berkah"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penerima Uang (Kwitansi)</label>
                  <input
                    type="text"
                    value={formData.penerimaName}
                    onChange={(e) => setFormData({ ...formData, penerimaName: e.target.value })}
                    placeholder="Nama Lengkap Penerima"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">Reset & Kosongkan Data BKU</h4>
                  <p className="text-xs text-slate-500">Cegah tumpukan transaksi dan bersihkan buku kas</p>
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

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Jumlah Transaksi Saat Ini:</span>
                <span className="font-bold font-mono text-slate-900">{bkuData.length} Baris Transaksi</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-slate-500">Total Pengeluaran Kas:</span>
                <span className="font-bold text-rose-600">{formatRupiah(totalKeluar)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Saldo Akhir Saat Ini:</span>
                <span className="font-bold text-emerald-700">{formatRupiah(lastSaldo)}</span>
              </div>
            </div>

            {/* Tips Backup Triwulan Sebelum Reset */}
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 space-y-2">
              <div className="flex items-center space-x-2">
                <Archive className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-bold">Tips Aman Triwulanan BOSP:</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Sebelum mengosongkan BKU untuk Triwulan berikutnya, pastikan Anda telah membuat <strong>Backup Triwulan</strong> agar seluruh kwitansi dan transaksi triwulan ini tetap bisa dibuka dan dipulihkan kembali kapan saja!
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setBackupModalTab('backup');
                  setIsBackupModalOpen(true);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Simpan Backup Triwulan Dulu Sebelum Kosongkan</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pilih tindakan di bawah ini untuk memastikan tampilan BKU benar-benar bersih 100% sebelum atau sesudah mengunggah file Buku Kas Umum yang baru:
            </p>

            <div className="space-y-2.5 pt-1">
              {isSingleMonth && (
                <button
                  type="button"
                  onClick={handleEmptyMonthBku}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Kosongkan Bulan {effectiveMonth} Saja ({monthItems.length} Transaksi)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleEmptyAllBku}
                className={`w-full ${
                  isSingleMonth
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                } font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Kosongkan Seluruh BKU 1 Tahun ({bkuData.length} Transaksi)</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreDefaultBku}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Kembalikan Data Transaksi Contoh</span>
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
    </div>
  );
};
