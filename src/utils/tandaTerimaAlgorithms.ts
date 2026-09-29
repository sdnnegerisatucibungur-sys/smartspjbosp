import { BkuItem, RkasItem, AppSettings, StandardTandaTerimaDoc, StandardTandaTerimaItem } from '../types';
import { formatTanggalIndo } from './formatters';

export function getBulanTahunFromTanggal(tglStr?: string): string {
  if (!tglStr) return 'JULI 2024';
  const parts = tglStr.split(/[-/]/);
  if (parts.length >= 3) {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    let monthIdx = -1;
    let year = parts[2];
    if (parts[0].length === 4) {
      year = parts[0];
      monthIdx = parseInt(parts[1], 10) - 1;
    } else {
      monthIdx = parseInt(parts[1], 10) - 1;
    }
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${monthNames[monthIdx]} ${year}`;
    }
  }
  return tglStr;
}

/**
 * Find matching ARKAS item for a BKU row using Kode Kegiatan or Uraian
 */
export function findMatchingArkas(
  bkuRow: BkuItem,
  rkasData: RkasItem[] = []
): RkasItem | undefined {
  if (!rkasData || rkasData.length === 0) return undefined;

  // 1. Direct match by Kode Kegiatan (misal: 04.06.02.)
  if (bkuRow.kodeKeg) {
    const cleanKode = bkuRow.kodeKeg.trim().replace(/\.+$/, '');
    const found = rkasData.find((r) => {
      const rKode = (r.kodeProg || '').trim().replace(/\.+$/, '');
      return rKode === cleanKode || rKode.startsWith(cleanKode) || cleanKode.startsWith(rKode);
    });
    if (found) return found;
  }

  // 2. Match by Kode Rekening & Uraian keywords
  const bkuUraianClean = (bkuRow.uraian || '').toLowerCase();
  return rkasData.find((r) => {
    if (bkuRow.kodeRek && r.kodeRek && bkuRow.kodeRek === r.kodeRek) {
      return true;
    }
    const rUraianClean = (r.uraian || '').toLowerCase();
    if (bkuUraianClean && rUraianClean) {
      if (bkuUraianClean.includes(rUraianClean) || rUraianClean.includes(bkuUraianClean)) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Check whether a BKU row belongs to Honor (kode program/kegiatan 07.12. dan seterusnya)
 * Khusus untuk pembayaran Honor GTT dan Tenaga Administrasi.
 */
export function isHonorBkuRow(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  if (!row.noBukti || row.noBukti === '-' || (Number(row.keluar) || 0) <= 0) {
    return false;
  }
  const directKode = (row.kodeKeg || '').trim();
  if (directKode.startsWith('07.12')) {
    return true;
  }
  const matchingRkas = findMatchingArkas(row, rkasData);
  if (matchingRkas && (matchingRkas.kodeProg || '').trim().startsWith('07.12')) {
    return true;
  }
  const uraianLower = (row.uraian || '').toLowerCase();
  if (/honor|honorarium|gtt|ptt|gty|guru\s*honorer|tenaga\s*administrasi/i.test(uraianLower)) {
    return true;
  }
  return false;
}

/**
 * Check whether a BKU row belongs to program 04.06. dan seterusnya
 * (Pengembangan Profesi Pendidik dan Tenaga Kependidikan / Komunitas Belajar / KKG & K3S & MKKS)
 */
export function isKode0406Row(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  if (!row.noBukti || row.noBukti === '-' || (Number(row.keluar) || 0) <= 0) {
    return false;
  }
  const uraianLower = (row.uraian || '').toLowerCase();
  // Abaikan baris pembukuan pajak non-pengeluaran
  if (
    uraianLower.startsWith('terima pph') ||
    uraianLower.startsWith('setor pph') ||
    uraianLower.startsWith('terima sspd') ||
    uraianLower.startsWith('setor sspd')
  ) {
    return false;
  }

  const directKode = (row.kodeKeg || '').trim();
  const matchingRkas = findMatchingArkas(row, rkasData);
  const rkasKode = (matchingRkas?.kodeProg || '').trim();

  const is0406 = directKode.startsWith('04.06') || rkasKode.startsWith('04.06');
  if (!is0406) {
    return false;
  }

  // ALGORITMA UANG HARIAN:
  // Hanya ambil transaksi penerimaan uang harian / transport / perjalanan / uang saku / kegiatan personal.
  // Kecualikan belanja barang/snack/konsumsi/catering toko yang murni pengadaan barang tanpa uang harian personal.
  const isBelanjaBarangToko =
    (row.tokoName && !uraianLower.includes('uang harian') && !uraianLower.includes('transport')) ||
    uraianLower.includes('snack') ||
    uraianLower.includes('makan') ||
    uraianLower.includes('minum') ||
    uraianLower.includes('kue') ||
    uraianLower.includes('catering') ||
    uraianLower.includes('katering') ||
    uraianLower.includes('konsumsi') ||
    uraianLower.includes('atk') ||
    uraianLower.includes('penggandaan') ||
    uraianLower.includes('fotocopy');

  if (isBelanjaBarangToko) {
    const isExplicitUangHarian =
      uraianLower.includes('uang harian') ||
      uraianLower.includes('uang saku') ||
      uraianLower.includes('transport') ||
      uraianLower.includes('perjalanan dinas') ||
      uraianLower.includes('bantuan transport');
    if (!isExplicitUangHarian) {
      return false;
    }
  }

  return true;
}

/**
 * Deteksi baris BKU khusus MKKS (Musyawarah Kerja Kepala Sekolah)
 * Sesuai instruksi: "Untuk MKKS Mengambil dari Kode 04.06.02. Uang harian, Jika tidak ada kode tersebut dalam BKU berati Kosong"
 */
export function isMkksBkuRow(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  if (!isKode0406Row(row, rkasData)) {
    return false;
  }
  const uraianLower = (row.uraian || '').toLowerCase();
  const arkas = findMatchingArkas(row, rkasData);
  const arkasUraian = (arkas?.uraian || '').toLowerCase();
  const directKode = (row.kodeKeg || '').trim();
  const arkasKode = (arkas?.kodeProg || '').trim();

  // Harus ada kode 04.06.02
  const has040602 = directKode.startsWith('04.06.02') || arkasKode.startsWith('04.06.02');
  if (!has040602) {
    return false;
  }

  // Harus spesifik mengandung kata kunci MKKS
  const isMkks =
    uraianLower.includes('mkks') ||
    uraianLower.includes('musyawarah kerja kepala sekolah') ||
    arkasUraian.includes('mkks') ||
    arkasUraian.includes('musyawarah kerja kepala sekolah');

  // Pastikan bukan KKG
  const isExplicitKkg =
    (uraianLower.includes('kkg') || uraianLower.includes('kelompok kerja guru')) &&
    !uraianLower.includes('mkks');

  return isMkks && !isExplicitKkg;
}

/**
 * Deteksi baris BKU khusus K3S (Kelompok Kerja Kepala Sekolah)
 * Sesuai instruksi: "Untuk KKG dan K3S Kodenya sama 04.06.02. Apabila di bku tidak ada kode tersebut berati tidak ada uang harian untuk kegiatan tersebut."
 */
export function isK3sBkuRow(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  if (!isKode0406Row(row, rkasData)) {
    return false;
  }
  // Jika masuk ke MKKS, pisahkan agar tidak terduplikasi
  if (isMkksBkuRow(row, rkasData)) {
    return false;
  }

  const uraianLower = (row.uraian || '').toLowerCase();
  const arkas = findMatchingArkas(row, rkasData);
  const arkasUraian = (arkas?.uraian || '').toLowerCase();
  const directKode = (row.kodeKeg || '').trim();
  const arkasKode = (arkas?.kodeProg || '').trim();

  // Harus ada kode 04.06.02
  const has040602 = directKode.startsWith('04.06.02') || arkasKode.startsWith('04.06.02');
  if (!has040602) {
    return false;
  }

  // Bukan KKG murni
  const isExplicitKkg =
    (uraianLower.includes('kkg') || uraianLower.includes('kelompok kerja guru') || uraianLower.includes('gugus')) &&
    !uraianLower.includes('k3s') &&
    !uraianLower.includes('kkks') &&
    !uraianLower.includes('kepala sekolah');

  if (isExplicitKkg) {
    return false;
  }

  // Indikator kuat K3S / KKKS / Kepala Sekolah
  const isK3s =
    uraianLower.includes('k3s') ||
    uraianLower.includes('kkks') ||
    uraianLower.includes('kepala sekolah') ||
    uraianLower.includes('kepsek') ||
    arkasUraian.includes('k3s') ||
    arkasUraian.includes('kkks') ||
    arkasUraian.includes('kepala sekolah');

  // Jika kode 04.06.02 dan tidak ada indikasi KKG atau MKKS, kategorikan ke K3S
  return isK3s || !uraianLower.includes('kkg');
}

/**
 * Deteksi baris BKU khusus KKG (Kelompok Kerja Guru)
 * Sesuai instruksi: "Untuk KKG dan K3S Kodenya sama 04.06.02. Apabila di bku tidak ada kode tersebut berati tidak ada uang harian untuk kegiatan tersebut."
 */
export function isKkgBkuRow(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  if (!isKode0406Row(row, rkasData)) {
    return false;
  }
  if (isMkksBkuRow(row, rkasData) || isK3sBkuRow(row, rkasData)) {
    return false;
  }

  const uraianLower = (row.uraian || '').toLowerCase();
  const arkas = findMatchingArkas(row, rkasData);
  const arkasUraian = (arkas?.uraian || '').toLowerCase();
  const directKode = (row.kodeKeg || '').trim();
  const arkasKode = (arkas?.kodeProg || '').trim();

  // Kodenya 04.06.02 (atau 04.06.01 untuk kompatibilitas data lama)
  const is040602 =
    directKode.startsWith('04.06.02') ||
    arkasKode.startsWith('04.06.02') ||
    directKode.startsWith('04.06.01') ||
    arkasKode.startsWith('04.06.01');

  if (!is040602) {
    return false;
  }

  const isKkg =
    uraianLower.includes('kkg') ||
    uraianLower.includes('mgmp') ||
    uraianLower.includes('kelompok kerja guru') ||
    uraianLower.includes('gugus') ||
    uraianLower.includes('guru') ||
    uraianLower.includes('pendidik') ||
    uraianLower.includes('komunitas belajar') ||
    uraianLower.includes('kombel') ||
    arkasUraian.includes('kkg') ||
    arkasUraian.includes('mgmp') ||
    arkasUraian.includes('kelompok kerja guru') ||
    arkasUraian.includes('guru') ||
    arkasUraian.includes('komunitas belajar');

  return isKkg;
}

/**
 * Deteksi baris BKU untuk Penerimaan Uang Harian Koordinasi Program Prioritas Pusat (Kode 03.05.01.)
 * Sesuai instruksi: "Menambah Penerimaan Dari kode 03.05.01. Uang Harin Kegiatan koordinasi dan pelaporan untuk mendukung Program Prioritas Pusat (Program Indonesia Pintar, BOSP, Sekolah Penggerak, dll.)"
 */
export function isPrioritasPusatBkuRow(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  if (!row.noBukti || row.noBukti === '-' || (Number(row.keluar) || 0) <= 0) {
    return false;
  }
  const uraianLower = (row.uraian || '').toLowerCase();
  if (/setor|terima\s*(pph|ppn|sspd)/i.test(uraianLower)) {
    return false;
  }

  const directKode = (row.kodeKeg || '').trim();
  const matchingRkas = findMatchingArkas(row, rkasData);
  const rkasKode = (matchingRkas?.kodeProg || '').trim();

  const is030501 = directKode.startsWith('03.05.01') || rkasKode.startsWith('03.05.01');
  const uraianMatch =
    uraianLower.includes('prioritas pusat') ||
    uraianLower.includes('program indonesia pintar') ||
    (uraianLower.includes('pip') && uraianLower.includes('koordinasi')) ||
    uraianLower.includes('sekolah penggerak') ||
    uraianLower.includes('03.05.01');

  if (!is030501 && !uraianMatch) {
    return false;
  }

  // Kecualikan belanja barang murni toko tanpa uang harian
  const isBelanjaBarangToko =
    row.tokoName && !uraianLower.includes('uang harian') && !uraianLower.includes('transport');
  if (isBelanjaBarangToko) {
    return false;
  }

  return true;
}

/**
 * Deteksi baris BKU untuk Penerimaan Uang Harian Validasi (Kode 07.05.04.)
 * Sesuai instruksi: "tambah 1 Penerimaan yaitu Validasi nanti mengambil datanya dari kode 07.05.04."
 */
export function isValidasiBkuRow(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  if (!row.noBukti || row.noBukti === '-' || (Number(row.keluar) || 0) <= 0) {
    return false;
  }
  const uraianLower = (row.uraian || '').toLowerCase();
  if (/setor|terima\s*(pph|ppn|sspd)/i.test(uraianLower)) {
    return false;
  }

  const directKode = (row.kodeKeg || '').trim();
  const matchingRkas = findMatchingArkas(row, rkasData);
  const rkasKode = (matchingRkas?.kodeProg || '').trim();

  const is070504 = directKode.startsWith('07.05.04') || rkasKode.startsWith('07.05.04');
  const uraianMatch =
    (uraianLower.includes('validasi') && (uraianLower.includes('data') || uraianLower.includes('dapodik') || uraianLower.includes('pokok'))) ||
    uraianLower.includes('07.05.04');

  if (!is070504 && !uraianMatch) {
    return false;
  }

  const isBelanjaBarangToko =
    row.tokoName && !uraianLower.includes('uang harian') && !uraianLower.includes('transport');
  if (isBelanjaBarangToko) {
    return false;
  }

  return true;
}

/**
 * Helper mencari kode kegiatan dari RKAS yang sesuai untuk Pelaksanaan Lomba.
 * Sesuai instruksi: "Untuk lomba kodenya 03.03.19."
 */
export function resolveLombaKodeKeg(row?: BkuItem, rkasData: RkasItem[] = []): string {
  if (row?.kodeKeg && (row.kodeKeg.trim().startsWith('03.03.19') || row.kodeKeg.trim().startsWith('03.03.21'))) {
    return row.kodeKeg.trim().startsWith('03.03.19') ? row.kodeKeg.trim() : '03.03.19.';
  }
  const matchingRkas = rkasData.find(
    (r) =>
      (r.kodeProg || '').trim().startsWith('03.03.19') ||
      ((r.kodeProg || '').trim().startsWith('03.03') && /lomba|o2sn|fls2n|osn|ftbi|kejuaraan/i.test(r.uraian || ''))
  );
  if (matchingRkas?.kodeProg) {
    return matchingRkas.kodeProg.trim();
  }
  return '03.03.19.';
}

/**
 * Deteksi baris BKU khusus Pelaksanaan Lomba
 * Sesuai instruksi: "Untuk lomba kodenya 03.03.19."
 */
export function isLombaBkuRow(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  if (!row.noBukti || row.noBukti === '-' || (Number(row.keluar) || 0) <= 0) return false;
  if (isHonorBkuRow(row, rkasData) || isKode0406Row(row, rkasData)) {
    return false;
  }

  const uraianLower = (row.uraian || '').toLowerCase();
  if (/setor|terima\s*(pph|ppn|sspd)/i.test(uraianLower)) return false;

  const directKode = (row.kodeKeg || '').trim();
  const matchingRkas = findMatchingArkas(row, rkasData);
  const rkasKode = (matchingRkas?.kodeProg || '').trim();

  // Utamakan kode 03.03.19., tetap toleransi 03.03.21 jika dari data riwayat BKU
  const is030319 =
    directKode.startsWith('03.03.19') ||
    rkasKode.startsWith('03.03.19') ||
    directKode.startsWith('03.03.21') ||
    rkasKode.startsWith('03.03.21');

  const uraianMatch =
    uraianLower.includes('lomba') ||
    uraianLower.includes('fls2n') ||
    uraianLower.includes('o2sn') ||
    uraianLower.includes('osn') ||
    uraianLower.includes('ftbi') ||
    uraianLower.includes('kejuaraan') ||
    uraianLower.includes('pentas pai') ||
    uraianLower.includes('popda');

  if (!is030319 && !uraianMatch) {
    return false;
  }

  // ALGORITMA UANG HARIAN:
  // Hanya ambil transaksi pengeluaran uang harian / transport / uang saku / pendampingan lomba.
  // Kecualikan belanja barang toko (piala, medali, kostum, spanduk, banner) yang bukan uang harian personal.
  const isBelanjaBarangToko =
    (row.tokoName && !uraianLower.includes('uang harian') && !uraianLower.includes('transport') && !uraianLower.includes('uang saku')) ||
    uraianLower.includes('piala') ||
    uraianLower.includes('medali') ||
    uraianLower.includes('spanduk') ||
    uraianLower.includes('banner') ||
    uraianLower.includes('kostum') ||
    uraianLower.includes('seragam') ||
    uraianLower.includes('kaos');

  if (isBelanjaBarangToko) {
    const isExplicitUangHarian =
      uraianLower.includes('uang harian') ||
      uraianLower.includes('uang saku') ||
      uraianLower.includes('transport') ||
      uraianLower.includes('perjalanan dinas') ||
      uraianLower.includes('pendamping');
    if (!isExplicitUangHarian) {
      return false;
    }
  }

  return true;
}

/**
 * Deteksi apakah baris BKU merupakan pembayaran Upah Tukang / Ongkos Kerja Tenaga
 * Sesuai instruksi: "untuk Tukang Kodenya 05.08.01."
 * PENTING: Pembelian material (cat, kuas, semen, paku, seng, lampu, saklar, dll.) adalah Belanja Barang Toko, BUKAN Upah!
 */
export function isTukangBkuRow(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  if (!row.noBukti || row.noBukti === '-' || (Number(row.keluar) || 0) <= 0) return false;
  if (isHonorBkuRow(row, rkasData) || isKode0406Row(row, rkasData)) return false;

  const uraian = (row.uraian || '').toLowerCase();

  // Abaikan baris pembukuan pajak
  if (/setor|terima\s*(pph|ppn|sspd)/i.test(uraian)) return false;

  // Cek apakah murni pembelian material toko bangunan (bukan upah tukang)
  const isMaterialOnly =
    /^(pembelian|belanja|pengadaan)\s+(cat|semen|kuas|tiner|pasir|batu|paku|seng|asbes|genteng|pipa|keramik|lampu|kabel|saklar|kunci|engsel|triplek|kayu|besi|keran|kran|plafon)/i.test(
      uraian
    ) && !/upah|tukang|ongkos|jasa\s*(tukang|kerja)/i.test(uraian);

  if (isMaterialOnly) return false;

  const directKode = (row.kodeKeg || '').trim();
  const matchingRkas = findMatchingArkas(row, rkasData);
  const rkasKode = (matchingRkas?.kodeProg || '').trim();

  // Sesuai permintaan pengguna: Kode 05.08.01. (Pemeliharaan Bangunan Gedung Sekolah)
  const isKode050801 = directKode.startsWith('05.08.01') || rkasKode.startsWith('05.08.01');

  // Indikator kuat upah tukang
  const hasUpahKeywords =
    /upah\s*tukang|ongkos\s*tukang|ongkos\s*kerja|upah\s*kerja|jasa\s*tukang|bayar\s*tukang|pekerja\s*perbaikan|tenaga\s*kerja\s*tukang/i.test(
      uraian
    );
  if (hasUpahKeywords) return true;

  // Jika kode 05.08.01 dan ada indikasi upah / ongkos / jasa tenaga kerja
  if (
    isKode050801 &&
    (/upah|ongkos|tukang|jasa\s*tenaga|pekerja/i.test(uraian) ||
      /5\.1\.02\.02\.01\.(0013|0014|0026)/.test(row.kodeRek || ''))
  ) {
    return true;
  }

  // Kata tukang umum jika bukan toko
  if (/\btukang\b/i.test(uraian) && !/toko|pembelian|belanja\s*(alat|bahan)/i.test(uraian)) {
    return true;
  }

  // Kompatibilitas dengan kode 03.04 (pemeliharaan gedung) jika ada rekening jasa tenaga kerja
  const isKode0304 = directKode.startsWith('03.04') || rkasKode.startsWith('03.04');
  if (
    isKode0304 &&
    (/upah|ongkos|jasa tenaga/i.test(uraian) ||
      /5\.1\.02\.02\.01\.(0013|0014|0026)/.test(row.kodeRek || ''))
  ) {
    if (!isMaterialOnly && !/toko|pembelian|belanja\s*(bahan|cat|semen)/i.test(uraian)) {
      return true;
    }
  }

  return false;
}

/**
 * INTEGRASI RKAS & BKU:
 * Mengambil No. Bukti, tanggal, penerima dari BKU.
 * Mengintegrasikan RKAS untuk kode kegiatan, nama kegiatan resmi, dan harga satuan uang harian.
 */
export function resolveUangHarianData(
  row: BkuItem,
  kodeTarget: string,
  rkasData: RkasItem[] = [],
  defaultTitle: string
) {
  const cleanTarget = kodeTarget.replace(/\.+$/, '');
  const matchingRkas =
    rkasData.find((r) => {
      const rKode = (r.kodeProg || '').trim().replace(/\.+$/, '');
      return rKode === cleanTarget || rKode.startsWith(cleanTarget);
    }) || findMatchingArkas(row, rkasData);

  const effectiveKodeKeg = row.kodeKeg?.trim() || matchingRkas?.kodeProg?.trim() || kodeTarget;
  const effectiveKodeRek = row.kodeRek?.trim() || matchingRkas?.kodeRek?.trim() || '5.1.02.04.01.0001';
  const namaKegiatan = matchingRkas?.uraian?.trim() || defaultTitle;
  const nominalTotal = Number(row.keluar) || 0;

  // Deteksi durasi hari dari uraian BKU (e.g. "2 hari" -> 2)
  let hariCount = 1;
  const hariMatch = (row.uraian || '').match(/(\d+)\s*(?:hari|hr)/i);
  if (hariMatch && parseInt(hariMatch[1], 10) > 0) {
    hariCount = parseInt(hariMatch[1], 10);
  }

  // Cek harga satuan / tarif dari RKAS untuk perhitungan akurat 100%
  let hargaSatuan = nominalTotal;
  if (matchingRkas && matchingRkas.tarif && matchingRkas.tarif > 0) {
    hargaSatuan = matchingRkas.tarif;
    if (nominalTotal % hargaSatuan === 0 && nominalTotal >= hargaSatuan) {
      hariCount = Math.round(nominalTotal / hargaSatuan);
    }
  } else if (hariCount > 1) {
    hargaSatuan = Math.round(nominalTotal / hariCount);
  }

  const volHari = `${hariCount} Hari`;

  return {
    effectiveKodeKeg,
    effectiveKodeRek,
    namaKegiatan,
    volHari,
    hargaSatuan,
    jumlah: nominalTotal,
  };
}

/**
 * Generate MKKS documents from BKU & ARKAS (Kode 04.06.02.)
 * Sesuai instruksi: "Untuk MKKS Mengambil dari Kode 04.06.02. Uang harian, Jika tidak ada kode tersebut dalam BKU berati Kosong"
 */
export function buildMkksDocs(
  bkuData: BkuItem[] = [],
  rkasData: RkasItem[] = [],
  settings: AppSettings
): StandardTandaTerimaDoc[] {
  const matchedBku = bkuData.filter((row) => isMkksBkuRow(row, rkasData));

  // JIKA TIDAK ADA KODE TERSEBUT DALAM BKU BERARTI KOSONG!
  if (matchedBku.length === 0) {
    return [];
  }

  const defaultDesa = settings.desaKelurahan || 'Cibungur';
  const defaultKab = settings.kabupaten || 'Lebak';
  const defaultSekolah = settings.namaSekolah || 'SDN 1 CIBUNGUR';
  const defaultKepsek = settings.namaKepsek || 'KARNA, S.Pd';
  const defaultBendahara = settings.namaBendahara || 'ATIKAWATI, S.Pd';
  const defaultNipBendahara = settings.nipBendahara || '199306082022212007';

  return matchedBku.map((row, idx) => {
    const { effectiveKodeKeg, effectiveKodeRek, volHari, hargaSatuan, jumlah } =
      resolveUangHarianData(row, '04.06.02.', rkasData, 'MUSYAWARAH KERJA KEPALA SEKOLAH (MKKS)');

    const bulan = getBulanTahunFromTanggal(row.tgl);
    const formattedDate = row.tgl ? formatTanggalIndo(row.tgl) : '12 Agustus 2025';
    const recipientName = row.penerimaName || defaultKepsek;
    const uniqueSuffix = row.id ? `${row.id}` : `${row.noBukti || 'bku'}-${idx}`;

    return {
      id: `mkks-${uniqueSuffix}`,
      category: 'mkks',
      judulDokumen: 'BUKTI PENERIMAAN UANG HARIAN MUSYAWARAH KERJA KEPALA SEKOLAH (MKKS)',
      noBku: row.noBukti || '',
      bulan,
      tgl: row.tgl || '',
      namaSatuanPendidikan: defaultSekolah,
      desaKelurahan: defaultDesa,
      kabupaten: defaultKab,
      namaKegiatan: 'MUSYAWARAH KERJA KEPALA SEKOLAH (MKKS)',
      kodeKeg: effectiveKodeKeg,
      kodeRek: effectiveKodeRek,
      items: [
        {
          id: `mkks-item-${uniqueSuffix}-0`,
          nama: recipientName,
          jabatan: 'Kepala Sekolah',
          vol: volHari,
          harga: hargaSatuan,
          jumlah,
        },
      ],
      totalJumlah: jumlah,
      tempatTgl: `${defaultDesa}, ${formattedDate}`,
      namaBendahara: defaultBendahara,
      nipBendahara: defaultNipBendahara,
      namaKepsek: defaultKepsek,
      nipKepsek: settings.nipKepsek || '196705081991031008',
    };
  });
}

/**
 * Generate standard K3S documents from BKU & ARKAS (Kode 04.06.02.)
 * Sesuai instruksi: "Untuk KKG dan K3S Kodenya sama 04.06.02. Apabila di bku tidak ada kode tersebut berati tidak ada uang harian untuk kegiatan tersebut."
 */
export function buildK3sDocs(
  bkuData: BkuItem[] = [],
  rkasData: RkasItem[] = [],
  settings: AppSettings
): StandardTandaTerimaDoc[] {
  const matchedBku = bkuData.filter((row) => isK3sBkuRow(row, rkasData));

  // JIKA TIDAK ADA KODE TERSEBUT DALAM BKU BERARTI KOSONG!
  if (matchedBku.length === 0) {
    return [];
  }

  const defaultDesa = settings.desaKelurahan || 'Cibungur';
  const defaultKab = settings.kabupaten || 'Lebak';
  const defaultSekolah = settings.namaSekolah || 'SDN 1 CIBUNGUR';
  const defaultKepsek = settings.namaKepsek || 'KARNA, S.Pd';
  const defaultBendahara = settings.namaBendahara || 'ATIKAWATI, S.Pd';
  const defaultNipBendahara = settings.nipBendahara || '199306082022212007';

  return matchedBku.map((row, idx) => {
    const { effectiveKodeKeg, effectiveKodeRek, volHari, hargaSatuan, jumlah } =
      resolveUangHarianData(row, '04.06.02.', rkasData, 'KELOMPOK KERJA KEPALA SEKOLAH (K3S)');

    const bulan = getBulanTahunFromTanggal(row.tgl);
    const formattedDate = row.tgl ? formatTanggalIndo(row.tgl) : '12 Agustus 2025';
    const recipientName = row.penerimaName || defaultKepsek;
    const uniqueSuffix = row.id ? `${row.id}` : `${row.noBukti || 'bku'}-${idx}`;

    return {
      id: `k3s-${uniqueSuffix}`,
      category: 'k3s',
      judulDokumen: 'BUKTI PENERIMAAN KELOMPOK KERJA KEPALA SEKOLAH (K3S)',
      noBku: row.noBukti || '',
      bulan,
      tgl: row.tgl || '',
      namaSatuanPendidikan: defaultSekolah,
      desaKelurahan: defaultDesa,
      kabupaten: defaultKab,
      namaKegiatan: 'KELOMPOK KERJA KEPALA SEKOLAH (K3S)',
      kodeKeg: effectiveKodeKeg,
      kodeRek: effectiveKodeRek,
      items: [
        {
          id: `k3s-item-${uniqueSuffix}-0`,
          nama: recipientName,
          jabatan: 'Kepala Sekolah',
          vol: volHari,
          harga: hargaSatuan,
          jumlah,
        },
      ],
      totalJumlah: jumlah,
      tempatTgl: `${defaultDesa}, ${formattedDate}`,
      namaBendahara: defaultBendahara,
      nipBendahara: defaultNipBendahara,
      namaKepsek: defaultKepsek,
      nipKepsek: settings.nipKepsek || '196705081991031008',
    };
  });
}

/**
 * Generate standard KKG documents from BKU & ARKAS (Kode 04.06.02.)
 * Sesuai instruksi: "Untuk KKG dan K3S Kodenya sama 04.06.02. Apabila di bku tidak ada kode tersebut berati tidak ada uang harian untuk kegiatan tersebut."
 */
export function buildKkgDocs(
  bkuData: BkuItem[] = [],
  rkasData: RkasItem[] = [],
  settings: AppSettings
): StandardTandaTerimaDoc[] {
  const matchedBku = bkuData.filter((row) => isKkgBkuRow(row, rkasData));

  // JIKA TIDAK ADA KODE TERSEBUT DALAM BKU BERARTI KOSONG!
  if (matchedBku.length === 0) {
    return [];
  }

  const defaultDesa = settings.desaKelurahan || 'Cibungur';
  const defaultKab = settings.kabupaten || 'Lebak';
  const defaultSekolah = settings.namaSekolah || 'SDN 1 CIBUNGUR';
  const defaultBendahara = settings.namaBendahara || 'ATIKAWATI, S.Pd';
  const defaultNipBendahara = settings.nipBendahara || '199306082022212007';

  return matchedBku.map((row, idx) => {
    const { effectiveKodeKeg, effectiveKodeRek, volHari, hargaSatuan, jumlah } =
      resolveUangHarianData(row, '04.06.02.', rkasData, 'KELOMPOK KERJA GURU (KKG)');

    const bulan = getBulanTahunFromTanggal(row.tgl);
    const formattedDate = row.tgl ? formatTanggalIndo(row.tgl) : '12 Agustus 2025';
    const uniqueSuffix = row.id ? `${row.id}` : `${row.noBukti || 'bku'}-${idx}`;

    let items: StandardTandaTerimaItem[] = [];
    if (settings.guruList && settings.guruList.length > 0) {
      const guruHanya = settings.guruList.filter(
        (g) => !/kepala sekolah|kepsek/i.test(g.jabatan || '')
      );
      const listToUse = guruHanya.length > 0 ? guruHanya : settings.guruList;
      const count = Math.min(listToUse.length, 6);
      const perTeacher = count > 0 ? Math.round(jumlah / count) : jumlah;
      items = listToUse.slice(0, count).map((g, itemIdx) => ({
        id: `kkg-item-${uniqueSuffix}-${itemIdx}`,
        nama: g.nama,
        jabatan: g.jabatan || 'Guru kelas',
        vol: volHari,
        harga: perTeacher,
        jumlah: perTeacher,
      }));
    } else {
      items = [
        {
          id: `kkg-item-${uniqueSuffix}-0`,
          nama: row.penerimaName || 'Guru Kelas / Mapel',
          jabatan: 'Guru kelas',
          vol: volHari,
          harga: hargaSatuan,
          jumlah,
        },
      ];
    }

    const calculatedTotal = items.reduce((acc, it) => acc + it.jumlah, 0);

    return {
      id: `kkg-${uniqueSuffix}`,
      category: 'kkg',
      judulDokumen: 'BUKTI PENERIMAAN KELOMPOK KERJA GURU (KKG)',
      noBku: row.noBukti || '',
      bulan,
      tgl: row.tgl || '',
      namaSatuanPendidikan: defaultSekolah,
      desaKelurahan: defaultDesa,
      kabupaten: defaultKab,
      namaKegiatan: 'KELOMPOK KERJA GURU (KKG)',
      kodeKeg: effectiveKodeKeg,
      kodeRek: effectiveKodeRek,
      items,
      totalJumlah: calculatedTotal,
      tempatTgl: `${defaultDesa}, ${formattedDate}`,
      namaBendahara: defaultBendahara,
      nipBendahara: defaultNipBendahara,
      namaKepsek: settings.namaKepsek || 'KARNA, S.Pd',
      nipKepsek: settings.nipKepsek || '196705081991031008',
    };
  });
}

/**
 * Generate Penerimaan Uang Harian Koordinasi Program Prioritas Pusat (Kode 03.05.01.)
 * Sesuai instruksi: "Menambah Penerimaan Dari kode 03.05.01. Uang Harin Kegiatan koordinasi dan pelaporan untuk mendukung Program Prioritas Pusat (Program Indonesia Pintar, BOSP, Sekolah Penggerak, dll.)"
 */
export function buildPrioritasPusatDocs(
  bkuData: BkuItem[] = [],
  rkasData: RkasItem[] = [],
  settings: AppSettings
): StandardTandaTerimaDoc[] {
  const matchedBku = bkuData.filter((row) => isPrioritasPusatBkuRow(row, rkasData));

  // JIKA TIDAK ADA KODE TERSEBUT DALAM BKU BERARTI KOSONG!
  if (matchedBku.length === 0) {
    return [];
  }

  const defaultDesa = settings.desaKelurahan || 'Cibungur';
  const defaultKab = settings.kabupaten || 'Lebak';
  const defaultSekolah = settings.namaSekolah || 'SDN 1 CIBUNGUR';
  const defaultKepsek = settings.namaKepsek || 'KARNA, S.Pd';
  const defaultBendahara = settings.namaBendahara || 'ATIKAWATI, S.Pd';
  const defaultNipBendahara = settings.nipBendahara || '199306082022212007';

  return matchedBku.map((row, idx) => {
    const { effectiveKodeKeg, effectiveKodeRek, volHari, hargaSatuan, jumlah } =
      resolveUangHarianData(row, '03.05.01.', rkasData, 'PELAPORAN PROGRAM PRIORITAS PUSAT');

    const bulan = getBulanTahunFromTanggal(row.tgl);
    const formattedDate = row.tgl ? formatTanggalIndo(row.tgl) : '15 Agustus 2025';
    const recipientName = row.penerimaName || defaultKepsek;
    const uniqueSuffix = row.id ? `${row.id}` : `${row.noBukti || 'bku'}-${idx}`;

    let recipientJabatan = 'Kepala Sekolah';
    if (row.penerimaName && row.penerimaName !== defaultKepsek && settings.guruList && settings.guruList.length > 0) {
      const match = settings.guruList.find(
        (g) => g.nama.toLowerCase().trim() === row.penerimaName?.toLowerCase().trim()
      );
      if (match?.jabatan) {
        recipientJabatan = match.jabatan;
      } else {
        recipientJabatan = 'Penanggung Jawab / Petugas Pelapor';
      }
    }

    return {
      id: `prioritas-${uniqueSuffix}`,
      category: 'prioritas-pusat',
      judulDokumen: 'BUKTI PENERIMAAN PELAPORAN PROGRAM PRIORITAS PUSAT',
      noBku: row.noBukti || '',
      bulan,
      tgl: row.tgl || '',
      namaSatuanPendidikan: defaultSekolah,
      desaKelurahan: defaultDesa,
      kabupaten: defaultKab,
      namaKegiatan: 'PELAPORAN PROGRAM PRIORITAS PUSAT',
      kodeKeg: effectiveKodeKeg,
      kodeRek: effectiveKodeRek,
      items: [
        {
          id: `prioritas-item-${uniqueSuffix}-0`,
          nama: recipientName,
          jabatan: recipientJabatan,
          vol: volHari,
          harga: hargaSatuan,
          jumlah,
        },
      ],
      totalJumlah: jumlah,
      tempatTgl: `${defaultDesa}, ${formattedDate}`,
      namaBendahara: defaultBendahara,
      nipBendahara: defaultNipBendahara,
      namaKepsek: defaultKepsek,
      nipKepsek: settings.nipKepsek || '196705081991031008',
    };
  });
}

/**
 * Generate standard Lomba documents (Guru & Siswa) from BKU & ARKAS (Kode 03.03.19.)
 * Sesuai instruksi: "Untuk lomba kodenya 03.03.19."
 */
export function buildLombaDocs(
  bkuData: BkuItem[] = [],
  rkasData: RkasItem[] = [],
  settings: AppSettings,
  mode: 'guru' | 'siswa' = 'guru'
): StandardTandaTerimaDoc[] {
  const matchedBku = bkuData.filter((row) => isLombaBkuRow(row, rkasData));

  // JIKA TIDAK ADA KODE TERSEBUT DALAM BKU BERARTI KOSONG!
  if (matchedBku.length === 0) {
    return [];
  }

  const judul =
    mode === 'guru'
      ? 'BUKTI PENERIMAAN PELAKSANAAN LOMBA (GURU PENDAMPING)'
      : 'BUKTI PENERIMAAN PELAKSANAAN LOMBA (PESERTA SISWA)';

  return matchedBku.map((row, idx) => {
    const { effectiveKodeKeg, effectiveKodeRek, namaKegiatan, volHari, hargaSatuan, jumlah } =
      resolveUangHarianData(row, '03.03.19.', rkasData, 'PELAKSANAAN LOMBA');

    const bulan = getBulanTahunFromTanggal(row.tgl);
    const formattedDate = row.tgl ? formatTanggalIndo(row.tgl) : '';
    const uniqueSuffix = row.id ? `${row.id}` : `${row.noBukti || 'bku'}-${idx}`;

    let items: StandardTandaTerimaItem[] = [];

    if (mode === 'guru') {
      if (settings.guruList && settings.guruList.length > 0) {
        const guruHanya = settings.guruList.filter(
          (g) => !/kepala sekolah|kepsek/i.test(g.jabatan || '')
        );
        const listToUse = guruHanya.length > 0 ? guruHanya : settings.guruList;
        const count = Math.min(listToUse.length, 3);
        const perPerson = Math.round(jumlah / count);
        items = listToUse.slice(0, count).map((g, itemIdx) => ({
          id: `lomba-guru-${uniqueSuffix}-${itemIdx}`,
          nama: g.nama,
          jabatan: 'Guru Pembina / Pendamping',
          vol: volHari,
          harga: perPerson,
          jumlah: perPerson,
        }));
      } else {
        items = [
          {
            id: `lomba-guru-${uniqueSuffix}-0`,
            nama: row.penerimaName || 'Guru Pendamping Lomba',
            jabatan: 'Guru Pembina / Pendamping',
            vol: volHari,
            harga: hargaSatuan,
            jumlah,
          },
        ];
      }
    } else {
      // mode === 'siswa'
      items = [
        {
          id: `lomba-siswa-${uniqueSuffix}-0`,
          nama: row.penerimaName || 'Peserta Didik (Siswa Lomba)',
          jabatan: 'Siswa Peserta Lomba',
          vol: volHari,
          harga: hargaSatuan,
          jumlah,
        },
      ];
    }

    const calculatedTotal = items.reduce((acc, it) => acc + it.jumlah, 0);

    return {
      id: `lomba-${mode}-${uniqueSuffix}`,
      category: mode === 'guru' ? 'lomba-guru' : 'lomba-siswa',
      lombaType: mode,
      judulDokumen: judul,
      noBku: row.noBukti || '',
      bulan,
      tgl: row.tgl || '',
      namaSatuanPendidikan: settings.namaSekolah || '',
      desaKelurahan: settings.desaKelurahan || '',
      kabupaten: settings.kabupaten || '',
      namaKegiatan,
      kodeKeg: effectiveKodeKeg,
      kodeRek: effectiveKodeRek,
      items,
      totalJumlah: calculatedTotal,
      tempatTgl: `${settings.desaKelurahan || ''}, ${formattedDate}`,
      namaBendahara: settings.namaBendahara || '',
      nipBendahara: settings.nipBendahara || '',
      namaKepsek: settings.namaKepsek || '',
      nipKepsek: settings.nipKepsek || '',
    };
  });
}

/**
 * Generate standard Validasi documents from BKU & ARKAS (Kode 07.05.04.)
 * Sesuai instruksi: "tambah 1 Penerimaan yaitu Validasi nanti mengambil datanya dari kode 07.05.04."
 */
export function buildValidasiDocs(
  bkuData: BkuItem[] = [],
  rkasData: RkasItem[] = [],
  settings: AppSettings
): StandardTandaTerimaDoc[] {
  const matchedBku = bkuData.filter((row) => isValidasiBkuRow(row, rkasData));

  // JIKA TIDAK ADA KODE TERSEBUT DALAM BKU BERARTI KOSONG!
  if (matchedBku.length === 0) {
    return [];
  }

  return matchedBku.map((row, idx) => {
    const { effectiveKodeKeg, effectiveKodeRek, namaKegiatan, volHari, hargaSatuan, jumlah } =
      resolveUangHarianData(row, '07.05.04.', rkasData, 'Validasi Data Pokok Pendidikan');

    const bulan = getBulanTahunFromTanggal(row.tgl);
    const formattedDate = row.tgl ? formatTanggalIndo(row.tgl) : '';
    const recipientName = row.penerimaName || 'Operator Pendataan';
    const uniqueSuffix = row.id ? `${row.id}` : `${row.noBukti || 'bku'}-${idx}`;

    return {
      id: `validasi-${uniqueSuffix}`,
      category: 'validasi',
      judulDokumen: 'BUKTI PENERIMAAN UANG HARIAN VALIDASI DATA POKOK PENDIDIKAN',
      noBku: row.noBukti || '',
      bulan,
      tgl: row.tgl || '',
      namaSatuanPendidikan: settings.namaSekolah || '',
      desaKelurahan: settings.desaKelurahan || '',
      kabupaten: settings.kabupaten || '',
      namaKegiatan,
      kodeKeg: effectiveKodeKeg,
      kodeRek: effectiveKodeRek,
      items: [
        {
          id: `validasi-item-${uniqueSuffix}-0`,
          nama: recipientName,
          jabatan: 'Operator / Petugas Validasi',
          vol: volHari,
          harga: hargaSatuan,
          jumlah,
        },
      ],
      totalJumlah: jumlah,
      tempatTgl: `${settings.desaKelurahan || ''}, ${formattedDate}`,
      namaBendahara: settings.namaBendahara || '',
      nipBendahara: settings.nipBendahara || '',
      namaKepsek: settings.namaKepsek || '',
      nipKepsek: settings.nipKepsek || '',
    };
  });
}

/**
 * Generate standard SPPD documents from BKU & ARKAS
 */
export function buildSppdDocs(
  bkuData: BkuItem[] = [],
  rkasData: RkasItem[] = [],
  settings: AppSettings
): StandardTandaTerimaDoc[] {
  const matchedBku = bkuData.filter((row) => {
    if (!row.noBukti || row.noBukti === '-' || (Number(row.keluar) || 0) <= 0) return false;
    // Cegah pencampuran data dengan Honor (07.12) atau KKG/K3S/MKKS (04.06) atau Prioritas (03.05) atau Validasi (07.05)
    if (
      isHonorBkuRow(row, rkasData) ||
      isKode0406Row(row, rkasData) ||
      isPrioritasPusatBkuRow(row, rkasData) ||
      isValidasiBkuRow(row, rkasData) ||
      isLombaBkuRow(row, rkasData) ||
      isTukangBkuRow(row, rkasData)
    ) {
      return false;
    }
    const uraian = (row.uraian || '').toLowerCase();
    const kodeRek = (row.kodeRek || '').toLowerCase();
    return (
      uraian.includes('sppd') ||
      uraian.includes('perjalanan dinas') ||
      uraian.includes('transport dinas') ||
      uraian.includes('dinas luar') ||
      kodeRek.startsWith('5.1.02.04')
    );
  });

  if (matchedBku.length === 0) {
    return [];
  }

  return matchedBku.map((row, idx) => {
    const arkas = findMatchingArkas(row, rkasData);
    const nominal = Number(row.keluar) || 0;
    const bulan = getBulanTahunFromTanggal(row.tgl);
    const formattedDate = row.tgl ? formatTanggalIndo(row.tgl) : '';
    const uniqueSuffix = row.id ? `${row.id}` : `${row.noBukti || 'bku'}-${idx}`;

    return {
      id: `sppd-${uniqueSuffix}`,
      category: 'sppd',
      judulDokumen: 'BUKTI PENERIMAAN BIAYA PERJALANAN DINAS (SPPD)',
      noBku: row.noBukti || '',
      bulan,
      tgl: row.tgl || '',
      namaSatuanPendidikan: settings.namaSekolah || '',
      desaKelurahan: settings.desaKelurahan || '',
      kabupaten: settings.kabupaten || '',
      namaKegiatan: 'Biaya Perjalanan Dinas Dalam Daerah (SPPD)',
      kodeKeg: arkas?.kodeProg || row.kodeKeg || '01.01.01.',
      kodeRek: row.kodeRek || arkas?.kodeRek || '5.1.02.04.01.0001',
      items: [
        {
          id: `sppd-item-${uniqueSuffix}-0`,
          nama: row.penerimaName || settings.namaKepsek || 'Kepala Sekolah',
          jabatan: 'Kepala Sekolah',
          vol: '1 Perjalanan',
          harga: nominal,
          jumlah: nominal,
        },
      ],
      totalJumlah: nominal,
      tempatTgl: `${settings.desaKelurahan || ''}, ${formattedDate}`,
      namaBendahara: settings.namaBendahara || '',
      nipBendahara: settings.nipBendahara || '',
      namaKepsek: settings.namaKepsek || '',
      nipKepsek: settings.nipKepsek || '',
    };
  });
}

/**
 * Generate standard Lain-lain documents
 */
export function buildLainDocs(
  bkuData: BkuItem[] = [],
  rkasData: RkasItem[] = [],
  settings: AppSettings
): StandardTandaTerimaDoc[] {
  return [];
}

/**
 * Cek apakah baris BKU merupakan kategori PENERIMAAN (Honor, Upah Tukang, atau Uang Harian/Perjalanan Dinas)
 * Transaksi ini menghasilkan output Tanda Terima / Bukti Penerimaan Uang Personal.
 * TIDAK BOLEH muncul di Kwitansi & Nota Toko!
 */
export function isPenerimaanRow(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  if (!row.noBukti || row.noBukti === '-' || (Number(row.keluar) || 0) <= 0) return false;
  const uraian = (row.uraian || '').toLowerCase();

  // Abaikan baris pembukuan pajak
  if (/^(setor|terima)\s*(pph|ppn|sspd)/i.test(uraian)) return false;

  // 1. Honor (GTT / PTT / Guru Honorer / Tendik / Narasumber / Juri / Pelatih)
  if (isHonorBkuRow(row, rkasData)) return true;
  if (
    /honor|honorarium|gtt|ptt|gty|guru\s*honorer|narasumber|instruktur|juri\s*lomba|pelatih\s*ekskul|uang\s*lelah/i.test(
      uraian
    )
  ) {
    return true;
  }

  // 2. Upah Tukang (05.08.01. atau kata tukang)
  if (isTukangBkuRow(row, rkasData)) return true;

  // 3. K3S, MKKS, KKG (04.06.02.)
  if (
    isMkksBkuRow(row, rkasData) ||
    isK3sBkuRow(row, rkasData) ||
    isKkgBkuRow(row, rkasData) ||
    isKode0406Row(row, rkasData)
  ) {
    return true;
  }

  // 4. Koordinasi Program Prioritas Pusat (03.05.01.)
  if (isPrioritasPusatBkuRow(row, rkasData)) return true;

  // 5. Pelaksanaan Lomba (03.03.19. / 03.03.21.)
  if (isLombaBkuRow(row, rkasData)) return true;

  // 6. Validasi Data Pokok Pendidikan (07.05.04.)
  if (isValidasiBkuRow(row, rkasData)) return true;

  // 7. Belanja Perjalanan Dinas (Rekening 5.1.02.04)
  const kodeRek = (row.kodeRek || '').trim();
  if (kodeRek.startsWith('5.1.02.04')) {
    return true;
  }

  // 8. Kata kunci penerimaan uang harian & SPPD
  if (
    uraian.includes('sppd') ||
    uraian.includes('perjalanan dinas') ||
    uraian.includes('transport dinas') ||
    uraian.includes('dinas luar') ||
    uraian.includes('uang harian') ||
    uraian.includes('uang saku') ||
    uraian.includes('bantuan transport') ||
    uraian.includes('biaya transport')
  ) {
    const isTokoGoods =
      /snack|makan|minum|kue|catering|katering|konsumsi|atk|penggandaan|fotocopy/i.test(uraian);
    if (!isTokoGoods || /uang harian|uang saku|sppd/i.test(uraian)) {
      return true;
    }
  }

  return false;
}

/**
 * Cek apakah baris BKU merupakan BELANJA BARANG & JASA PENGADAAN TOKO
 * Transaksi ini menghasilkan output NOTA TOKO & KWITANSI PEMBAYARAN TOKO.
 * Bersih 100% dari Honor, Upah Tukang, MKKS, K3S, KKG, Prioritas Pusat, Lomba, Validasi, dan SPPD.
 */
export function isBelanjaBarangRow(row: BkuItem, rkasData: RkasItem[] = []): boolean {
  const noBukti = (row.noBukti || '').trim();
  if (!noBukti || noBukti === '-' || !noBukti.toUpperCase().startsWith('BPU')) {
    return false;
  }
  if ((Number(row.keluar) || 0) <= 0) {
    return false;
  }
  const uraian = (row.uraian || '').toLowerCase();

  // Abaikan baris pembukuan pajak
  if (/^(setor|terima)\s*(pph|ppn|sspd)/i.test(uraian)) {
    return false;
  }

  // JANGAN masukkan transaksi yang masuk kategori Penerimaan
  if (isPenerimaanRow(row, rkasData)) {
    return false;
  }

  return true;
}
