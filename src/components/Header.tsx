import React from 'react';
import {
  Calendar,
  School,
  Cloud,
  CloudOff,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { AppSettings, TabType } from '../types';
import { DAFTAR_BULAN, getTriwulanFromMonth } from '../utils/monthHelper';

interface HeaderProps {
  settings: AppSettings;
  currentTab: TabType;
  selectedBulan: string;
  onBulanChange: (bulan: string) => void;
  selectedPeriode?: string;
  onPeriodeChange?: (p: string) => void;
  onPrintCurrentView?: () => void;
  cloudSyncStatus?: 'saved' | 'saving' | 'error' | 'offline';
  lastCloudSyncTime?: string | null;
  onManualSync?: () => void;
  isSyncingInitial?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentTab,
  selectedBulan,
  onBulanChange,
  cloudSyncStatus = 'saved',
  lastCloudSyncTime,
  onManualSync,
  isSyncingInitial = false,
}) => {
  const isRkas = currentTab === 'rkas';
  const triwulanInfo = selectedBulan !== 'Semua Bulan' ? getTriwulanFromMonth(selectedBulan) : null;

  return (
    <header
      id="main-app-header"
      className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 no-print"
    >
      <div className="flex items-center space-x-3 flex-wrap gap-y-2">
        {/* Dropdown Periode Bulanan (Kecuali RKAS) */}
        {isRkas ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-300/80 text-amber-900 rounded-xl text-xs font-bold shadow-2xs">
            <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
            <span>RKAS: Rencana Anggaran Penuh 1 Tahun ({settings.tahunAnggaran || '2026'})</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#093262]">
              <Calendar className="w-4 h-4 text-[#0b4382]" />
              <span>Bulan SPJ:</span>
            </div>
            <select
              id="select-bosp-bulan"
              value={selectedBulan}
              onChange={(e) => onBulanChange(e.target.value)}
              className="bg-blue-50/90 border border-blue-300 text-xs font-black text-[#072449] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0b4382] cursor-pointer shadow-2xs transition-all hover:bg-blue-100/70"
            >
              {DAFTAR_BULAN.map((bulan, idx) => (
                <option key={bulan} value={bulan}>
                  Bulan {idx + 1}: {bulan} {settings.tahunAnggaran || '2026'}
                </option>
              ))}
              <option value="Semua Bulan">
                📅 Semua Bulan (Kumulatif 1 Tahun Penuh)
              </option>
            </select>

            {triwulanInfo && (
              <span className="hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100/90 text-[#0b4382] border border-blue-200">
                {triwulanInfo.tahap} • {triwulanInfo.triwulan}
              </span>
            )}
          </div>
        )}

        {/* Info Nama Sekolah */}
        <div className="hidden md:flex items-center text-xs text-slate-500 font-medium pl-3 border-l border-slate-200">
          {settings.logoSekolah ? (
            <img
              src={settings.logoSekolah}
              alt="Logo"
              className="w-5 h-5 object-contain mr-2 rounded-xs"
            />
          ) : (
            <School className="w-3.5 h-3.5 mr-1.5 text-[#0b4382]" />
          )}
          <span className="font-bold text-[#093262]">{settings.namaSekolah}</span>
          <span className="mx-1 text-slate-300">•</span>
          <span className="font-mono text-slate-500 text-[11px]">{settings.npsn}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2.5 sm:space-x-3 flex-wrap">
        {/* Status Sinkronisasi Supabase */}
        {cloudSyncStatus === 'saving' || isSyncingInitial ? (
          <div
            id="cloud-sync-saving-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold shadow-2xs animate-pulse"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span className="hidden sm:inline">Menyimpan ke Cloud...</span>
            <span className="sm:hidden">Menyimpan...</span>
          </div>
        ) : cloudSyncStatus === 'error' ? (
          <button
            id="cloud-sync-error-btn"
            type="button"
            onClick={onManualSync}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-full text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Klik untuk mencoba simpan ulang"
          >
            <CloudOff className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Gagal Tersimpan • Coba Lagi</span>
            <span className="sm:hidden">Coba Lagi</span>
          </button>
        ) : (
          <button
            id="cloud-sync-saved-btn"
            type="button"
            onClick={onManualSync}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-medium shadow-2xs transition-all cursor-pointer group"
            title="Data Anda tersimpan aman di Supabase. Klik untuk sinkronisasi sekarang."
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-emerald-800 font-medium">
              {lastCloudSyncTime ? `Tersimpan Cloud ${lastCloudSyncTime}` : 'Tersimpan Cloud'}
            </span>
            <RefreshCw className="w-2.5 h-2.5 text-emerald-600 group-hover:rotate-180 transition-transform ml-0.5" />
          </button>
        )}
      </div>
    </header>
  );
};
