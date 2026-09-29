import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  RotateCcw,
  Download,
  Search,
  Filter,
  Calendar,
  Trash2,
  AlertCircle,
  X,
  PlusCircle,
  SlidersHorizontal,
  Layers,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { AppSettings, RkasItem } from '../types';
import { initialRkasData } from '../data/initialData';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { exportRkasToExcel, parseRkasExcel } from '../utils/excelHelper';

interface RkasTabProps {
  settings: AppSettings;
  rkasData: RkasItem[];
  onUpdateRkas: (data: RkasItem[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const RkasTab: React.FC<RkasTabProps> = ({
  settings,
  rkasData,
  onUpdateRkas,
  showToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTw, setFilterTw] = useState<'all' | 'tw1' | 'tw2' | 'tw3' | 'tw4'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // New item form state
  const [formData, setFormData] = useState<Partial<RkasItem>>({
    no: '',
    kodeRek: '',
    kodeProg: '',
    uraian: '',
    vol: '1',
    satuan: 'Pcs',
    tarif: 0,
    jumlah: 0,
    tw1: 0,
    tw2: 0,
    tw3: 0,
    tw4: 0,
    isHeader: false,
  });

  // Totals calculation
  const detailItems = rkasData.filter((i) => !i.isHeader);
  const itemsToSum = detailItems.length > 0 ? detailItems : rkasData;

  const totalTahun = itemsToSum.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
  const totalTw1 = itemsToSum.reduce((acc, curr) => acc + (Number(curr.tw1) || 0), 0);
  const totalTw2 = itemsToSum.reduce((acc, curr) => acc + (Number(curr.tw2) || 0), 0);
  const totalTw3 = itemsToSum.reduce((acc, curr) => acc + (Number(curr.tw3) || 0), 0);
  const totalTw4 = itemsToSum.reduce((acc, curr) => acc + (Number(curr.tw4) || 0), 0);

  // Item counts and percentages per Triwulan
  const countTw1 = itemsToSum.filter((i) => (Number(i.tw1) || 0) > 0).length;
  const countTw2 = itemsToSum.filter((i) => (Number(i.tw2) || 0) > 0).length;
  const countTw3 = itemsToSum.filter((i) => (Number(i.tw3) || 0) > 0).length;
  const countTw4 = itemsToSum.filter((i) => (Number(i.tw4) || 0) > 0).length;
  const countTotal = itemsToSum.length;

  const pctTw1 = totalTahun > 0 ? ((totalTw1 / totalTahun) * 100).toFixed(1) : '0';
  const pctTw2 = totalTahun > 0 ? ((totalTw2 / totalTahun) * 100).toFixed(1) : '0';
  const pctTw3 = totalTahun > 0 ? ((totalTw3 / totalTahun) * 100).toFixed(1) : '0';
  const pctTw4 = totalTahun > 0 ? ((totalTw4 / totalTahun) * 100).toFixed(1) : '0';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const parsed = parseRkasExcel(buffer);
        if (parsed.length > 0) {
          onUpdateRkas(parsed);
          showToast(`Upload Berhasil! 100% data lama telah diganti dengan ${parsed.length} baris RKAS dari file '${file.name}'.`, 'success');
        } else {
          showToast('Tidak ada data yang terbaca dari format Excel ini. Pastikan file memiliki baris uraian kegiatan.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Terjadi kesalahan saat memproses file Excel RKAS.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleOpenResetModal = () => {
    setIsResetModalOpen(true);
  };

  const handleEmptyAllRkas = () => {
    onUpdateRkas([]);
    setIsResetModalOpen(false);
    showToast('Seluruh data RKAS berhasil dikosongkan (0 baris). Tampilan bersih 100% siap untuk upload baru.', 'success');
  };

  const handleRestoreDefaultRkas = () => {
    onUpdateRkas(initialRkasData);
    setIsResetModalOpen(false);
    showToast('Data RKAS berhasil dipulihkan ke data contoh standar.', 'info');
  };

  const handleExport = () => {
    if (rkasData.length === 0) {
      showToast('Tidak ada data RKAS untuk diekspor.', 'error');
      return;
    }
    exportRkasToExcel(rkasData, settings.namaSekolah);
    showToast('File Excel RKAS berhasil diunduh.', 'success');
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.uraian) {
      showToast('Nama uraian kegiatan wajib diisi.', 'error');
      return;
    }

    const volNum = parseFloat(String(formData.vol)) || 1;
    const tarifNum = parseFloat(String(formData.tarif)) || 0;
    const computedJumlah = formData.isHeader ? parseFloat(String(formData.jumlah)) || 0 : volNum * tarifNum;

    const newItem: RkasItem = {
      id: `rkas-manual-${Date.now()}`,
      no: formData.no || String(rkasData.length + 1),
      kodeRek: formData.kodeRek || '',
      kodeProg: formData.kodeProg || '',
      uraian: formData.uraian,
      vol: formData.vol || '',
      satuan: formData.satuan || '',
      tarif: tarifNum,
      jumlah: computedJumlah,
      tw1: parseFloat(String(formData.tw1)) || 0,
      tw2: parseFloat(String(formData.tw2)) || 0,
      tw3: parseFloat(String(formData.tw3)) || 0,
      tw4: parseFloat(String(formData.tw4)) || 0,
      isHeader: Boolean(formData.isHeader),
    };

    onUpdateRkas([...rkasData, newItem]);
    setIsAddModalOpen(false);
    setFormData({
      no: '',
      kodeRek: '',
      kodeProg: '',
      uraian: '',
      vol: '1',
      satuan: 'Pcs',
      tarif: 0,
      jumlah: 0,
      tw1: 0,
      tw2: 0,
      tw3: 0,
      tw4: 0,
      isHeader: false,
    });
    showToast('Item RKAS baru berhasil ditambahkan.', 'success');
  };

  const handleDeleteItem = (index: number) => {
    const updated = [...rkasData];
    updated.splice(index, 1);
    onUpdateRkas(updated);
    showToast('Baris RKAS dihapus.', 'info');
  };

  // Filtered rows
  const filteredData = rkasData.filter((item) => {
    const matchSearch =
      searchQuery === '' ||
      item.uraian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kodeRek.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kodeProg.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (filterTw === 'tw1') return item.isHeader || (item.tw1 && item.tw1 > 0);
    if (filterTw === 'tw2') return item.isHeader || (item.tw2 && item.tw2 > 0);
    if (filterTw === 'tw3') return item.isHeader || (item.tw3 && item.tw3 > 0);
    if (filterTw === 'tw4') return item.isHeader || (item.tw4 && item.tw4 > 0);

    return true;
  });

  return (
    <div id="tab-rkas-view" className="space-y-5">
      {/* Action Header Card - Rapih, Simpel, Interaktif, dengan Warna Background Royal Navy BOSP */}
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
                Format Resmi Excel ARKAS Kemendikdasmen
              </span>
              {settings.tahunAnggaran && (
                <span className="px-2.5 py-0.5 bg-white/10 text-blue-200 border border-white/15 text-[10px] font-medium rounded-full">
                  T.A. {settings.tahunAnggaran}
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Kertas Kerja RKAS BOSP 2026
            </h3>
            <p className="text-xs text-blue-100/80 max-w-2xl font-normal leading-relaxed">
              Kelola rencana anggaran sekolah, unggah file Excel Kertas Kerja, dan pantau pembagian per Triwulan
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Upload Excel Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:shadow-emerald-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Unggah file Excel Kertas Kerja RKAS (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unggah RKAS (.xlsx)</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Manual Add Item */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md hover:shadow-blue-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Tambah Belanja RKAS Baru Secara Manual"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Item</span>
            </button>

            {/* Download Excel */}
            <button
              type="button"
              onClick={handleExport}
              className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20 transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Unduh Kertas Kerja RKAS dalam format Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-blue-200" />
              <span>Unduh Excel</span>
            </button>

            {/* Subtle Divider */}
            <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block" />

            {/* Reset / Kosongkan Data */}
            <button
              type="button"
              onClick={handleOpenResetModal}
              className="bg-rose-500/20 hover:bg-rose-500/30 active:scale-95 text-rose-200 hover:text-white border border-rose-400/30 font-semibold text-xs px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs shadow-2xs"
              title="Reset atau Kosongkan Data RKAS"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
              <span>Reset / Kosongkan</span>
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
              placeholder="Cari uraian belanja / kode rekening..."
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

          {/* Interactive Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-blue-200/70 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" />
              <span>Filter Triwulan:</span>
            </span>

            <button
              type="button"
              onClick={() => setFilterTw('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTw === 'all'
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10'
              }`}
            >
              <span>Semua TW</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTw === 'all' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/15 text-blue-200'
                }`}
              >
                {countTotal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTw('tw1')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTw === 'tw1'
                  ? 'bg-emerald-400 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10'
              }`}
            >
              <span>TW 1</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTw === 'tw1' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/15 text-blue-200'
                }`}
              >
                {countTw1}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTw('tw2')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTw === 'tw2'
                  ? 'bg-sky-400 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10'
              }`}
            >
              <span>TW 2</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTw === 'tw2' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/15 text-blue-200'
                }`}
              >
                {countTw2}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTw('tw3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTw === 'tw3'
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10'
              }`}
            >
              <span>TW 3</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTw === 'tw3' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/15 text-blue-200'
                }`}
              >
                {countTw3}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTw('tw4')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterTw === 'tw4'
                  ? 'bg-purple-400 text-slate-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-blue-100 border border-white/10'
              }`}
            >
              <span>TW 4</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTw === 'tw4' ? 'bg-slate-900/15 text-slate-900' : 'bg-white/15 text-blue-200'
                }`}
              >
                {countTw4}
              </span>
            </button>

            {(filterTw !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterTw('all');
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

      {/* Summary Cards - 5 Komponen Berwarna Lengkap, Estetik & Interaktif (Klik kartu untuk filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total RKAS Tahunan - Deep Royal Navy Kemendikdasmen */}
        <div
          onClick={() => setFilterTw('all')}
          className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#072449] via-[#093262] to-[#0c4382] text-white shadow-xs border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
            filterTw === 'all'
              ? 'ring-2 ring-amber-400 border-amber-400/60 shadow-md scale-[1.02]'
              : 'border-[#0d417d] hover:-translate-y-1 hover:shadow-md'
          }`}
          title="Klik untuk menampilkan seluruh kegiatan RKAS"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                TOTAL PAGU RKAS
              </span>
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-amber-300 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-base xl:text-lg font-black text-white mt-2 tracking-tight tabular-nums">
              {formatRupiah(totalTahun)}
            </h4>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-blue-200 font-medium">
            <span>{countTotal} Rincian Belanja</span>
            <span className="text-amber-300 font-bold">100% Pagu</span>
          </div>
        </div>

        {/* 2. Triwulan 1 - Vibrant Emerald */}
        <div
          onClick={() => setFilterTw(filterTw === 'tw1' ? 'all' : 'tw1')}
          className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xs border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
            filterTw === 'tw1'
              ? 'ring-2 ring-emerald-300 border-emerald-300 shadow-md scale-[1.02]'
              : 'border-emerald-400/40 hover:-translate-y-1 hover:shadow-md'
          }`}
          title="Klik untuk filter kegiatan Triwulan 1"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">
                  TRIWULAN 1
                </span>
                <span className="px-1.5 py-0.2 bg-emerald-950/40 text-emerald-200 rounded text-[9px] font-bold">
                  Jan - Mar
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-emerald-100 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
                <Layers className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-base xl:text-lg font-black text-white mt-2 tracking-tight tabular-nums">
              {formatRupiah(totalTw1)}
            </h4>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-emerald-100 font-medium">
              <span>{countTw1} Belanja</span>
              <span className="font-bold text-white">{pctTw1}%</span>
            </div>
            <div className="w-full bg-emerald-950/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-300 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, Number(pctTw1)))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Triwulan 2 - Vibrant Sapphire / Royal Blue */}
        <div
          onClick={() => setFilterTw(filterTw === 'tw2' ? 'all' : 'tw2')}
          className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-xs border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
            filterTw === 'tw2'
              ? 'ring-2 ring-sky-300 border-sky-300 shadow-md scale-[1.02]'
              : 'border-blue-400/40 hover:-translate-y-1 hover:shadow-md'
          }`}
          title="Klik untuk filter kegiatan Triwulan 2"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200">
                  TRIWULAN 2
                </span>
                <span className="px-1.5 py-0.2 bg-blue-950/40 text-blue-200 rounded text-[9px] font-bold">
                  Apr - Jun
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-blue-100 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-base xl:text-lg font-black text-white mt-2 tracking-tight tabular-nums">
              {formatRupiah(totalTw2)}
            </h4>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-blue-100 font-medium">
              <span>{countTw2} Belanja</span>
              <span className="font-bold text-white">{pctTw2}%</span>
            </div>
            <div className="w-full bg-blue-950/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-sky-300 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, Number(pctTw2)))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Triwulan 3 - Vibrant Amber / Orange */}
        <div
          onClick={() => setFilterTw(filterTw === 'tw3' ? 'all' : 'tw3')}
          className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 text-white shadow-xs border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
            filterTw === 'tw3'
              ? 'ring-2 ring-amber-300 border-amber-300 shadow-md scale-[1.02]'
              : 'border-amber-400/40 hover:-translate-y-1 hover:shadow-md'
          }`}
          title="Klik untuk filter kegiatan Triwulan 3"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
                  TRIWULAN 3
                </span>
                <span className="px-1.5 py-0.2 bg-amber-950/40 text-amber-200 rounded text-[9px] font-bold">
                  Jul - Sep
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-amber-100 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-base xl:text-lg font-black text-white mt-2 tracking-tight tabular-nums">
              {formatRupiah(totalTw3)}
            </h4>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-amber-100 font-medium">
              <span>{countTw3} Belanja</span>
              <span className="font-bold text-white">{pctTw3}%</span>
            </div>
            <div className="w-full bg-amber-950/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-300 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, Number(pctTw3)))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 5. Triwulan 4 - Vibrant Purple / Violet */}
        <div
          onClick={() => setFilterTw(filterTw === 'tw4' ? 'all' : 'tw4')}
          className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-purple-600 via-violet-700 to-purple-900 text-white shadow-xs border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
            filterTw === 'tw4'
              ? 'ring-2 ring-purple-300 border-purple-300 shadow-md scale-[1.02]'
              : 'border-purple-400/40 hover:-translate-y-1 hover:shadow-md'
          }`}
          title="Klik untuk filter kegiatan Triwulan 4"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
          <div>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-200">
                  TRIWULAN 4
                </span>
                <span className="px-1.5 py-0.2 bg-purple-950/40 text-purple-200 rounded text-[9px] font-bold">
                  Okt - Des
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-purple-100 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <h4 className="text-base xl:text-lg font-black text-white mt-2 tracking-tight tabular-nums">
              {formatRupiah(totalTw4)}
            </h4>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-purple-100 font-medium">
              <span>{countTw4} Belanja</span>
              <span className="font-bold text-white">{pctTw4}%</span>
            </div>
            <div className="w-full bg-purple-950/40 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-300 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, Number(pctTw4)))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-[#093262] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="font-extrabold text-sm tracking-tight text-white">KERTAS KERJA RKAS TA 2026</h4>
              <p className="text-[11px] text-blue-200">Rincian Anggaran Per Komponen & Triwulan BOSP Reguler</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white/10 text-amber-300 border border-white/20 text-xs font-mono font-bold rounded-xl">
            Total: {formatRupiah(totalTahun)}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar max-h-[550px]">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#093262] text-white text-[11px] font-bold uppercase text-center divide-x divide-[#0d417d] border-b border-[#0d417d]">
                <th className="py-2.5 px-3">No. Urut</th>
                <th className="py-2.5 px-3">Kode Rekening</th>
                <th className="py-2.5 px-3">Kode Program</th>
                <th className="py-2.5 px-4 text-left">Uraian Belanja</th>
                <th className="py-2.5 px-3">Rincian Vol</th>
                <th className="py-2.5 px-3">Satuan</th>
                <th className="py-2.5 px-3 text-right">Tarif Harga</th>
                <th className="py-2.5 px-3 text-right">Jumlah Total</th>
                <th className="py-2.5 px-3 text-right">Triwulan 1</th>
                <th className="py-2.5 px-3 text-right">Triwulan 2</th>
                <th className="py-2.5 px-3 text-right">Triwulan 3</th>
                <th className="py-2.5 px-3 text-right">Triwulan 4</th>
                <th className="py-2.5 px-2 text-center w-12 no-print">Aksi</th>
              </tr>
              <tr className="bg-[#072449] text-blue-200 text-[10px] font-semibold italic text-center divide-x divide-[#0b386e]">
                <th className="py-1">1</th>
                <th className="py-1">2</th>
                <th className="py-1">3</th>
                <th className="py-1 text-left px-4">4</th>
                <th className="py-1">5</th>
                <th className="py-1">6</th>
                <th className="py-1 text-right px-3">7</th>
                <th className="py-1 text-right px-3">8</th>
                <th className="py-1 text-right px-3">9</th>
                <th className="py-1 text-right px-3">10</th>
                <th className="py-1 text-right px-3">11</th>
                <th className="py-1 text-right px-3">12</th>
                <th className="py-1 no-print">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-700 bg-white">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-14 text-center text-slate-500 font-medium">
                    {rkasData.length === 0 ? (
                      <div className="max-w-md mx-auto space-y-3 px-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-slate-800 text-sm">Data RKAS Bersih / Kosong (0 Baris)</h5>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Data telah dikosongkan 100% sehingga tidak ada sisa tumpukan data lama. Silakan unggah file Excel Kertas Kerja RKAS (.xlsx) terbaru Anda atau muat kembali data contoh.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Unggah File Excel Sekarang</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRestoreDefaultRkas}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                            <span>Muat Data Contoh Baku</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <span>Tidak ada baris RKAS yang sesuai kriteria filter/pencarian "{searchQuery}".</span>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  if (item.isHeader) {
                    return (
                      <tr key={item.id || idx} className="bg-slate-100/90 font-bold text-slate-900 text-xs border-y border-slate-200">
                        <td className="py-2 px-3 text-center">{item.no || ''}</td>
                        <td className="py-2 px-3 font-mono">{item.kodeRek || ''}</td>
                        <td className="py-2 px-3 font-mono">{item.kodeProg || ''}</td>
                        <td className="py-2 px-4 uppercase tracking-wider" colSpan={4}>
                          {item.uraian}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold">{formatRupiah(item.jumlah)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{formatRupiah(item.tw1)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{formatRupiah(item.tw2)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{formatRupiah(item.tw3)}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{formatRupiah(item.tw4)}</td>
                        <td className="py-2 px-2 text-center no-print">
                          <button
                            onClick={() => handleDeleteItem(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Hapus baris header"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.id || idx} className="hover:bg-blue-50/50 text-xs border-b border-slate-100">
                      <td className="py-2 px-3 text-center text-slate-400">{item.no || idx + 1}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{item.kodeRek || '-'}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">{item.kodeProg || '-'}</td>
                      <td className="py-2 px-4 font-semibold text-slate-800">{item.uraian}</td>
                      <td className="py-2 px-3 text-center">{item.vol || '-'}</td>
                      <td className="py-2 px-3 text-center text-slate-500">{item.satuan || '-'}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatNumber(item.tarif)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatNumber(item.jumlah)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 font-mono">{formatNumber(item.tw1)}</td>
                      <td className="py-2 px-3 text-right text-slate-600 font-mono">{formatNumber(item.tw2)}</td>
                      <td className="py-2 px-3 text-right text-slate-600 font-mono">{formatNumber(item.tw3)}</td>
                      <td className="py-2 px-3 text-right text-slate-600 font-mono">{formatNumber(item.tw4)}</td>
                      <td className="py-2 px-2 text-center no-print">
                        <button
                          onClick={() => handleDeleteItem(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Hapus item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Tambah Item Kertas Kerja RKAS</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3 text-xs">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isHeaderCheckbox"
                  checked={Boolean(formData.isHeader)}
                  onChange={(e) => setFormData({ ...formData, isHeader: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isHeaderCheckbox" className="font-bold text-slate-700">
                  Jadikan Baris Header / Sub-Standar (Misal: 03. Standar Proses)
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Rekening (Belanja)</label>
                  <input
                    type="text"
                    value={formData.kodeRek || ''}
                    onChange={(e) => setFormData({ ...formData, kodeRek: e.target.value })}
                    placeholder="Contoh: 5.1.02.01.01.0030"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Program / Standar</label>
                  <input
                    type="text"
                    value={formData.kodeProg || ''}
                    onChange={(e) => setFormData({ ...formData, kodeProg: e.target.value })}
                    placeholder="Contoh: 05.08.01."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Uraian Belanja / Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={formData.uraian || ''}
                  onChange={(e) => setFormData({ ...formData, uraian: e.target.value })}
                  placeholder="Contoh: Belanja Alat Kebersihan Sapu Ijuk"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              {!formData.isHeader && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Volume</label>
                    <input
                      type="number"
                      value={formData.vol || ''}
                      onChange={(e) => setFormData({ ...formData, vol: e.target.value })}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Satuan</label>
                    <input
                      type="text"
                      value={formData.satuan || ''}
                      onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                      placeholder="Pcs / Rim / Dus"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tarif Satuan (Rp)</label>
                    <input
                      type="number"
                      value={formData.tarif || ''}
                      onChange={(e) => setFormData({ ...formData, tarif: Number(e.target.value) })}
                      placeholder="35000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[11px]">TW 1 (Rp)</label>
                  <input
                    type="number"
                    value={formData.tw1 || ''}
                    onChange={(e) => setFormData({ ...formData, tw1: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[11px]">TW 2 (Rp)</label>
                  <input
                    type="number"
                    value={formData.tw2 || ''}
                    onChange={(e) => setFormData({ ...formData, tw2: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[11px]">TW 3 (Rp)</label>
                  <input
                    type="number"
                    value={formData.tw3 || ''}
                    onChange={(e) => setFormData({ ...formData, tw3: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[11px]">TW 4 (Rp)</label>
                  <input
                    type="number"
                    value={formData.tw4 || ''}
                    onChange={(e) => setFormData({ ...formData, tw4: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
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
                  Simpan ke RKAS
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
                  <h4 className="font-extrabold text-base text-slate-900">Reset & Kosongkan Data RKAS</h4>
                  <p className="text-xs text-slate-500">Cegah tumpukan data dan bersihkan rincian lama</p>
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
                <span className="text-slate-500">Jumlah Data Saat Ini:</span>
                <span className="font-bold font-mono text-slate-900">{rkasData.length} Baris Kegiatan</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Pagu RKAS:</span>
                <span className="font-bold text-blue-700">{formatRupiah(totalTahun)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pilih tindakan di bawah ini untuk memastikan tampilan RKAS benar-benar bersih 100% sebelum atau sesudah mengunggah file Kertas Kerja Excel yang baru:
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleEmptyAllRkas}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Kosongkan Seluruh Data (0 Baris - Bersih 100%)</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreDefaultRkas}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Kembalikan Data Contoh Standar</span>
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
    </div>
  );
};
