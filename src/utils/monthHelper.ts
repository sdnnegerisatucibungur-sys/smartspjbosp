import { BkuItem, RkasItem } from '../types';

export const DAFTAR_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export type NamaBulan = typeof DAFTAR_BULAN[number];

/**
 * Mendapatkan indeks bulan 1..12 berdasarkan nama bulan
 */
export function getMonthIndex(monthName: string): number {
  const clean = (monthName || '').trim().toLowerCase();
  const idx = DAFTAR_BULAN.findIndex((b) => b.toLowerCase() === clean);
  return idx !== -1 ? idx + 1 : 1;
}

/**
 * Mendapatkan nama bulan dari indeks 1..12
 */
export function getMonthNameFromIndex(index: number): NamaBulan {
  const safeIdx = Math.max(1, Math.min(12, Math.round(index))) - 1;
  return DAFTAR_BULAN[safeIdx];
}

/**
 * Mendeteksi nama bulan dari string tanggal transaksi (misal: "2026-01-15", "15/01/2026", "15-01-2026", "15 Januari 2026")
 */
export function getMonthNameFromDate(dateStr: string | undefined): NamaBulan | null {
  if (!dateStr) return null;
  const s = String(dateStr).trim().toLowerCase();

  // 1. Cek langsung nama bulan bahasa Indonesia
  for (let i = 0; i < DAFTAR_BULAN.length; i++) {
    if (s.includes(DAFTAR_BULAN[i].toLowerCase())) {
      return DAFTAR_BULAN[i];
    }
  }

  // 2. Cek nama bulan bahasa Inggris (singkatan / lengkap)
  const enMonths = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  ];
  for (let i = 0; i < enMonths.length; i++) {
    if (s.includes(enMonths[i])) {
      return DAFTAR_BULAN[i];
    }
  }

  // 3. Format DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, atau YYYY/MM/DD
  const parts = s.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      const m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) return DAFTAR_BULAN[m - 1];
    } else {
      // DD-MM-YYYY
      const m = parseInt(parts[1], 10);
      if (m >= 1 && m <= 12) return DAFTAR_BULAN[m - 1];
    }
  }

  return null;
}

/**
 * Mendapatkan nama bulan dari item BKU (prioritas: field row.bulan -> parsing row.tgl)
 */
export function getBkuItemMonth(item: BkuItem): NamaBulan {
  if (item.bulan && DAFTAR_BULAN.includes(item.bulan as NamaBulan)) {
    return item.bulan as NamaBulan;
  }
  const detected = getMonthNameFromDate(item.tgl);
  if (detected) return detected;
  return 'Januari';
}

/**
 * Menyaring BKU berdasarkan pilihan bulan
 * Jika selectedMonth === 'Semua Bulan', kembalikan semua data
 */
export function filterBkuByMonth(items: BkuItem[], selectedMonth: string): BkuItem[] {
  if (!selectedMonth || selectedMonth === 'Semua Bulan') {
    return items;
  }
  return items.filter((item) => {
    // 1. Jika item memiliki properti bulan eksplisit
    if (item.bulan) {
      return item.bulan.toLowerCase() === selectedMonth.toLowerCase();
    }
    // 2. Deteksi dari tanggal transaksi
    const detected = getMonthNameFromDate(item.tgl);
    if (detected) {
      return detected.toLowerCase() === selectedMonth.toLowerCase();
    }
    // Jika tidak dapat dideteksi sama sekali, tampilkan jika belum ada bulan lain
    return false;
  });
}

/**
 * Menggabungkan data BKU baru untuk bulan tertentu tanpa menghapus data bulan lain
 */
export function mergeBkuMonthly(
  existingItems: BkuItem[],
  incomingItems: BkuItem[],
  targetMonth: string,
  mode: 'replace_month' | 'replace_all' = 'replace_month'
): BkuItem[] {
  const isSingle = Boolean(targetMonth && targetMonth !== 'Semua Bulan');

  // Jika user mengunggah untuk bulan tertentu (misal Februari), seluruh baris transaksi file tersebut
  // milik bulan tersebut (termasuk baris Saldo Bank / Tunai pembuka)
  const stampedIncoming = incomingItems.map((item) => {
    return {
      ...item,
      bulan: isSingle ? targetMonth : (item.bulan || getMonthNameFromDate(item.tgl) || 'Januari'),
    };
  });

  if (mode === 'replace_all' || !isSingle) {
    return stampedIncoming;
  }

  // Ambil data bulan lain yang bukan targetMonth
  const otherMonthsData = existingItems.filter((item) => {
    const m = getBkuItemMonth(item);
    return m.toLowerCase() !== targetMonth.toLowerCase();
  });

  return [...otherMonthsData, ...stampedIncoming];
}

/**
 * Mendeteksi apakah baris BKU merupakan Saldo Awal / Saldo Pindahan dari bulan lalu
 * Contoh: "Saldo Bank Bulan Januari 2026", "Saldo Tunai Bulan Januari 2026", "Saldo Pindahan Bulan Lalu"
 */
