import React, { useState } from 'react';
import {
  FileCheck2,
  Printer,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Building,
  RotateCcw,
} from 'lucide-react';
import { AppSettings, VerificationItem } from '../types';
import { initialVerificationChecklist } from '../data/initialData';
import { formatTanggalIndo } from '../utils/formatters';

interface VerifikasiTabProps {
  settings: AppSettings;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const VerifikasiTab: React.FC<VerifikasiTabProps> = ({ settings, showToast }) => {
  const [items, setItems] = useState<VerificationItem[]>(initialVerificationChecklist);
  const [tglVerifikasi, setTglVerifikasi] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [namaVerifikator1, setNamaVerifikator1] = useState('Drs. H. Mulyadi, M.Pd');
  const [nipVerifikator1, setNipVerifikator1] = useState('196905141994031004');
  const [jabatanVerifikator1, setJabatanVerifikator1] = useState('Pengawas Pembina SD');

  const [namaVerifikator2, setNamaVerifikator2] = useState('Ahmad Subhan, S.E');
  const [nipVerifikator2, setNipVerifikator2] = useState('198208122010011015');
  const [jabatanVerifikator2, setJabatanVerifikator2] = useState('Tim Manajemen BOSP Disdik');

  const [kesimpulanStatus, setKesimpulanStatus] = useState<'Diterima' | 'Perbaikan' | 'Ditolak'>(
    'Diterima'
  );
  const [catatanUmum, setCatatanUmum] = useState(
    'Seluruh berkas SPJ BOSP Triwulan 2 telah diteliti dan dinyatakan LENGKAP & SAH untuk diarsipkan.'
  );

  const handleStatusChange = (
    id: string,
    status: 'Lengkap' | 'Tidak Lengkap' | 'Tidak Ada'
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status } : it))
    );
  };

  const handleCatatanChange = (id: string, catatan: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, catatan } : it))
    );
  };

  const handleSetAllLengkap = () => {
    setItems((prev) => prev.map((it) => ({ ...it, status: 'Lengkap' })));
    showToast('Semua item ditandai LENGKAP', 'success');
  };

  const countLengkap = items.filter((i) => i.status === 'Lengkap').length;
  const countBelum = items.length - countLengkap;

  return (
    <div id="tab-verifikasi-view" className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
              Standar Pengawasan Inspektorat & Tim BOSP Dinas Pendidikan
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Lembar Verifikasi Kelengkapan Dokumen SPJ BOSP
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Checklist instrumen pemeriksaan fisik SPJ sebelum disahkan oleh Pengawas Sekolah dan Tim Verifikasi
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSetAllLengkap}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tandai Semua Lengkap</span>
            </button>
            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Lembar Verifikasi</span>
            </button>
          </div>
        </div>

        {/* Verifier Names Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal Verifikasi</label>
            <input
              type="date"
              value={tglVerifikasi}
              onChange={(e) => setTglVerifikasi(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Verifikator 1 (Pengawas)</label>
            <input
              type="text"
              value={namaVerifikator1}
              onChange={(e) => setNamaVerifikator1(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Verifikator 2 (Tim BOSP)</label>
            <input
              type="text"
              value={namaVerifikator2}
              onChange={(e) => setNamaVerifikator2(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Kesimpulan Akhir</label>
            <select
              value={kesimpulanStatus}
              onChange={(e) =>
                setKesimpulanStatus(e.target.value as 'Diterima' | 'Perbaikan' | 'Ditolak')
              }
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="Diterima">DITERIMA (LENGKAP & SAH)</option>
              <option value="Perbaikan">PERBAIKAN (ADA CATATAN)</option>
              <option value="Ditolak">DITOLAK</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRINTABLE INSTRUMEN VERIFIKASI */}
      <div className="print-page-portrait bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 font-sans text-xs">
        {/* Kop Surat Verifikasi */}
        <div className="pb-3 border-b-2 border-slate-900 leading-tight flex items-center gap-4">
          {settings.logoSekolah && (
            <div className="w-16 h-18 shrink-0 flex items-center justify-center">
              <img
                src={settings.logoSekolah}
                alt="Logo"
                className="w-14 h-16 object-contain"
              />
            </div>
          )}
          <div className="grow text-center">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
              PEMERINTAH KABUPATEN {settings.kabupaten.toUpperCase()}
            </h4>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
              DINAS PENDIDIKAN - TIM MANAJEMEN BOSP
            </h4>
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide mt-1">
              INSTRUMEN VERIFIKASI LAPORAN PERTANGGUNGJAWABAN (SPJ) DANA BOSP
            </h3>
            <p className="text-[10px] text-slate-600 font-semibold">
              TAHUN ANGGARAN 2026 - TAHAP / TRIWULAN 2
            </p>
          </div>
        </div>

        {/* School Info Header */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 print:bg-transparent p-3 rounded-lg border border-slate-200 print:border-none text-xs">
          <div className="space-y-1">
            <p>Nama Satuan Pendidikan : <span className="font-black text-slate-900">{settings.namaSekolah}</span></p>
            <p>NPSN : <span className="font-bold font-mono">{settings.npsn}</span></p>
            <p>Kecamatan / Kab : <span>{settings.kecamatan} / {settings.kabupaten}</span></p>
          </div>
          <div className="space-y-1">
            <p>Kepala Sekolah : <span className="font-bold">{settings.namaKepsek}</span></p>
            <p>Bendahara BOSP : <span className="font-bold">{settings.namaBendahara}</span></p>
            <p>Tanggal Verifikasi : <span className="font-bold">{formatTanggalIndo(tglVerifikasi)}</span></p>
          </div>
        </div>

        {/* Verification Checklist Table */}
        <table className="w-full border-collapse border border-slate-900 text-xs">
          <thead>
            <tr className="bg-slate-100 print:bg-slate-200 uppercase font-extrabold text-center border-b border-slate-900">
              <th className="py-2 px-2 border-r border-slate-900 w-8">No</th>
              <th className="py-2 px-3 border-r border-slate-900 text-left">Komponen / Dokumen yang Diverifikasi</th>
              <th className="py-2 px-2 border-r border-slate-900 w-24 text-center">Ada & Lengkap</th>
              <th className="py-2 px-2 border-r border-slate-900 w-24 text-center">Tdk Lengkap</th>
              <th className="py-2 px-2 border-r border-slate-900 w-20 text-center">Tidak Ada</th>
              <th className="py-2 px-3 text-left">Catatan / Keterangan Tim Verifikator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {items.map((it, idx) => (
              <tr key={it.id}>
                <td className="py-2 px-2 text-center border-r border-slate-900 font-bold">{idx + 1}</td>
                <td className="py-2 px-3 border-r border-slate-900 font-semibold text-slate-900">
                  {it.komponen}
                </td>
                <td className="py-2 px-2 text-center border-r border-slate-900 font-black">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name={`status-${it.id}`}
                      checked={it.status === 'Lengkap'}
                      onChange={() => handleStatusChange(it.id, 'Lengkap')}
                      className="w-4 h-4 text-blue-600 no-print"
                    />
                    <span className="hidden print:inline-block font-bold">
                      {it.status === 'Lengkap' ? 'V' : ''}
                    </span>
                  </label>
                </td>
                <td className="py-2 px-2 text-center border-r border-slate-900 font-black">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name={`status-${it.id}`}
                      checked={it.status === 'Tidak Lengkap'}
                      onChange={() => handleStatusChange(it.id, 'Tidak Lengkap')}
                      className="w-4 h-4 text-amber-600 no-print"
                    />
                    <span className="hidden print:inline-block font-bold">
                      {it.status === 'Tidak Lengkap' ? 'V' : ''}
                    </span>
                  </label>
                </td>
                <td className="py-2 px-2 text-center border-r border-slate-900 font-black">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name={`status-${it.id}`}
                      checked={it.status === 'Tidak Ada'}
                      onChange={() => handleStatusChange(it.id, 'Tidak Ada')}
                      className="w-4 h-4 text-rose-600 no-print"
                    />
                    <span className="hidden print:inline-block font-bold">
                      {it.status === 'Tidak Ada' ? 'V' : ''}
                    </span>
                  </label>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={it.catatan || ''}
                    onChange={(e) => handleCatatanChange(it.id, e.target.value)}
                    placeholder="Catatan verifikator..."
                    className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Kesimpulan Box */}
        <div className="border border-slate-900 p-3 rounded-lg print:rounded-none space-y-2">
          <p className="font-bold text-xs uppercase">
            KESIMPULAN HASIL VERIFIKASI :{' '}
            <span className="px-2 py-0.5 border border-slate-900 font-black uppercase text-slate-900">
              {kesimpulanStatus === 'Diterima' ? 'LENGKAP & DAPAT DITERIMA' : kesimpulanStatus}
            </span>
          </p>
          <p className="text-[11px] text-slate-700 italic">
            Catatan Tim:{' '}
            <input
              type="text"
              value={catatanUmum}
              onChange={(e) => setCatatanUmum(e.target.value)}
              className="w-full bg-transparent border-b border-slate-400 font-medium text-slate-900 focus:outline-none"
            />
          </p>
        </div>

        {/* 3-Way Official Signatures */}
        <div className="pt-6 grid grid-cols-3 text-center text-xs font-bold gap-4">
          <div>
            <p className="mb-14">
              Pihak Sekolah Yang Diperiksa,<br />Kepala Sekolah {settings.namaSekolah}
            </p>
            <p className="font-black underline text-slate-900">{settings.namaKepsek}</p>
            <p className="text-[10px] font-normal text-slate-600">NIP. {settings.nipKepsek}</p>
          </div>

          <div>
            <p className="mb-14">
              Tim Verifikator 1,<br />{jabatanVerifikator1}
            </p>
            <p className="font-black underline text-slate-900">{namaVerifikator1}</p>
            <p className="text-[10px] font-normal text-slate-600">NIP. {nipVerifikator1}</p>
          </div>

          <div>
            <p className="mb-14">
              Tim Verifikator 2,<br />{jabatanVerifikator2}
            </p>
            <p className="font-black underline text-slate-900">{namaVerifikator2}</p>
            <p className="text-[10px] font-normal text-slate-600">NIP. {nipVerifikator2}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
