import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  BookOpen,
  Receipt,
  FileSignature,
  Calculator,
  FolderKanban,
  Plane,
  Settings,
  Boxes,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Cloud,
} from 'lucide-react';
import { AppSettings, TabType, SchoolAccount } from '../types';
import { LOGO_TUT_WURI } from '../utils/logoPresets';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  settings: AppSettings;
  currentAccount?: SchoolAccount | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  settings,
  currentAccount,
  onLogout,
}) => {
  const navItems: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rkas', label: 'Upload RKAS', icon: FileSpreadsheet },
    { id: 'bku', label: 'Upload BKU', icon: BookOpen },
    { id: 'kwitansi', label: 'Nota & Kwitansi (Landscape)', icon: Receipt },
    { id: 'tandaterima', label: 'Tanda Terima', icon: FileSignature },
    { id: 'pajak', label: 'Rekap Pajak', icon: Calculator },
    { id: 'administrasi', label: 'Administrasi', icon: FolderKanban },
    { id: 'sppd', label: 'SPPD Dinas', icon: Plane },
    { id: 'pengaturan', label: 'Pengaturan Sekolah', icon: Settings },
  ];

  const handleOpenInventaris = () => {
    const savedUrl = localStorage.getItem('inventaris_app_url') || 'https://inventaris-sekolah.kemdikbud.go.id';
    window.open(savedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <aside
      id="main-sidebar"
      className="w-64 bg-[#093262] text-blue-100 flex flex-col flex-shrink-0 border-r border-[#0d417d] no-print select-none shadow-xl"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#0d417d] bg-[#072449]/70 flex items-center space-x-3">
        {settings.logoSekolah ? (
          <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shrink-0 shadow-md border border-white/20 overflow-hidden">
            <img
              src={settings.logoSekolah}
              alt="Logo Sekolah"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shrink-0 shadow-md border border-white/20 overflow-hidden">
            <img
              src={LOGO_TUT_WURI}
              alt="Tut Wuri Handayani"
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center leading-none">
            <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">Administrasi</span>
            <span className="font-extrabold text-amber-400 text-sm sm:text-base tracking-tight ml-1">Sekolah</span>
          </div>
          <p className="text-[10px] text-blue-200/90 font-bold tracking-wider uppercase mt-1 truncate">
            SMART SPJ BOSP
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto text-xs font-semibold custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'administrasi' && currentTab === 'verifikasi');
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0f4d93] text-white shadow-sm border-l-4 border-amber-400 font-bold'
                  : 'text-blue-100/75 hover:bg-[#0c3c74] hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-blue-300'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* External Link: Inventaris */}
        <div className="pt-2 border-t border-[#0d417d] my-2">
          <button
            id="nav-inventaris"
            onClick={handleOpenInventaris}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-blue-200/80 hover:bg-[#0c3c74] hover:text-white transition-all text-xs cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Boxes className="w-4 h-4 text-blue-300" />
              <span>Inventaris Sekolah</span>
            </div>
            <ExternalLink className="w-3 h-3 text-blue-300/70" />
          </button>
        </div>
      </nav>

      {/* Footer Info & School Account Status */}
      <div className="p-3.5 border-t border-[#0d417d] bg-[#072449]/50 space-y-2.5">
        <div className="bg-[#062347] p-2.5 rounded-xl border border-[#0d417d] text-[11px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold truncate max-w-[140px]" title={settings.namaSekolah}>
              {settings.namaSekolah}
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-2.5 h-2.5" />
              Aktif
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-blue-200/70">
            <span>NPSN: {settings.npsn}</span>
            <span className="text-amber-400 font-semibold">
              {currentAccount?.paketLangganan || 'Tahunan'}
            </span>
          </div>
          <div className="flex items-center justify-center pt-1 border-t border-[#0d417d] text-[10px]">
            <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <Cloud className="w-3 h-3 text-emerald-300" />
              Tersinkron Otomatis
            </span>
          </div>
        </div>

        <div className="pt-1">
          {onLogout && (
            <button
              type="button"
              id="btn-sidebar-logout"
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-rose-500/25 active:bg-rose-500/35 text-blue-100 hover:text-rose-200 font-bold text-xs transition-colors cursor-pointer border border-white/10"
              title="Keluar dari akun sekolah"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
