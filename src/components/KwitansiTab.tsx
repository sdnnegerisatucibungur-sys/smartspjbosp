import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Printer,
  CheckSquare,
  Square,
  Edit3,
  Calendar,
  Search,
  Filter,
  X,
  Plus,
  Trash2,
  Stamp,
  Download,
  FileDown,
  Layers,
  AlertCircle,
  Loader2,
  CheckCheck,
} from 'lucide-react';
import { AppSettings, BkuItem, BpuGroup, BpuItemDetail, RkasItem } from '../types';
import { formatRupiah, terbilang, formatTanggalIndo } from '../utils/formatters';
import { downloadBpuPdf, PdfExportOptions } from '../utils/pdfGenerator';
import { isBelanjaBarangRow } from '../utils/tandaTerimaAlgorithms';
import { DAFTAR_BULAN, filterBkuByMonth } from '../utils/monthHelper';

interface KwitansiTabProps {
  settings: AppSettings;
  bkuData: BkuItem[];
  rkasData: RkasItem[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  selectedBulan?: string;
  onBulanChange?: (b: string) => void;
}

export const KwitansiTab: React.FC<KwitansiTabProps> = ({
  settings,
  bkuData,
  rkasData,
  showToast,
  selectedBulan = 'Januari',
  onBulanChange,
}) => {
  // Filter data BKU sesuai bulan yang dipilih (jika bukan 'Semua Bulan')
  const monthlyBkuData = useMemo(() => {
    if (!selectedBulan || selectedBulan === 'Semua Bulan') return bkuData;
    return filterBkuByMonth(bkuData, selectedBulan);
  }, [bkuData, selectedBulan]);

  // Group BKU by BPU number - KHUSUS BELANJA BARANG (Non-Honor, Non-Upah, Non-SPPD)
  const groupedBpu = useMemo(() => {
    const grouped: Record<string, BpuGroup> = {};

    monthlyBkuData.forEach((row) => {
      // HANYA proses transaksi yang memenuhi kriteria Belanja Barang & Jasa Toko
      // Transaksi Honor, Upah Tukang, dan Perjalanan Dinas (SPPD) otomatis dipisahkan ke Tanda Terima
      if (!isBelanjaBarangRow(row, rkasData)) return;

      const noBukti = (row.noBukti || '').trim();
      if (!noBukti || noBukti === '-' || !noBukti.toUpperCase().startsWith('BPU')) return;

      if (!grouped[noBukti]) {
        let namaKegiatan = '';
        const kodeKeg = (row.kodeKeg || '').trim();

        if (kodeKeg) {
          const headerMatches = rkasData.filter(
            (r) =>
              r.isHeader &&
              r.kodeProg &&
              (r.kodeProg === kodeKeg ||
                r.kodeProg === kodeKeg + '.' ||
                kodeKeg.startsWith(r.kodeProg) ||
                r.kodeProg.startsWith(kodeKeg))
          );
          if (headerMatches.length > 0) {
            headerMatches.sort((a, b) => b.kodeProg.length - a.kodeProg.length);
            namaKegiatan = headerMatches[0].uraian;
          }
        }

        grouped[noBukti] = {
          noBukti: noBukti,
          tgl: row.tgl,
          kodeKeg: kodeKeg,
          kodeRek: (row.kodeRek || '').replace(/[\r\n\t\s]+/g, '').trim(),
          namaKegiatan: namaKegiatan,
          items: [],
          totalKeluar: 0,
          tokoName: row.tokoName || '',
          penerimaName: row.penerimaName || '',
        };
      }

      // Clean uraian text
      const cleanUraian = row.uraian
        .replace(/Perabot Kantor-/gi, '')
        .replace(/Belanja Alat\/Bahan untuk Kegiatan Kantor-/gi, '')
        .replace(/\(\d+\s*(Porsi|Pcs|Buah|lembar|kg|Kaleng|meter|Rim)\)/gi, '')
        .trim();

      // Find matching item in RKAS
      const detailRkas = rkasData.filter((r) => !r.isHeader && r.tarif > 0);
      let bestMatch: RkasItem | null = null;
      let highestScore = -1;

      const bkuWords = cleanUraian.toLowerCase().split(/[\s\-/.]+/).filter((w) => w.length > 2);

      detailRkas.forEach((r) => {
        let score = 0;
        const rkasUraianLower = r.uraian.toLowerCase();

        if (r.kodeRek && row.kodeRek && r.kodeRek === row.kodeRek) score += 40;
        if (
          r.kodeProg &&
          row.kodeKeg &&
          (row.kodeKeg.startsWith(r.kodeProg) || r.kodeProg.startsWith(row.kodeKeg))
        ) {
          score += 30;
        }

        let matchedWordCount = 0;
        bkuWords.forEach((w) => {
          if (rkasUraianLower.includes(w)) matchedWordCount++;
        });
        if (bkuWords.length > 0) {
          score += (matchedWordCount / bkuWords.length) * 50;
        }

        if (row.keluar > 0 && r.tarif > 0) {
          const quotient = row.keluar / r.tarif;
          if (Number.isInteger(quotient) && quotient > 0 && quotient <= 1000) {
            score += 60;
          } else if (Math.abs(quotient - Math.round(quotient)) < 0.01) {
            score += 40;
          }
        }

        if (score > highestScore) {
          highestScore = score;
          bestMatch = r;
        }
      });

      let tarif = bestMatch ? bestMatch.tarif : 0;
      let satuan = bestMatch && bestMatch.satuan ? bestMatch.satuan : 'Pcs';
      let vol = 1;

      const matchQty = row.uraian.match(/\((\d+)\s*([^)]+)\)/i);
      if (matchQty && matchQty[1]) {
        vol = parseInt(matchQty[1], 10);
        if (matchQty[2]) satuan = matchQty[2].trim();
        if (row.keluar > 0 && vol > 0 && tarif === 0) {
          tarif = Math.round(row.keluar / vol);
        }
      } else if (tarif > 0 && row.keluar > 0) {
        vol = Math.round(row.keluar / tarif);
        if (vol <= 0) vol = 1;
      } else if (row.keluar > 0) {
        tarif = row.keluar;
        vol = 1;
      }

      grouped[noBukti].items.push({
        uraian: cleanUraian || row.uraian,
        vol,
        satuan,
        tarif,
        jumlah: row.keluar || 0,
      });

      grouped[noBukti].totalKeluar += Number(row.keluar) || 0;
    });

    return grouped;
  }, [monthlyBkuData, rkasData]);

