import React, { useState } from 'react';
import {
  Mail,
  ClipboardList,
  Coffee,
  FileCheck2,
  FolderKanban,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { AdministrasiSubTab, AppSettings, BkuItem, RkasItem } from '../types';
import { SuratUndanganView } from './administrasi/SuratUndanganView';
import { DaftarHadirView } from './administrasi/DaftarHadirView';
import { PenerimaanSnackView } from './administrasi/PenerimaanSnackView';
import { VerifikasiTab } from './VerifikasiTab';
import { DAFTAR_BULAN } from '../utils/monthHelper';

interface AdministrasiTabProps {
  settings: AppSettings;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  bkuData?: BkuItem[];
  rkasData?: RkasItem[];
  onUpdateSettings?: (updated: AppSettings) => void;
  selectedBulan?: string;
  onBulanChange?: (b: string) => void;
}

export const AdministrasiTab: React.FC<AdministrasiTabProps> = ({
  settings,
  showToast,
  bkuData = [],
  rkasData = [],
  onUpdateSettings,
  selectedBulan = 'Januari',
  onBulanChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<AdministrasiSubTab>('undangan');

  const subTabs: Array<{
    id: AdministrasiSubTab;
    label: string;
    subLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    {
      id: 'undangan',
      label: 'Surat Undangan',
      subLabel: 'KKG, MKKS, Rapat Dinas, Kombel, Lomba',
      icon: Mail,
      badge: 'Format 1',
    },
    {
      id: 'daftar_hadir',
      label: 'Daftar Hadir',
      subLabel: '[No, Nama, NIP, Jabatan, Tanda Tangan]',
      icon: ClipboardList,
      badge: 'Format 2',
    },
    {
      id: 'snack',
      label: 'Penerimaan Snack',
      subLabel: 'Tanda Terima Konsumsi / Snack Kegiatan',
      icon: Coffee,
      badge: 'Format 3',
    },
    {
      id: 'verifikasi_spj',
      label: 'Verifikasi SPJ',
      subLabel: 'Instrumen Pemeriksaan Fisik Dokumen BOSP',
      icon: FileCheck2,
      badge: 'Format 4',
    },
  ];

  return (
    <div id="tab-administrasi-view" className="space-y-6">
      {/* Top Banner & Sub-tab navigation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full flex items-center space-x-1">
                <FolderKanban className="w-3 h-3 text-blue-600" />
                <span>Modul Administrasi & Persuratan BOSP</span>
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Format Resmi Kedinasan</span>
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">
              Administrasi Sekolah & Kegiatan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola dan cetak instrumen administrasi kegiatan: Surat Undangan, Daftar Hadir [No, Nama, NIP, Jabatan, Tanda Tangan], Tanda Terima Penerimaan Snack, dan Verifikasi SPJ.
            </p>
          </div>

          {/* Dropdown Pilihan Bulan Administrasi */}
          {onBulanChange && (
            <div className="flex items-center space-x-2 bg-blue-50/90 px-3.5 py-2 rounded-2xl border border-blue-300 shadow-2xs self-start sm:self-center">
              <Calendar className="w-4 h-4 text-[#0b4382]" />
              <label className="text-[#093262] font-black text-xs whitespace-nowrap">
                Bulan:
              </label>
              <select
                id="select-administrasi-bulan"
                value={selectedBulan}
                onChange={(e) => onBulanChange(e.target.value)}
                className="bg-transparent text-xs font-black text-[#072449] focus:outline-none cursor-pointer"
                title="Pilih Bulan Administrasi"
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
        </div>

        {/* 4 Main Sub-Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start space-x-3 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 ring-2 ring-blue-600/20'
                    : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-xs border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black truncate ${
                        isActive ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </span>
                    {tab.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {tab.subLabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab View Contents */}
      {activeSubTab === 'undangan' && (
        <SuratUndanganView settings={settings} showToast={showToast} onUpdateSettings={onUpdateSettings} />
      )}

      {activeSubTab === 'daftar_hadir' && (
        <DaftarHadirView settings={settings} showToast={showToast} onUpdateSettings={onUpdateSettings} />
      )}

      {activeSubTab === 'snack' && (
        <PenerimaanSnackView settings={settings} showToast={showToast} onUpdateSettings={onUpdateSettings} />
      )}

      {activeSubTab === 'verifikasi_spj' && (
        <VerifikasiTab settings={settings} showToast={showToast} />
      )}
    </div>
  );
};
