import { AppSettings, BkuItem, RkasItem, TaxRecord, TandaTerimaHonor, TandaTerimaTukang, TukangDoc, TukangWorker, TandaTerimaKkg, TandaTerimaMkks, TandaTerimaLomba, SppdData, VerificationItem, SchoolAccount } from '../types';
import { LOGO_PEMKAB_LEBAK, LOGO_KKG_PRESET, LOGO_MKKS_PRESET } from '../utils/logoPresets';

// Pengaturan dasar bersih untuk sekolah baru
export const initialSettings: AppSettings = {
  namaSekolah: '',
  npsn: '',
  alamat: '',
  desaKelurahan: '',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
  kodePos: '',
  emailSekolah: '',
  kotaTanggal: '',
  tahunAnggaran: '2026',
  namaKepsek: '',
  nipKepsek: '',
  pangkatKepsek: '',
  namaBendahara: '',
  nipBendahara: '',
  pangkatBendahara: '',
  noRekeningBosp: '',
  noRekening: '',
  rekeningAtasNama: '',
  namaBank: '',
  logoSekolah: '',
  guruList: [],
  tukangList: [],
};

// Helper untuk mengisi pengaturan otomatis dari akun sekolah yang login
export const createSettingsFromSchoolAccount = (account: SchoolAccount): AppSettings => {
  return {
    namaSekolah: account.namaSekolah,
    npsn: account.npsn,
    alamat: account.alamat || '',
    desaKelurahan: '',
    kecamatan: account.kecamatan || '',
    kabupaten: account.kabupaten || '',
    provinsi: account.provinsi || '',
    kodePos: '',
    emailSekolah: account.email || '',
    kotaTanggal: account.kecamatan || account.kabupaten || 'Indonesia',
    tahunAnggaran: '2026',
    namaKepsek: account.namaKepsek || '',
    nipKepsek: account.nipKepsek || '',
    pangkatKepsek: '',
    namaBendahara: account.namaBendahara || '',
    nipBendahara: account.nipBendahara || '',
    pangkatBendahara: '',
    noRekeningBosp: '',
    noRekening: '',
    rekeningAtasNama: account.namaSekolah ? `BOSP ${account.namaSekolah}` : '',
    namaBank: '',
    logoSekolah: '',
    guruList: [],
    tukangList: [],
  };
};

// DATA DUMMY AWAL DIKOSONGKAN SESUAI PERMINTAAN PENGGUNA
export const initialRkasData: RkasItem[] = [];
export const initialBkuData: BkuItem[] = [];
export const initialTaxRecords: TaxRecord[] = [];
export const initialTukangData: TandaTerimaTukang[] = [];
export const initialTukangDocs: TukangDoc[] = [];
export const initialKkgData: TandaTerimaKkg[] = [];
export const initialMkksData: TandaTerimaMkks[] = [];
export const initialLombaData: TandaTerimaLomba[] = [];

