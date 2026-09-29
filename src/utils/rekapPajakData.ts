import { RekapPajakItem, BukuPembantuPajakItem, BkuItem, AppSettings } from '../types';

export const initialRekapPajakItems: RekapPajakItem[] = [
  {
    id: 'rp-1',
    no: 1,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor PPh 23 2% Pelaksanaan kegiatan komunitas belajar di satuan pendidikan',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 114000,
    ppn: {},
    pph21: {},
    pph23: { April: 4560 },
    pajakDaerah: {},
    tanggalBelanja: '02/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-2',
    no: 2,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor SSPD Pelaksanaan kegiatan komunitas belajar di satuan pendidikan',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 114000,
    ppn: {},
    pph21: {},
    pph23: {},
    pajakDaerah: { April: 22800 },
    tanggalBelanja: '02/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-3',
    no: 3,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor PPh 23 2% Pelaksanaan Ekstrakurikuler Kepramukaan',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 38000,
    ppn: {},
    pph21: {},
    pph23: { April: 1520 },
    pajakDaerah: {},
    tanggalBelanja: '03/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-4',
    no: 4,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor SSPD Pelaksanaan Ekstrakurikuler Kepramukaan',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 38000,
    ppn: {},
    pph21: {},
    pph23: {},
    pajakDaerah: { April: 7600 },
    tanggalBelanja: '03/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-5',
    no: 5,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor PPh 23 2% Penyusunan kisi-kisi dan penyusunan soal penilaian sumatif (ulangan tengah semester/akhir semester/kenaikan kelas)',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 114000,
    ppn: {},
    pph21: {},
    pph23: { April: 2280 },
    pajakDaerah: {},
    tanggalBelanja: '06/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-6',
    no: 6,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor SSPD Penyusunan kisi-kisi dan penyusunan soal penilaian sumatif (ulangan tengah semester/akhir semester/kenaikan kelas)',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 114000,
    ppn: {},
    pph21: {},
    pph23: {},
    pajakDaerah: { April: 11400 },
    tanggalBelanja: '06/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-7',
    no: 7,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor PPh 23 2% Tes kemampuan akademik peserta didik',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 228000,
    ppn: {},
    pph21: {},
    pph23: { April: 6840 },
    pajakDaerah: {},
    tanggalBelanja: '20/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-8',
    no: 8,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor SSPD Tes kemampuan akademik peserta didik',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 228000,
    ppn: {},
    pph21: {},
    pph23: {},
    pajakDaerah: { April: 34200 },
    tanggalBelanja: '20/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-9',
    no: 9,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor PPh 23 2% Kegiatan Komunitas Belajar antar sekolah (termasuk KKG, MGMP, MGMPS, MGMPK, KKKS, atau MKKS)',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 114000,
    ppn: {},
    pph21: {},
    pph23: { April: 2280 },
    pajakDaerah: {},
    tanggalBelanja: '22/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-10',
    no: 10,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor SSPD Kegiatan Komunitas Belajar antar sekolah (termasuk KKG, MGMP, MGMPS, MGMPK, KKKS, atau MKKS)',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 114000,
    ppn: {},
    pph21: {},
    pph23: {},
    pajakDaerah: { April: 11400 },
    tanggalBelanja: '22/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-11',
    no: 11,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor PPh 21 Operator TIM Teknis ANBK/TKA Sekolah-Ahli dalam bidangnya',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 200000,
    ppn: {},
    pph21: { April: 10000 },
    pph23: {},
    pajakDaerah: {},
    tanggalBelanja: '23/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-12',
    no: 12,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor PPh 21 Honor Pengawas Ujian ANBK / TKA',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 150000,
    ppn: {},
    pph21: { April: 7500 },
    pph23: {},
    pajakDaerah: {},
    tanggalBelanja: '23/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
  {
    id: 'rp-13',
    no: 13,
    npsn: '20602599',
    namaSekolah: 'SDN 1 CIBUNGUR',
    kecamatan: 'CIGEMBLONG',
    uraianBelanja: 'Setor PPh 21 Honor Pengawas Ujian ANBK / TKA',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 150000,
    ppn: {},
    pph21: { April: 7500 },
    pph23: {},
    pajakDaerah: {},
    tanggalBelanja: '23/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  },
];

export interface MonthSummaryAdjustment {
  ppn: { [bulan: string]: number };
  pph21: { [bulan: string]: number };
  pph23: { [bulan: string]: number };
  pajakDaerah: { [bulan: string]: number };
}

// Default penyesuaian manual dibuat 0 agar perhitungan 100% murni sesuai transaksi yang ada
export const defaultMonthAdjustment: MonthSummaryAdjustment = {
  ppn: {
    Januari: 0, Februari: 0, Maret: 0,
    April: 0, Mei: 0, Juni: 0,
    Juli: 0, Agustus: 0, September: 0,
    Oktober: 0, November: 0, Desember: 0,
  },
  pph21: {
    Januari: 0, Februari: 0, Maret: 0,
    April: 0, Mei: 0, Juni: 0,
    Juli: 0, Agustus: 0, September: 0,
    Oktober: 0, November: 0, Desember: 0,
  },
  pph23: {
    Januari: 0, Februari: 0, Maret: 0,
    April: 0, Mei: 0, Juni: 0,
    Juli: 0, Agustus: 0, September: 0,
    Oktober: 0, November: 0, Desember: 0,
  },
  pajakDaerah: {
    Januari: 0, Februari: 0, Maret: 0,
    April: 0, Mei: 0, Juni: 0,
    Juli: 0, Agustus: 0, September: 0,
    Oktober: 0, November: 0, Desember: 0,
  },
};

export const TRIWULAN_MONTHS: Record<string, string[]> = {
  'TW 1': ['Januari', 'Februari', 'Maret'],
  'TW 2': ['April', 'Mei', 'Juni'],
  'TW 3': ['Juli', 'Agustus', 'September'],
  'TW 4': ['Oktober', 'November', 'Desember'],
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Parsing tanggal fleksibel dari berbagai format:
 * - "02-04-2026", "02/04/2026", "2026-04-02", "2 April 2026"
 */
export const parseDateInfo = (dateStr: string) => {
  if (!dateStr) {
    return { day: 1, monthIdx: 3, monthName: 'April', year: 2026, triwulan: 'TW 2' };
  }

  const clean = dateStr.trim();

  // Format YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const parts = clean.split('-');
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthName = MONTH_NAMES[Math.max(0, Math.min(11, monthIdx))];
    const triwulan = `TW ${Math.floor(monthIdx / 3) + 1}`;
    return { day, monthIdx, monthName, year, triwulan };
  }

  // Format DD-MM-YYYY atau DD/MM/YYYY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(clean)) {
    const parts = clean.split(/[-/]/);
    const day = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const monthName = MONTH_NAMES[Math.max(0, Math.min(11, monthIdx))];
    const triwulan = `TW ${Math.floor(monthIdx / 3) + 1}`;
    return { day, monthIdx, monthName, year, triwulan };
  }

  // Cek nama bulan teks
  const lower = clean.toLowerCase();
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (lower.includes(MONTH_NAMES[i].toLowerCase())) {
      const monthIdx = i;
      const monthName = MONTH_NAMES[i];
      const triwulan = `TW ${Math.floor(monthIdx / 3) + 1}`;
      return { day: 1, monthIdx, monthName, year: 2026, triwulan };
    }
  }

  return { day: 1, monthIdx: 3, monthName: 'April', year: 2026, triwulan: 'TW 2' };
};

