/**
 * Formatting utilities for Indonesian currency, numbers, and dates
 */

export function formatRupiah(angka: number | string | undefined | null): string {
  const num = typeof angka === 'string' ? parseFloat(angka) || 0 : angka || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(angka: number | string | undefined | null): string {
  const num = typeof angka === 'string' ? parseFloat(angka) || 0 : angka || 0;
  return new Intl.NumberFormat('id-ID').format(num);
}

export function terbilang(angka: number | string | undefined | null): string {
  const n = Math.abs(Math.floor(typeof angka === 'string' ? parseFloat(angka) || 0 : angka || 0));
  if (n === 0) return 'Nol';

  const huruf = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function convert(num: number): string {
    if (num < 12) {
      return huruf[num];
    } else if (num < 20) {
      return convert(num - 10) + ' Belas';
    } else if (num < 100) {
      const sisa = num % 10;
      return convert(Math.floor(num / 10)) + ' Puluh' + (sisa ? ' ' + convert(sisa) : '');
    } else if (num < 200) {
      const sisa = num - 100;
      return 'Seratus' + (sisa ? ' ' + convert(sisa) : '');
    } else if (num < 1000) {
      const sisa = num % 100;
      return convert(Math.floor(num / 100)) + ' Ratus' + (sisa ? ' ' + convert(sisa) : '');
    } else if (num < 2000) {
      const sisa = num - 1000;
      return 'Seribu' + (sisa ? ' ' + convert(sisa) : '');
    } else if (num < 1000000) {
      const sisa = num % 1000;
      return convert(Math.floor(num / 1000)) + ' Ribu' + (sisa ? ' ' + convert(sisa) : '');
    } else if (num < 1000000000) {
      const sisa = num % 1000000;
      return convert(Math.floor(num / 1000000)) + ' Juta' + (sisa ? ' ' + convert(sisa) : '');
    } else if (num < 1000000000000) {
      const sisa = num % 1000000000;
      return convert(Math.floor(num / 1000000000)) + ' Miliar' + (sisa ? ' ' + convert(sisa) : '');
    } else {
      const sisa = num % 1000000000000;
      return convert(Math.floor(num / 1000000000000)) + ' Triliun' + (sisa ? ' ' + convert(sisa) : '');
    }
  }

  return convert(n).trim();
}

export function formatTanggalIndo(tglStr: string | undefined | null): string {
  if (!tglStr || tglStr === '-') return '-';
  const clean = String(tglStr).trim();
  const parts = clean.split(/[-/.]/);

  if (parts.length === 3) {
    let d: string, m: number, y: string;
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      y = parts[0];
      m = parseInt(parts[1], 10);
      d = parts[2];
    } else {
      // DD-MM-YYYY
      d = parts[0];
      m = parseInt(parts[1], 10);
      y = parts[2];
    }
    const bulanIndo = [
      '',
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
    ];
    if (m >= 1 && m <= 12) {
      return `${d.padStart(2, '0')} ${bulanIndo[m]} ${y}`;
    }
  }
  return tglStr;
}

export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Parsing angka dari string format Indonesia (titik ribuan, koma desimal, kurung negatif, simbol Rp)
 * Contoh: "25.000.000", "25.000.000,00", "(5.000.000)", "Rp 1.500.000", 25000000 -> 25000000
 */
export function parseIndonesianNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str || str === '-') return 0;

  // Deteksi minus dalam kurung misal (1.000.000) atau tanda minus di depan
  const isNegative = (str.startsWith('(') && str.endsWith(')')) || str.startsWith('-');

  // Bersihkan teks mata uang, spasi, kurung
  let cleaned = str.replace(/[Rp\sIDR()]/gi, '').trim();

  // Jika memiliki titik dan koma, misal "12.345.678,50" -> hapus titik, ubah koma jadi titik
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.') && !cleaned.includes(',')) {
    // Cek apakah titik merupakan pemisah ribuan (bukan desimal)
    const parts = cleaned.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      cleaned = cleaned.replace(/\./g, '');
    }
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = cleaned.replace(',', '.');
    } else if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return isNegative ? -Math.abs(num) : num;
}