// DATA CONTOH / SAMPEL DOKUMEN (Dapat dimuat saat pengujian template)
export const sampleRkasData: RkasItem[] = [
  { no: '1', kodeRek: '', kodeProg: '02.', uraian: 'Pengembangan Standar Isi', tarif: 0, jumlah: 250000, tw1: 0, tw2: 0, tw3: 250000, tw4: 0, isHeader: true },
  { no: '2', kodeRek: '', kodeProg: '02.03.', uraian: 'Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler', tarif: 0, jumlah: 250000, tw1: 0, tw2: 0, tw3: 250000, tw4: 0, isHeader: true },
  { no: '3', kodeRek: '', kodeProg: '02.03.01.', uraian: 'Penyusunan Kurikulum', tarif: 0, jumlah: 250000, tw1: 0, tw2: 0, tw3: 250000, tw4: 0, isHeader: true },
  { no: '4', kodeRek: '5.1.02.01.01.0024', kodeProg: '02.03.01.', uraian: 'Penggandaan-Spesifikasi: Kwarto / Polio', vol: '200', satuan: 'lembar', tarif: 300, jumlah: 60000, tw1: 0, tw2: 0, tw3: 60000, tw4: 0, isHeader: false },
  { no: '5', kodeRek: '5.1.02.01.01.0052', kodeProg: '02.03.01.', uraian: 'Biaya Makanan dan Minuman Rapat-Snack', vol: '10', satuan: 'porsi', tarif: 19000, jumlah: 190000, tw1: 0, tw2: 0, tw3: 190000, tw4: 0, isHeader: false },
  { no: '6', kodeRek: '', kodeProg: '03.', uraian: 'Standar Proses', tarif: 0, jumlah: 18324500, tw1: 3031500, tw2: 4707000, tw3: 6244000, tw4: 4342000, isHeader: true },
  { no: '7', kodeRek: '', kodeProg: '03.01.01.', uraian: 'Pelaksanaan Pendaftaran Peserta Didik Baru (PPDB)', tarif: 0, jumlah: 280000, tw1: 0, tw2: 280000, tw3: 0, tw4: 0, isHeader: true },
  { no: '8', kodeRek: '5.1.02.01.01.0026', kodeProg: '03.01.01.', uraian: 'Belanja Alat/Bahan untuk Kegiatan Kantor-Spanduk PPDB', vol: '8', satuan: 'meter', tarif: 35000, jumlah: 280000, tw1: 0, tw2: 280000, tw3: 0, tw4: 0, isHeader: false },
  { no: '8b', kodeRek: '', kodeProg: '03.03.19.', uraian: 'Pelaksanaan Kegiatan Lomba Siswa (FLS2N, O2SN, OSN, FTBI)', tarif: 0, jumlah: 500000, tw1: 0, tw2: 500000, tw3: 0, tw4: 0, isHeader: true },
  { no: '8c', kodeRek: '5.1.02.04.01.0001', kodeProg: '03.03.19.', uraian: 'Uang Harian Pelaksanaan Kegiatan Lomba Siswa', vol: '1', satuan: 'Kegiatan', tarif: 500000, jumlah: 500000, tw1: 0, tw2: 500000, tw3: 0, tw4: 0, isHeader: false },
  { no: '8d', kodeRek: '', kodeProg: '03.05.01.', uraian: 'Kegiatan koordinasi dan pelaporan untuk mendukung Program Prioritas Pusat (Program Indonesia Pintar, BOSP, Sekolah Penggerak, dll.)', tarif: 0, jumlah: 300000, tw1: 0, tw2: 300000, tw3: 0, tw4: 0, isHeader: true },
  { no: '8e', kodeRek: '5.1.02.04.01.0001', kodeProg: '03.05.01.', uraian: 'Uang Harian Kegiatan Koordinasi dan Pelaporan Program Prioritas Pusat', vol: '1', satuan: 'Kegiatan', tarif: 300000, jumlah: 300000, tw1: 0, tw2: 300000, tw3: 0, tw4: 0, isHeader: false },
  { no: '9', kodeRek: '', kodeProg: '04.06.02.', uraian: 'Pelaksanaan Kegiatan Komunitas Belajar (KKG) di Satuan Pendidikan', tarif: 0, jumlah: 600000, tw1: 0, tw2: 600000, tw3: 0, tw4: 0, isHeader: true },
  { no: '9b', kodeRek: '', kodeProg: '04.06.02.', uraian: 'Koordinasi dan Pelaksanaan Kegiatan K3S / MKKS', tarif: 0, jumlah: 250000, tw1: 0, tw2: 250000, tw3: 0, tw4: 0, isHeader: true },
  { no: '10', kodeRek: '5.1.02.01.01.0055', kodeProg: '04.06.02.', uraian: 'Snack Komunitas Belajar', vol: '12', satuan: 'Porsi', tarif: 19000, jumlah: 228000, tw1: 0, tw2: 228000, tw3: 0, tw4: 0, isHeader: false },
  { no: '10b', kodeRek: '5.1.02.04.01.0001', kodeProg: '04.06.02.', uraian: 'Uang Harian Pelaksanaan Kegiatan K3S / MKKS', vol: '1', satuan: 'Kegiatan', tarif: 250000, jumlah: 250000, tw1: 0, tw2: 250000, tw3: 0, tw4: 0, isHeader: false },
  { no: '10c', kodeRek: '5.1.02.04.01.0001', kodeProg: '04.06.02.', uraian: 'Uang Harian Pelaksanaan Kegiatan Kelompok Kerja Guru (KKG)', vol: '1', satuan: 'Kegiatan', tarif: 150000, jumlah: 150000, tw1: 0, tw2: 150000, tw3: 0, tw4: 0, isHeader: false },
  { no: '11', kodeRek: '', kodeProg: '06.05.09.', uraian: 'Penyediaan Peralatan Kebersihan Sekolah', tarif: 0, jumlah: 826000, tw1: 0, tw2: 826000, tw3: 0, tw4: 0, isHeader: true },
  { no: '12', kodeRek: '5.1.02.01.01.0030', kodeProg: '06.05.09.', uraian: 'Gagang Pengepel-Standar', vol: '7', satuan: 'Buah', tarif: 35000, jumlah: 245000, tw1: 0, tw2: 245000, tw3: 0, tw4: 0, isHeader: false },
  { no: '13', kodeRek: '5.1.02.01.01.0030', kodeProg: '06.05.09.', uraian: 'Serok Sampah-Standar', vol: '7', satuan: 'Buah', tarif: 20000, jumlah: 140000, tw1: 0, tw2: 140000, tw3: 0, tw4: 0, isHeader: false },
  { no: '14', kodeRek: '5.1.02.01.01.0030', kodeProg: '06.05.09.', uraian: 'Pengki Plastik', vol: '7', satuan: 'Pcs', tarif: 18000, jumlah: 126000, tw1: 0, tw2: 126000, tw3: 0, tw4: 0, isHeader: false },
  { no: '15', kodeRek: '5.1.02.01.01.0030', kodeProg: '06.05.09.', uraian: 'Sapu Ijuk-Standar', vol: '7', satuan: 'Pcs', tarif: 30000, jumlah: 210000, tw1: 0, tw2: 210000, tw3: 0, tw4: 0, isHeader: false },
  { no: '16', kodeRek: '5.1.02.01.01.0030', kodeProg: '06.05.09.', uraian: 'Sapu Lidi Tangkai-Standar', vol: '7', satuan: 'Pcs', tarif: 15000, jumlah: 105000, tw1: 0, tw2: 105000, tw3: 0, tw4: 0, isHeader: false },
  { no: '17', kodeRek: '', kodeProg: '05.08.01.', uraian: 'Pemeliharaan Bangunan Gedung Sekolah', tarif: 0, jumlah: 1985000, tw1: 0, tw2: 1985000, tw3: 0, tw4: 0, isHeader: true },
  { no: '18', kodeRek: '5.1.02.01.01.0030', kodeProg: '05.08.01.', uraian: 'Cat Tembok-Cat Tembok', vol: '50', satuan: 'kg', tarif: 26000, jumlah: 1300000, tw1: 0, tw2: 1300000, tw3: 0, tw4: 0, isHeader: false },
  { no: '19', kodeRek: '5.1.02.01.01.0030', kodeProg: '05.08.01.', uraian: 'Thinner-Thinner', vol: '3', satuan: 'Kaleng', tarif: 35000, jumlah: 105000, tw1: 0, tw2: 105000, tw3: 0, tw4: 0, isHeader: false },
  { no: '20', kodeRek: '5.1.02.01.01.0030', kodeProg: '05.08.01.', uraian: 'Kuas 3 Inch-Kuas 3 Inch', vol: '2', satuan: 'Buah', tarif: 25000, jumlah: 50000, tw1: 0, tw2: 50000, tw3: 0, tw4: 0, isHeader: false },
  { no: '21', kodeRek: '5.1.02.01.01.0030', kodeProg: '05.08.01.', uraian: 'Cat Kayu/Besi-Cat Kayu/Besi', vol: '8', satuan: 'kg', tarif: 55000, jumlah: 440000, tw1: 0, tw2: 440000, tw3: 0, tw4: 0, isHeader: false },
  { no: '22', kodeRek: '5.1.02.01.01.0030', kodeProg: '05.08.01.', uraian: 'Roll Cat-Roll Cat', vol: '3', satuan: 'Buah', tarif: 30000, jumlah: 90000, tw1: 0, tw2: 90000, tw3: 0, tw4: 0, isHeader: false },
  { no: '22b', kodeRek: '5.1.02.02.01.0013', kodeProg: '05.08.01.', uraian: 'Belanja Jasa Tenaga Kerja / Upah Tukang Pemeliharaan Bangunan Sekolah', vol: '4', satuan: 'OH', tarif: 110000, jumlah: 440000, tw1: 0, tw2: 440000, tw3: 0, tw4: 0, isHeader: false },
  { no: '22c', kodeRek: '', kodeProg: '07.05.04.', uraian: 'Penyelenggaraan Validasi / Validasi Data Pokok Pendidikan', tarif: 0, jumlah: 300000, tw1: 0, tw2: 300000, tw3: 0, tw4: 0, isHeader: true },
  { no: '22d', kodeRek: '5.1.02.04.01.0001', kodeProg: '07.05.04.', uraian: 'Uang Harian Validasi Data Pokok Pendidikan', vol: '1', satuan: 'Kegiatan', tarif: 300000, jumlah: 300000, tw1: 0, tw2: 300000, tw3: 0, tw4: 0, isHeader: false },
  { no: '23', kodeRek: '', kodeProg: '07.12.00.', uraian: 'Pembayaran Honorarium Guru & Tenaga Kependidikan', tarif: 0, jumlah: 16200000, tw1: 4050000, tw2: 4050000, tw3: 4050000, tw4: 4050000, isHeader: true },
  { no: '24', kodeRek: '5.1.02.02.01.0026', kodeProg: '07.12.03.', uraian: 'Honorarium Tenaga Administrasi (Syifa Safanatul Hayat)', vol: '12', satuan: 'OB', tarif: 700000, jumlah: 8400000, tw1: 2100000, tw2: 2100000, tw3: 2100000, tw4: 2100000, isHeader: false },
  { no: '25', kodeRek: '5.1.02.02.01.0031', kodeProg: '07.12.02.', uraian: 'Honorarium Tenaga Kependidikan (Aji Daud Abdu Somad)', vol: '12', satuan: 'OB', tarif: 650000, jumlah: 7800000, tw1: 1950000, tw2: 1950000, tw3: 1950000, tw4: 1950000, isHeader: false },
];

