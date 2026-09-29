import React from 'react';
import {
  Wallet,
  Receipt,
  PiggyBank,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  FileSignature,
  Percent,
  Users,
  Briefcase,
  PieChart,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { AppSettings, BkuItem, RkasItem, TabType, TaxRecord } from '../types';
import { formatRupiah } from '../utils/formatters';
import {
  DAFTAR_BULAN,
  computeAnnualRealization,
  filterBkuByMonth,
  getTriwulanFromMonth,
  NamaBulan,
} from '../utils/monthHelper';

interface DashboardTabProps {
  settings: AppSettings;
  rkasData: RkasItem[];
  bkuData: BkuItem[];
  taxRecords: TaxRecord[];
  onNavigate: (tab: TabType) => void;
  selectedBulan?: string;
  onBulanChange?: (b: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  settings,
  rkasData,
  bkuData,
  taxRecords,
  onNavigate,
  selectedBulan = 'Januari',
  onBulanChange,
}) => {
  // Hitung Analisis Tahunan Lengkap 12 Bulan vs RKAS
  const annualAnalytics = computeAnnualRealization(rkasData, bkuData);
  const {
    totalPaguRkas,
    totalRealisasiTahunan,
    totalTerimaTahunan,
    sisaSaldoKasSaatIni,
    sisaPaguRkasSaatIni,
    persentaseSerapanTahunan,
    bulanSummaries,
  } = annualAnalytics;

  // Filter BKU data untuk bulan yang sedang aktif
  const isAllMonths = selectedBulan === 'Semua Bulan';
  const activeBkuData = isAllMonths ? bkuData : filterBkuByMonth(bkuData, selectedBulan);

  // Ambil ringkasan bulan aktif dari analisis tahunan
  const activeMonthSummary = bulanSummaries.find((m) => m.bulan === selectedBulan);
  const activeSaldoKas =
    !isAllMonths && activeMonthSummary && activeMonthSummary.hasData
      ? activeMonthSummary.saldoAkhir
      : sisaSaldoKasSaatIni;

  // Perhitungan statistik bulan aktif
  const totalRealisasiBulan = activeBkuData.reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);
  const totalTerimaBulan = activeBkuData.reduce((acc, curr) => acc + (Number(curr.terima) || 0), 0);
  const uniqueBpuBulan = new Set(
    activeBkuData
      .map((b) => b.noBukti?.trim())
      .filter((b) => b && b !== '-' && b.toUpperCase().startsWith('BPU'))
  );
  const bpuCountBulan = uniqueBpuBulan.size;

  // Komposisi 3 Jenis Belanja Berdasarkan Kode Rekening BKU
  let belanjaBarangJasa = 0;
  let belanjaModalPeralatanMesin = 0;
  let belanjaModalAsetTetap = 0;

  activeBkuData.forEach((b) => {
    const keluar = Number(b.keluar) || 0;
    if (keluar <= 0) return;

    let k = (b.kodeRek || '').replace(/[\r\n\t\s]+/g, '').trim();

    if (!k && b.uraian) {
      const matchRkas = rkasData.find(
        (r) => !r.isHeader && r.uraian && b.uraian.toLowerCase().includes(r.uraian.toLowerCase().trim())
      );
      if (matchRkas?.kodeRek) {
        k = matchRkas.kodeRek.replace(/[\r\n\t\s]+/g, '').trim();
      }
    }

    if (k.startsWith('5.1.02')) {
      belanjaBarangJasa += keluar;
    } else if (k.startsWith('5.2.02')) {
      belanjaModalPeralatanMesin += keluar;
    } else if (k.startsWith('5.2.05')) {
      belanjaModalAsetTetap += keluar;
    } else if (k.startsWith('5.2')) {
      belanjaModalPeralatanMesin += keluar;
    } else if (keluar > 0 && b.noBukti && b.noBukti !== '-') {
      belanjaBarangJasa += keluar;
    }
  });

  const totalKomposisi = belanjaBarangJasa + belanjaModalPeralatanMesin + belanjaModalAsetTetap;
  const pctBarang = totalKomposisi > 0 ? Math.round((belanjaBarangJasa / totalKomposisi) * 100) : 0;
  const pctPeralatan = totalKomposisi > 0 ? Math.round((belanjaModalPeralatanMesin / totalKomposisi) * 100) : 0;
  const pctAsetTetap = totalKomposisi > 0 ? Math.max(0, 100 - pctBarang - pctPeralatan) : 0;

  // Tax statistics
  const totalPajakBelumSetor = taxRecords
    .filter((t) => t.statusSetor === 'Belum Disetor')
    .reduce((acc, curr) => acc + (Number(curr.nominalPajak) || 0), 0);

  const activeTriwulan = selectedBulan !== 'Semua Bulan' ? getTriwulanFromMonth(selectedBulan) : null;

  return (
    <div id="tab-dashboard-view" className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#072449] via-[#093262] to-[#0b4382] rounded-3xl p-5 sm:p-7 text-white shadow-lg border border-[#0d417d] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-bold mb-2.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
            <span>Sistem SPJ BOSP Bulanan &amp; Realisasi RKAS 1 Tahun</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Dashboard Monitoring SPJ BOSP
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl font-medium leading-relaxed">
            {settings.namaSekolah || 'Sekolah'} • Tahun Anggaran {settings.tahunAnggaran || '2026'}
          </p>
        </div>

        {/* Dropdown Pemilih Bulan & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onBulanChange && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1.5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400 ml-1.5" />
              <select
                value={selectedBulan}
                onChange={(e) => onBulanChange(e.target.value)}
                className="bg-[#072449] text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {DAFTAR_BULAN.map((bulan, idx) => (
                  <option key={bulan} value={bulan}>
                    Bulan {idx + 1}: {bulan}
                  </option>
                ))}
                <option value="Semua Bulan">📅 Semua Bulan (Kumulatif 1 Tahun)</option>
              </select>
            </div>
          )}

          <button
            onClick={() => onNavigate('kwitansi')}
            className="bg-amber-400 hover:bg-amber-300 text-[#072449] text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Kwitansi &amp; Nota</span>
          </button>
          <button
            onClick={() => onNavigate('rkas')}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center space-x-2 cursor-pointer backdrop-blur-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Lihat RKAS</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Utama (Tahun vs Bulan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pagu RKAS (1 Tahun Penuh) */}
        <div className="bg-gradient-to-br from-blue-50/90 via-white to-sky-50/50 rounded-2xl p-4.5 sm:p-5 border border-blue-200/90 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0b4382] via-[#093262] to-blue-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-[#0b4382] uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#0b4382]" />
              Total Pagu RKAS (1 Tahun)
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#0b4382] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Wallet className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-black text-[#072449] tracking-tight tabular-nums">
              {formatRupiah(totalPaguRkas)}
            </h3>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100/80 text-[#0b4382] border border-blue-200/80">
                Alokasi 12 Bulan RKAS
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Realisasi Bulan Terpilih & Kumulatif */}
        <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/50 rounded-2xl p-4.5 sm:p-5 border border-emerald-200/90 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5 text-emerald-700" />
              Realisasi: {selectedBulan}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <FileSignature className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-black text-emerald-950 tracking-tight tabular-nums">
              {formatRupiah(totalRealisasiBulan)}
            </h3>
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="font-semibold text-emerald-800">
                Kumulatif 1 Tahun:
              </span>
              <strong className="font-bold text-emerald-900">
                {formatRupiah(totalRealisasiTahunan)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Sisa Saldo Kas Riil Saat Ini */}
        <div className="bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/50 rounded-2xl p-4.5 sm:p-5 border border-amber-200/90 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <PiggyBank className="w-3.5 h-3.5 text-amber-700" />
              Sisa Saldo Kas Riil {!isAllMonths ? `(${selectedBulan})` : 'Saat Ini'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <PiggyBank className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-black text-amber-950 tracking-tight tabular-nums">
              {formatRupiah(activeSaldoKas)}
            </h3>
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="text-amber-800 font-semibold">
                {!isAllMonths ? `Realisasi ${selectedBulan}:` : 'Total Diterima:'}
              </span>
              <strong className="text-amber-900 font-bold">
                {formatRupiah(!isAllMonths ? totalRealisasiBulan : totalTerimaTahunan)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 4: Sisa Pagu Anggaran RKAS */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/50 rounded-2xl p-4.5 sm:p-5 border border-indigo-200/90 shadow-2xs hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#093262] via-indigo-600 to-purple-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-indigo-700" />
              Sisa Pagu RKAS
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#093262] text-amber-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Receipt className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-black text-indigo-950 tracking-tight tabular-nums">
              {formatRupiah(sisaPaguRkasSaatIni)}
            </h3>
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="text-indigo-800 font-semibold">SPJ ({selectedBulan}):</span>
              <strong className="text-indigo-900 font-bold">{bpuCountBulan} BPU Siap Cetak</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FITUR UTAMA: PEMANTAUAN REALISASI BULANAN 1 TAHUN PENUH (12 BULAN RKAS)  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0b4382] border border-blue-200 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#0b4382]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Pemantauan Realisasi 12 Bulan (Tahun {settings.tahunAnggaran || '2026'})
                </h3>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold rounded-full">
                  Multi-Bulan Supabase
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pekerjaan SPJ disimpan otomatis per bulan. Klik pada bulan untuk melihat atau mengerjakan SPJ bulan tersebut.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('bku')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0b4382] border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Upload BKU Bulanan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Grid 12 Bulan (Januari s.d. Desember) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {bulanSummaries.map((m) => {
            const isSelected = selectedBulan === m.bulan;
            return (
              <div
                key={m.bulan}
                onClick={() => onBulanChange && onBulanChange(m.bulan)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/90 border-[#0b4382] ring-2 ring-[#0b4382]/30 shadow-md'
                    : m.hasData
                    ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/70 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#093262] text-white text-[10px] font-black flex items-center justify-center">
                        {m.bulanIndex}
                      </span>
                      <strong className="text-xs font-black text-slate-900">
                        {m.bulan}
                      </strong>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                        m.hasData
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-200/70 text-slate-600 border-slate-300'
                      }`}
                    >
                      {m.hasData ? `✅ Terisi (${m.transactionCount})` : '⚪ Belum Terisi'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] pt-1 border-t border-slate-100">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Realisasi Belanja:</span>
                      <strong className={`font-mono font-bold ${m.totalKeluar > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {formatRupiah(m.totalKeluar)}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Penerimaan:</span>
                      <span className="font-mono text-slate-700">
                        {formatRupiah(m.totalTerima)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Saldo Akhir:</span>
                      <span className="font-mono font-bold text-amber-800">
                        {formatRupiah(m.saldoAkhir)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-semibold">
                    {m.tahap} • {m.triwulan}
                  </span>
                  <span
                    className={`font-black flex items-center gap-1 ${
                      isSelected ? 'text-[#0b4382]' : 'text-slate-600 group-hover:text-[#0b4382]'
                    }`}
                  >
                    {isSelected ? 'Bulan Aktif' : 'Buka SPJ →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Analytics Section: Serapan Dana & Komposisi Belanja */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Serapan Dana Progress */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#0b4382] flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-extrabold text-[#093262] text-xs uppercase tracking-wider">
                  SERAPAN DANA BOSP TAHUNAN
                </h4>
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#0b4382] text-white shadow-2xs">
                {persentaseSerapanTahunan}%
              </span>
            </div>

            <div className="relative pt-2">
              <div className="overflow-hidden h-3.5 text-xs flex rounded-full bg-slate-100 border border-slate-200">
                <div
                  style={{ width: `${persentaseSerapanTahunan}%` }}
                  className="shadow-xs flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-[#0b4382] via-blue-600 to-amber-400 transition-all duration-500 rounded-full"
                ></div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-[#0b4382]" />
                  Total Pagu RKAS (1 Tahun)
                </span>
                <span className="font-bold text-slate-900">{formatRupiah(totalPaguRkas)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Total Realisasi Kumulatif
                </span>
                <span className="font-bold text-emerald-700">{formatRupiah(totalRealisasiTahunan)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Sisa Anggaran RKAS Belum Dibelanjakan
                </span>
                <span className="font-bold text-amber-900">
                  {formatRupiah(sisaPaguRkasSaatIni)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 rounded-xl border border-blue-200/80 text-[11px] text-[#072449] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0b4382] shrink-0" />
            <span>
              Saldo kas saat ini sebesar <strong>{formatRupiah(sisaSaldoKasSaatIni)}</strong> siap digunakan untuk belanja bulan berjalan.
            </span>
          </div>
        </div>

        {/* Realisasi Komposisi 3 Jenis Belanja Berdasarkan Kode Rekening BKU */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <PieChart className="w-3.5 h-3.5" />
              </div>
              <h4 className="font-extrabold text-[#093262] text-xs uppercase tracking-wider">
                KOMPOSISI BELANJA ({selectedBulan})
              </h4>
            </div>

            <div className="space-y-3">
              {/* 5.1.02 — Belanja Barang dan Jasa */}
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/80">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate" title="5.1.02 — Belanja Barang dan Jasa">
                      5.1.02 Belanja Barang &amp; Jasa
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-900 shrink-0 tabular-nums">
                    {formatRupiah(belanjaBarangJasa)}
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden my-1">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pctBarang}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Realisasi BKU</span>
                  <span className="font-bold text-emerald-700">{pctBarang}%</span>
                </div>
              </div>

              {/* 5.2.02 — Belanja Modal Peralatan dan Mesin */}
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/80">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0b4382] shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate" title="5.2.02 — Belanja Modal Peralatan dan Mesin">
                      5.2.02 Modal Peralatan &amp; Mesin
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-900 shrink-0 tabular-nums">
                    {formatRupiah(belanjaModalPeralatanMesin)}
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden my-1">
                  <div
                    className="bg-gradient-to-r from-[#0b4382] to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pctPeralatan}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Realisasi BKU</span>
                  <span className="font-bold text-[#0b4382]">{pctPeralatan}%</span>
                </div>
              </div>

              {/* 5.2.05 — Belanja Modal Aset Tetap Lainnya */}
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100/80">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate" title="5.2.05 — Belanja Modal Aset Tetap Lainnya">
                      5.2.05 Modal Aset Tetap Lainnya
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-900 shrink-0 tabular-nums">
                    {formatRupiah(belanjaModalAsetTetap)}
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden my-1">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pctAsetTetap}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Realisasi BKU</span>
                  <span className="font-bold text-amber-800">{pctAsetTetap}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              Total Belanja ({selectedBulan}): <strong className="text-slate-800 font-bold">{formatRupiah(totalKomposisi)}</strong>
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold">
              100% Akurat
            </span>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-extrabold text-[#093262] text-xs uppercase tracking-wider">
              MENU ADMINISTRASI SPJ ({selectedBulan})
            </h4>
          </div>
          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('kwitansi')}
              className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-slate-50/80 hover:bg-blue-50/80 border border-slate-200/80 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0b4382] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 group-hover:text-[#0b4382] truncate">
                    Cetak Kwitansi &amp; Nota Landscape
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">Format resmi 2 item per lembar A4</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0b4382] transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
            </button>

            <button
              onClick={() => onNavigate('tandaterima')}
              className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-slate-50/80 hover:bg-emerald-50/80 border border-slate-200/80 hover:border-emerald-300 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 truncate">
                    Tanda Terima Honor &amp; Tukang
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">Daftar penerimaan siap tanda tangan</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
            </button>

            <button
              onClick={() => onNavigate('pajak')}
              className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-slate-50/80 hover:bg-amber-50/80 border border-slate-200/80 hover:border-amber-300 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Percent className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <p className="font-bold text-xs text-slate-900 group-hover:text-amber-800 truncate">
                      Buku Pembantu Pajak &amp; SSPD
                    </p>
                    {totalPajakBelumSetor > 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full font-bold shrink-0">
                        Perlu Setor
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">PPh 21, PPh 23, PPN &amp; Pajak Daerah</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-800 transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
            </button>

            <button
              onClick={() => onNavigate('sppd')}
              className="w-full text-left p-2.5 sm:p-3 rounded-xl bg-slate-50/80 hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-300 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 group-hover:text-indigo-700 truncate">
                    Cetak SPPD &amp; Surat Tugas
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">Lembar 1 &amp; 2 visum resmi</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
