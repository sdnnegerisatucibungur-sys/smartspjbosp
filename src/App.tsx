import React, { useState, useEffect, useRef } from 'react';
import {
  AppSettings,
  BkuItem,
  RkasItem,
  TabType,
  TaxRecord,
  SchoolAccount,
  BukuPembantuPajakItem,
  RekapPajakItem,
} from './types';
import {
  initialSettings,
  initialRkasData,
  initialBkuData,
  initialTaxRecords,
  sampleRkasData,
  sampleBkuData,
  sampleTaxRecords,
  createSettingsFromSchoolAccount,
} from './data/initialData';
import { initialBukuPembantuPajakItems } from './utils/bukuPembantuPajakData';
import { initialRekapPajakItems, syncRekapPajakFromBppAndBku } from './utils/rekapPajakData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { RkasTab } from './components/RkasTab';
import { BkuTab } from './components/BkuTab';
import { KwitansiTab } from './components/KwitansiTab';
import { TandaTerimaTab } from './components/TandaTerimaTab';
import { PajakTab } from './components/PajakTab';
import { AdministrasiTab } from './components/AdministrasiTab';
import { SppdTab } from './components/SppdTab';
import { PengaturanTab } from './components/PengaturanTab';
import { AuthPage } from './components/AuthPage';
import {
  TriwulanBackupPackage,
  RestoreSelectionOptions,
} from './utils/backupHelper';
import {
  saveSchoolWorkspaceToSupabase,
  loadSchoolWorkspaceFromSupabase,
  checkSchoolActivationStatus,
  isSupabaseConfigured,
  purgeSchoolDataLocally,
  SchoolWorkspacePayload,
} from './lib/supabaseClient';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Menu,
} from 'lucide-react';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // Sesi Akun Sekolah yang sedang Login (Multi-Tenant)
  const [currentAccount, setCurrentAccount] = useState<SchoolAccount | null>(() => {
    try {
      const saved = localStorage.getItem('spj_active_school_account');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load active school session', e);
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedPeriode, setSelectedPeriode] = useState<string>(
    'Triwulan 2 (April - Juni 2026)'
  );
  // Pilihan Bulan SPJ (Multi-Bulan Pengerjaan Bulanan)
  const [selectedBulan, setSelectedBulan] = useState<string>(() => {
    try {
      const active = localStorage.getItem('spj_active_school_account');
      if (active) {
        const parsedAccount: SchoolAccount = JSON.parse(active);
        const savedBulan = localStorage.getItem(`spj_school_${parsedAccount.npsn}_selected_bulan`);
        if (savedBulan) return savedBulan;
      }
    } catch (e) {
      console.error('Failed to load selected month from storage', e);
    }
    return 'Januari';
  });

  const handleBulanChange = (newBulan: string) => {
    setSelectedBulan(newBulan);
    if (currentAccount) {
      localStorage.setItem(`spj_school_${currentAccount.npsn}_selected_bulan`, newBulan);
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper key storage unik per sekolah
  const getStorageKey = (suffix: string, npsn?: string) => {
    const code = npsn || currentAccount?.npsn || 'global';
    return `spj_school_${code}_${suffix}`;
  };

  // Settings State with LocalStorage per Sekolah
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const active = localStorage.getItem('spj_active_school_account');
      if (active) {
        const parsedAccount: SchoolAccount = JSON.parse(active);
        const savedSettings = localStorage.getItem(`spj_school_${parsedAccount.npsn}_settings`);
        if (savedSettings) return JSON.parse(savedSettings);
        return createSettingsFromSchoolAccount(parsedAccount);
      }
    } catch (e) {
      console.error('Failed to load settings from storage', e);
    }
    return initialSettings;
  });

  // RKAS State with LocalStorage per Sekolah (Awalnya bersih / kosong untuk sekolah baru)
  const [rkasData, setRkasData] = useState<RkasItem[]>(() => {
    try {
      const active = localStorage.getItem('spj_active_school_account');
      if (active) {
        const parsedAccount: SchoolAccount = JSON.parse(active);
        const saved = localStorage.getItem(`spj_school_${parsedAccount.npsn}_rkas`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load RKAS from storage', e);
    }
    return initialRkasData;
  });

  // BKU State with LocalStorage per Sekolah (Awalnya bersih / kosong untuk sekolah baru)
  const [bkuData, setBkuData] = useState<BkuItem[]>(() => {
    try {
      const active = localStorage.getItem('spj_active_school_account');
      if (active) {
        const parsedAccount: SchoolAccount = JSON.parse(active);
        const saved = localStorage.getItem(`spj_school_${parsedAccount.npsn}_bku`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load BKU from storage', e);
    }
    return initialBkuData;
  });

  // Tax Records State with LocalStorage per Sekolah (Awalnya bersih / kosong untuk sekolah baru)
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>(() => {
    try {
      const active = localStorage.getItem('spj_active_school_account');
      if (active) {
        const parsedAccount: SchoolAccount = JSON.parse(active);
        const saved = localStorage.getItem(`spj_school_${parsedAccount.npsn}_tax`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load tax records from storage', e);
    }
    return initialTaxRecords;
  });

  // Buku Pembantu Pajak State with LocalStorage per Sekolah
  const [bppItems, setBppItems] = useState<BukuPembantuPajakItem[]>(() => {
    try {
      const active = localStorage.getItem('spj_active_school_account');
      if (active) {
        const parsedAccount: SchoolAccount = JSON.parse(active);
        const saved = localStorage.getItem(`spj_school_${parsedAccount.npsn}_bpp`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load bpp from storage', e);
    }
    return initialBukuPembantuPajakItems;
  });

  // Rekapitulasi Pajak Lampiran 4 State with LocalStorage per Sekolah
  const [rekapItems, setRekapItems] = useState<RekapPajakItem[]>(() => {
    try {
      const active = localStorage.getItem('spj_active_school_account');
      if (active) {
        const parsedAccount: SchoolAccount = JSON.parse(active);
        const saved = localStorage.getItem(`spj_school_${parsedAccount.npsn}_rekap_pajak`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load rekap pajak from storage', e);
    }
    return initialRekapPajakItems;
  });

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastState[]>([]);

  // =========================================================
  // SUPABASE CLOUD SYNC STATE & REFS (MULTI-DEVICE PERSISTENCE)
  // =========================================================
  const isInitialLoadDoneRef = useRef(false);
  const autoSaveTimerRef = useRef<any>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('saved');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);
  const [isSyncingInitial, setIsSyncingInitial] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fungsi Sinkronisasi Data dari Supabase Cloud (Multi-Device & Ganti Komputer)
  const syncFromCloud = async (account: SchoolAccount) => {
    setIsSyncingInitial(true);
    setCloudSyncStatus('saving');
    try {
      const result = await loadSchoolWorkspaceFromSupabase(account.npsn);
      if (result.success && result.payload) {
        const p = result.payload;
        if (p.settings) {
          const merged: AppSettings = {
            ...p.settings,
            namaSekolah: account.namaSekolah,
            npsn: account.npsn,
          };
          setSettings(merged);
          localStorage.setItem(`spj_school_${account.npsn}_settings`, JSON.stringify(merged));
        }
        if (Array.isArray(p.rkasData)) {
          setRkasData(p.rkasData);
          localStorage.setItem(`spj_school_${account.npsn}_rkas`, JSON.stringify(p.rkasData));
        }
        if (Array.isArray(p.bkuData)) {
          setBkuData(p.bkuData);
          localStorage.setItem(`spj_school_${account.npsn}_bku`, JSON.stringify(p.bkuData));
        }
        if (Array.isArray(p.taxRecords)) {
          setTaxRecords(p.taxRecords);
          localStorage.setItem(`spj_school_${account.npsn}_tax`, JSON.stringify(p.taxRecords));
        }
        if (Array.isArray(p.extraData?.bppItems)) {
          setBppItems(p.extraData.bppItems);
          localStorage.setItem(`spj_school_${account.npsn}_bpp`, JSON.stringify(p.extraData.bppItems));
        }
        if (Array.isArray(p.extraData?.rekapItems)) {
          setRekapItems(p.extraData.rekapItems);
          localStorage.setItem(`spj_school_${account.npsn}_rekap_pajak`, JSON.stringify(p.extraData.rekapItems));
        }
        if (p.selectedPeriode) {
          setSelectedPeriode(p.selectedPeriode);
        }
        if (p.extraData?.selectedBulan) {
          setSelectedBulan(p.extraData.selectedBulan);
          localStorage.setItem(`spj_school_${account.npsn}_selected_bulan`, p.extraData.selectedBulan);
        }
        setCloudSyncStatus('saved');
        const formattedTime = new Date(p.lastSyncedAt || Date.now()).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setLastCloudSyncTime(formattedTime);
        showToast('Data pengerjaan berhasil disinkronkan dari Supabase Cloud!', 'success');
      } else {
        // Jika belum ada data tersimpan di cloud untuk sekolah ini, amankan data lokal ke Supabase
        const initialPayload: SchoolWorkspacePayload = {
          npsn: account.npsn,
          settings,
          rkasData,
          bkuData,
          taxRecords,
          selectedPeriode,
          extraData: {
            bppItems,
            rekapItems,
            selectedBulan,
          },
          lastSyncedAt: new Date().toISOString(),
        };
        await saveSchoolWorkspaceToSupabase(account.npsn, initialPayload);
        setCloudSyncStatus('saved');
        setLastCloudSyncTime(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        );
      }
    } catch (err) {
      console.error('Initial cloud sync error', err);
      setCloudSyncStatus('error');
    } finally {
      setIsSyncingInitial(false);
      isInitialLoadDoneRef.current = true;
    }
  };

  // Verifikasi Validitas Akun Aktif ke Supabase (Jika tabel / baris dihapus di Supabase)
  useEffect(() => {
    if (!currentAccount || !isSupabaseConfigured()) return;

    let isMounted = true;
    const verifyActiveSession = async () => {
      try {
        const res = await checkSchoolActivationStatus(currentAccount.npsn);
        if (!isMounted) return;

        if (res.status === 'not_found') {
          // Akun atau tabel dihapus di Supabase -> data otomatis hilang dan reset ke 0
          purgeSchoolDataLocally(currentAccount.npsn);
          setSettings(initialSettings);
          setRkasData([]);
          setBkuData([]);
          setTaxRecords([]);
          setBppItems(initialBukuPembantuPajakItems);
          setRekapItems(initialRekapPajakItems);
          isInitialLoadDoneRef.current = false;
          setCurrentAccount(null);
          setIsMobileMenuOpen(false);
          showToast(
            'Data sekolah telah dihapus dari database. Seluruh data otomatis hilang dan Anda harus melakukan registrasi ulang kembali ke 0.',
            'error'
          );
        } else if (res.status !== 'active') {
          // Status akun tidak aktif (pending / expired / suspended)
          try {
            localStorage.removeItem('spj_active_school_account');
          } catch (e) {
            console.error('Failed to clear active session', e);
          }
          isInitialLoadDoneRef.current = false;
          setCurrentAccount(null);
          setIsMobileMenuOpen(false);
          showToast(
            `Sesi Login Berakhir: Status sekolah Anda di database Supabase adalah ${res.status.toUpperCase()}. Harap hubungi Admin.`,
            'error'
          );
        }
      } catch (err) {
        console.warn('Gagal verifikasi sesi ke Supabase', err);
      }
    };

    verifyActiveSession();
    return () => {
      isMounted = false;
    };
  }, [currentAccount?.npsn]);

  // Muat data Cloud saat aplikasi dibuka dengan akun yang sudah aktif
  useEffect(() => {
    if (currentAccount && !isInitialLoadDoneRef.current) {
      syncFromCloud(currentAccount);
    }
  }, [currentAccount?.npsn]);

  // Otomatis Simpan (Auto-Save Debounce) ke Supabase Cloud setiap ada perubahan data
  useEffect(() => {
    if (!currentAccount || !isInitialLoadDoneRef.current || isSyncingInitial) {
      return;
    }

    setCloudSyncStatus('saving');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const payload: SchoolWorkspacePayload = {
          npsn: currentAccount.npsn,
          settings,
          rkasData,
          bkuData,
          taxRecords,
          selectedPeriode,
          extraData: {
            bppItems,
            rekapItems,
            selectedBulan,
          },
          lastSyncedAt: new Date().toISOString(),
        };
        const res = await saveSchoolWorkspaceToSupabase(currentAccount.npsn, payload);
        if (res.success) {
          setCloudSyncStatus('saved');
          setLastCloudSyncTime(
            new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          );
        } else {
          setCloudSyncStatus('error');
        }
      } catch (e) {
        console.error('Auto save error', e);
        setCloudSyncStatus('error');
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [settings, rkasData, bkuData, taxRecords, selectedPeriode, selectedBulan, bppItems, rekapItems]);

  // Handler Simpan / Sinkronisasi Manual ke Cloud Supabase
  const handleManualCloudSync = async () => {
    if (!currentAccount) return;
    setCloudSyncStatus('saving');
    try {
      const payload: SchoolWorkspacePayload = {
        npsn: currentAccount.npsn,
        settings,
        rkasData,
        bkuData,
        taxRecords,
        selectedPeriode,
        extraData: {
          bppItems,
          rekapItems,
          selectedBulan,
        },
        lastSyncedAt: new Date().toISOString(),
      };
      const res = await saveSchoolWorkspaceToSupabase(currentAccount.npsn, payload);
      if (res.success) {
        setCloudSyncStatus('saved');
        setLastCloudSyncTime(
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        );
        showToast('Seluruh data pengerjaan berhasil disinkronkan ke Supabase Cloud!', 'success');
      } else {
        setCloudSyncStatus('error');
        showToast(`Gagal sinkronisasi: ${res.message}`, 'error');
      }
    } catch (err: any) {
      setCloudSyncStatus('error');
      showToast(`Gagal sinkronisasi: ${err.message || err}`, 'error');
    }
  };

  // Handler Saat Sekolah Berhasil Login
  const handleLoginSuccess = async (account: SchoolAccount) => {
    setCurrentAccount(account);
    try {
      localStorage.setItem('spj_active_school_account', JSON.stringify(account));
    } catch (e) {
      console.error('Failed to persist active session', e);
    }

    // Muat data awal dari Local Cache
    const savedSettings = localStorage.getItem(`spj_school_${account.npsn}_settings`);
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    } else {
      const newSettings = createSettingsFromSchoolAccount(account);
      setSettings(newSettings);
      localStorage.setItem(`spj_school_${account.npsn}_settings`, JSON.stringify(newSettings));
    }

    const savedRkas = localStorage.getItem(`spj_school_${account.npsn}_rkas`);
    setRkasData(savedRkas ? JSON.parse(savedRkas) : []);

    const savedBku = localStorage.getItem(`spj_school_${account.npsn}_bku`);
    setBkuData(savedBku ? JSON.parse(savedBku) : []);

    const savedTax = localStorage.getItem(`spj_school_${account.npsn}_tax`);
    setTaxRecords(savedTax ? JSON.parse(savedTax) : []);

    const savedBpp = localStorage.getItem(`spj_school_${account.npsn}_bpp`);
    setBppItems(savedBpp ? JSON.parse(savedBpp) : initialBukuPembantuPajakItems);

    const savedRekap = localStorage.getItem(`spj_school_${account.npsn}_rekap_pajak`);
    setRekapItems(savedRekap ? JSON.parse(savedRekap) : initialRekapPajakItems);

    const savedBulan = localStorage.getItem(`spj_school_${account.npsn}_selected_bulan`);
    setSelectedBulan(savedBulan || 'Januari');

    setCurrentTab('dashboard');

    // Sinkronkan data terbaru dari Cloud Supabase agar multi-perangkat selalu up-to-date
    await syncFromCloud(account);
  };

  // Handler Logout: Simpan Progres Terakhir ke Supabase sebelum Keluar
  const handleLogout = async () => {
    if (currentAccount) {
      setCloudSyncStatus('saving');
      try {
        const payload: SchoolWorkspacePayload = {
          npsn: currentAccount.npsn,
          settings,
          rkasData,
          bkuData,
          taxRecords,
          selectedPeriode,
          extraData: {
            bppItems,
            rekapItems,
            selectedBulan,
          },
          lastSyncedAt: new Date().toISOString(),
        };
        await saveSchoolWorkspaceToSupabase(currentAccount.npsn, payload);
      } catch (e) {
        console.warn('Gagal menyimpan saat logout', e);
      }
    }

    try {
      localStorage.removeItem('spj_active_school_account');
    } catch (e) {
      console.error('Failed to clear active session', e);
    }
    isInitialLoadDoneRef.current = false;
    setCurrentAccount(null);
    setIsMobileMenuOpen(false);
    showToast('Seluruh progres pengerjaan aman di Supabase Cloud. Anda telah berhasil keluar.', 'info');
  };

  // Sync to LocalStorage on updates (Multi-Tenant per NPSN, Nama Sekolah & NPSN Terkunci)
  const handleUpdateSettings = (newSettings: AppSettings) => {
    const lockedSettings: AppSettings = currentAccount
      ? {
          ...newSettings,
          namaSekolah: currentAccount.namaSekolah,
          npsn: currentAccount.npsn,
        }
      : newSettings;

    setSettings(lockedSettings);
    if (currentAccount) {
      try {
        localStorage.setItem(
          `spj_school_${currentAccount.npsn}_settings`,
          JSON.stringify(lockedSettings)
        );
      } catch (e) {
        console.error('Failed to save settings', e);
      }
    }
  };

  const handleUpdateRkas = (newData: RkasItem[]) => {
    setRkasData(newData);
    if (currentAccount) {
      try {
        localStorage.setItem(`spj_school_${currentAccount.npsn}_rkas`, JSON.stringify(newData));
      } catch (e) {
        console.error('Failed to save RKAS', e);
      }
    }
  };

  const handleUpdateBku = (newData: BkuItem[]) => {
    setBkuData(newData);
    // Jika ada data BKU baru dan ada data BPP, sinkronkan nilai belanja Rekap Pajak secara otomatis
    if (newData && newData.length > 0 && bppItems && bppItems.length > 0) {
      try {
        const synced = syncRekapPajakFromBppAndBku(bppItems, newData, settings);
        if (synced && synced.length > 0) {
          setRekapItems(synced);
        }
      } catch (err) {
        console.warn('Auto sync rekap tax error on BKU update', err);
      }
    }
    if (currentAccount) {
      try {
        localStorage.setItem(`spj_school_${currentAccount.npsn}_bku`, JSON.stringify(newData));
      } catch (e) {
        console.error('Failed to save BKU', e);
      }
    }
  };

  const handleUpdateTaxes = (newTaxes: TaxRecord[]) => {
    setTaxRecords(newTaxes);
    if (currentAccount) {
      try {
        localStorage.setItem(`spj_school_${currentAccount.npsn}_tax`, JSON.stringify(newTaxes));
      } catch (e) {
        console.error('Failed to save tax records', e);
      }
    }
  };

  const handleUpdateBpp = (newItems: BukuPembantuPajakItem[]) => {
    setBppItems(newItems);
    if (currentAccount) {
      try {
        localStorage.setItem(`spj_school_${currentAccount.npsn}_bpp`, JSON.stringify(newItems));
      } catch (e) {
        console.error('Failed to save bpp', e);
      }
    }
  };

  const handleUpdateRekap = (newItems: RekapPajakItem[]) => {
    setRekapItems(newItems);
    if (currentAccount) {
      try {
        localStorage.setItem(`spj_school_${currentAccount.npsn}_rekap_pajak`, JSON.stringify(newItems));
      } catch (e) {
        console.error('Failed to save rekap pajak', e);
      }
    }
  };

  const handleResetAllData = () => {
    if (window.confirm('Apakah Anda ingin mengosongkan seluruh data BKU, RKAS, dan Pajak sekolah ini?')) {
      if (currentAccount) {
        try {
          localStorage.removeItem(`spj_school_${currentAccount.npsn}_rkas`);
          localStorage.removeItem(`spj_school_${currentAccount.npsn}_bku`);
          localStorage.removeItem(`spj_school_${currentAccount.npsn}_tax`);
          localStorage.removeItem(`spj_school_${currentAccount.npsn}_bpp`);
          localStorage.removeItem(`spj_school_${currentAccount.npsn}_rekap_pajak`);
        } catch (e) {
          console.error('Failed to clear school storage', e);
        }
      }
      setRkasData([]);
      setBkuData([]);
      setTaxRecords([]);
      setBppItems([]);
      setRekapItems([]);
      showToast('Seluruh data BKU, RKAS, dan Pajak sekolah telah dikosongkan.', 'info');
    }
  };

  // Handler: Pemulihan Data dari Cadangan Triwulan (Backup & Restore)
  const handleRestoreBackup = (
    backup: TriwulanBackupPackage,
    options: RestoreSelectionOptions
  ) => {
    try {
      if (options.restoreBku && Array.isArray(backup.payload.bkuData)) {
        setBkuData(backup.payload.bkuData);
        if (currentAccount) {
          localStorage.setItem(
            `spj_school_${currentAccount.npsn}_bku`,
            JSON.stringify(backup.payload.bkuData)
          );
        }
      }

      if (options.restorePajak) {
        if (Array.isArray(backup.payload.taxRecords)) {
          setTaxRecords(backup.payload.taxRecords);
          if (currentAccount) {
            localStorage.setItem(
              `spj_school_${currentAccount.npsn}_tax`,
              JSON.stringify(backup.payload.taxRecords)
            );
          }
        }
        if (Array.isArray(backup.payload.bppItems)) {
          setBppItems(backup.payload.bppItems);
          if (currentAccount) {
            localStorage.setItem(
              `spj_school_${currentAccount.npsn}_bpp`,
              JSON.stringify(backup.payload.bppItems)
            );
          }
        }
        if (Array.isArray(backup.payload.rekapItems)) {
          setRekapItems(backup.payload.rekapItems);
          if (currentAccount) {
            localStorage.setItem(
              `spj_school_${currentAccount.npsn}_rekap_pajak`,
              JSON.stringify(backup.payload.rekapItems)
            );
          }
        }
      }

      if (options.restoreRkas && Array.isArray(backup.payload.rkasData)) {
        setRkasData(backup.payload.rkasData);
        if (currentAccount) {
          localStorage.setItem(
            `spj_school_${currentAccount.npsn}_rkas`,
            JSON.stringify(backup.payload.rkasData)
          );
        }
      }

      if (options.restoreSettings && backup.payload.settings) {
        const mergedSettings: AppSettings = {
          ...settings,
          ...backup.payload.settings,
          npsn: currentAccount?.npsn || backup.payload.settings.npsn || settings.npsn,
          namaSekolah: currentAccount?.namaSekolah || backup.payload.settings.namaSekolah || settings.namaSekolah,
        };
        setSettings(mergedSettings);
        if (currentAccount) {
          localStorage.setItem(
            `spj_school_${currentAccount.npsn}_settings`,
            JSON.stringify(mergedSettings)
          );
        }
      }

      if (backup.payload.selectedPeriode) {
        setSelectedPeriode(backup.payload.selectedPeriode);
      }

      showToast(`Data ${backup.triwulanLabel} berhasil dipulihkan ke aplikasi!`, 'success');
    } catch (e) {
      console.error('Failed to restore backup', e);
      showToast('Gagal memulihkan data cadangan', 'error');
    }
  };

  const handleLoadSampleTemplate = () => {
    if (window.confirm('Muat contoh data lengkap (RKAS & BKU untuk referensi)?')) {
      setRkasData(sampleRkasData);
      setBkuData(sampleBkuData);
      setTaxRecords(sampleTaxRecords);
      if (currentAccount) {
        localStorage.setItem(`spj_school_${currentAccount.npsn}_rkas`, JSON.stringify(sampleRkasData));
        localStorage.setItem(`spj_school_${currentAccount.npsn}_bku`, JSON.stringify(sampleBkuData));
        localStorage.setItem(`spj_school_${currentAccount.npsn}_tax`, JSON.stringify(sampleTaxRecords));
      }
      showToast('Data contoh referensi berhasil dimuat.', 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================
  // JIKA BELUM LOGIN: TAMPILKAN AUTH PAGE (LOGIN / REGISTRASI)
  // =========================================================
  if (!currentAccount) {
    return (
      <>
        <AuthPage onLoginSuccess={handleLoginSuccess} showToast={showToast} />

        {/* Floating Toast Notification Container */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none no-print">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
                toast.type === 'success'
                  ? 'bg-emerald-50/95 text-emerald-900 border-emerald-300'
                  : toast.type === 'error'
                  ? 'bg-rose-50/95 text-rose-900 border-rose-300'
                  : 'bg-blue-50/95 text-blue-900 border-blue-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {toast.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
                {toast.type === 'error' && (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                {toast.type === 'info' && (
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </>
    );
  }

  // =========================================================
  // SETELAH LOGIN: TAMPILKAN DASHBOARD UTAMA SPJ BOSP
  // =========================================================
  return (
    <div id="spj-app-root" className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex flex-shrink-0 h-full">
        <Sidebar
          currentTab={currentTab}
          onTabChange={handleTabChange}
          settings={settings}
          currentAccount={currentAccount}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-64 h-full bg-slate-900 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              currentTab={currentTab}
              onTabChange={handleTabChange}
              settings={settings}
              currentAccount={currentAccount}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top Header Bar */}
        <div className="relative">
          <Header
            settings={settings}
            currentTab={currentTab}
            selectedBulan={selectedBulan}
            onBulanChange={handleBulanChange}
            selectedPeriode={selectedPeriode}
            onPeriodeChange={setSelectedPeriode}
            onPrintCurrentView={handlePrint}
            cloudSyncStatus={cloudSyncStatus}
            lastCloudSyncTime={lastCloudSyncTime}
            onManualSync={handleManualCloudSync}
            isSyncingInitial={isSyncingInitial}
          />
          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-slate-900 no-print"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Viewport for Active Tab */}
        <main
          id="main-tab-content-area"
          className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8"
        >
          {currentTab === 'dashboard' && (
            <DashboardTab
              settings={settings}
              rkasData={rkasData}
              bkuData={bkuData}
              taxRecords={taxRecords}
              onNavigate={handleTabChange}
              selectedBulan={selectedBulan}
              onBulanChange={handleBulanChange}
            />
          )}

          {currentTab === 'rkas' && (
            <RkasTab
              settings={settings}
              rkasData={rkasData}
              onUpdateRkas={handleUpdateRkas}
              showToast={showToast}
            />
          )}

          {currentTab === 'bku' && (
            <BkuTab
              settings={settings}
              bkuData={bkuData}
              onUpdateBku={handleUpdateBku}
              showToast={showToast}
              rkasData={rkasData}
              taxRecords={taxRecords}
              bppItems={bppItems}
              rekapItems={rekapItems}
              selectedPeriode={selectedPeriode}
              selectedBulan={selectedBulan}
              onBulanChange={handleBulanChange}
              onRestoreData={handleRestoreBackup}
            />
          )}

          {currentTab === 'kwitansi' && (
            <KwitansiTab
              settings={settings}
              bkuData={bkuData}
              rkasData={rkasData}
              showToast={showToast}
              selectedBulan={selectedBulan}
              onBulanChange={handleBulanChange}
            />
          )}

          {currentTab === 'tandaterima' && (
            <TandaTerimaTab
              settings={settings}
              bkuData={bkuData}
              rkasData={rkasData}
              showToast={showToast}
              selectedBulan={selectedBulan}
              onBulanChange={handleBulanChange}
            />
          )}

          {currentTab === 'pajak' && (
            <PajakTab
              settings={settings}
              taxRecords={taxRecords}
              onUpdateTaxes={handleUpdateTaxes}
              showToast={showToast}
              bkuData={bkuData}
              bppItems={bppItems}
              onUpdateBpp={handleUpdateBpp}
              rekapItems={rekapItems}
              onUpdateRekap={handleUpdateRekap}
              selectedBulan={selectedBulan}
              onBulanChange={handleBulanChange}
            />
          )}

          {(currentTab === 'administrasi' || currentTab === 'verifikasi') && (
            <AdministrasiTab
              settings={settings}
              showToast={showToast}
              bkuData={bkuData}
              rkasData={rkasData}
              onUpdateSettings={handleUpdateSettings}
              selectedBulan={selectedBulan}
              onBulanChange={handleBulanChange}
            />
          )}

          {currentTab === 'sppd' && (
            <SppdTab
              settings={settings}
              showToast={showToast}
              selectedBulan={selectedBulan}
              onBulanChange={handleBulanChange}
            />
          )}

          {currentTab === 'pengaturan' && (
            <PengaturanTab
              settings={settings}
              onSaveSettings={handleUpdateSettings}
              onResetAllData={handleResetAllData}
              showToast={showToast}
              cloudSyncStatus={cloudSyncStatus}
              lastCloudSyncTime={lastCloudSyncTime}
              onManualSync={handleManualCloudSync}
              bkuData={bkuData}
              rkasData={rkasData}
              taxRecords={taxRecords}
              bppItems={bppItems}
              rekapItems={rekapItems}
              selectedPeriode={selectedPeriode}
              onRestoreData={handleRestoreBackup}
            />
          )}
        </main>
      </div>

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none no-print">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-xs font-semibold backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 text-emerald-900 border-emerald-300'
                : toast.type === 'error'
                ? 'bg-rose-50/95 text-rose-900 border-rose-300'
                : 'bg-blue-50/95 text-blue-900 border-blue-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {toast.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              {toast.type === 'info' && (
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