export function isSaldoAwalRow(item: { uraian?: string; noBukti?: string }): boolean {
  const u = (item.uraian || '').toLowerCase();
  const b = (item.noBukti || '').toLowerCase();
  return (
    u.includes('saldo bank') ||
    u.includes('saldo tunai') ||
    u.includes('saldo kas') ||
    u.includes('saldo pindahan') ||
    u.includes('saldo awal') ||
    u.startsWith('saldo ') ||
    b.includes('saldo')
  );
}

/**
 * Mendeteksi apakah baris BKU merupakan Tarik Tunai dari Bank ke Kas Tunai
 * (Perpindahan internal antar-kas yang tidak menambah total saldo kas umum)
 */
export function isTarikTunaiRow(item: { uraian?: string; noBukti?: string }): boolean {
  const u = (item.uraian || '').toLowerCase();
  const b = (item.noBukti || '').toLowerCase();
  return (
    u.includes('tarik tunai') ||
    u.includes('penarikan tunai') ||
    u.includes('penarikan dana') ||
    u.includes('pengambilan tunai') ||
    u.includes('tarik bank') ||
    u.includes('tarik dari bank') ||
    b.includes('tarik')
  );
}

/**
 * Normalisasi dan rekonsiliasi saldo BKU per bulan agar sesuai aturan resmi ARKAS BOSP:
 * 1. Menjaga saldo resmi hasil upload Excel (kolom Saldo dari ARKAS).
 * 2. Mencegah Saldo Awal bulan lalu dan Tarik Tunai dihitung ganda sebagai penerimaan baru.
 * 3. Memastikan saldo akhir bulan berkurang sesuai realisasi belanja riil dan penarikan.
 */
export function normalizeBkuMonthlyBalances(items: BkuItem[]): BkuItem[] {
  if (!items || items.length === 0) return [];

  const groupedByMonth = new Map<string, BkuItem[]>();
  items.forEach((item) => {
    const m = getBkuItemMonth(item);
    const list = groupedByMonth.get(m) || [];
    list.push(item);
    groupedByMonth.set(m, list);
  });

  const normalizedAll: BkuItem[] = [];
  let previousMonthClosingSaldo = 0;

  DAFTAR_BULAN.forEach((bln, monthIdx) => {
    const monthRows = groupedByMonth.get(bln);
    if (!monthRows || monthRows.length === 0) return;

    // Cek apakah bulan ini memiliki baris Saldo Awal (Bank / Tunai)
    const openingRows = monthRows.filter((r, idx) => idx < 4 && isSaldoAwalRow(r));
    const hasOpeningRows = openingRows.length > 0;
    const totalOpeningFromRows = openingRows.reduce((acc, r) => acc + (Number(r.terima) || 0), 0);

    // Baseline saldo awal bulan
    let startingSaldo = 0;
    if (hasOpeningRows) {
      startingSaldo = totalOpeningFromRows;
    } else if (monthIdx > 0 && previousMonthClosingSaldo > 0) {
      startingSaldo = previousMonthClosingSaldo;
    } else {
      const firstRow = monthRows[0];
      startingSaldo = Number(firstRow.terima) || Number(firstRow.saldo) || 0;
    }

    let running = startingSaldo;
    let openingProcessed = 0;

    const processedRows = monthRows.map((row, idx) => {
      const terima = Number(row.terima) || 0;
      const keluar = Number(row.keluar) || 0;
      const isAwal = isSaldoAwalRow(row);
      const isTarik = isTarikTunaiRow(row);

      // Jika baris Saldo Awal (Bank atau Tunai): set akumulasi saldo awal
      if (isAwal) {
        openingProcessed += terima;
        running = openingProcessed;
        return {
          ...row,
          saldo: running,
        };
      }

      // Jika baris Tarik Tunai: di BKU Kas Umum saldo total tidak bertambah
      if (isTarik) {
        return {
          ...row,
          saldo: running,
        };
      }

      // Jika baris memiliki saldo resmi dari hasil upload Excel yang valid
      // Pastikan saldo resmi hasil upload Excel dipertahankan apa adanya
      const hasValidRowSaldo =
        row.saldo !== undefined &&
        row.saldo !== null &&
        !isNaN(Number(row.saldo)) &&
        Number(row.saldo) > 0;

      // Cek apakah saldo tidak terkorupsi oleh bug cascade lama
      const isCorruptedCascade =
        hasOpeningRows &&
        hasValidRowSaldo &&
        Number(row.saldo) > startingSaldo + 500000000;

      if (hasValidRowSaldo && !isCorruptedCascade) {
        running = Number(row.saldo);
        return {
          ...row,
          saldo: running,
        };
      }

      // Perhitungan normal: saldo berkurang ketika belanja
      running = running + terima - keluar;
      return {
        ...row,
        saldo: running,
      };
    });

    if (processedRows.length > 0) {
      previousMonthClosingSaldo = processedRows[processedRows.length - 1].saldo || 0;
    }

    normalizedAll.push(...processedRows);
  });

  groupedByMonth.forEach((monthRows, bln) => {
    if (!DAFTAR_BULAN.includes(bln as NamaBulan)) {
      normalizedAll.push(...monthRows);
    }
  });

  return normalizedAll;
}