  const allBpuKeys = useMemo(() => Object.keys(groupedBpu), [groupedBpu]);

  // Selected BPUs for printing & downloading
  const [selectedBpus, setSelectedBpus] = useState<string[]>([]);

  // Update seleksi otomatis saat bulan berganti / data BPU terisi
  useEffect(() => {
    setSelectedBpus(allBpuKeys);
  }, [allBpuKeys]);

  // Layout mode for PDF: 2 per page (hemat kertas), 1 per page (format luas), or auto
  const [pdfLayoutMode, setPdfLayoutMode] = useState<'two-per-page' | 'one-per-page' | 'auto'>('two-per-page');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Editing state for BPU custom overrides
  const [bpuOverrides, setBpuOverrides] = useState<Record<string, Partial<BpuGroup>>>({});
  const [editingBpuKey, setEditingBpuKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<BpuGroup | null>(null);

  // Search & Filter
  const [searchBpuQuery, setSearchBpuQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'selected' | 'unselected'>('all');

  const toggleBpu = (key: string) => {
    setSelectedBpus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    setSelectedBpus(selectAll ? [...allBpuKeys] : []);
  };

  const handleSelectVisible = () => {
    const visibleKeys = visibleBpus;
    const combined = Array.from(new Set([...selectedBpus, ...visibleKeys]));
    setSelectedBpus(combined);
    showToast(`${visibleKeys.length} BPU hasil pencarian berhasil ditambahkan ke pilihan.`, 'info');
  };

  const openEditModal = (key: string) => {
    const raw = groupedBpu[key];
    const override = bpuOverrides[key] || {};
    const merged: BpuGroup = {
      ...raw,
      ...override,
      items: override.items ? [...override.items] : [...raw.items],
    };
    setEditForm(merged);
    setEditingBpuKey(key);
  };

  const saveEditModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm || !editingBpuKey) return;

    // recalculate total
    const total = editForm.items.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);
    const updatedForm = { ...editForm, totalKeluar: total };