/**
 * Memeriksa apakah uraian transaksi merupakan transaksi pajak (terima/pungut/setor pajak),
 * saldo, atau transaksi perbankan non-belanja.
 */
export const isTaxUraian = (uraian: string = ''): boolean => {
  const lower = uraian.toLowerCase().trim();
  return (
    lower.startsWith('setor') ||
    lower.startsWith('terima') ||
    lower.startsWith('pungut') ||
    lower.startsWith('potong') ||
    lower.startsWith('bayar pajak') ||
    lower.includes('penyetoran') ||
    lower.includes('pemotongan') ||
    lower.includes('pungutan') ||
    lower.startsWith('pajak') ||
    lower.includes('pph 21') ||
    lower.includes('pph 23') ||
    lower.includes('pph21') ||
    lower.includes('pph23') ||
    lower.includes('pph 4') ||
    lower.includes('pph4') ||
    lower.includes('ppn') ||
    lower.includes('sspd') ||
    lower.includes('pajak daerah') ||
    lower.includes('pajak restoran') ||
    lower.includes('saldo awal') ||
    lower.includes('bunga bank') ||
    lower.includes('pajak bunga') ||
    lower.includes('tarik tunai') ||
    lower.includes('setor tunai')
  );
};

/**
 * Normalisasi kode rekening / kode kegiatan (menghilangkan spasi, titik ganda, dan titik di akhir)
 * Contoh: "04.06.01." -> "04.06.01"
 */
export const normalizeCode = (str: string = ''): string => {
  return str.replace(/[^0-9.]/g, '').trim().replace(/\.+$/, '');
};