export function reconcileBkuBalances(items: BkuItem[]): BkuItem[] {
  return normalizeBkuMonthlyBalances(items);
}

/**
 * Mendapatkan Triwulan dan Tahap dari Nama Bulan
 */
export function getTriwulanFromMonth(month: string): { triwulan: string; tahap: string } {
  const idx = getMonthIndex(month);
  if (idx <= 3) {
    return { triwulan: 'Triwulan 1', tahap: 'Tahap 1' };
  } else if (idx <= 6) {
    return { triwulan: 'Triwulan 2', tahap: 'Tahap 1' };
  } else if (idx <= 9) {
    return { triwulan: 'Triwulan 3', tahap: 'Tahap 2' };
  } else {
    return { triwulan: 'Triwulan 4', tahap: 'Tahap 2' };
  }
}

/**
 * Statistik Realisasi 12 Bulan (Januari s.d. Desember)
 */
export interface MonthSummary {
  bulan: NamaBulan;
  bulanIndex: number;
  triwulan: string;
  tahap: string;
  totalTerima: number;
  totalKeluar: number;
  saldoAkhir: number;
  transactionCount: number;
  bpuCount: number;
  hasData: boolean;
}

export interface AnnualRealizationAnalytics {
  totalPaguRkas: number;
  totalRealisasiTahunan: number;
  totalTerimaTahunan: number;
  sisaSaldoKasSaatIni: number;
  sisaPaguRkasSaatIni: number;
  persentaseSerapanTahunan: number;
  bulanSummaries: MonthSummary[];
}

export function computeAnnualRealization(
  rkasData: RkasItem[],
  allBkuData: BkuItem[]
): AnnualRealizationAnalytics {
  // Hitung total pagu dari RKAS (item bukan header)
  const detailRkas = rkasData.filter((r) => !r.isHeader);
  const totalPaguRkas = detailRkas.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);

  let totalRealisasiTahunan = 0;
  let totalTerimaTahunan = 0;
  let latestSaldoKas = 0;

  // Normalisasi seluruh data BKU sekaligus secara kronologis
  const normalizedAll = normalizeBkuMonthlyBalances(allBkuData);

  const bulanSummaries: MonthSummary[] = DAFTAR_BULAN.map((bulan, idx) => {
    const bulanItems = filterBkuByMonth(normalizedAll, bulan);

    // Penerimaan murni BOSP: tidak menghitung saldo awal bulan lalu & tarik tunai
    const realTerima = bulanItems
      .filter((b) => !isSaldoAwalRow(b) && !isTarikTunaiRow(b))
      .reduce((acc, curr) => acc + (Number(curr.terima) || 0), 0);

    // Realisasi belanja murni
    const realKeluar = bulanItems
      .filter((b) => !isTarikTunaiRow(b) && !isSaldoAwalRow(b))
      .reduce((acc, curr) => acc + (Number(curr.keluar) || 0), 0);

    totalRealisasiTahunan += realKeluar;
    totalTerimaTahunan += realTerima;

    // Saldo akhir bulan: diambil persis dari baris terakhir BKU bulan tersebut
    let saldoAkhir = 0;
    if (bulanItems.length > 0) {
      const lastItem = bulanItems[bulanItems.length - 1];
      saldoAkhir = Number(lastItem.saldo) || 0;
      latestSaldoKas = saldoAkhir;
    }

    const uniqueBpu = new Set(
      bulanItems
        .map((b) => b.noBukti?.trim())
        .filter((b) => b && b !== '-' && b.toUpperCase().startsWith('BPU'))
    );

    const { triwulan, tahap } = getTriwulanFromMonth(bulan);

    return {
      bulan,
      bulanIndex: idx + 1,
      triwulan,
      tahap,
      totalTerima: realTerima,
      totalKeluar: realKeluar,
      saldoAkhir,
      transactionCount: bulanItems.length,
      bpuCount: uniqueBpu.size,
      hasData: bulanItems.length > 0,
    };
  });

  const sisaSaldoKasSaatIni = latestSaldoKas;
  const sisaPaguRkasSaatIni = Math.max(0, totalPaguRkas - totalRealisasiTahunan);
  const persentaseSerapanTahunan =
    totalPaguRkas > 0
      ? Math.min(100, Math.round((totalRealisasiTahunan / totalPaguRkas) * 100))
      : 0;

  return {
    totalPaguRkas,
    totalRealisasiTahunan,
    totalTerimaTahunan,
    sisaSaldoKasSaatIni,
    sisaPaguRkasSaatIni,
    persentaseSerapanTahunan,
    bulanSummaries,
  };
}
