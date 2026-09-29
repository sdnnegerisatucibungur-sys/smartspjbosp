import { AppSettings, BkuItem, RkasItem, TaxRecord, BukuPembantuPajakItem, RekapPajakItem } from '../types';

export type TriwulanType = 'TW1' | 'TW2' | 'TW3' | 'TW4' | 'SEMUA';

export interface BackupStats {
  totalBku: number;
  totalRkas: number;
  totalPajak: number;
  totalBpp: number;
  totalRekap: number;
  totalTerima: number;
  totalKeluar: number;
  saldoAkhir: number;
}

export interface TriwulanBackupPackage {
  id: string;
  version: string;
  appIdentifier: 'BOSP_SPJ_MANAGER';
  createdAt: string; // ISO String
  triwulan: TriwulanType;
  triwulanLabel: string;
  tahunAnggaran: string;
  catatan?: string;
  npsn: string;
  namaSekolah: string;
  stats: BackupStats;
  payload: {
    bkuData: BkuItem[];
    rkasData?: RkasItem[];
    taxRecords?: TaxRecord[];
    bppItems?: BukuPembantuPajakItem[];
    rekapItems?: RekapPajakItem[];
    settings?: AppSettings;
    selectedPeriode?: string;
  };
}

export interface RestoreSelectionOptions {
  restoreBku: boolean;
  restorePajak: boolean;
  restoreRkas: boolean;
  restoreSettings: boolean;
}

export const TRIWULAN_OPTIONS: { id: TriwulanType; label: string; bulan: string; description: string }[] = [
  {
    id: 'TW1',
    label: 'Triwulan 1',
    bulan: 'Januari - Maret',
    description: 'Pencairan & Realisasi BOSP Tahap 1 Awal (Jan - Mar)',
  },
  {
    id: 'TW2',
    label: 'Triwulan 2',
    bulan: 'April - Juni',
    description: 'Pencairan & Realisasi BOSP Tahap 1 Akhir (Apr - Jun)',
  },
  {
    id: 'TW3',
    label: 'Triwulan 3',
    bulan: 'Juli - September',
    description: 'Pencairan & Realisasi BOSP Tahap 2 Awal (Jul - Sep)',
  },
  {
    id: 'TW4',
    label: 'Triwulan 4',
    bulan: 'Oktober - Desember',
    description: 'Pencairan & Realisasi BOSP Tahap 2 Akhir (Okt - Des)',
  },
  {
    id: 'SEMUA',
    label: 'Semua Triwulan (Tahunan)',
    bulan: 'Januari - Desember',
    description: 'Pencadangan Total Keseluruhan Tahun Anggaran',
  },
];

const BACKUP_STORAGE_PREFIX = 'spj_school_backups_';

export function getBackupStorageKey(npsn: string): string {
  const cleanNpsn = npsn || 'default';
  return `${BACKUP_STORAGE_PREFIX}${cleanNpsn}`;
}

export function getSavedBackups(npsn: string): TriwulanBackupPackage[] {
  try {
    const key = getBackupStorageKey(npsn);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return [];
  } catch (err) {
    console.error('Gagal membaca daftar backup lokal:', err);
    return [];
  }
}

export function saveBackupPackage(backup: TriwulanBackupPackage): boolean {
  try {
    const key = getBackupStorageKey(backup.npsn);
    const existing = getSavedBackups(backup.npsn);
    
    // Cek apakah sudah ada backup untuk ID yang sama atau timpa
    const filtered = existing.filter((b) => b.id !== backup.id);
    const updated = [backup, ...filtered];
    
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Gagal menyimpan backup lokal:', err);
    return false;
  }
}

export function deleteBackupPackage(npsn: string, backupId: string): boolean {
  try {
    const key = getBackupStorageKey(npsn);
    const existing = getSavedBackups(npsn);
    const updated = existing.filter((b) => b.id !== backupId);
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Gagal menghapus backup lokal:', err);
    return false;
  }
}