export const sampleBkuData: BkuItem[] = [
  { id: 'bku-1', tgl: '01-04-2026', kodeKeg: '', kodeRek: '', noBukti: '-', uraian: 'Saldo Bank Awal Periode', terima: 5000000, keluar: 0, saldo: 5000000 },
  { id: 'bku-2', tgl: '01-04-2026', kodeKeg: '', kodeRek: '', noBukti: '-', uraian: 'Saldo Tunai Awal Periode', terima: 15000000, keluar: 0, saldo: 20000000 },
];

export const sampleTaxRecords: TaxRecord[] = [
  {
    id: 'tax-1',
    tgl: '02-04-2026',
    noBukti: 'BPU47',
    uraian: 'Pajak Snack Komunitas Belajar (Catering Barokah)',
    jenisPajak: 'PPh 23',
    dpp: 228000,
    tarifPersen: 2,
    nominalPajak: 4560,
    kodeBilling: '012984712093847',
    ntpn: '9A8B7C6D5E4F3G2H',
    statusSetor: 'Sudah Disetor',
    tglSetor: '02-04-2026',
    keterangan: 'Setor via Pos / Bank Persepsi',
  },
  {
    id: 'tax-2',
    tgl: '02-04-2026',
    noBukti: 'BPU47',
    uraian: 'Pajak Daerah SSPD Mamin Komunitas Belajar',
    jenisPajak: 'SSPD / Pajak Daerah',
    dpp: 228000,
    tarifPersen: 10,
    nominalPajak: 22800,
    kodeBilling: '982736412098371',
    ntpn: '1A2B3C4D5E6F7G8H',
    statusSetor: 'Sudah Disetor',
    tglSetor: '02-04-2026',
    keterangan: 'Setor Pajak Restoran ke Bapenda Kab. Lebak',
  },
];