    setBpuOverrides((prev) => ({
      ...prev,
      [editingBpuKey]: updatedForm,
    }));
    setEditingBpuKey(null);
    setEditForm(null);
    showToast(`Perubahan untuk ${editingBpuKey} berhasil disimpan!`, 'success');
  };

  // Get active BPUs that match filter tab and search
  const visibleBpus = allBpuKeys.filter((k) => {
    if (filterTab === 'selected' && !selectedBpus.includes(k)) return false;
    if (filterTab === 'unselected' && selectedBpus.includes(k)) return false;
    if (!searchBpuQuery) return true;
    const q = searchBpuQuery.toLowerCase();
    const b = groupedBpu[k];
    return (
      k.toLowerCase().includes(q) ||
      b.namaKegiatan.toLowerCase().includes(q) ||
      b.items.some((it) => it.uraian.toLowerCase().includes(q))
    );
  });

  // Only checked BPUs
  const activePrintBpus = allBpuKeys.filter((k) => selectedBpus.includes(k));

  // Resolved list of objects for checked BPUs
  const activePrintBpuObjects = useMemo(() => {
    return activePrintBpus.map((k) => ({
      ...groupedBpu[k],
      ...(bpuOverrides[k] || {}),
    }));
  }, [activePrintBpus, groupedBpu, bpuOverrides]);

  const totalSelectedNominal = useMemo(() => {
    return activePrintBpuObjects.reduce((acc, curr) => acc + (Number(curr.totalKeluar) || 0), 0);
  }, [activePrintBpuObjects]);

  // Trigger Native PDF Generator (jsPDF) based on strictly checked BPUs
  const handleDownloadPdf = (targetBpus?: BpuGroup[]) => {
    const list = targetBpus || activePrintBpuObjects;
    if (list.length === 0) {
      showToast('Pilih minimal satu nomor BPU/Nota yang ingin dicetak ke PDF.', 'error');
      return;
    }

    setIsGeneratingPdf(true);
    // Timeout gives browser tick to render loading spinner
    setTimeout(() => {
      try {
        downloadBpuPdf(list, settings, {
          layoutMode: pdfLayoutMode,
        });
        setIsGeneratingPdf(false);
        showToast(
          `Berkas PDF untuk ${list.length} Nota/Kwitansi berhasil dibuat dan diunduh!`,
          'success'
        );
      } catch (err) {
        console.error('PDF Generation Error:', err);
        setIsGeneratingPdf(false);
        showToast('Gagal membuat berkas PDF. Silakan coba lagi.', 'error');
      }
    }, 120);
  };

  // Browser Print Dialog
  const handleBrowserPrint = () => {
    if (activePrintBpus.length === 0) {
      showToast('Pilih minimal satu nomor BPU untuk dicetak.', 'error');
      return;
    }
    window.print();
  };

  return (
    <div id="tab-kwitansi-view" className="space-y-6">
      {/* Control & Selection Panel (Hidden when printing) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
        {/* Title and Top Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              Cetak Nota & Kwitansi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Format A4 Landscape</span>
              <span>•</span>
              <span>{allBpuKeys.length} Transaksi BPU</span>
              <span>•</span>
              <span className="text-slate-700 font-semibold">{activePrintBpus.length} Terpilih</span>
              {totalSelectedNominal > 0 && (
                <>
                  <span>•</span>
                  <span className="font-bold text-blue-900 font-mono">
                    {formatRupiah(totalSelectedNominal)}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Primary Action Buttons & Format Lembar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {/* Dropdown Pilihan Bulan Kwitansi */}
            {onBulanChange && (
              <div className="flex items-center space-x-1.5 bg-blue-50/90 px-3 py-1.5 rounded-xl border border-blue-300 text-xs shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#0b4382]" />
                <label className="text-[#093262] font-extrabold text-[11px] whitespace-nowrap">
                  Bulan:
                </label>
                <select
                  id="select-kwitansi-bulan"
                  value={selectedBulan}
                  onChange={(e) => onBulanChange(e.target.value)}
                  className="bg-transparent text-xs font-black text-[#072449] focus:outline-none cursor-pointer"
                  title="Pilih Bulan Kwitansi & Nota SPJ"
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

            {/* Format Lembar Selection */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
              <label className="text-slate-500 font-medium text-[11px] whitespace-nowrap">
                Format:
              </label>
              <select
                value={pdfLayoutMode}
                onChange={(e) => setPdfLayoutMode(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                title="Format Tata Letak Lembar PDF"
              >
                <option value="two-per-page">2 Pasang / Lembar (Hemat)</option>
                <option value="one-per-page">1 Pasang / Lembar (Format Luas)</option>
                <option value="auto">Otomatis</option>
              </select>
            </div>

            {/* Download PDF Button */}
            <button
              type="button"
              id="btn-download-kwitansi-pdf"
              onClick={() => handleDownloadPdf()}
              disabled={activePrintBpus.length === 0 || isGeneratingPdf}
              className="bg-[#0b4382] hover:bg-[#083567] active:scale-95 disabled:opacity-40 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>
                {isGeneratingPdf
                  ? 'Menyusun PDF...'
                  : `Unduh PDF (${activePrintBpus.length} Nota)`}
              </span>
            </button>

            {/* Direct Browser Print Button */}
            <button
              type="button"
              id="btn-browser-print-kwitansi"
              onClick={handleBrowserPrint}
              disabled={activePrintBpus.length === 0}
              className="bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:opacity-40 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Langsung</span>
            </button>
          </div>
        </div>

        {/* Filter, Search & Checkbox List Section */}
        <div className="space-y-2.5">
          {/* Controls Bar: Batch Actions, Filter Tabs, and Search Input */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            <div className="flex items-center flex-wrap gap-2">
              {/* Pilih Semua / Kosongkan Pilihan */}
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/70 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-2.5 py-1 text-slate-700 hover:text-blue-700 hover:bg-white rounded-md font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Centang semua nomor BPU"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pilih Semua</span>
                </button>
                <div className="w-px h-3.5 bg-slate-300 mx-0.5" />
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md font-medium transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Kosongkan semua centang"
                >
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kosongkan</span>
                </button>
              </div>

              {/* Quick Filter Tabs: Semua / Terpilih / Belum Terpilih */}
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/70 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({allBpuKeys.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('selected')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    filterTab === 'selected'
                      ? 'bg-white text-[#0b4382] shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Terpilih</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      filterTab === 'selected'
                        ? 'bg-blue-100 text-[#0b4382]'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {activePrintBpus.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unselected')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    filterTab === 'unselected'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Belum ({allBpuKeys.length - activePrintBpus.length})
                </button>
              </div>

              {searchBpuQuery && (
                <button
                  type="button"
                  onClick={handleSelectVisible}
                  className="bg-blue-50 hover:bg-blue-100 text-[#0b4382] border border-blue-200 font-bold text-xs px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Pilih Hasil Cari ({visibleBpus.length})</span>
                </button>
              )}
            </div>

            {/* Search Input Box with clear icon */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchBpuQuery}
                onChange={(e) => setSearchBpuQuery(e.target.value)}
                placeholder="Cari BPU / nama barang..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
              />
              {searchBpuQuery && (
                <button
                  type="button"
                  onClick={() => setSearchBpuQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* BPU Grid List: Clean, organized, uniform responsive grid */}
          <div className="border border-slate-200/80 rounded-xl bg-slate-50/50 p-2.5 sm:p-3">
            {visibleBpus.length === 0 ? (
              <div className="w-full py-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-1.5">
                <p>
                  Tidak ada nomor BPU yang cocok dengan filter atau kata kunci &quot;
                  {searchBpuQuery}&quot;.
                </p>
                {(filterTab !== 'all' || searchBpuQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterTab('all');
                      setSearchBpuQuery('');
                    }}
                    className="text-blue-600 hover:underline text-xs font-semibold cursor-pointer pt-0.5"
                  >
                    Reset filter dan tampilkan semua transaksi
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {visibleBpus.map((k) => {
                  const isChecked = selectedBpus.includes(k);
                  const b = groupedBpu[k];
                  const nominalFormatted = b ? formatRupiah(b.totalKeluar) : '';
                  return (
                    <div
                      key={k}
                      onClick={() => toggleBpu(k)}
                      className={`relative flex items-center justify-between border rounded-lg px-2.5 py-1.5 text-xs transition-all select-none cursor-pointer group/item ${
                        isChecked
                          ? 'bg-blue-50/90 border-blue-400 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-200/60'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700 font-medium'
                      }`}
                      title={`${k} • ${nominalFormatted} • ${b?.namaKegiatan || ''}`}
                    >
                      <label
                        className="flex items-center space-x-1.5 cursor-pointer truncate flex-1 mr-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBpu(k)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer shrink-0"
                        />
                        <span className="font-mono tracking-tight text-[11px] truncate font-semibold">
                          {k}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(k);
                        }}
                        title={`Sesuaikan data ${k}`}
                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 p-1 rounded-md cursor-pointer opacity-40 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity shrink-0"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer bar inside container showing count info and helpful hints */}
            <div className="pt-2.5 mt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 px-1">
              <span>
                Menampilkan <strong className="text-slate-800 font-bold">{visibleBpus.length}</strong>{' '}
                dari {allBpuKeys.length} BPU
                {filterTab === 'selected' && ' (Hanya Terpilih)'}
                {filterTab === 'unselected' && ' (Belum Terpilih)'}
              </span>
              <span className="text-slate-400 text-[10px]">
                Klik kotak untuk memilih • Arahkan kursor untuk ikon edit (✏) & detail transaksi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet View: Displays strictly only the checked BPUs */}
      <div id="printable-kwitansi-nota-area" className="space-y-8">
        {allBpuKeys.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 no-print">
            <Receipt className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-sm text-slate-700">Belum Ada Transaksi BPU pada BKU</p>
            <p className="text-xs mt-1 text-slate-500">
              Silakan unggah data BKU di menu <strong>Upload BKU</strong> atau pastikan terdapat baris pengeluaran dengan nomor bukti BPU.
            </p>
          </div>
        ) : activePrintBpus.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 no-print space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
            <div>
              <p className="font-bold text-sm text-slate-800">
                Tidak Ada Nota / BPU yang Dicentang
              </p>
              <p className="text-xs mt-1 text-slate-500 max-w-md mx-auto">
                Silakan centang satu atau beberapa nomor BPU pada daftar pilihan di atas untuk menampilkan dan mencetak dokumen resmi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 cursor-pointer inline-flex items-center space-x-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Centang Semua BPU Sekarang</span>
            </button>
          </div>
        ) : (
          (() => {
            const pages: React.ReactNode[] = [];
            const isSingleMode = pdfLayoutMode === 'one-per-page';
            const step = isSingleMode ? 1 : 2;

            for (let i = 0; i < activePrintBpus.length; i += step) {
              const key1 = activePrintBpus[i];
              const key2 = !isSingleMode && activePrintBpus[i + 1] ? activePrintBpus[i + 1] : null;

              const bpu1 = { ...groupedBpu[key1], ...(bpuOverrides[key1] || {}) };
              const bpu2 = key2 ? { ...groupedBpu[key2], ...(bpuOverrides[key2] || {}) } : null;

              pages.push(
                <div
                  key={`print-page-${i}`}
                  className="print-page-landscape bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5"
                >
                  {/* Page indicator in screen view */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold no-print pb-2 border-b border-slate-100">
                    <span>
                      Halaman Cetak {Math.floor(i / step) + 1} dari{' '}
                      {Math.ceil(activePrintBpus.length / step)}
                    </span>
                    <span>Format: A4 Landscape</span>
                  </div>

                  <BpuPairRender
                    bpu={bpu1}
                    settings={settings}
                    onEdit={() => openEditModal(key1)}
                    onDownloadSingle={() => handleDownloadPdf([bpu1])}
                  />

                  {bpu2 && (
                    <div className="relative py-2 no-print flex items-center justify-center">
                      <div className="w-full border-b-2 border-dashed border-slate-300"></div>
                      <span className="absolute bg-white px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Batas Potong Lembar
                      </span>
                    </div>
                  )}

                  {bpu2 && (
                    <BpuPairRender
                      bpu={bpu2}
                      settings={settings}
                      onEdit={() => openEditModal(key2)}
                      onDownloadSingle={() => handleDownloadPdf([bpu2])}
                    />
                  )}
                </div>
              );
            }
            return pages;
          })()
        )}
      </div>

      {/* Edit BPU Modal */}
      {editingBpuKey && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Sesuaikan Dokumen: {editingBpuKey}
                </h3>
                <p className="text-xs text-slate-500">
                  Ubah nama toko, penerima, tanggal, atau rincian item nota tanpa merusak data BKU
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBpuKey(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEditModal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Dokumen</label>
                  <input
                    type="text"
                    value={editForm.tgl}
                    onChange={(e) => setEditForm({ ...editForm, tgl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Toko / Rekanan</label>
                  <input
                    type="text"
                    value={editForm.tokoName || ''}
                    onChange={(e) => setEditForm({ ...editForm, tokoName: e.target.value })}
                    placeholder="Contoh: TB. Berkah Jaya"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Penerima Uang / Tanda Tangan Kwitansi
                </label>
                <input
                  type="text"
                  value={editForm.penerimaName || ''}
                  onChange={(e) => setEditForm({ ...editForm, penerimaName: e.target.value })}
                  placeholder="Contoh: H. Samsul (Pemilik Toko)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Untuk Pembayaran (Keterangan di Kwitansi)
                </label>
                <input
                  type="text"
                  value={editForm.keteranganPembayaran || editForm.namaKegiatan || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, keteranganPembayaran: e.target.value })
                  }
                  placeholder="Contoh: Belanja Bahan Pemeliharaan Gedung Sekolah"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Items in Nota */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800">Rincian Barang / Nota</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newItems = [
                        ...editForm.items,
                        { uraian: 'Barang Baru', vol: 1, satuan: 'Pcs', tarif: 50000, jumlah: 50000 },
                      ];
                      setEditForm({ ...editForm, items: newItems });
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> <span>Tambah Barang</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {editForm.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-1.5 items-center bg-slate-50 p-2 rounded-lg border border-slate-200"
                    >
                      <input
                        type="text"
                        value={it.uraian}
                        onChange={(e) => {
                          const updated = [...editForm.items];
                          updated[idx].uraian = e.target.value;
                          setEditForm({ ...editForm, items: updated });
                        }}
                        className="col-span-5 px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        placeholder="Nama Barang"
                      />
                      <input
                        type="number"
                        min={1}
                        value={it.vol}
                        onChange={(e) => {
                          const updated = [...editForm.items];
                          updated[idx].vol = Number(e.target.value) || 1;
                          updated[idx].jumlah = updated[idx].vol * updated[idx].tarif;
                          setEditForm({ ...editForm, items: updated });
                        }}
                        className="col-span-2 px-1 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                        placeholder="Vol"
                      />
                      <input
                        type="text"
                        value={it.satuan}
                        onChange={(e) => {
                          const updated = [...editForm.items];
                          updated[idx].satuan = e.target.value;
                          setEditForm({ ...editForm, items: updated });
                        }}
                        className="col-span-2 px-1 py-1 bg-white border border-slate-200 rounded text-xs text-center"
                        placeholder="Sat"
                      />
                      <input
                        type="number"
                        value={it.tarif}
                        onChange={(e) => {
                          const updated = [...editForm.items];
                          updated[idx].tarif = Number(e.target.value) || 0;
                          updated[idx].jumlah = updated[idx].vol * updated[idx].tarif;
                          setEditForm({ ...editForm, items: updated });
                        }}
                        className="col-span-2 px-1 py-1 bg-white border border-slate-200 rounded text-xs text-right font-mono"
                        placeholder="Harga"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...editForm.items];
                          updated.splice(idx, 1);
                          setEditForm({ ...editForm, items: updated });
                        }}
                        className="col-span-1 text-rose-500 hover:text-rose-700 flex justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBpuKey(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Simpan & Perbarui Cetakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: A single Pair of (Kwitansi Left) + (Nota Right)
interface BpuPairRenderProps {
  bpu: BpuGroup;
  settings: AppSettings;
  onEdit: () => void;
  onDownloadSingle: () => void;
}

const BpuPairRender: React.FC<BpuPairRenderProps> = ({
  bpu,
  settings,
  onEdit,
  onDownloadSingle,
}) => {
  const terbilangStr = terbilang(bpu.totalKeluar) + ' Rupiah';
  const notaNo = bpu.noBukti.replace(/[^0-9]/g, '') || bpu.noBukti;
  const formattedTotal = formatRupiah(bpu.totalKeluar);
  const formattedDate = formatTanggalIndo(bpu.tgl);
  const kotaTgl = settings.kotaTanggal || 'Cigemblong';
  const namaSekolah = settings.namaSekolah || 'SDN 1 CIBUNGUR';
  const kabupaten = (settings.kabupaten || 'LEBAK').toUpperCase();

  const namaToko = bpu.tokoName ? bpu.tokoName : `TOKO REKANAN ${namaSekolah}`;
  const namaPenerima = bpu.penerimaName || bpu.tokoName || 'Pihak Rekanan';

  // Requires Materai 10000 if total >= 5,000,000
  const needsMaterai = bpu.totalKeluar >= 5000000;

  let untukPembayaranText = bpu.keteranganPembayaran || '';
  if (!untukPembayaranText) {
    if (bpu.namaKegiatan) {
      untukPembayaranText = bpu.namaKegiatan.toLowerCase().startsWith('belanja')
        ? bpu.namaKegiatan
        : 'Belanja ' + bpu.namaKegiatan;
    } else if (bpu.items.length > 0) {
      untukPembayaranText = 'Belanja ' + bpu.items.map((it) => it.uraian).join(', ');
    } else {
      untukPembayaranText = 'Belanja Keperluan Operasional Sekolah BOSP';
    }
  }

  return (
    <div className="relative group">
      <div className="bpu-pair-container grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-4 p-4 print:p-0 border border-slate-300 print:border-none rounded-xl bg-white">
        {/* KWITANSI BLOCK (LEFT) */}
        <div className="bpu-doc-box border-2 border-slate-900 p-3 rounded-lg flex flex-col justify-between text-xs font-sans bg-white">
          <div>
            {/* Kop Resmi Kwitansi */}
            <div className="pb-1 mb-1.5 border-b-2 border-slate-900 flex items-center gap-2.5">
              {settings.logoSekolah && (
                <div className="w-10 h-12 shrink-0 flex items-center justify-center">
                  <img
                    src={settings.logoSekolah}
                    alt="Logo"
                    className="w-9 h-11 object-contain"
                  />
                </div>
              )}
              <div className="grow text-center">
                <p className="text-[10px] font-bold text-slate-800 print:text-black uppercase leading-tight">
                  PEMERINTAH KABUPATEN {kabupaten}
                </p>
                <p className="text-[10px] font-bold text-slate-800 print:text-black uppercase leading-tight">
                  DINAS PENDIDIKAN
                </p>
                <p className="text-xs font-black text-slate-900 print:text-black tracking-wide uppercase leading-tight">
                  {namaSekolah}
                </p>
                <p className="text-[9px] text-slate-600 print:text-black leading-tight">
                  {settings.alamat} {settings.desaKelurahan} Kec. {settings.kecamatan}
                </p>
              </div>
            </div>

            <div className="text-center font-black text-xs tracking-widest pb-1 mb-1.5 print:text-black">
              KWITANSI / BUKTI PEMBAYARAN
            </div>

            <table className="w-full text-xs space-y-0.5 border-collapse">
              <tbody>
                <tr>
                  <td className="font-bold w-28 py-0.5 text-slate-900 print:text-black text-[11px]">
                    Nomor Bukti
                  </td>
                  <td className="py-0.5 text-[11px]">
                    : <span className="font-extrabold text-blue-900 print:text-black">{bpu.noBukti}</span>
                  </td>
                </tr>
                {bpu.kodeRek && (
                  <tr>
                    <td className="font-bold py-0.5 text-slate-700 print:text-black text-[10px]">
                      Kode Rekening
                    </td>
                    <td className="py-0.5 font-mono text-[10px] text-slate-800 print:text-black">
                      : {bpu.kodeRek}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="font-bold py-0.5 text-slate-900 print:text-black text-[11px]">
                    Telah Terima Dari
                  </td>
                  <td className="py-0.5 font-medium text-slate-800 print:text-black text-[11px]">
                    : Bendahara BOSP {namaSekolah}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold py-0.5 text-slate-900 print:text-black text-[11px] align-top">
                    Uang Sejumlah
                  </td>
                  <td className="py-0.5 font-bold italic bg-slate-50 print:bg-slate-100 p-1 rounded print:rounded-none border border-slate-300 print:border-black text-slate-800 print:text-black text-[10px] leading-snug">
                    : &ldquo;{terbilangStr}&rdquo;
                  </td>
                </tr>
                <tr>
                  <td className="font-bold py-0.5 text-slate-900 print:text-black text-[11px] align-top">
                    Untuk Pembayaran
                  </td>
                  <td className="py-0.5 font-medium text-slate-900 print:text-black text-[11px] leading-snug">
                    : {untukPembayaranText}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-300 print:border-black">
            {/* Tanggal & Nominal */}
            <div className="flex items-center justify-between mb-2">
              <div className="border-2 border-slate-900 px-3 py-1 rounded-lg print:rounded-none bg-slate-50 print:bg-slate-100 text-xs font-black text-slate-900 print:text-black inline-block font-mono">
                {formattedTotal}
              </div>

              {needsMaterai && (
                <div className="border border-dashed border-slate-500 print:border-black px-2 py-0.5 text-center text-[8px] text-slate-700 print:text-black font-bold">
                  MATERAI Rp 10.000
                </div>
              )}

              <p className="text-[10px] text-slate-600 print:text-black font-semibold">
                {kotaTgl}, {formattedDate}
              </p>
            </div>

            {/* Tripartite Signatures: Menyetujui Kepsek, Lunas Dibayar Bendahara, Penerima Rekanan */}
            <div className="grid grid-cols-3 gap-1 text-center text-[9px] pt-1">
              <div>
                <p className="font-bold print:text-black">Setuju Dibayar,</p>
                <p className="text-slate-600 print:text-black mb-7">Kepala Sekolah</p>
                <p className="font-bold border-b border-slate-900 print:border-black pb-0.5 print:text-black truncate min-h-[1rem]">
                  {settings.namaKepsek || ''}
                </p>
                <p className="text-[8px] text-slate-500 print:text-black truncate">
                  {settings.nipKepsek ? `NIP. ${settings.nipKepsek}` : ''}
                </p>
              </div>

              <div>
                <p className="font-bold print:text-black">Lunas Dibayar,</p>
                <p className="text-slate-600 print:text-black mb-7">Bendahara BOSP</p>
                <p className="font-bold border-b border-slate-900 print:border-black pb-0.5 print:text-black truncate min-h-[1rem]">
                  {settings.namaBendahara || ''}
                </p>
                <p className="text-[8px] text-slate-500 print:text-black truncate">
                  {settings.nipBendahara ? `NIP. ${settings.nipBendahara}` : ''}
                </p>
              </div>

              <div>
                <p className="font-bold print:text-black">Yang Menerima,</p>
                <p className="text-slate-600 print:text-black mb-7">Pihak Rekanan</p>
                <p className="font-bold border-b border-slate-900 print:border-black pb-0.5 print:text-black truncate">
                  {namaPenerima}
                </p>
                <p className="text-[8px] text-slate-500 print:text-black">
                  (Tanda Tangan & Cap)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NOTA BLOCK (RIGHT) */}
        <div className="bpu-doc-box border-2 border-slate-900 p-3 rounded-lg flex flex-col justify-between text-xs font-sans bg-white">
          <div>
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-1 mb-2">
              <div>
                <h4 className="font-black text-xs text-slate-900 print:text-black uppercase">
                  {namaToko}
                </h4>
                <p className="text-[9px] text-slate-500 print:text-black">
                  Penyedia Alat & Kebutuhan Sekolah
                </p>
                <p className="text-[9px] text-slate-600 print:text-black mt-0.5">
                  Kepada Yth: Bendahara {namaSekolah}
                </p>
              </div>
              <div className="text-right">
                <h5 className="font-black text-xs tracking-wider text-slate-900 print:text-black">
                  NOTA KONTAN
                </h5>
                <p className="text-[10px] font-bold text-slate-700 print:text-black">
                  No: {notaNo}
                </p>
                <p className="text-[9px] text-slate-500 print:text-black">
                  {kotaTgl}, {formattedDate}
                </p>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 print:border-black text-[9px] uppercase font-extrabold bg-slate-100 print:bg-slate-200">
                  <th className="py-1 px-1 text-center border-r border-slate-400 print:border-black w-7">
                    No
                  </th>
                  <th className="py-1 px-1 text-center border-r border-slate-400 print:border-black w-14">
                    Banyak
                  </th>
                  <th className="py-1 px-1.5 border-r border-slate-400 print:border-black">
                    Nama Barang / Uraian
                  </th>
                  <th className="py-1 px-1.5 text-right border-r border-slate-400 print:border-black w-20">
                    Harga (Rp)
                  </th>
                  <th className="py-1 px-1.5 text-right w-20">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {bpu.items.map((item, i) => (
                  <tr key={i} className="border-b border-slate-300 print:border-black text-[10px]">
                    <td className="py-0.5 px-1 text-center font-medium border-r border-slate-300 print:border-black">
                      {i + 1}
                    </td>
                    <td className="py-0.5 px-1 text-center font-medium border-r border-slate-300 print:border-black">
                      {item.vol} {item.satuan}
                    </td>
                    <td className="py-0.5 px-1.5 font-semibold text-slate-800 print:text-black border-r border-slate-300 print:border-black">
                      {item.uraian}
                    </td>
                    <td className="py-0.5 px-1.5 text-right font-mono border-r border-slate-300 print:border-black">
                      {new Intl.NumberFormat('id-ID').format(item.tarif)}
                    </td>
                    <td className="py-0.5 px-1.5 text-right font-bold font-mono print:text-black">
                      {new Intl.NumberFormat('id-ID').format(item.jumlah)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 print:border-black font-black text-xs bg-slate-50 print:bg-slate-100">
                  <td colSpan={4} className="py-1 px-1.5 text-right uppercase tracking-wider text-[10px]">
                    JUMLAH TOTAL:
                  </td>
                  <td className="py-1 px-1.5 text-right text-slate-900 print:text-black font-mono font-black">
                    {formattedTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-2 pt-1 border-t border-slate-300 print:border-black flex items-end justify-between">
            <p className="text-[8px] italic text-slate-500 print:text-black max-w-[200px] leading-tight">
              Terbilang: {terbilang(bpu.totalKeluar)} Rupiah
            </p>

            <div className="text-center text-[9px]">
              <p className="font-bold print:text-black">Tanda Terima Toko / Cap</p>
              <div className="h-8"></div>
              <p className="font-bold border-b border-slate-900 print:border-black px-2 print:text-black">
                ( {namaToko} )
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Overlay Buttons on Hover */}
      <div className="absolute top-2 right-2 hidden group-hover:flex items-center space-x-2 no-print">
        <button
          type="button"
          onClick={onDownloadSingle}
          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center space-x-1 cursor-pointer"
          title="Unduh Berkas PDF Khusus BPU Ini"
        >
          <FileDown className="w-3 h-3" />
          <span>Unduh PDF</span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center space-x-1 cursor-pointer"
        >
          <Edit3 className="w-3 h-3" />
          <span>Edit BPU</span>
        </button>
      </div>
    </div>
  );
};