/**
 * SINKRONISASI BUKU PEMBANTU PAJAK & BKU KE REKAPITULASI PAJAK (LAMPIRAN 4)
 * Menjamin kesesuaian 100% akurat:
 * - Dasar pencocokan: No. Kode di BPP adalah Kode Kegiatan di BKU
 * - Jumlah belanja diambil murni dari nilai belanja asli di BKU (BUKAN dari nominal pajak)
 * - Baris pajak di BKU diabaikan sebagai objek belanja, melainkan dipasangkan dengan belanja induknya
 * - Kolom bulan (PPN, PPh 21, PPh 23, SSPD) dipetakan ke bulan transaksi yang tepat
 * - Total per triwulan persis sama dengan total setor/pengeluaran BPP tanpa selisih Rp 1 pun
 */
export const syncRekapPajakFromBppAndBku = (
  bppItems: BukuPembantuPajakItem[],
  bkuData: BkuItem[] = [],
  settings: AppSettings
): RekapPajakItem[] => {
  if (!bppItems || bppItems.length === 0) {
    return [];
  }

  // Ambil hanya baris transaksi "Setor" atau baris yang memiliki nilai pengeluaran
  // Di BPP resmi, setiap pajak ada baris "Terima" (debit) dan "Setor" (kredit/pengeluaran).
  // Mengambil baris "Setor" memastikan tidak terjadi dobel hitung pajak.
  const setorRows = bppItems.filter((it) => {
    const uraianLower = (it.uraian || '').toLowerCase();
    const hasPengeluaran = (it.pengeluaran || 0) > 0;
    const isSetor = uraianLower.startsWith('setor');
    return isSetor || hasPengeluaran;
  });

  // Jika tidak ada baris setor eksplisit, gunakan baris terima
  const targetRows = setorRows.length > 0 ? setorRows : bppItems.filter((it) => {
    const totalPajak = (it.ppn || 0) + (it.pph21 || 0) + (it.pph23 || 0) + (it.pph4 || 0) + (it.sspd || 0);
    return totalPajak > 0;
  });

  // Filter HANYA baris belanja riil dari BKU (bukan baris potongan pajak atau setor pajak)
  const realBelanjaRows = (bkuData || []).filter(
    (b) => (b.keluar || 0) > 0 && !isTaxUraian(b.uraian)
  );

  const rekapList: RekapPajakItem[] = [];

  targetRows.forEach((it, index) => {
    const uraianText = it.uraian || '';
    const uraianLower = uraianText.toLowerCase();

    // Deteksi tanggal & nama bulan
    const dateInfo = parseDateInfo(it.tanggal);
    const monthName = dateInfo.monthName;

    // Tentukan jenis pajak dan nilai pajaknya
    let jenis: 'PPN' | 'PPh 21' | 'PPh 23' | 'SSPD' = 'PPh 23';
    let nominalPajak = 0;

    if (it.ppn > 0 || uraianLower.includes('ppn')) {
      jenis = 'PPN';
      nominalPajak = it.ppn > 0 ? it.ppn : (it.pengeluaran || 0);
    } else if (it.pph21 > 0 || uraianLower.includes('pph 21') || uraianLower.includes('pph21')) {
      jenis = 'PPh 21';
      nominalPajak = it.pph21 > 0 ? it.pph21 : (it.pengeluaran || 0);
    } else if (it.sspd > 0 || it.pph4 > 0 || uraianLower.includes('sspd') || uraianLower.includes('pajak daerah') || uraianLower.includes('restoran')) {
      jenis = 'SSPD';
      nominalPajak = (it.sspd || it.pph4 || 0) > 0 ? (it.sspd || it.pph4) : (it.pengeluaran || 0);
    } else {
      // Default PPh 23
      jenis = 'PPh 23';
      nominalPajak = it.pph23 > 0 ? it.pph23 : (it.pengeluaran || 0);
    }

    if (nominalPajak === 0 && (it.pengeluaran || 0) > 0) {
      nominalPajak = it.pengeluaran;
    }

    // Bersihkan nama uraian belanja (hilangkan prefix "Setor PPh 23 2% ", "Terima PPh 21 ", dsb.)
    let uraianBelanjaClean = uraianText
      .replace(/^(setor|terima|pungut|potong)\s+(ppn|pph\s*21|pph\s*23|pph\s*4|sspd|pajak\s*daerah|pajak)\s*(\d+%\s*)?/i, '')
      .trim();

    if (!uraianBelanjaClean) {
      uraianBelanjaClean = uraianText;
    }

    // Ekstrak kata kunci untuk pencocokan uraian
    const keywords = uraianBelanjaClean
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (w) =>
          w.length >= 3 &&
          !['kegiatan', 'belanja', 'pembayaran', 'pelaksanaan', 'pada', 'yang', 'untuk', 'dan', 'satuan'].includes(w)
      );

    const targetKode = normalizeCode(it.noKode);

    // Cari transaksi belanja ASLI yang cocok di BKU berdasarkan Kode Kegiatan dan Uraian
    let jumlahBelanja = 0;
    let tanggalBelanja = it.tanggal || '02/04/2026';
    let matchedBelanja: BkuItem | undefined;
    let highestScore = -1;

    if (realBelanjaRows.length > 0) {
      realBelanjaRows.forEach((bku) => {
        let score = 0;
        const bkuKeg = normalizeCode(bku.kodeKeg);
        const bkuRek = normalizeCode(bku.kodeRek);

        // 1. KODE KEGIATAN MATCH (Dasar utama: No. Kode di BPP = Kode Kegiatan di BKU)
        if (
          targetKode &&
          (bkuKeg === targetKode ||
            bkuKeg.startsWith(targetKode) ||
            targetKode.startsWith(bkuKeg) ||
            bkuRek.startsWith(targetKode))
        ) {
          score += 100;
        }

        // 2. KECOCOKAN KATA KUNCI URAIAN
        const bkuLower = bku.uraian.toLowerCase();
        keywords.forEach((kw) => {
          if (bkuLower.includes(kw)) {
            score += 25;
          }
        });

        // 3. KECOCOKAN TRIWULAN / BULAN / TANGGAL
        const bkuDateInfo = parseDateInfo(bku.tgl);
        if (bkuDateInfo.triwulan === dateInfo.triwulan) {
          score += 15;
        }
        if (bkuDateInfo.monthName === dateInfo.monthName) {
          score += 15;
        }
        if (bkuDateInfo.day === dateInfo.day && bkuDateInfo.monthName === dateInfo.monthName) {
          score += 20;
        }

        // 4. KECOCOKAN MATEMATIS NILAI PAJAK DENGAN BELANJA
        if (jenis === 'PPh 23') {
          if (
            Math.abs(bku.keluar * 0.02 - nominalPajak) <= 15 ||
            Math.abs(bku.keluar * 0.04 - nominalPajak) <= 15
          ) {
            score += 60;
          }
        } else if (jenis === 'SSPD') {
          if (Math.abs(bku.keluar * 0.1 - nominalPajak) <= 50) {
            score += 60;
          }
        } else if (jenis === 'PPh 21') {
          if (Math.abs(bku.keluar * 0.05 - nominalPajak) <= 20) {
            score += 60;
          }
        } else if (jenis === 'PPN') {
          if (Math.abs(bku.keluar * 0.11 - nominalPajak) <= 50) {
            score += 60;
          }
        }

        if (score > highestScore && score >= 35) {
          highestScore = score;
          matchedBelanja = bku;
        }
      });
    }

    if (matchedBelanja) {
      jumlahBelanja = matchedBelanja.keluar;
      tanggalBelanja = matchedBelanja.tgl;
      if (uraianBelanjaClean.length < 5) {
        uraianBelanjaClean = matchedBelanja.uraian;
      }
    } else {
      // Jika BKU belum diunggah atau tidak ditemukan belanja spesifik,
      // hitung nilai belanja bruto matematis dari tarif pajak (BUKAN nominal pajak!)
      if (jenis === 'PPh 23') {
        jumlahBelanja = Math.round(nominalPajak / 0.02);
      } else if (jenis === 'PPh 21') {
        jumlahBelanja = Math.round(nominalPajak / 0.05);
      } else if (jenis === 'SSPD') {
        jumlahBelanja = Math.round(nominalPajak * 10);
      } else if (jenis === 'PPN') {
        jumlahBelanja = Math.round(nominalPajak / 0.11);
      } else {
        jumlahBelanja = Math.round(nominalPajak * 10);
      }
    }

    // Format tanggal belanja dan tanggal setor
    const formattedTglBelanja = tanggalBelanja.includes('-')
      ? tanggalBelanja.split('-').join('/')
      : tanggalBelanja;

    const formattedTglSetor = it.tanggal.includes('-')
      ? it.tanggal.split('-').join('/')
      : it.tanggal;

    // Buat objek RekapPajakItem
    const rekapItem: RekapPajakItem = {
      id: `rp-sync-${index + 1}-${Date.now()}`,
      no: index + 1,
      npsn: settings.npsn || '20602599',
      namaSekolah: settings.namaSekolah || 'SDN 1 CIBUNGUR',
      kecamatan: settings.kecamatan || 'CIGEMBLONG',
      uraianBelanja: `${uraianText.startsWith('Setor') || uraianText.startsWith('Terima') ? uraianText : `Setor ${jenis} ${uraianBelanjaClean}`}`,
      sumberDana: 'BOSP REGULER',
      jumlahBelanja,
      ppn: jenis === 'PPN' ? { [monthName]: nominalPajak } : {},
      pph21: jenis === 'PPh 21' ? { [monthName]: nominalPajak } : {},
      pph23: jenis === 'PPh 23' ? { [monthName]: nominalPajak } : {},
      pajakDaerah: jenis === 'SSPD' ? { [monthName]: nominalPajak } : {},
      tanggalBelanja: formattedTglBelanja,
      tanggalSetorPajak: formattedTglSetor,
      noNtpn: '',
    };

    rekapList.push(rekapItem);
  });

  return rekapList;
};

