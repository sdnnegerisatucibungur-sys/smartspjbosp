import React, { useState } from 'react';
import {
  Printer,
  FileText,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Download,
  Check,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AppSettings, SppdData } from '../types';
import { formatRupiah, terbilang, formatTanggalIndo } from '../utils/formatters';
import {
  SPPD_KEGIATAN_PRESETS,
  createDefaultSppd,
  SppdActivityPreset,
} from '../utils/sppdData';
import { generateSppdPdf } from '../utils/sppdPdf';
import { DAFTAR_BULAN } from '../utils/monthHelper';

interface SppdTabProps {
  settings: AppSettings;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  selectedBulan?: string;
  onBulanChange?: (b: string) => void;
}

export const SppdTab: React.FC<SppdTabProps> = ({
  settings,
  showToast,
  selectedBulan = 'Januari',
  onBulanChange,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('kkg-gugus');
  const [sppd, setSppd] = useState<SppdData>(() =>
    createDefaultSppd(settings, 'kkg-gugus')
  );
  const [activeSheet, setActiveSheet] = useState<'all' | 'lembar1' | 'lembar2' | 'lembar3'>('lembar2');
  const [showVisumDetails, setShowVisumDetails] = useState<boolean>(true);
  const [showTransitStages, setShowTransitStages] = useState<boolean>(false);
  const [useManualSignatureTujuan, setUseManualSignatureTujuan] = useState<boolean>(true);
  const [emptyRow1, setEmptyRow1] = useState<boolean>(true);

  const totalBiaya =
    (sppd.biayaTransport || 0) +
    (sppd.biayaUangHarian || 0) +
    (sppd.biayaPenginapan || 0) +
    (sppd.biayaLainLain || 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = (sheet: 'all' | 'lembar1' | 'lembar2' | 'lembar3' = activeSheet) => {
    try {
      generateSppdPdf(sppd, settings, sheet, {
        useManualSignatureTujuan: useManualSignatureTujuan,
        emptyRow1: emptyRow1,
      });
      showToast('PDF SPPD Resmi (SPPD WAJIB KERTAS A4.pdf) berhasil diunduh', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat file PDF SPPD', 'error');
    }
  };

  // Switch Activity Preset
  const handleSelectKegiatan = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = SPPD_KEGIATAN_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setSppd((prev) => ({
      ...prev,
      kegiatanPresetId: preset.id,
      namaKegiatan: preset.namaKegiatan,
      maksudPerjalanan: preset.maksudPerjalanan,
      tempatTujuan: preset.tempatTujuan,
      instansiTujuan: preset.instansiTujuan,
      lamaHari: preset.lamaHari,
      alatAngkutan: preset.alatAngkutan,
      biayaTransport: preset.biayaTransport,
      biayaUangHarian: preset.biayaUangHarian,

      // Auto update Visum Lembar Belakang
      visumTibaDi: preset.tempatTujuan,
      visumBerangkatDari: preset.tempatTujuan,
      visumTibaJabatan: preset.pejabatTujuanJabatan,
      visumBerangkatJabatan: preset.pejabatTujuanJabatan,
      visumTibaNama: preset.pejabatTujuanNama || '',
      visumTibaNip: preset.pejabatTujuanNip || '',
      visumBerangkatNama: preset.pejabatTujuanNama || '',
      visumBerangkatNip: preset.pejabatTujuanNip || '',
    }));

    if (preset.pejabatTujuanNama) {
      setUseManualSignatureTujuan(false);
    } else {
      setUseManualSignatureTujuan(true);
    }

    showToast(`Format disesuaikan untuk: ${preset.namaKegiatan}`, 'info');
  };

  // Switch Pegawai
  const handleSelectPegawai = (guruId: string | number) => {
    const found = settings.guruList.find((g) => String(g.id) === String(guruId));
    if (found) {
      setSppd((prev) => ({
        ...prev,
        pegawaiId: String(found.id),
        pegawaiNama: found.nama,
        pegawaiNip: found.nip || '',
        pegawaiPangkatGol: found.gol || (found.status === 'PNS' ? 'Penata Muda / III.a' : '-'),
        pegawaiJabatan: found.jabatan || 'Guru',
      }));
      showToast(`Data SPPD diisi untuk ${found.nama}`, 'info');
    }
  };

  // Sync date change to all Visum dates
  const handleTanggalBerangkatChange = (newDate: string) => {
    setSppd((prev) => ({
      ...prev,
      tglBerangkat: newDate,
      tglKembali: prev.lamaHari === 1 ? newDate : prev.tglKembali,
      visumTglTiba: newDate,
      visumTglBerangkatKembali: prev.lamaHari === 1 ? newDate : prev.tglKembali,
      kembaliTglTiba: prev.lamaHari === 1 ? newDate : prev.tglKembali,
    }));
  };

  const handleTanggalKembaliChange = (newDate: string) => {
    setSppd((prev) => ({
      ...prev,
      tglKembali: newDate,
      visumTglBerangkatKembali: newDate,
      kembaliTglTiba: newDate,
    }));
  };

  const handleResetToDefault = () => {
    const def = createDefaultSppd(settings, selectedPresetId);
    setSppd(def);
    showToast('Formulir SPPD dikembalikan ke pengaturan awal', 'info');
  };

  const currentPreset =
    SPPD_KEGIATAN_PRESETS.find((p) => p.id === selectedPresetId) ||
    SPPD_KEGIATAN_PRESETS[0];

  return (
    <div id="tab-sppd-view" className="space-y-6">
      {/* Configuration & Controls (No Print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 no-print">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                Format SPPD & Visum Resmi 100%
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
                {currentPreset.badge}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Penerbitan SPPD & Lembar Visum Perjalanan Dinas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih kegiatan & pegawai dari dropdown untuk mengisi otomatis Lembar 1 (SPPD Depan), Lembar 2 (Visum Belakang), dan Lembar 3 (Biaya Riil).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Dropdown Pilihan Bulan SPPD */}
            {onBulanChange && (
              <div className="flex items-center space-x-1.5 bg-blue-50/90 px-3 py-2 rounded-xl border border-blue-300 text-xs shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#0b4382]" />
                <label className="text-[#093262] font-extrabold text-[11px] whitespace-nowrap">
                  Bulan:
                </label>
                <select
                  id="select-sppd-bulan"
                  value={selectedBulan}
                  onChange={(e) => onBulanChange(e.target.value)}
                  className="bg-transparent text-xs font-black text-[#072449] focus:outline-none cursor-pointer"
                  title="Pilih Bulan SPPD"
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

            <button
              onClick={handleResetToDefault}
              title="Reset Formulir"
              className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleDownloadPdf(activeSheet)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF Resmi</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Berkas (Print)</span>
            </button>
          </div>
        </div>

        {/* Sheet Switcher Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/60 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveSheet('all')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSheet === 'all'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Lembar (Berkas Lengkap)</span>
          </button>
          <button
            onClick={() => setActiveSheet('lembar1')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSheet === 'lembar1'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lembar 1: SPPD Depan</span>
          </button>
          <button
            onClick={() => setActiveSheet('lembar2')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSheet === 'lembar2'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Lembar 2: Visum Belakang (Format Resmi 100%)</span>
          </button>
          <button
            onClick={() => setActiveSheet('lembar3')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSheet === 'lembar3'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Lembar 3: Rincian Biaya Riil</span>
          </button>
        </div>

        {/* Core Dropdowns: 1. Kegiatan, 2. Pegawai */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Dropdown 1: Kegiatan Perjalanan Dinas */}
          <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-blue-900 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                1. Pilih Kegiatan Perjalanan Dinas (Dropdown Preset)
              </label>
              <span className="text-[10px] text-blue-600 font-medium">Otomatis isi rincian & visum</span>
            </div>
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectKegiatan(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-xl font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              {SPPD_KEGIATAN_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  [{preset.kategori}] {preset.namaKegiatan}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-600 italic">
              Maksud: {sppd.maksudPerjalanan}
            </p>
          </div>

          {/* Dropdown 2: Pegawai Yang Berangkat */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-600" />
                2. Pilih Pegawai / Guru Yang Ditugaskan (Dropdown Perorangan)
              </label>
              <span className="text-[10px] text-slate-500 font-medium">{settings.guruList.length} Pegawai Terdaftar</span>
            </div>
            <select
              value={sppd.pegawaiId || ''}
              onChange={(e) => handleSelectPegawai(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="">-- Pilih Pegawai --</option>
              {settings.guruList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nama} — {g.jabatan || 'Guru'} ({g.nip ? `NIP. ${g.nip}` : 'Non-PNS'})
                </option>
              ))}
            </select>

            {/* Quick Switch Badges for Teachers */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
              <span className="text-[10px] text-slate-400 font-semibold shrink-0">Cepat:</span>
              {settings.guruList.slice(0, 5).map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSelectPegawai(g.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all shrink-0 cursor-pointer ${
                    sppd.pegawaiNama === g.nama
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {g.nama.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nomor SPPD</label>
            <input
              type="text"
              value={sppd.noSppd}
              onChange={(e) => setSppd({ ...sppd, noSppd: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-800 bg-slate-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tempat Tujuan</label>
            <input
              type="text"
              value={sppd.tempatTujuan}
              onChange={(e) =>
                setSppd({
                  ...sppd,
                  tempatTujuan: e.target.value,
                  visumTibaDi: e.target.value,
                  visumBerangkatDari: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal Berangkat</label>
            <input
              type="date"
              value={sppd.tglBerangkat}
              onChange={(e) => handleTanggalBerangkatChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal Kembali</label>
            <input
              type="date"
              value={sppd.tglKembali}
              onChange={(e) => handleTanggalKembaliChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 font-semibold"
            />
          </div>
        </div>

        {/* Accordion: Pengaturan Visum Tiba & Berangkat (Lembar Belakang) */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowVisumDetails(!showVisumDetails)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Pengaturan Pilihan Tiba & Berangkat (Lembar Belakang / Visum)
            </span>
            <div className="flex items-center gap-2 text-slate-500 font-normal">
              <span>{showVisumDetails ? 'Sembunyikan' : 'Buka Pengaturan'}</span>
              {showVisumDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showVisumDetails && (
            <div className="p-4 space-y-4 text-xs bg-white border-t border-slate-100">
              {/* Box I & II Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bagian I: Keberangkatan dari Kedudukan Asal */}
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>Bagian I: Berangkat dari Tempat Kedudukan</span>
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700">Kolom Kanan Atas</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Berangkat Dari</label>
                      <input
                        type="text"
                        value={sppd.tempatBerangkat}
                        onChange={(e) => setSppd({ ...sppd, tempatBerangkat: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Ke (Tujuan)</label>
                      <input
                        type="text"
                        value={sppd.tempatTujuan}
                        onChange={(e) => setSppd({ ...sppd, tempatTujuan: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Pejabat Pengesah Asal</label>
                    <input
                      type="text"
                      value={sppd.ppkNama || settings.namaKepsek}
                      onChange={(e) => setSppd({ ...sppd, ppkNama: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 font-bold"
                    />
                  </div>
                </div>

                {/* Bagian II: Tiba di & Berangkat dari Tempat Tujuan */}
                <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/70 space-y-2.5">
                  <div className="font-bold text-blue-900 border-b border-blue-200 pb-1.5 flex items-center justify-between">
                    <span>Bagian II: Pengesahan di Tempat Tujuan (Visum)</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Kolom Kiri & Kanan</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Tiba di (Tujuan)</label>
                      <input
                        type="text"
                        value={sppd.visumTibaDi || sppd.tempatTujuan}
                        onChange={(e) => setSppd({ ...sppd, visumTibaDi: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Berangkat Kembali Ke</label>
                      <input
                        type="text"
                        value={sppd.visumBerangkatKe || `${settings.namaSekolah} (${settings.desaKelurahan})`}
                        onChange={(e) => setSppd({ ...sppd, visumBerangkatKe: e.target.value })}
                        className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Jabatan Pejabat di Lokasi Tujuan
                    </label>
                    <input
                      type="text"
                      value={sppd.visumTibaJabatan || ''}
                      onChange={(e) =>
                        setSppd({
                          ...sppd,
                          visumTibaJabatan: e.target.value,
                          visumBerangkatJabatan: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg text-slate-800 font-bold"
                      placeholder="Contoh: Kepala Satuan Pendidikan di Kec. Cibeber / Kepala Dinas"
                    />
                  </div>

                  {/* Format Baris Pertama Sesuai SPPD WAJIB KERTAS A4.pdf */}
                  <div className="pt-2 space-y-2 bg-white p-3 rounded-lg border border-blue-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-slate-700">Baris Pertama (Paling Atas):</label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="emptyRow1Option"
                            checked={emptyRow1}
                            onChange={() => setEmptyRow1(true)}
                            className="text-blue-600"
                          />
                          <span className="text-[11px] text-slate-800 font-semibold">2 Kolom Kosong (Wajib Sesuai SPPD WAJIB KERTAS A4.pdf)</span>
                        </label>

                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="emptyRow1Option"
                            checked={!emptyRow1}
                            onChange={() => setEmptyRow1(false)}
                            className="text-blue-600"
                          />
                          <span className="text-[11px] text-slate-700 font-medium">Isi Bagian I (Asal) di Kanan</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Mode Pengesahan / Tanda Tangan Lokasi Tujuan */}
                  <div className="pt-2 space-y-2 bg-white p-3 rounded-lg border border-blue-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-slate-700">Pengesahan di Lokasi Tujuan (Bagian II):</label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="visumSignType"
                            checked={useManualSignatureTujuan}
                            onChange={() => {
                              setUseManualSignatureTujuan(true);
                              setSppd((prev) => ({
                                ...prev,
                                visumTibaNama: '',
                                visumTibaNip: '',
                                visumBerangkatNama: '',
                                visumBerangkatNip: '',
                              }));
                            }}
                            className="text-blue-600"
                          />
                          <span className="text-[11px] text-slate-800 font-semibold">Titik-Titik Manual (Format Asli sppd.pdf)</span>
                        </label>

                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="visumSignType"
                            checked={!useManualSignatureTujuan}
                            onChange={() => {
                              setUseManualSignatureTujuan(false);
                              if (!sppd.visumTibaNama) {
                                setSppd((prev) => ({
                                  ...prev,
                                  visumTibaNama: currentPreset.pejabatTujuanNama || 'Iwan Fathurohman, S.Pd',
                                  visumTibaNip: currentPreset.pejabatTujuanNip || '198205172008011002',
                                  visumBerangkatNama: currentPreset.pejabatTujuanNama || 'Iwan Fathurohman, S.Pd',
                                  visumBerangkatNip: currentPreset.pejabatTujuanNip || '198205172008011002',
                                }));
                              }
                            }}
                            className="text-blue-600"
                          />
                          <span className="text-[11px] text-slate-700 font-medium">Teks Nama & NIP</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {!useManualSignatureTujuan && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Nama Pejabat Tujuan</label>
                        <input
                          type="text"
                          value={sppd.visumTibaNama || ''}
                          onChange={(e) =>
                            setSppd({
                              ...sppd,
                              visumTibaNama: e.target.value,
                              visumBerangkatNama: e.target.value,
                            })
                          }
                          placeholder="Nama Pejabat di Lokasi"
                          className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">NIP Pejabat Tujuan</label>
                        <input
                          type="text"
                          value={sppd.visumTibaNip || ''}
                          onChange={(e) =>
                            setSppd({
                              ...sppd,
                              visumTibaNip: e.target.value,
                              visumBerangkatNip: e.target.value,
                            })
                          }
                          placeholder="NIP (jika PNS)"
                          className="w-full px-2 py-1 border border-slate-200 rounded text-[11px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle Tahap Tambahan / Transit (III & IV) */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowTransitStages(!showTransitStages)}
                  className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{showTransitStages ? '− Tutup Kolom Transit III & IV' : '+ Tampilkan Kolom Transit / Multi-Tujuan (III & IV)'}</span>
                </button>
                <span className="text-[10px] text-slate-400">
                  (Default kosong atau titik-titik sesuai blanko resmi)
                </span>
              </div>

              {showTransitStages && (
                <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/80 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-amber-900 block mb-1">Tahap III (Tiba & Berangkat Transit 1)</span>
                    <input
                      type="text"
                      placeholder="Tiba di mana"
                      value={sppd.visumTahap3?.tibaDi || ''}
                      onChange={(e) =>
                        setSppd({
                          ...sppd,
                          visumTahap3: { ...sppd.visumTahap3!, tibaDi: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-amber-200 rounded-lg text-slate-800 bg-white mb-1.5"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-amber-900 block mb-1">Tahap IV (Tiba & Berangkat Transit 2)</span>
                    <input
                      type="text"
                      placeholder="Tiba di mana"
                      value={sppd.visumTahap4?.tibaDi || ''}
                      onChange={(e) =>
                        setSppd({
                          ...sppd,
                          visumTahap4: { ...sppd.visumTahap4!, tibaDi: e.target.value },
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-amber-200 rounded-lg text-slate-800 bg-white mb-1.5"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Biaya Riil Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Biaya Transport (Rp)</label>
            <input
              type="number"
              value={sppd.biayaTransport}
              onChange={(e) => setSppd({ ...sppd, biayaTransport: Number(e.target.value) })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Uang Harian (Rp)</label>
            <input
              type="number"
              value={sppd.biayaUangHarian}
              onChange={(e) => setSppd({ ...sppd, biayaUangHarian: Number(e.target.value) })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Biaya Penginapan (Rp)</label>
            <input
              type="number"
              value={sppd.biayaPenginapan}
              onChange={(e) => setSppd({ ...sppd, biayaPenginapan: Number(e.target.value) })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Total Biaya Riil</label>
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl font-bold font-mono text-blue-800 flex items-center justify-between">
              <span>{formatRupiah(totalBiaya)}</span>
              <span className="text-[10px] text-blue-600">{sppd.lamaHari} Hari</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PREVIEW & PRINT PAGES (100% PERSIS FORMAT RESMI) */}
      {/* ========================================================================= */}
      <div id="printable-sppd-area" className="space-y-8">
        {/* LEMBAR 1: SPPD DEPAN */}
        {(activeSheet === 'all' || activeSheet === 'lembar1') && (
          <div className="print-page-portrait bg-white p-8 md:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 font-serif text-xs leading-relaxed text-black">
            {/* Kop Surat Resmi */}
            <div className="text-center pb-2 border-b-2 border-black">
              <h3 className="font-bold text-sm tracking-wider uppercase">PEMERINTAH KABUPATEN LEBAK</h3>
              <h2 className="font-bold text-base tracking-wider uppercase">DINAS PENDIDIKAN</h2>
              <h1 className="font-black text-lg tracking-wide uppercase">{settings.namaSekolah}</h1>
              <p className="font-sans text-[10px] text-slate-700">
                {settings.alamat} — Kab. Lebak, Banten
              </p>
              <div className="border-b border-black mt-1" />
            </div>

            {/* Judul SPPD */}
            <div className="text-center py-2 space-y-1">
              <h3 className="font-bold text-sm tracking-wide uppercase underline">
                SURAT PERINTAH PERJALANAN DINAS
              </h3>
              <p className="font-bold text-xs">( S P P D )</p>
              <p className="font-sans text-xs">Nomor : {sppd.noSppd}</p>
            </div>

            {/* Tabel 10 Poin Format Baku Pemerintah */}
            <table className="w-full border-collapse border border-black text-xs font-serif">
              <tbody>
                <tr className="border-b border-black">
                  <td className="py-1.5 px-2 text-center border-r border-black w-8 font-bold">1.</td>
                  <td className="py-1.5 px-3 border-r border-black w-72 font-semibold">
                    Pejabat Pembuat Komitmen / Yang Memberi Perintah
                  </td>
                  <td className="py-1.5 px-3">{sppd.ppkNama || settings.namaKepsek}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-1.5 px-2 text-center border-r border-black font-bold">2.</td>
                  <td className="py-1.5 px-3 border-r border-black font-semibold">
                    Nama / NIP Pegawai yang diperintahkan
                  </td>
                  <td className="py-1.5 px-3">
                    <span className="font-bold">{sppd.pegawaiNama}</span>
                    <br />
                    <span className="text-[11px]">NIP. {sppd.pegawaiNip || '-'}</span>
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-1.5 px-2 text-center border-r border-black font-bold">3.</td>
                  <td className="py-1.5 px-3 border-r border-black font-semibold">
                    a. Pangkat dan Golongan ruang gaji
                    <br />
                    b. Jabatan / Instansi
                    <br />
                    c. Tingkat Biaya Perjalanan Dinas
                  </td>
                  <td className="py-1.5 px-3">
                    a. {sppd.pegawaiPangkatGol || '-'}
                    <br />
                    b. {sppd.pegawaiJabatan || 'Guru'} / {settings.namaSekolah}
                    <br />
                    c. {sppd.tingkatBiaya || 'Tingkat C / Biasa'}
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-1.5 px-2 text-center border-r border-black font-bold">4.</td>
                  <td className="py-1.5 px-3 border-r border-black font-semibold">Maksud Perjalanan Dinas</td>
                  <td className="py-1.5 px-3 font-medium">{sppd.maksudPerjalanan}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-1.5 px-2 text-center border-r border-black font-bold">5.</td>
                  <td className="py-1.5 px-3 border-r border-black font-semibold">
                    Alat angkutan yang dipergunakan
                  </td>
                  <td className="py-1.5 px-3">{sppd.alatAngkutan || 'Kendaraan Darat'}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-1.5 px-2 text-center border-r border-black font-bold">6.</td>
                  <td className="py-1.5 px-3 border-r border-black font-semibold">
                    a. Tempat berangkat
                    <br />
                    b. Tempat tujuan
                  </td>
                  <td className="py-1.5 px-3">
                    a. {sppd.tempatBerangkat}
                    <br />
                    b. {sppd.tempatTujuan}
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-1.5 px-2 text-center border-r border-black font-bold">7.</td>
                  <td className="py-1.5 px-3 border-r border-black font-semibold">
                    a. Lamanya perjalanan dinas
                    <br />
                    b. Tanggal berangkat
                    <br />
                    c. Tanggal harus kembali
                  </td>
                  <td className="py-1.5 px-3">
                    a. {sppd.lamaHari} ({sppd.lamaHari === 1 ? 'Satu' : sppd.lamaHari}) hari
                    <br />
                    b. {formatTanggalIndo(sppd.tglBerangkat)}
                    <br />
                    c. {formatTanggalIndo(sppd.tglKembali)}
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-1.5 px-2 text-center border-r border-black font-bold">8.</td>
                  <td className="py-1.5 px-3 border-r border-black font-semibold">Pengikut / NIP</td>
                  <td className="py-1.5 px-3 italic">- Tidak ada -</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-1.5 px-2 text-center border-r border-black font-bold">9.</td>
                  <td className="py-1.5 px-3 border-r border-black font-semibold">
                    Pembebanan Anggaran
                    <br />
                    a. Instansi / Sumber Dana
                    <br />
                    b. Akun / Kode Rekening
                  </td>
                  <td className="py-1.5 px-3">
                    a. {sppd.bebanAnggaran}
                    <br />
                    b. {sppd.mataAnggaran}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2 text-center border-r border-black font-bold">10.</td>
                  <td className="py-1.5 px-3 border-r border-black font-semibold">Keterangan lain-lain</td>
                  <td className="py-1.5 px-3 italic">Dilaksanakan dengan penuh rasa tanggung jawab</td>
                </tr>
              </tbody>
            </table>

            {/* Signatures Lembar 1 */}
            <div className="pt-6 flex justify-between items-start text-xs font-serif">
              <div />
              <div className="text-left w-72 space-y-1">
                <p>
                  Dikeluarkan di : {settings.kotaTanggal || 'Cigemblong'}
                  <br />
                  Pada tanggal : {formatTanggalIndo(sppd.tglBerangkat)}
                </p>
                <p className="font-bold pt-1">
                  {sppd.ppkJabatan || 'PEJABAT PEMBUAT KOMITMEN'}
                  <br />
                  {settings.namaSekolah}
                </p>
                <div className="h-16" />
                <p className="font-bold underline uppercase">{sppd.ppkNama || settings.namaKepsek}</p>
                <p className="text-[11px]">NIP. {sppd.ppkNip || settings.nipKepsek}</p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEMBAR 2: VISUM TIBA / BERANGKAT (100% PERSIS KERTAS A4 & MARGIN ~0.5 CM) */}
        {/* ========================================================================= */}
        {(activeSheet === 'all' || activeSheet === 'lembar2') && (
          <div className="print-page-portrait bg-white p-[5mm] rounded-2xl border border-slate-200/80 shadow-xs space-y-2 font-sans text-[11px] leading-snug text-black min-h-[287mm] flex flex-col justify-between">
            {/* TABEL VISUM UTAMA FULL KERTAS A4 */}
            <div className="border border-black flex-1 flex flex-col justify-between">
              {/* ROW I: 2 KOLOM BARIS PERTAMA (UKURAN TETAP FULL A4 BAIK KOSONG MAUPUN TERISI) */}
              <div className="grid grid-cols-2 divide-x divide-black border-b border-black h-[50mm] min-h-[50mm]">
                {/* Kiri: Kosong */}
                <div className="p-3" />

                {/* Kanan: Kosong jika emptyRow1, atau I. Berangkat dari jika !emptyRow1 */}
                {emptyRow1 ? (
                  <div className="p-3" />
                ) : (
                  <div className="p-3 text-left flex flex-col justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-start">
                        <span className="w-36 font-bold">I.  Berangkat dari</span>
                        <span className="flex-1">:  {sppd.tempatBerangkat || settings.namaSekolah}</span>
                      </div>
                      <div className="pl-6 text-[10px] text-slate-600">(Tempat Kedudukan)</div>
                      <div className="flex items-start">
                        <span className="w-36 pl-5">Ke</span>
                        <span className="flex-1">:  {sppd.tempatTujuan}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-36 pl-5">Pada Tanggal</span>
                        <span className="flex-1">:  {formatTanggalIndo(sppd.tglBerangkat)}</span>
                      </div>
                    </div>

                    <div className="pt-2 text-center w-56 mx-auto">
                      <div className="h-6" />
                      <p className="font-bold underline uppercase">{sppd.ppkNama || settings.namaKepsek}</p>
                      <p className="text-[10px]">NIP. {sppd.ppkNip || settings.nipKepsek}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ROW II: 2 KOLOM BARIS KE-2 (TIBA DI & BERANGKAT DARI - UKURAN SAMA DENGAN BARIS I s/d V) */}
              <div className="grid grid-cols-2 divide-x divide-black border-b border-black h-[50mm] min-h-[50mm]">
                {/* Kiri: II. Tiba di (Tanpa teks Kepala Satuan Pendidikan dan tanpa ceklis) */}
                <div className="p-3 text-left flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-start">
                      <span className="w-32 font-bold">II. Tiba di</span>
                      <span className="flex-1">:  {sppd.visumTibaDi || sppd.tempatTujuan}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-32 pl-5">Pada tanggal</span>
                      <span className="flex-1">:  {formatTanggalIndo(sppd.visumTglTiba || sppd.tglBerangkat)}</span>
                    </div>
                  </div>

                  <div className="pb-1 text-center w-56 mx-auto flex flex-col items-center">
                    {useManualSignatureTujuan || !sppd.visumTibaNama ? (
                      <>
                        <p className="text-[11px] tracking-wider">......................................................</p>
                        <p className="text-[11px]">NIP...................................................</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold underline uppercase">{sppd.visumTibaNama}</p>
                        <p className="text-[10px]">NIP. {sppd.visumTibaNip || '-'}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Kanan: Berangkat dari Tujuan kembali ke Asal (Tanpa teks Kepala Satuan Pendidikan dan tanpa ceklis) */}
                <div className="p-3 text-left flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-start">
                      <span className="w-36 font-bold">Berangkat dari</span>
                      <span className="flex-1">:  {sppd.visumBerangkatDari || sppd.tempatTujuan}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36">Ke</span>
                      <span className="flex-1">:  {sppd.visumBerangkatKe || `${settings.namaSekolah} (${settings.desaKelurahan || 'Cigemblong'})`}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36">Pada Tanggal</span>
                      <span className="flex-1">:  {formatTanggalIndo(sppd.visumTglBerangkatKembali || sppd.tglKembali)}</span>
                    </div>
                  </div>

                  <div className="pb-1 text-center w-56 mx-auto flex flex-col items-center">
                    {useManualSignatureTujuan || !sppd.visumBerangkatNama ? (
                      <>
                        <p className="text-[11px] tracking-wider">......................................................</p>
                        <p className="text-[11px]">NIP. .................................................</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold underline uppercase">{sppd.visumBerangkatNama}</p>
                        <p className="text-[10px]">NIP. {sppd.visumBerangkatNip || '-'}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ROW III: PERSIS SPPD WAJIB KERTAS A4.PDF */}
              <div className="grid grid-cols-2 divide-x divide-black border-b border-black h-[50mm] min-h-[50mm]">
                {/* Kiri: III. Tiba di */}
                <div className="p-3 text-left flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-start">
                      <span className="w-32 font-bold">III.  Tiba di</span>
                      <span className="flex-1">:</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-32 pl-7">Pada tanggal</span>
                      <span className="flex-1">:</span>
                    </div>
                  </div>

                  <div className="pb-1 text-center w-56 mx-auto">
                    <p className="text-[11px] tracking-wider">......................................................</p>
                    <p className="text-[11px]">NIP...................................................</p>
                  </div>
                </div>

                {/* Kanan: Berangkat dari */}
                <div className="p-3 text-left flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-start">
                      <span className="w-36 font-bold">Berangkat dari</span>
                      <span className="flex-1">:</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36">Ke</span>
                      <span className="flex-1">:</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36">Pada Tanggal</span>
                      <span className="flex-1">:</span>
                    </div>
                  </div>

                  <div className="pb-1 text-center w-56 mx-auto">
                    <p className="text-[11px] tracking-wider">......................................................</p>
                    <p className="text-[11px]">NIP. .................................................</p>
                  </div>
                </div>
              </div>

              {/* ROW IV: PERSIS SPPD WAJIB KERTAS A4.PDF */}
              <div className="grid grid-cols-2 divide-x divide-black border-b border-black h-[50mm] min-h-[50mm]">
                {/* Kiri: IV. Tiba di */}
                <div className="p-3 text-left flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-start">
                      <span className="w-32 font-bold">IV.   Tiba di</span>
                      <span className="flex-1">:</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-32 pl-7">Pada tanggal</span>
                      <span className="flex-1">:</span>
                    </div>
                  </div>

                  <div className="pb-1 text-center w-56 mx-auto">
                    <p className="text-[11px] tracking-wider">......................................................</p>
                    <p className="text-[11px]">NIP...................................................</p>
                  </div>
                </div>

                {/* Kanan: Berangkat dari */}
                <div className="p-3 text-left flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-start">
                      <span className="w-36 font-bold">Berangkat dari</span>
                      <span className="flex-1">:</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36">Ke</span>
                      <span className="flex-1">:</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36">Pada Tanggal</span>
                      <span className="flex-1">:</span>
                    </div>
                  </div>

                  <div className="pb-1 text-center w-56 mx-auto">
                    <p className="text-[11px] tracking-wider">......................................................</p>
                    <p className="text-[11px]">NIP. .................................................</p>
                  </div>
                </div>
              </div>

              {/* ROW V: BARIS V DI BAWAH IV (UKURAN DAN KOLOM PERSIS SAMA DENGAN I s/d IV) */}
              <div className="grid grid-cols-2 divide-x divide-black border-b border-black h-[50mm] min-h-[50mm]">
                {/* Kiri: V. Tiba di */}
                <div className="p-3 text-left flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-start">
                      <span className="w-32 font-bold">V.    Tiba di</span>
                      <span className="flex-1">:</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-32 pl-7">Pada tanggal</span>
                      <span className="flex-1">:</span>
                    </div>
                  </div>

                  <div className="pb-1 text-center w-56 mx-auto">
                    <p className="text-[11px] tracking-wider">......................................................</p>
                    <p className="text-[11px]">NIP...................................................</p>
                  </div>
                </div>

                {/* Kanan: Berangkat dari */}
                <div className="p-3 text-left flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-start">
                      <span className="w-36 font-bold">Berangkat dari</span>
                      <span className="flex-1">:</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36">Ke</span>
                      <span className="flex-1">:</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-36">Pada Tanggal</span>
                      <span className="flex-1">:</span>
                    </div>
                  </div>

                  <div className="pb-1 text-center w-56 mx-auto">
                    <p className="text-[11px] tracking-wider">......................................................</p>
                    <p className="text-[11px]">NIP. .................................................</p>
                  </div>
                </div>
              </div>

              {/* ROW VI: CATATAN LAIN-LAIN (PERSIS SEPERTI SPPD WAJIB KERTAS A4.PDF) */}
              <div className="p-2.5 h-[8mm] min-h-[8mm] flex items-center text-[11px]">
                <span className="font-bold mr-2">VI.</span>
                <span className="text-slate-800">{sppd.catatanLain || ''}</span>
              </div>
            </div>

            {/* ROW VII: PERHATIAN (PERSIS SEPERTI DI SPPD WAJIB KERTAS A4.PDF) */}
            <div className="pt-2 space-y-1 text-[10px] leading-relaxed">
              <p className="font-bold">VII. PERHATIAN :</p>
              <p className="text-justify text-slate-900">
                Pejabat yang berwenang menerbitkan SPPD, Pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat, serta bendaharawan bertanggungjawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara menderita rugi akibat kesalahan, kelalaian dan kealpaannya.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEMBAR 3: RINCIAN BIAYA RIIL & BUKTI PENGELUARAN */}
        {/* ========================================================================= */}
        {(activeSheet === 'all' || activeSheet === 'lembar3') && (
          <div className="print-page-portrait bg-white p-8 md:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 font-serif text-xs leading-relaxed text-black">
            {/* Kop Surat */}
            <div className="text-center pb-2 border-b-2 border-black">
              <h3 className="font-bold text-sm tracking-wider uppercase">PEMERINTAH KABUPATEN LEBAK</h3>
              <h2 className="font-bold text-base tracking-wider uppercase">DINAS PENDIDIKAN</h2>
              <h1 className="font-black text-lg tracking-wide uppercase">{settings.namaSekolah}</h1>
              <p className="font-sans text-[10px] text-slate-700">
                {settings.alamat} — Kab. Lebak, Banten
              </p>
              <div className="border-b border-black mt-1" />
            </div>

            {/* Judul Lembar 3 */}
            <div className="text-center py-2 space-y-1">
              <h3 className="font-bold text-sm tracking-wide uppercase underline">
                RINCIAN BIAYA RIIL PERJALANAN DINAS
              </h3>
              <p className="font-sans text-xs">Lampiran SPPD Nomor : {sppd.noSppd}</p>
            </div>

            {/* Tabel Rincian Biaya Riil */}
            <table className="w-full border-collapse border border-black text-xs font-serif">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 border-b border-black text-center font-bold">
                  <th className="py-2 px-2 border-r border-black w-10">No</th>
                  <th className="py-2 px-3 border-r border-black text-left">Perincian Biaya Riil</th>
                  <th className="py-2 px-3 border-r border-black text-right w-40">Jumlah (Rp)</th>
                  <th className="py-2 px-3 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black">
                  <td className="py-2 px-2 text-center border-r border-black font-semibold">1.</td>
                  <td className="py-2 px-3 border-r border-black font-semibold">
                    Biaya Transportasi Darat PP ({sppd.tempatBerangkat} - {sppd.tempatTujuan})
                  </td>
                  <td className="py-2 px-3 text-right border-r border-black font-mono font-bold">
                    {formatRupiah(sppd.biayaTransport)}
                  </td>
                  <td className="py-2 px-3 text-slate-700">Sesuai Standar Biaya Masukan (SBM)</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="py-2 px-2 text-center border-r border-black font-semibold">2.</td>
                  <td className="py-2 px-3 border-r border-black font-semibold">
                    Uang Harian Perjalanan Dinas ({sppd.lamaHari} Hari)
                  </td>
                  <td className="py-2 px-3 text-right border-r border-black font-mono font-bold">
                    {formatRupiah(sppd.biayaUangHarian)}
                  </td>
                  <td className="py-2 px-3 text-slate-700">Perjalanan Dinas Dalam Daerah</td>
                </tr>
                {sppd.biayaPenginapan > 0 && (
                  <tr className="border-b border-black">
                    <td className="py-2 px-2 text-center border-r border-black font-semibold">3.</td>
                    <td className="py-2 px-3 border-r border-black font-semibold">Biaya Penginapan / Hotel</td>
                    <td className="py-2 px-3 text-right border-r border-black font-mono font-bold">
                      {formatRupiah(sppd.biayaPenginapan)}
                    </td>
                    <td className="py-2 px-3 text-slate-700">Bukti Riil</td>
                  </tr>
                )}
                {sppd.biayaLainLain > 0 && (
                  <tr className="border-b border-black">
                    <td className="py-2 px-2 text-center border-r border-black font-semibold">4.</td>
                    <td className="py-2 px-3 border-r border-black font-semibold">Biaya Lain-lain / Tol / Parkir</td>
                    <td className="py-2 px-3 text-right border-r border-black font-mono font-bold">
                      {formatRupiah(sppd.biayaLainLain)}
                    </td>
                    <td className="py-2 px-3 text-slate-700">Bukti Pengeluaran Riil</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 print:bg-slate-200 font-bold border-t-2 border-black">
                  <td colSpan={2} className="py-2.5 px-3 text-right uppercase border-r border-black">
                    Jumlah Total Biaya Riil :
                  </td>
                  <td className="py-2.5 px-3 text-right border-r border-black font-mono font-bold text-sm">
                    {formatRupiah(totalBiaya)}
                  </td>
                  <td className="py-2 px-3 italic text-[11px] font-normal">
                    {sppd.lamaHari} Hari Kerja
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Terbilang */}
            <div className="pt-2 text-xs italic font-serif">
              <p>
                Terbilang : <span className="font-bold underline">{terbilang(totalBiaya)} Rupiah</span>
              </p>
            </div>

            {/* Pernyataan Pengeluaran Riil */}
            <div className="pt-2 text-[11px] text-justify leading-relaxed border-t border-slate-300">
              <p className="italic">
                Zat dan jumlah tersebut di atas benar-benar dikeluarkan untuk pelaksanaan perjalanan dinas dimaksud dan
                apabila terdapat kelebihan pembayaran, kami bersedia untuk menyetorkannya kembali ke Kas Daerah.
              </p>
            </div>

            {/* Tanda Tangan: Kiri Mengetahui PPK, Kanan Yang Menerima */}
            <div className="pt-8 grid grid-cols-2 text-center text-xs font-serif">
              <div className="space-y-1">
                <p>Mengetahui / Menyetujui,</p>
                <p className="font-bold uppercase">
                  {sppd.ppkJabatan || 'PEJABAT PEMBUAT KOMITMEN'}
                  <br />
                  {settings.namaSekolah}
                </p>
                <div className="h-16" />
                <p className="font-bold underline uppercase">{sppd.ppkNama || settings.namaKepsek}</p>
                <p className="text-[11px]">NIP. {sppd.ppkNip || settings.nipKepsek}</p>
              </div>

              <div className="space-y-1">
                <p>
                  {settings.kotaTanggal || 'Cigemblong'}, {formatTanggalIndo(sppd.tglBerangkat)}
                </p>
                <p className="font-bold">
                  Yang Melaksanakan Perjalanan Dinas /
                  <br />
                  Penerima Biaya
                </p>
                <div className="h-16" />
                <p className="font-bold underline uppercase">{sppd.pegawaiNama}</p>
                <p className="text-[11px]">NIP. {sppd.pegawaiNip || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
