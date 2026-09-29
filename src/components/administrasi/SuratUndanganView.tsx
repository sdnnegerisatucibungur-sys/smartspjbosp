import React, { useState } from 'react';
import {
  Mail,
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  ListOrdered,
  Building,
  UserCheck,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { ActivityScopeType, AppSettings, SuratUndanganData } from '../../types';
import { ACTIVITY_PRESETS, createDefaultUndangan, getKetuaTitleFromKop } from '../../utils/administrasiData';
import { generateSuratUndanganPdf } from '../../utils/administrasiPdf';
import { formatTanggalIndo } from '../../utils/formatters';
import { OfficialKopSurat } from './OfficialKopSurat';

interface SuratUndanganViewProps {
  settings: AppSettings;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialScope?: ActivityScopeType;
  onUpdateSettings?: (updated: AppSettings) => void;
}

export const SuratUndanganView: React.FC<SuratUndanganViewProps> = ({
  settings,
  showToast,
  initialScope = 'kkg' as const,
  onUpdateSettings,
}) => {
  const defaultScope: ActivityScopeType = initialScope;
  const [activeScope, setActiveScope] = useState<ActivityScopeType>(defaultScope);
  const [docData, setDocData] = useState<SuratUndanganData>(() =>
    createDefaultUndangan(defaultScope, settings)
  );
  const [copied, setCopied] = useState(false);

  const handleSelectScope = (scope: ActivityScopeType) => {
    setActiveScope(scope);
    const newDoc = createDefaultUndangan(scope, settings);
    setDocData(newDoc);
    showToast(`Format undangan dialihkan ke ${ACTIVITY_PRESETS[scope]?.title}`, 'info');
  };

  const handleReset = () => {
    setDocData(createDefaultUndangan(activeScope, settings));
    showToast('Data undangan dikembalikan ke pengaturan default', 'info');
  };

  const handleDownloadPdf = () => {
    try {
      const pdf = generateSuratUndanganPdf(docData, settings);
      const safeName = docData.perihal.toLowerCase().replace(/[^a-z0-9]/g, '_');
      pdf.save(`Surat_Undangan_${safeName}.pdf`);
      showToast('Surat Undangan berhasil diunduh dalam format PDF resmi', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghasilkan file PDF', 'error');
    }
  };

  const handleCopyText = () => {
    const textToCopy = `
SURAT UNDANGAN
Nomor: ${docData.nomorSurat}
Hal: ${docData.perihal}

Kepada Yth.
${docData.tujuanKepada}

${docData.pembukaText}

Hari, Tanggal : ${docData.hariTglAcara}
Waktu         : ${docData.waktuAcara}
Tempat        : ${docData.tempatAcara}
Agenda        :
${docData.agendaAcara}

${docData.penutupText}

${docData.tempatDitetapkan}, ${formatTanggalIndo(docData.tglSurat)}
${docData.penandatanganJabatan}

${docData.penandatanganNama}
NIP. ${docData.penandatanganNip}
    `.trim();

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      showToast('Teks undangan disalin ke clipboard', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="space-y-6">
      {/* Scope Presets Navigation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
                Format 1: Surat Undangan Kedinasan
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-full flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Format Standar Dinas Pendidikan</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Surat Undangan Kegiatan & Rapat Dinas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Format surat undangan resmi untuk KKG, MKKS / K3S, Rapat Dinas Sekolah, KKG Sekolah (Kombel), dan Pelaksanaan Lomba.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReset}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Reset ke data awal"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleCopyText}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? 'Tersalin' : 'Salin Pesan'}</span>
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
              <span>Cetak Surat</span>
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

      {/* Main Layout: Left = Quick Form Editor, Right = Printable Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Editor */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Editor Data Undangan</span>
            </h4>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              Live Preview
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Surat</label>
              <input
                type="text"
                value={docData.nomorSurat}
                onChange={(e) => setDocData({ ...docData, nomorSurat: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sifat</label>
                <input
                  type="text"
                  value={docData.sifat}
                  onChange={(e) => setDocData({ ...docData, sifat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lampiran</label>
                <input
                  type="text"
                  value={docData.lampiran}
                  onChange={(e) => setDocData({ ...docData, lampiran: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hal / Perihal</label>
              <input
                type="text"
                value={docData.perihal}
                onChange={(e) => setDocData({ ...docData, perihal: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tempat Ditetapkan</label>
                <input
                  type="text"
                  value={docData.tempatDitetapkan}
                  onChange={(e) => setDocData({ ...docData, tempatDitetapkan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Surat</label>
                <input
                  type="date"
                  value={docData.tglSurat}
                  onChange={(e) => setDocData({ ...docData, tglSurat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tujuan Undangan (Kepada Yth)</label>
              <textarea
                rows={2}
                value={docData.tujuanKepada}
                onChange={(e) => setDocData({ ...docData, tujuanKepada: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Hari & Tanggal Acara</span>
              </label>
              <input
                type="text"
                value={docData.hariTglAcara}
                onChange={(e) => setDocData({ ...docData, hariTglAcara: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Waktu Pelaksanaan</span>
              </label>
              <input
                type="text"
                value={docData.waktuAcara}
                onChange={(e) => setDocData({ ...docData, waktuAcara: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Tempat Acara</span>
              </label>
              <input
                type="text"
                value={docData.tempatAcara}
                onChange={(e) => setDocData({ ...docData, tempatAcara: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
                <span>Agenda / Susunan Acara</span>
              </label>
              <textarea
                rows={4}
                value={docData.agendaAcara}
                onChange={(e) => setDocData({ ...docData, agendaAcara: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="block font-bold text-slate-800">Penandatangan Surat:</span>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="block text-slate-600 text-[11px]">Jabatan Penandatangan</label>
                  {(activeScope === 'kkg' || activeScope === 'mkks') && (
                    <button
                      type="button"
                      onClick={() => {
                        const title = getKetuaTitleFromKop(activeScope, settings);
                        setDocData({ ...docData, penandatanganJabatan: title });
                        showToast(`Jabatan disesuaikan dengan kop: ${title}`, 'info');
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline decoration-dotted"
                    >
                      Sesuai Kop: {getKetuaTitleFromKop(activeScope, settings)}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={docData.penandatanganJabatan}
                  onChange={(e) => setDocData({ ...docData, penandatanganJabatan: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] mb-0.5">Nama Terang & Gelar</label>
                <input
                  type="text"
                  value={docData.penandatanganNama}
                  onChange={(e) => setDocData({ ...docData, penandatanganNama: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-[11px] mb-0.5">NIP</label>
                <input
                  type="text"
                  value={docData.penandatanganNip}
                  onChange={(e) => setDocData({ ...docData, penandatanganNip: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Printable A4 Document Preview */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div
            id="surat-undangan-print-area"
            className="w-full max-w-[210mm] bg-white text-slate-950 p-8 sm:p-12 rounded-2xl shadow-md border border-slate-200/80 font-serif leading-relaxed text-sm print:p-0 print:border-none print:shadow-none print:rounded-none print:w-full"
          >
            {/* Kop Surat Resmi */}
            <OfficialKopSurat
              settings={settings}
              scope={activeScope}
              onUpdateSettings={onUpdateSettings}
              showToast={showToast}
              className="mb-5"
            />

            {/* Tanggal & Tempat Penetapan (Kanan Atas) */}
            <div className="text-right text-xs mb-4">
              <span>
                {docData.tempatDitetapkan || settings.desaKelurahan || 'Cibungur'}, {formatTanggalIndo(docData.tglSurat)}
              </span>
            </div>

            {/* Header Nomor, Sifat, Lampiran, Hal */}
            <div className="flex justify-between items-start text-xs mb-6">
              <table className="text-left w-auto">
                <tbody>
                  <tr>
                    <td className="pr-4 py-0.5 font-sans font-semibold text-slate-700">Nomor</td>
                    <td className="pr-2 py-0.5">:</td>
                    <td className="py-0.5 font-mono font-bold text-slate-900">{docData.nomorSurat}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-0.5 font-sans font-semibold text-slate-700">Sifat</td>
                    <td className="pr-2 py-0.5">:</td>
                    <td className="py-0.5 text-slate-900">{docData.sifat}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-0.5 font-sans font-semibold text-slate-700">Lampiran</td>
                    <td className="pr-2 py-0.5">:</td>
                    <td className="py-0.5 text-slate-900">{docData.lampiran}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-0.5 font-sans font-semibold text-slate-700">Hal</td>
                    <td className="pr-2 py-0.5">:</td>
                    <td className="py-0.5 font-bold text-slate-950 underline">{docData.perihal}</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-left max-w-xs text-xs">
                <p className="font-semibold text-slate-800">Kepada Yth,</p>
                <div className="whitespace-pre-line text-slate-900 font-bold mt-1">
                  {docData.tujuanKepada}
                </div>
              </div>
            </div>

            {/* Isi Surat */}
            <div className="space-y-4 text-xs sm:text-sm text-justify leading-relaxed">
              <p>{docData.pembukaText}</p>

              {/* Rincian Kotak Pelaksanaan */}
              <div className="bg-slate-50/70 print:bg-transparent p-4 rounded-xl border border-slate-200 print:border-none print:p-0 my-3 font-sans text-xs">
                <table className="w-full">
                  <tbody>
                    <tr className="align-top">
                      <td className="w-32 py-1 font-bold text-slate-800">Hari / Tanggal</td>
                      <td className="w-4 py-1">:</td>
                      <td className="py-1 font-semibold text-slate-900">{docData.hariTglAcara}</td>
                    </tr>
                    <tr className="align-top">
                      <td className="py-1 font-bold text-slate-800">Waktu</td>
                      <td className="py-1">:</td>
                      <td className="py-1 text-slate-900">{docData.waktuAcara}</td>
                    </tr>
                    <tr className="align-top">
                      <td className="py-1 font-bold text-slate-800">Tempat</td>
                      <td className="py-1">:</td>
                      <td className="py-1 text-slate-900 font-medium">{docData.tempatAcara}</td>
                    </tr>
                    <tr className="align-top">
                      <td className="py-1 font-bold text-slate-800">Agenda / Acara</td>
                      <td className="py-1">:</td>
                      <td className="py-1 text-slate-900 whitespace-pre-line font-medium leading-relaxed">
                        {docData.agendaAcara}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>{docData.penutupText}</p>
            </div>

            {/* Tanda Tangan Kanan Bawah */}
            <div className="mt-8 flex justify-end">
              <div className="text-center min-w-[200px] text-xs font-sans">
                <p className="font-semibold text-slate-800">{docData.penandatanganJabatan}</p>
                {docData.scope !== 'kkg' && docData.scope !== 'mkks' ? (
                  <p className="font-bold text-slate-900 mb-16">{settings.namaSekolah || 'SDN 1 CIBUNGUR'}</p>
                ) : (
                  <div className="h-16" />
                )}

                <p className="font-bold text-slate-950 text-sm underline decoration-slate-950 decoration-1 underline-offset-4">
                  {docData.penandatanganNama}
                </p>
                <p className="text-[11px] text-slate-700 font-mono mt-0.5">
                  NIP. {docData.penandatanganNip}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
