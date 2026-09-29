import React, { useState } from 'react';
import {
  ClipboardList,
  Printer,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Users,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Building,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { ActivityScopeType, AppSettings, DaftarHadirData, PesertaHadirItem } from '../../types';
import {
  ACTIVITY_PRESETS,
  createDefaultDaftarHadir,
  getPesertaFromGuruList,
  getKetuaTitleFromKop,
  getPesertaKkgGugus,
  getPesertaMkks,
} from '../../utils/administrasiData';
import { generateDaftarHadirPdf } from '../../utils/administrasiPdf';
import { OfficialKopSurat } from './OfficialKopSurat';

interface DaftarHadirViewProps {
  settings: AppSettings;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialScope?: ActivityScopeType;
  onUpdateSettings?: (updated: AppSettings) => void;
}

export const DaftarHadirView: React.FC<DaftarHadirViewProps> = ({
  settings,
  showToast,
  initialScope = 'kkg' as const,
  onUpdateSettings,
}) => {
  const defaultScope: ActivityScopeType = initialScope;
  const [activeScope, setActiveScope] = useState<ActivityScopeType>(defaultScope);
  const [data, setData] = useState<DaftarHadirData>(() =>
    createDefaultDaftarHadir(defaultScope, settings)
  );

  const isKkgOrMkks = activeScope === 'kkg' || activeScope === 'mkks';

  // Edit or Add participant modal / inline state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formNama, setFormNama] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formJabatan, setFormJabatan] = useState('');

  const handleSelectScope = (scope: ActivityScopeType) => {
    setActiveScope(scope);
    const newDoc = createDefaultDaftarHadir(scope, settings);
    setData(newDoc);
    showToast(`Daftar hadir diselaraskan dengan kegiatan: ${ACTIVITY_PRESETS[scope]?.title}`, 'info');
  };

  const handleResetToGuru = () => {
    const list = getPesertaFromGuruList(settings);
    setData((prev) => ({ ...prev, peserta: list }));
    showToast('Daftar peserta dimuat ulang dari data Dewan Guru & Tenaga Kependidikan', 'info');
  };

  const handleLoadRegionalPeserta = () => {
    const list = activeScope === 'mkks' ? getPesertaMkks(settings) : getPesertaKkgGugus(settings);
    setData((prev) => ({ ...prev, peserta: list }));
    showToast(`Daftar peserta perwakilan sekolah se-wilayah ${activeScope === 'mkks' ? 'K3S / MKKS' : 'KKG Gugus'} berhasil dimuat`, 'info');
  };

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setFormNama('');
    setFormNip('-');
    setFormJabatan(isKkgOrMkks ? (settings.namaSekolah || 'SDN 1 Cibungur') : 'Guru Kelas');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (idx: number) => {
    setEditingIndex(idx);
    const p = data.peserta[idx];
    setFormNama(p.nama);
    setFormNip(p.nip);
    setFormJabatan(isKkgOrMkks ? (p.instansi || p.jabatan) : (p.jabatan || p.instansi || ''));
    setIsModalOpen(true);
  };

  const handleSaveParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      showToast('Nama peserta tidak boleh kosong', 'error');
      return;
    }

    if (editingIndex !== null) {
      // Edit
      setData((prev) => ({
        ...prev,
        peserta: prev.peserta.map((p, idx) =>
          idx === editingIndex
            ? {
                ...p,
                nama: formNama.trim(),
                nip: formNip.trim() || '-',
                jabatan: isKkgOrMkks ? (p.jabatan || 'Peserta Rapat') : formJabatan.trim(),
                instansi: isKkgOrMkks ? formJabatan.trim() : (p.instansi || settings.namaSekolah || 'SDN 1 Cibungur'),
              }
            : p
        ),
      }));
      showToast('Data peserta berhasil diperbarui', 'success');
    } else {
      // Add
      const newItem: PesertaHadirItem = {
        id: `p-${Date.now()}`,
        no: data.peserta.length + 1,
        nama: formNama.trim(),
        nip: formNip.trim() || '-',
        jabatan: isKkgOrMkks ? 'Peserta Rapat' : (formJabatan.trim() || 'Peserta'),
        instansi: isKkgOrMkks ? formJabatan.trim() : (settings.namaSekolah || 'SDN 1 Cibungur'),
      };
      setData((prev) => ({
        ...prev,
        peserta: [...prev.peserta, newItem].map((item, i) => ({ ...item, no: i + 1 })),
      }));
      showToast('Peserta baru berhasil ditambahkan', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDeleteParticipant = (idx: number) => {
    setData((prev) => ({
      ...prev,
      peserta: prev.peserta.filter((_, i) => i !== idx).map((item, i) => ({ ...item, no: i + 1 })),
    }));
    showToast('Peserta dihapus dari daftar hadir', 'info');
  };

  const handleAddEmptyRows = (count: number = 3) => {
    const newItems: PesertaHadirItem[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push({
        id: `empty-${Date.now()}-${i}`,
        no: data.peserta.length + i + 1,
        nama: '',
        nip: '',
        jabatan: '',
      });
    }
    setData((prev) => ({
      ...prev,
      peserta: [...prev.peserta, ...newItems].map((item, idx) => ({ ...item, no: idx + 1 })),
    }));
    showToast(`${count} baris kosong cadangan berhasil ditambahkan untuk tanda tangan manual`, 'success');
  };

  const handleDownloadPdf = () => {
    try {
      const pdf = generateDaftarHadirPdf(data, settings);
      const safeName = data.namaKegiatan.toLowerCase().replace(/[^a-z0-9]/g, '_');
      pdf.save(`Daftar_Hadir_${safeName}.pdf`);
      showToast('Daftar Hadir berhasil diunduh dalam format PDF resmi', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghasilkan file PDF', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Presets */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
                Format 2: Daftar Hadir Resmi
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Format Kolom: [No, Nama, NIP, Jabatan, Tanda Tangan]</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Daftar Hadir Pelaksanaan Kegiatan & Rapat
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Standar baku daftar hadir kedinasan untuk KKG, MKKS / K3S, Rapat Dinas Sekolah, KKG Sekolah, dan Kegiatan Lomba.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isKkgOrMkks ? (
              <button
                onClick={handleLoadRegionalPeserta}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs px-3 py-2 rounded-xl transition-all border border-indigo-200 flex items-center space-x-1.5 cursor-pointer"
                title="Muat daftar peserta perwakilan sekolah se-wilayah/gugus"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Muat Peserta Se-Wilayah</span>
              </button>
            ) : (
              <button
                onClick={handleResetToGuru}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Ambil nama guru dari Master Data Sekolah"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Muat Master Guru</span>
              </button>
            )}
            <button
              onClick={() => handleAddEmptyRows(3)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Tambah baris kosong untuk presensi tamu"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>+3 Baris Kosong</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-3 py-2 rounded-xl transition-all border border-blue-200 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Peserta</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Daftar Hadir</span>
            </button>
          </div>
        </div>

        {/* Preset Selector Pills */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Pilih Jenis Format Kegiatan:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {(Object.keys(ACTIVITY_PRESETS) as ActivityScopeType[]).map((key) => {
              const preset = ACTIVITY_PRESETS[key];
              const isSelected = activeScope === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectScope(key)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`block text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                      isSelected ? 'text-blue-700' : 'text-slate-400'
                    }`}
                  >
                    {preset.badge}
                  </span>
                  <span className={`block text-xs font-bold truncate ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                    {preset.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metadata Inline Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 no-print">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Pengaturan Keterangan Kegiatan & Penandatangan
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Kegiatan</label>
            <input
              type="text"
              value={data.namaKegiatan}
              onChange={(e) => setData({ ...data, namaKegiatan: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hari & Tanggal</label>
            <input
              type="text"
              value={data.hariTanggal}
              onChange={(e) => setData({ ...data, hariTanggal: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Waktu Pelaksanaan</label>
            <input
              type="text"
              value={data.waktu}
              onChange={(e) => setData({ ...data, waktu: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tempat Pelaksanaan</label>
            <input
              type="text"
              value={data.tempat}
              onChange={(e) => setData({ ...data, tempat: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-slate-700">Jabatan Mengetahui</label>
              {isKkgOrMkks && (
                <button
                  type="button"
                  onClick={() => {
                    const title = getKetuaTitleFromKop(activeScope, settings);
                    setData({ ...data, mengetahuiJabatan: title });
                    showToast(`Jabatan diselaraskan ke: ${title}`, 'info');
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline decoration-dotted"
                >
                  Sesuai Kop
                </button>
              )}
            </div>
            <input
              type="text"
              value={data.mengetahuiJabatan}
              onChange={(e) => setData({ ...data, mengetahuiJabatan: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Penandatangan</label>
            <input
              type="text"
              value={data.mengetahuiNama}
              onChange={(e) => setData({ ...data, mengetahuiNama: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">NIP Penandatangan</label>
            <input
              type="text"
              value={data.mengetahuiNip}
              onChange={(e) => setData({ ...data, mengetahuiNip: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* PRINTABLE A4 DAFTAR HADIR DOCUMENT */}
      <div className="flex justify-center">
        <div
          id="daftar-hadir-print-area"
          className="w-full max-w-[210mm] bg-white text-slate-950 p-8 sm:p-12 rounded-2xl shadow-md border border-slate-200/80 font-sans text-xs print:p-0 print:border-none print:shadow-none print:rounded-none print:w-full"
        >
          {/* Kop Surat Resmi */}
          <OfficialKopSurat
            settings={settings}
            scope={activeScope}
            onUpdateSettings={onUpdateSettings}
            showToast={showToast}
            className="mb-4"
          />

          {/* Judul Dokumen */}
          <div className="text-center my-4">
            <h3 className="text-base font-black uppercase tracking-wider text-slate-950">
              DAFTAR HADIR PESERTA
            </h3>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800 mt-0.5">
              KEGIATAN: {data.namaKegiatan}
            </h4>
          </div>

          {/* Metadata Kegiatan */}
          <div className="grid grid-cols-2 gap-x-6 text-[11px] mb-3 pb-2 border-b border-slate-300">
            <div>
              <p>
                <span className="font-bold inline-block w-28">Hari / Tanggal</span>: {data.hariTanggal}
              </p>
              <p className="mt-0.5">
                <span className="font-bold inline-block w-28">Waktu</span>: {data.waktu}
              </p>
            </div>
            <div>
              <p>
                <span className="font-bold inline-block w-28">Tempat</span>: {data.tempat}
              </p>
              <p className="mt-0.5">
                <span className="font-bold inline-block w-28">Satuan Pendidikan</span>: {settings.namaSekolah || 'SDN 1 CIBUNGUR'}
              </p>
            </div>
          </div>

          {/* TABEL FORMAT KOLOM: [No, Nama, NIP, Jabatan, Tanda Tangan] */}
          <div className="overflow-x-auto my-3">
            <table className="w-full text-left border-collapse border border-slate-950 text-xs">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-100 text-slate-950 font-black uppercase text-center border-b border-slate-950">
                  <th className="py-2.5 px-2 border-r border-slate-950 w-10">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-950 text-left">Nama Lengkap</th>
                  <th className="py-2.5 px-3 border-r border-slate-950 text-center w-40">NIP</th>
                  <th className="py-2.5 px-3 border-r border-slate-950 text-left w-44">
                    {isKkgOrMkks ? 'Instansi' : 'Jabatan'}
                  </th>
                  <th className="py-2.5 px-3 text-center w-44 border-r border-slate-950">Tanda Tangan</th>
                  <th className="py-2 px-1 text-center w-14 border-l border-slate-950 no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-950">
                {data.peserta.map((peserta, idx) => {
                  const isOdd = (idx + 1) % 2 === 1;
                  return (
                    <tr key={peserta.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2 border-r border-slate-950 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-950 font-bold text-slate-900">
                        {peserta.nama || <span className="italic text-slate-300 font-normal">........................................</span>}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-950 text-center font-mono text-[11px] text-slate-700">
                        {peserta.nip || '-'}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-950 text-slate-800">
                        {isKkgOrMkks
                          ? (peserta.instansi || peserta.jabatan || <span className="italic text-slate-300 font-normal">........................</span>)
                          : (peserta.jabatan || peserta.instansi || <span className="italic text-slate-300 font-normal">........................</span>)
                        }
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-950 text-left font-mono text-[11px] relative h-12 align-top">
                        {isOdd ? (
                          <span className="block text-left font-semibold text-slate-800">
                            {idx + 1}.
                          </span>
                        ) : (
                          <span className="block text-right pr-6 font-semibold text-slate-800">
                            {idx + 1}.
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-1 border-l border-slate-950 text-center no-print">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(idx)}
                            className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 cursor-pointer"
                            title="Edit baris"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteParticipant(idx)}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tanda Tangan Mengetahui */}
          <div className="mt-8 flex justify-end">
            <div className="text-center min-w-[220px] text-xs">
              <p className="text-slate-600 mb-0.5">
                {settings.desaKelurahan || 'Cibungur'}, {data.hariTanggal ? data.hariTanggal.split(',').pop()?.trim() || '' : ''}
              </p>
              <p className="font-semibold text-slate-800">Mengetahui,</p>
              <p className="font-bold text-slate-900 mb-16">
                {data.mengetahuiJabatan || (isKkgOrMkks ? getKetuaTitleFromKop(activeScope, settings) : 'Kepala Satuan Pendidikan')}
              </p>

              <p className="font-bold text-slate-950 text-sm underline decoration-slate-950 decoration-1 underline-offset-4">
                {data.mengetahuiNama || settings.namaKepsek || 'KARNA, S.Pd'}
              </p>
              <p className="text-[11px] text-slate-700 font-mono mt-0.5">
                NIP. {data.mengetahuiNip || settings.nipKepsek || '197804072008011010'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit Peserta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingIndex !== null ? 'Edit Data Peserta Hadir' : 'Tambah Peserta Hadir Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  placeholder="Contoh: SUHENDRI, S.Pd"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP (Kosongkan atau beri tanda - jika non-ASN)</label>
                <input
                  type="text"
                  placeholder="198208042022211009 atau -"
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isKkgOrMkks ? 'Instansi / Asal Sekolah' : 'Jabatan'}
                </label>
                <input
                  type="text"
                  placeholder={isKkgOrMkks ? 'Contoh: SDN 1 Cibungur / SDN 2 Cigemblong' : 'Contoh: Guru Kelas / Kepala Sekolah'}
                  value={formJabatan}
                  onChange={(e) => setFormJabatan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {isKkgOrMkks && (
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] text-slate-500 font-medium block">Pilih Instansi Cepat:</span>
                    <div className="flex flex-wrap gap-1">
                      {['SDN 1 Cibungur', 'SDN 2 Cibungur', 'SDN 1 Cigemblong', 'SDN 2 Cigemblong', 'SDN 3 Cigemblong', 'SDN 1 Mugijaya', 'SDN 2 Mugijaya', 'Dinas Pendidikan'].map((school) => (
                        <button
                          key={school}
                          type="button"
                          onClick={() => setFormJabatan(school)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded text-[10px] border border-slate-200 transition-colors cursor-pointer"
                        >
                          + {school}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