export function createBackupPackage(params: {
  triwulan: TriwulanType;
  tahunAnggaran: string;
  catatan?: string;
  settings: AppSettings;
  bkuData: BkuItem[];
  rkasData: RkasItem[];
  taxRecords: TaxRecord[];
  bppItems: BukuPembantuPajakItem[];
  rekapItems: RekapPajakItem[];
  selectedPeriode?: string;
}): TriwulanBackupPackage {
  const {
    triwulan,
    tahunAnggaran,
    catatan,
    settings,
    bkuData,
    rkasData,
    taxRecords,
    bppItems,
    rekapItems,
    selectedPeriode,
  } = params;

  const twInfo = TRIWULAN_OPTIONS.find((t) => t.id === triwulan);
  const triwulanLabel = twInfo ? `${twInfo.label} (${twInfo.bulan})` : triwulan;

  let totalTerima = 0;
  let totalKeluar = 0;
  bkuData.forEach((row) => {
    totalTerima += Number(row.terima) || 0;
    totalKeluar += Number(row.keluar) || 0;
  });
  const saldoAkhir = totalTerima - totalKeluar;

  const timestamp = Date.now();
  const id = `backup_${triwulan.toLowerCase()}_${tahunAnggaran}_${timestamp}`;

  const backupPackage: TriwulanBackupPackage = {
    id,
    version: '1.0',
    appIdentifier: 'BOSP_SPJ_MANAGER',
    createdAt: new Date().toISOString(),
    triwulan,
    triwulanLabel,
    tahunAnggaran: tahunAnggaran || settings.tahunAnggaran || '2026',
    catatan: catatan?.trim() || `Cadangan data ${triwulanLabel} sebelum reset BKU`,
    npsn: settings.npsn || '20601830',
    namaSekolah: settings.namaSekolah || 'SDN 1 CIBUNGUR',
    stats: {
      totalBku: bkuData.length,
      totalRkas: rkasData.length,
      totalPajak: taxRecords.length,
      totalBpp: bppItems.length,
      totalRekap: rekapItems.length,
      totalTerima,
      totalKeluar,
      saldoAkhir,
    },
    payload: {
      bkuData: JSON.parse(JSON.stringify(bkuData)),
      rkasData: JSON.parse(JSON.stringify(rkasData)),
      taxRecords: JSON.parse(JSON.stringify(taxRecords)),
      bppItems: JSON.parse(JSON.stringify(bppItems)),
      rekapItems: JSON.parse(JSON.stringify(rekapItems)),
      settings: JSON.parse(JSON.stringify(settings)),
      selectedPeriode,
    },
  };

  return backupPackage;
}

export function downloadBackupAsJson(backup: TriwulanBackupPackage): void {
  const cleanSchool = (backup.namaSekolah || 'SEKOLAH')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);

  const dateStr = new Date(backup.createdAt).toISOString().slice(0, 10);
  const filename = `BACKUP_SPJ_${cleanSchool}_${backup.triwulan}_${backup.tahunAnggaran}_${dateStr}.json`;

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file: File): Promise<TriwulanBackupPackage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('Berkas cadangan kosong atau tidak dapat dibaca.');
        }

        const data = JSON.parse(text);

        // Validasi struktur berkas
        if (!data || typeof data !== 'object') {
          throw new Error('Format berkas tidak valid (bukan JSON terstruktur).');
        }

        if (!data.payload || !Array.isArray(data.payload.bkuData)) {
          throw new Error('Berkas tidak berisi data BKU yang valid untuk dipulihkan.');
        }

        // Normalisasi struktur jika dari versi alternatif
        const backupPackage: TriwulanBackupPackage = {
          id: data.id || `restored_${Date.now()}`,
          version: data.version || '1.0',
          appIdentifier: data.appIdentifier || 'BOSP_SPJ_MANAGER',
          createdAt: data.createdAt || new Date().toISOString(),
          triwulan: data.triwulan || 'SEMUA',
          triwulanLabel: data.triwulanLabel || 'Cadangan Data',
          tahunAnggaran: data.tahunAnggaran || '2026',
          catatan: data.catatan || 'Dipulihkan dari berkas eksternal',
          npsn: data.npsn || data.payload.settings?.npsn || '20601830',
          namaSekolah: data.namaSekolah || data.payload.settings?.namaSekolah || 'Sekolah',
          stats: data.stats || {
            totalBku: data.payload.bkuData?.length || 0,
            totalRkas: data.payload.rkasData?.length || 0,
            totalPajak: data.payload.taxRecords?.length || 0,
            totalBpp: data.payload.bppItems?.length || 0,
            totalRekap: data.payload.rekapItems?.length || 0,
            totalTerima: 0,
            totalKeluar: 0,
            saldoAkhir: 0,
          },
          payload: {
            bkuData: data.payload.bkuData || [],
            rkasData: data.payload.rkasData || [],
            taxRecords: data.payload.taxRecords || [],
            bppItems: data.payload.bppItems || [],
            rekapItems: data.payload.rekapItems || [],
            settings: data.payload.settings,
            selectedPeriode: data.payload.selectedPeriode,
          },
        };

        resolve(backupPackage);
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal memproses berkas cadangan JSON.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Terjadi kesalahan saat membaca berkas cadangan.'));
    };

    reader.readAsText(file);
  });
}