export const sampleTukangData: TandaTerimaTukang[] = [
  {
    id: 'tukang-1',
    nama: 'Udin Samsudin',
    kualifikasi: 'Kepala Tukang',
    keahlian: 'Tukang Cat & Plafon',
    uraianKerja: 'Pengecatan 3 Ruang Kelas & Perbaikan Lisplang Rusak',
    gajiPerHari: 120000,
    hariKerja: 2,
    jumlahBruto: 240000,
    pajakPph21: 1200,
    diterima: 238800,
    upahPerHari: 120000,
    jumlahUpah: 240000,
    potonganPph: 1200,
    diterimaNetto: 238800,
  },
  {
    id: 'tukang-2',
    nama: 'Kuswara',
    kualifikasi: 'Tukang',
    keahlian: 'Tukang Bangunan',
    uraianKerja: 'Membantu Pengecatan & Pembersihan Dinding Sekolah',
    gajiPerHari: 100000,
    hariKerja: 2,
    jumlahBruto: 200000,
    pajakPph21: 1000,
    diterima: 199000,
    upahPerHari: 100000,
    jumlahUpah: 200000,
    potonganPph: 1000,
    diterimaNetto: 199000,
  },
];

export const sampleTukangDocs: TukangDoc[] = [
  {
    id: 'doc-tukang-1',
    noBku: 'BPU56',
    bulan: 'APRIL 2026',
    tgl: '10-04-2026',
    namaSatuanPendidikan: 'SDN 1 CIBUNGUR',
    desaKelurahan: 'Cibungur',
    kabupaten: 'Lebak',
    namaKegiatan: 'Pembayaran Upah Tukang',
    kodeKeg: '03.04.01.',
    kodeRek: '5.1.02.02.01.0013',
    workers: [
      {
        id: 'tk-1',
        nama: 'Udin Samsudin',
        kualifikasi: 'Kepala Tukang',
        gajiPerHari: 120000,
        hariKerja: 2,
        jumlahBruto: 240000,
        pajakPph21: 1200,
        diterima: 238800,
      },
      {
        id: 'tk-2',
        nama: 'Kuswara',
        kualifikasi: 'Tukang',
        gajiPerHari: 100000,
        hariKerja: 2,
        jumlahBruto: 200000,
        pajakPph21: 1000,
        diterima: 199000,
      },
    ],
    totalBruto: 440000,
    totalPajak: 2200,
    totalDiterima: 437800,
    tempatTgl: 'Cibungur, 10 April 2026',
    namaBendahara: 'SUHENDRI, S.Pd',
    nipBendahara: '198208042022211009',
    namaKepsek: 'KARNA, S.Pd',
    nipKepsek: '197804072008011010',
  },
];