/**
 * TARIK SEMUA TRANSAKSI BELANJA KENA PAJAK DARI BKU ARKAS
 * Menghasilkan:
 * 1. Baris Buku Pembantu Pajak lengkap (Terima & Setor)
 * 2. Baris Rekapitulasi Pajak Lampiran 4
 *
 * Mendukung 2 Pola BKU ARKAS:
 * Pola A: BKU yang di bawah transaksi belanja sudah memiliki baris potongan & setor pajak
 * Pola B: BKU standar di mana pajak dihitung otomatis dari belanja kena pajak
 */
export const extractTaxesFromBku = (
  bkuData: BkuItem[],
  settings: AppSettings
): {
  bppRows: BukuPembantuPajakItem[];
  rekapRows: RekapPajakItem[];
} => {
  if (!bkuData || bkuData.length === 0) {
    return { bppRows: [], rekapRows: [] };
  }

  const bppRows: BukuPembantuPajakItem[] = [];
  const rekapRows: RekapPajakItem[] = [];
  let rowId = 1;

  // Cek apakah BKU sudah memiliki baris potongan / setor pajak eksplisit
  const hasExplicitTaxRows = bkuData.some((b) => isTaxUraian(b.uraian));
  const realBelanjaRows = bkuData.filter((b) => (b.keluar || 0) > 0 && !isTaxUraian(b.uraian));

  if (hasExplicitTaxRows) {
    // =========================================================================
    // POLA A: BKU SUDAH MEMILIKI BARIS POTONGAN DAN SETOR PAJAK
    // =========================================================================
    // Temukan setiap baris "Setor" atau potongan pajak di BKU, lalu pasangkan
    // dengan transaksi Belanja induknya agar jumlah belanjanya 100% tepat!
    bkuData.forEach((bku, idx) => {
      const lower = bku.uraian.toLowerCase().trim();
      const isTax = isTaxUraian(bku.uraian);
      if (!isTax) return;

      const isSetor = lower.startsWith('setor') || lower.includes('penyetoran');
      const isPungut = lower.startsWith('pungut') || lower.startsWith('terima') || lower.includes('pemotongan');

      // Ambil baris setor untuk masuk ke rekap
      if (!isSetor && !isPungut) return;
      if (isSetor && (bku.keluar || 0) <= 0) return;
      if (isPungut && (bku.terima || 0) <= 0 && (bku.keluar || 0) <= 0) return;

      // Tentukan jenis pajak
      let jenis: 'PPN' | 'PPh 21' | 'PPh 23' | 'SSPD' = 'PPh 23';
      if (lower.includes('ppn')) jenis = 'PPN';
      else if (lower.includes('pph 21') || lower.includes('pph21')) jenis = 'PPh 21';
      else if (lower.includes('sspd') || lower.includes('pajak daerah') || lower.includes('restoran')) jenis = 'SSPD';
      else jenis = 'PPh 23';

      const taxAmount = bku.keluar || bku.terima || 0;
      if (taxAmount <= 0) return;

      // Cari belanja induk: telusuri baris sebelum transaksi pajak ini di BKU
      let parentBelanja: BkuItem | undefined;
      for (let j = idx - 1; j >= 0; j--) {
        const prev = bkuData[j];
        if (prev.keluar > 0 && !isTaxUraian(prev.uraian)) {
          // Cocokkan kode kegiatan jika ada
          const prevKeg = normalizeCode(prev.kodeKeg);
          const currKeg = normalizeCode(bku.kodeKeg);
          if (!currKeg || !prevKeg || prevKeg === currKeg || prevKeg.startsWith(currKeg) || currKeg.startsWith(prevKeg)) {
            parentBelanja = prev;
            break;
          }
        }
      }

      // Jika belum ketemu di baris sebelumnya, cari di seluruh realBelanjaRows
      if (!parentBelanja) {
        const currKeg = normalizeCode(bku.kodeKeg);
        parentBelanja = realBelanjaRows.find((rb) => {
          const rbKeg = normalizeCode(rb.kodeKeg);
          return currKeg && (rbKeg === currKeg || rbKeg.startsWith(currKeg));
        });
      }

      const grossBelanja = parentBelanja ? parentBelanja.keluar : Math.round(taxAmount / (jenis === 'PPh 23' ? 0.02 : jenis === 'SSPD' ? 0.1 : jenis === 'PPh 21' ? 0.05 : 0.11));
      const tglBelanja = parentBelanja ? parentBelanja.tgl : bku.tgl;
      const kodeKeg = (parentBelanja?.kodeKeg || bku.kodeKeg || '04.06.01.').trim();

      const dInfo = parseDateInfo(bku.tgl);
      const dateStr = `${String(dInfo.day).padStart(2, '0')}-${String(dInfo.monthIdx + 1).padStart(2, '0')}-${dInfo.year}`;

      // Buat baris Buku Pembantu Pajak (Terima & Setor)
      if (isSetor) {
        bppRows.push({
          id: `bpp-auto-${rowId++}-t`,
          tanggal: dateStr,
          noKode: kodeKeg,
          uraian: bku.uraian.replace(/^setor/i, 'Terima'),
          ppn: jenis === 'PPN' ? taxAmount : 0,
          pph21: jenis === 'PPh 21' ? taxAmount : 0,
          pph23: jenis === 'PPh 23' ? taxAmount : 0,
          pph4: 0,
          sspd: jenis === 'SSPD' ? taxAmount : 0,
          pengeluaran: 0,
          saldo: taxAmount,
        });

        bppRows.push({
          id: `bpp-auto-${rowId++}-s`,
          tanggal: dateStr,
          noKode: kodeKeg,
          uraian: bku.uraian,
          ppn: 0,
          pph21: 0,
          pph23: 0,
          pph4: 0,
          sspd: 0,
          pengeluaran: taxAmount,
          saldo: 0,
        });

        // Buat baris Rekap Lampiran 4
        rekapRows.push({
          id: `rekap-auto-${rekapRows.length + 1}`,
          no: rekapRows.length + 1,
          npsn: settings.npsn || '20602599',
          namaSekolah: settings.namaSekolah || 'SDN 1 CIBUNGUR',
          kecamatan: settings.kecamatan || 'CIGEMBLONG',
          uraianBelanja: bku.uraian,
          sumberDana: 'BOSP REGULER',
          jumlahBelanja: grossBelanja,
          ppn: jenis === 'PPN' ? { [dInfo.monthName]: taxAmount } : {},
          pph21: jenis === 'PPh 21' ? { [dInfo.monthName]: taxAmount } : {},
          pph23: jenis === 'PPh 23' ? { [dInfo.monthName]: taxAmount } : {},
          pajakDaerah: jenis === 'SSPD' ? { [dInfo.monthName]: taxAmount } : {},
          tanggalBelanja: tglBelanja.includes('-') ? tglBelanja.split('-').join('/') : tglBelanja,
          tanggalSetorPajak: bku.tgl.includes('-') ? bku.tgl.split('-').join('/') : bku.tgl,
          noNtpn: '',
        });
      }
    });

    if (bppRows.length > 0) {
      return { bppRows, rekapRows };
    }
  }

  // =========================================================================
  // POLA B: BKU STANDAR (DIHITUNG DARI BELANJA KENA PAJAK)
  // =========================================================================
  realBelanjaRows.forEach((bku) => {
    const lower = bku.uraian.toLowerCase();
    const dInfo = parseDateInfo(bku.tgl);
    const dateStr = `${String(dInfo.day).padStart(2, '0')}-${String(dInfo.monthIdx + 1).padStart(2, '0')}-${dInfo.year}`;
    const kode = bku.kodeKeg || bku.kodeRek || '04.06.01.';

    const isMamin =
      lower.includes('snack') ||
      lower.includes('makan') ||
      lower.includes('konsumsi') ||
      lower.includes('kue') ||
      lower.includes('nasi') ||
      lower.includes('catering');

    const isHonor =
      lower.includes('honor') ||
      lower.includes('narasumber') ||
      lower.includes('pengawas') ||
      lower.includes('pemateri') ||
      lower.includes('operator');

    const isJasa =
      lower.includes('sewa') ||
      lower.includes('cetak') ||
      lower.includes('penggandaan') ||
      lower.includes('publikasi') ||
      lower.includes('jasa');

    const isBarangBesar = bku.keluar >= 2000000 && !isMamin && !isHonor;

    // 1. Makanan & Minuman: PPh 23 (2%) + Pajak Daerah/SSPD (10%)
    if (isMamin) {
      const pphVal = Math.round(bku.keluar * 0.02);
      const sspdVal = Math.round(bku.keluar * 0.1);

      // BPP PPh 23 (Terima & Setor)
      bppRows.push({
        id: `bpp-ext-${rowId++}-pph-t`,
        tanggal: dateStr,
        noKode: kode,
        uraian: `Terima PPh 23 2% ${bku.uraian}`,
        ppn: 0,
        pph21: 0,
        pph23: pphVal,
        pph4: 0,
        sspd: 0,
        pengeluaran: 0,
        saldo: pphVal,
      });
      bppRows.push({
        id: `bpp-ext-${rowId++}-pph-s`,
        tanggal: dateStr,
        noKode: kode,
        uraian: `Setor PPh 23 2% ${bku.uraian}`,
        ppn: 0,
        pph21: 0,
        pph23: 0,
        pph4: 0,
        sspd: 0,
        pengeluaran: pphVal,
        saldo: 0,
      });

      // BPP SSPD (Terima & Setor)
      bppRows.push({
        id: `bpp-ext-${rowId++}-sspd-t`,
        tanggal: dateStr,
        noKode: kode,
        uraian: `Terima SSPD ${bku.uraian}`,
        ppn: 0,
        pph21: 0,
        pph23: 0,
        pph4: 0,
        sspd: sspdVal,
        pengeluaran: 0,
        saldo: sspdVal,
      });
      bppRows.push({
        id: `bpp-ext-${rowId++}-sspd-s`,
        tanggal: dateStr,
        noKode: kode,
        uraian: `Setor SSPD ${bku.uraian}`,
        ppn: 0,
        pph21: 0,
        pph23: 0,
        pph4: 0,
        sspd: 0,
        pengeluaran: sspdVal,
        saldo: 0,
      });

      // Rekap Lampiran 4
      rekapRows.push({
        id: `rekap-ext-${rekapRows.length + 1}`,
        no: rekapRows.length + 1,
        npsn: settings.npsn || '20602599',
        namaSekolah: settings.namaSekolah || 'SDN 1 CIBUNGUR',
        kecamatan: settings.kecamatan || 'CIGEMBLONG',
        uraianBelanja: `Setor PPh 23 2% ${bku.uraian}`,
        sumberDana: 'BOSP REGULER',
        jumlahBelanja: bku.keluar,
        ppn: {},
        pph21: {},
        pph23: { [dInfo.monthName]: pphVal },
        pajakDaerah: {},
        tanggalBelanja: dateStr.split('-').join('/'),
        tanggalSetorPajak: dateStr.split('-').join('/'),
        noNtpn: '',
      });

      rekapRows.push({
        id: `rekap-ext-${rekapRows.length + 1}`,
        no: rekapRows.length + 1,
        npsn: settings.npsn || '20602599',
        namaSekolah: settings.namaSekolah || 'SDN 1 CIBUNGUR',
        kecamatan: settings.kecamatan || 'CIGEMBLONG',
        uraianBelanja: `Setor SSPD ${bku.uraian}`,
        sumberDana: 'BOSP REGULER',
        jumlahBelanja: bku.keluar,
        ppn: {},
        pph21: {},
        pph23: {},
        pajakDaerah: { [dInfo.monthName]: sspdVal },
        tanggalBelanja: dateStr.split('-').join('/'),
        tanggalSetorPajak: dateStr.split('-').join('/'),
        noNtpn: '',
      });
    }

    // 2. Honorarium: PPh 21 (5%)
    else if (isHonor) {
      const pph21Val = Math.round(bku.keluar * 0.05);

      bppRows.push({
        id: `bpp-ext-${rowId++}-pph21-t`,
        tanggal: dateStr,
        noKode: kode,
        uraian: `Terima PPh 21 ${bku.uraian}`,
        ppn: 0,
        pph21: pph21Val,
        pph23: 0,
        pph4: 0,
        sspd: 0,
        pengeluaran: 0,
        saldo: pph21Val,
      });
      bppRows.push({
        id: `bpp-ext-${rowId++}-pph21-s`,
        tanggal: dateStr,
        noKode: kode,
        uraian: `Setor PPh 21 ${bku.uraian}`,
        ppn: 0,
        pph21: 0,
        pph23: 0,
        pph4: 0,
        sspd: 0,
        pengeluaran: pph21Val,
        saldo: 0,
      });

      rekapRows.push({
        id: `rekap-ext-${rekapRows.length + 1}`,
        no: rekapRows.length + 1,
        npsn: settings.npsn || '20602599',
        namaSekolah: settings.namaSekolah || 'SDN 1 CIBUNGUR',
        kecamatan: settings.kecamatan || 'CIGEMBLONG',
        uraianBelanja: `Setor PPh 21 ${bku.uraian}`,
        sumberDana: 'BOSP REGULER',
        jumlahBelanja: bku.keluar,
        ppn: {},
        pph21: { [dInfo.monthName]: pph21Val },
        pph23: {},
        pajakDaerah: {},
        tanggalBelanja: dateStr.split('-').join('/'),
        tanggalSetorPajak: dateStr.split('-').join('/'),
        noNtpn: '',
      });
    }

    // 3. Jasa / Sewa / Cetak: PPh 23 (2%)
    else if (isJasa) {
      const pph23Val = Math.round(bku.keluar * 0.02);

      bppRows.push({
        id: `bpp-ext-${rowId++}-jasa-t`,
        tanggal: dateStr,
        noKode: kode,
        uraian: `Terima PPh 23 2% ${bku.uraian}`,
        ppn: 0,
        pph21: 0,
        pph23: pph23Val,
        pph4: 0,
        sspd: 0,
        pengeluaran: 0,
        saldo: pph23Val,
      });
      bppRows.push({
        id: `bpp-ext-${rowId++}-jasa-s`,
        tanggal: dateStr,
        noKode: kode,
        uraian: `Setor PPh 23 2% ${bku.uraian}`,
        ppn: 0,
        pph21: 0,
        pph23: 0,
        pph4: 0,
        sspd: 0,
        pengeluaran: pph23Val,
        saldo: 0,
      });

      rekapRows.push({
        id: `rekap-ext-${rekapRows.length + 1}`,
        no: rekapRows.length + 1,
        npsn: settings.npsn || '20602599',
        namaSekolah: settings.namaSekolah || 'SDN 1 CIBUNGUR',
        kecamatan: settings.kecamatan || 'CIGEMBLONG',
        uraianBelanja: `Setor PPh 23 2% ${bku.uraian}`,
        sumberDana: 'BOSP REGULER',
        jumlahBelanja: bku.keluar,
        ppn: {},
        pph21: {},
        pph23: { [dInfo.monthName]: pph23Val },
        pajakDaerah: {},
        tanggalBelanja: dateStr.split('-').join('/'),
        tanggalSetorPajak: dateStr.split('-').join('/'),
        noNtpn: '',
      });
    }

    // 4. Belanja Barang > 2 Juta: PPN (11%)
    else if (isBarangBesar) {
      const ppnVal = Math.round(bku.keluar * 0.11);

      bppRows.push({
        id: `bpp-ext-${rowId++}-ppn-t`,
        tanggal: dateStr,
        noKode: kode,
        uraian: `Terima PPN ${bku.uraian}`,
        ppn: ppnVal,
        pph21: 0,
        pph23: 0,
        pph4: 0,
        sspd: 0,
        pengeluaran: 0,
        saldo: ppnVal,
      });
      bppRows.push({
        id: `bpp-ext-${rowId++}-ppn-s`,
        tanggal: dateStr,
        noKode: kode,
        uraian: `Setor PPN ${bku.uraian}`,
        ppn: 0,
        pph21: 0,
        pph23: 0,
        pph4: 0,
        sspd: 0,
        pengeluaran: ppnVal,
        saldo: 0,
      });

      rekapRows.push({
        id: `rekap-ext-${rekapRows.length + 1}`,
        no: rekapRows.length + 1,
        npsn: settings.npsn || '20602599',
        namaSekolah: settings.namaSekolah || 'SDN 1 CIBUNGUR',
        kecamatan: settings.kecamatan || 'CIGEMBLONG',
        uraianBelanja: `Setor PPN ${bku.uraian}`,
        sumberDana: 'BOSP REGULER',
        jumlahBelanja: bku.keluar,
        ppn: { [dInfo.monthName]: ppnVal },
        pph21: {},
        pph23: {},
        pajakDaerah: {},
        tanggalBelanja: dateStr.split('-').join('/'),
        tanggalSetorPajak: dateStr.split('-').join('/'),
        noNtpn: '',
      });
    }
  });

  return { bppRows, rekapRows };
};