export const sampleKkgData: TandaTerimaKkg[] = [
  {
    id: 'kkg-1',
    nama: 'Siti Rohmah, S.Pd',
    nip: '198511122023212015',
    asalSekolah: 'SDN 1 Cibungur',
    peran: 'Peserta KKG Guru Kelas Awal',
    transport: 50000,
    konsumsi: 25000,
    totalDiterima: 75000,
  },
  {
    id: 'kkg-2',
    nama: 'Dedi Kurniawan, S.Pd.SD',
    nip: '199002152019031008',
    asalSekolah: 'SDN 1 Cibungur',
    peran: 'Peserta KKG PJOK Gugus 03',
    transport: 50000,
    konsumsi: 25000,
    totalDiterima: 75000,
  },
  {
    id: 'kkg-3',
    nama: 'Rina Marlina, S.Pd',
    nip: '-',
    asalSekolah: 'SDN 1 Cibungur',
    peran: 'Peserta KKG PAI Cigemblong',
    transport: 50000,
    konsumsi: 25000,
    totalDiterima: 75000,
  },
];

export const sampleMkksData: TandaTerimaMkks[] = [
  {
    id: 'mkks-1',
    nama: 'KARNA, S.Pd',
    nip: '197804072008011010',
    namaSekolah: 'SDN 1 CIBUNGUR',
    jabatan: 'Kepala Sekolah',
    transport: 100000,
    iuranKegiatan: 150000,
    total: 250000,
  },
];

export const sampleLombaData: TandaTerimaLomba[] = [
  {
    id: 'lomba-1',
    nama: 'Dedi Kurniawan, S.Pd.SD',
    kategori: 'Guru Pembina / Pendamping',
    cabangLomba: 'O2SN Cabang Atletik & Bulutangkis',
    transport: 100000,
    uangSaku: 75000,
    total: 175000,
  },
  {
    id: 'lomba-2',
    nama: 'Muhammad Rizki (Siswa)',
    kategori: 'Siswa',
    cabangLomba: 'O2SN Kids Athletics Putra',
    transport: 50000,
    uangSaku: 50000,
    total: 100000,
  },
  {
    id: 'lomba-3',
    nama: 'Siti Nurhaliza (Siswa)',
    kategori: 'Siswa',
    cabangLomba: 'FLS2N Lomba Menyanyi Solo',
    transport: 50000,
    uangSaku: 50000,
    total: 100000,
  },
];

export const initialSppdData: SppdData = {
  noSuratTugas: '800/042/SDN1-CBG/IV/2026',
  noSppd: '090/015/SPPD-BOSP/2026',
  tglSurat: '2026-04-20',
  pegawaiNama: 'KARNA, S.Pd',
  pegawaiNip: '197804072008011010',
  pegawaiPangkatGol: 'Pembina / IV.a',
  pegawaiJabatan: 'Kepala Sekolah',
  tingkatBiaya: 'Tingkat C / Biasa',
  maksudPerjalanan: 'Menghadiri Rapat Koordinasi Rekonsiliasi BKU BOSP Triwulan 1 & Verifikasi ARKAS 4.1 Tahun 2026',
  alatAngkutan: 'Kendaraan Darat / Roda Dua',
  tempatBerangkat: 'SDN 1 Cibungur (Cigemblong)',
  tempatTujuan: 'Dinas Pendidikan Kabupaten Lebak (Rangkasbitung)',
  lamaHari: 1,
  tglBerangkat: '2026-04-20',
  tglKembali: '2026-04-20',
  bebanAnggaran: 'BOSP Reguler TA 2026 SDN 1 Cibungur',
  mataAnggaran: '5.1.02.04.01.0001 (Belanja Perjalanan Dinas Dalam Kota)',
  instansiTujuan: 'Dinas Pendidikan Kab. Lebak',
  biayaTransport: 150000,
  biayaUangHarian: 100000,
  biayaPenginapan: 0,
  biayaLainLain: 0,
};

export const initialVerificationChecklist: VerificationItem[] = [
  { id: 'v-1', komponen: 'Surat Pertanggungjawaban Mutlak (SPTJM) bermaterai Rp 10.000', status: 'Lengkap', catatan: 'Ditandatangani KS & bermaterai sah' },
  { id: 'v-2', komponen: 'Buku Kas Umum (BKU) Periode berjalan ditandatangani KS & Bendahara', status: 'Lengkap', catatan: 'Sesuai format baku arkas' },
  { id: 'v-3', komponen: 'Buku Pembantu Kas Tunai, Pembantu Bank, & Pembantu Pajak', status: 'Lengkap', catatan: 'Saldo klop dengan mutasi rekening' },
  { id: 'v-4', komponen: 'Bukti Pengeluaran (Kwitansi & Nota Toko Rekanan cap basah)', status: 'Lengkap', catatan: 'Lengkap tanda tangan penerima' },
  { id: 'v-5', komponen: 'Bukti Penyetoran Pajak Negara & Daerah (e-Billing / NTPN sah)', status: 'Lengkap', catatan: 'PPh 21, 23 dan SSPD tervalidasi' },
  { id: 'v-6', komponen: 'Berita Acara Pemeriksaan Kas & Rekonsiliasi Bank', status: 'Lengkap', catatan: 'Ditutup tiap akhir bulan' },
  { id: 'v-7', komponen: 'Dokumentasi Foto Fisik Kegiatan / Barang / Sarpras yang dibeli', status: 'Lengkap', catatan: 'Foto barang & cap terlampir' },
  { id: 'v-8', komponen: 'Daftar Hadir & Tanda Terima Honorarium / Transport / Upah Tukang', status: 'Lengkap', catatan: 'Tanda tangan ganjil-genap lengkap' },
  { id: 'v-9', komponen: 'Surat Perintah Tugas (SPT) & SPPD Perjalanan Dinas', status: 'Lengkap', catatan: 'Dilengkapi visum instansi tujuan' },
  { id: 'v-10', komponen: 'Berita Acara Serah Terima (BAST) Barang / Jasa', status: 'Lengkap', catatan: 'Untuk belanja modal dan aset' },
];

