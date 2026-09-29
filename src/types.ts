export interface GuruItem {
  id: string | number;
  nama: string;
  nip: string;
  jabatan: string;
  status?: 'PNS' | 'PPPK' | 'Honorer' | 'Tendik';
  gol?: string;
  honorPerBulan?: number;
}

export interface TukangItem {
  id: string | number;
  nama: string;
  kualifikasi: string; // 'Kepala Tukang' | 'Tukang' | 'Pekerja / Laden'
  gajiPerHari: number;
  nik?: string;
  keahlian?: string;
  noHp?: string;
}

export interface KopConfig {
  instansiInduk?: string;     // e.g. "PEMERINTAH KABUPATEN LEBAK"
  dinas?: string;             // e.g. "DINAS PENDIDIKAN"
  namaOrganisasi?: string;    // e.g. "KELOMPOK KERJA GURU (KKG) GUGUS 02" atau "MUSYAWARAH KERJA KEPALA SEKOLAH (MKKS)"
  subOrganisasi?: string;     // e.g. "KECAMATAN CIGEMBLONG"
  alamatSekretariat?: string; // e.g. "Sekretariat: SDN 1 Cibungur, Kp. Pasarkupa RT 02/03"
  kontakSekretariat?: string; // e.g. "Desa Cibungur, Kec. Cigemblong 42395 | Email: kkg.cigemblong@gmail.com"
  logo?: string;              // Custom uploaded or preset base64/url logo
}

export interface AppSettings {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  emailSekolah?: string;
  kotaTanggal: string;
  namaKepsek: string;
  nipKepsek: string;
  pangkatKepsek: string;
  namaBendahara: string;
  nipBendahara: string;
  pangkatBendahara: string;
  noRekeningBosp: string;
  noRekening?: string;
  rekeningAtasNama?: string;
  tahunAnggaran?: string;
  namaBank: string;
  guruList: GuruItem[];
  tukangList?: TukangItem[];
  logoSekolah?: string;
  kopKkg?: KopConfig;
  kopMkks?: KopConfig;
}

export interface VerificationItem {
  id: string;
  komponen: string;
  status: 'Lengkap' | 'Tidak Lengkap' | 'Tidak Ada';
  catatan?: string;
}

export interface RkasItem {
  id?: string;
  no: string;
  kodeRek: string;
  kodeProg: string;
  uraian: string;
  vol?: string | number;
  satuan?: string;
  tarif: number;
  jumlah: number;
  tw1: number;
  tw2: number;
  tw3: number;
  tw4: number;
  isHeader?: boolean;
}

export interface BkuItem {
  id: string;
  tgl: string;
  kodeKeg: string;
  kodeRek: string;
  noBukti: string;
  uraian: string;
  terima: number;
  keluar: number;
  saldo: number;
  tokoName?: string;
  penerimaName?: string;
  bulan?: string;
}

export interface BpuItemDetail {
  uraian: string;
  vol: number;
  satuan: string;
  tarif: number;
  jumlah: number;
}

export interface BpuGroup {
  noBukti: string;
  tgl: string;
  kodeKeg: string;
  kodeRek: string;
  namaKegiatan: string;
  items: BpuItemDetail[];
  totalKeluar: number;
  tokoName?: string;
  penerimaName?: string;
  keteranganPembayaran?: string;
}

export type JenisPajak = 'PPh 21' | 'PPh 22' | 'PPh 23' | 'PPN' | 'SSPD / Pajak Daerah';

export interface RekapPajakItem {
  id: string;
  no: number;
  npsn: string;
  namaSekolah: string;
  kecamatan: string;
  uraianBelanja: string;
  sumberDana: string;
  jumlahBelanja: number;
  ppn: { [bulan: string]: number };
  pph21: { [bulan: string]: number };
  pph23: { [bulan: string]: number };
  pajakDaerah: { [bulan: string]: number };
  tanggalBelanja: string;
  tanggalSetorPajak: string;
  noNtpn: string;
}

export interface BukuPembantuPajakItem {
  id: string;
  tanggal: string;
  noKode: string;
  uraian: string;
  ppn: number;
  pph21: number;
  pph23: number;
  pph4: number;
  sspd: number;
  pengeluaran: number;
  saldo: number;
}

export interface TaxRecord {
  id: string;
  tgl: string;
  noBukti: string;
  uraian: string;
  jenisPajak: JenisPajak;
  dpp: number;
  tarifPersen: number;
  nominalPajak: number;
  kodeBilling?: string;
  ntpn?: string;
  statusSetor: 'Sudah Disetor' | 'Belum Disetor';
  tglSetor?: string;
  keterangan?: string;
}

export interface HonorPtkRecipient {
  no: number;
  nama: string;
  jabatan: string;
  vol: string;
  harga: number;
  jumlah: number;
}

export interface HonorPtkDoc {
  id: string;
  noBku: string;
  bulan: string;
  tgl: string;
  namaSatuanPendidikan: string;
  desaKelurahan: string;
  kabupaten: string;
  namaKegiatan: string;
  kodeKeg?: string;
  kodeRek?: string;
  recipients: HonorPtkRecipient[];
  totalJumlah: number;
  tempatTgl: string;
  namaBendahara: string;
  nipBendahara: string;
  namaKepsek?: string;
  nipKepsek?: string;
}

export interface TandaTerimaHonor {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  honorBruto: number;
  pph21: number;
  honorNetto: number;
  noUrut: number;
}

export interface TukangWorker {
  id: string;
  nama: string;
  kualifikasi: string; // "Kepala Tukang", "Tukang", "Kenek / Pekerja"
  gajiPerHari: number; // Gaji/Hari (Rp)
  hariKerja: number; // Jumlah Hari kerja
  jumlahBruto: number; // Jumlah Bruto (Rp)
  pajakPph21: number; // Pajak PPh 21
  diterima: number; // Diterima
}

export interface TukangDoc {
  id: string;
  noBku: string;
  bulan: string;
  tgl: string;
  namaSatuanPendidikan: string;
  desaKelurahan: string;
  kabupaten: string;
  namaKegiatan: string;
  kodeKeg: string; // Kode program ARKAS e.g. "03.04.01."
  kodeRek?: string; // Kode rekening ARKAS e.g. "5.1.02.02.01.0013"
  workers: TukangWorker[];
  totalBruto: number;
  totalPajak: number;
  totalDiterima: number;
  tempatTgl: string;
  namaBendahara: string;
  nipBendahara: string;
  namaKepsek?: string;
  nipKepsek?: string;
}

export interface TandaTerimaTukang {
  id: string;
  nama: string;
  kualifikasi?: string;
  keahlian?: string;
  uraianKerja?: string;
  gajiPerHari?: number;
  hariKerja: number;
  jumlahBruto?: number;
  pajakPph21?: number;
  diterima?: number;
  upahPerHari?: number;
  jumlahUpah?: number;
  potonganPph?: number;
  diterimaNetto?: number;
}

export interface TandaTerimaKkg {
  id: string;
  nama: string;
  nip: string;
  asalSekolah: string;
  peran: string;
  transport: number;
  konsumsi: number;
  totalDiterima: number;
}

export interface TandaTerimaMkks {
  id: string;
  nama: string;
  nip: string;
  namaSekolah: string;
  jabatan: string;
  transport: number;
  iuranKegiatan: number;
  total: number;
}

export interface TandaTerimaLomba {
  id: string;
  nama: string;
  kategori: 'Siswa' | 'Guru Pembina / Pendamping';
  cabangLomba: string;
  transport: number;
  uangSaku: number;
  total: number;
}

export interface TandaTerimaSppdItem {
  id: string;
  nama: string;
  nip: string;
  tujuan: string;
  tanggal: string;
  transport: number;
  uangHarian: number;
  total: number;
}

export interface TandaTerimaLainItem {
  id: string;
  nama: string;
  uraian: string;
  volume: number;
  satuan: string;
  tarif: number;
  total: number;
}

export interface StandardTandaTerimaItem {
  id: string;
  nama: string;
  jabatan: string;
  vol: string; // e.g. "1 Kegiatan", "1 Perjalanan"
  harga: number; // e.g. 150000
  jumlah: number; // e.g. 150000
}

export interface StandardTandaTerimaDoc {
  id: string;
  category: 'k3s' | 'kkg' | 'mkks' | 'prioritas-pusat' | 'tukang' | 'lomba' | 'lomba-guru' | 'lomba-siswa' | 'validasi' | 'sppd' | 'lain';
  lombaType?: 'guru' | 'siswa';
  judulDokumen: string; // e.g. "BUKTI PENERIMAAN KELOMPOK KERJA KEPALA SEKOLAH (K3S)"
  noBku: string; // e.g. "BPU91"
  bulan: string; // e.g. "Juli 2024"
  tgl: string; // e.g. "16-08-2024"
  namaSatuanPendidikan: string;
  desaKelurahan: string;
  kabupaten: string;
  namaKegiatan: string;
  kodeKeg?: string;
  kodeRek?: string;
  items: StandardTandaTerimaItem[];
  totalJumlah: number;
  tempatTgl: string;
  namaBendahara: string;
  nipBendahara: string;
  namaKepsek?: string;
  nipKepsek?: string;
}

export interface SppdVisumStage {
  tibaDi: string;
  tglTiba: string;
  pejabatTibaJabatan: string;
  pejabatTibaNama: string;
  pejabatTibaNip: string;
  berangkatDari: string;
  ke: string;
  tglBerangkat: string;
  pejabatBerangkatJabatan: string;
  pejabatBerangkatNama: string;
  pejabatBerangkatNip: string;
}

export interface SppdData {
  id?: string;
  noSuratTugas: string;
  noSppd: string;
  tglSurat: string;
  kegiatanPresetId?: string;
  namaKegiatan?: string;
  pegawaiId?: string;
  pegawaiNama: string;
  pegawaiNip: string;
  pegawaiPangkatGol: string;
  pegawaiJabatan: string;
  tingkatBiaya: string;
  maksudPerjalanan: string;
  alatAngkutan: string;
  tempatBerangkat: string;
  tempatTujuan: string;
  lamaHari: number;
  tglBerangkat: string;
  tglKembali: string;
  bebanAnggaran: string;
  mataAnggaran: string;
  instansiTujuan: string;
  biayaTransport: number;
  biayaUangHarian: number;
  biayaPenginapan: number;
  biayaLainLain: number;
  
  // Visum Lembar Belakang (Official Form)
  ppkNama?: string;
  ppkNip?: string;
  ppkJabatan?: string;

  // II. Tiba di & Berangkat dari (Tujuan)
  visumTibaDi?: string;
  visumTglTiba?: string;
  visumTibaJabatan?: string;
  visumTibaNama?: string;
  visumTibaNip?: string;

  visumBerangkatDari?: string;
  visumBerangkatKe?: string;
  visumTglBerangkatKembali?: string;
  visumBerangkatJabatan?: string;
  visumBerangkatNama?: string;
  visumBerangkatNip?: string;

  // III & IV (Transit / Multi-tahap)
  visumTahap3?: SppdVisumStage;
  visumTahap4?: SppdVisumStage;

  // V. Tiba di (Kembali ke kedudukan asal)
  kembaliTibaDi?: string;
  kembaliTglTiba?: string;

  // VI. Catatan lain-lain
  catatanLain?: string;
}

export type AdministrasiSubTab = 'undangan' | 'daftar_hadir' | 'snack' | 'verifikasi_spj';

export type ActivityScopeType = 'kkg' | 'mkks' | 'rapat_dinas' | 'kkg_sekolah' | 'lomba' | 'custom';

export interface SuratUndanganData {
  id: string;
  scope: ActivityScopeType;
  namaKegiatan: string;
  nomorSurat: string;
  sifat: string;
  lampiran: string;
  perihal: string;
  tglSurat: string;
  tempatDitetapkan: string;
  tujuanKepada: string;
  pembukaText: string;
  hariTglAcara: string;
  waktuAcara: string;
  tempatAcara: string;
  agendaAcara: string;
  penutupText: string;
  penandatanganJabatan: string;
  penandatanganNama: string;
  penandatanganNip: string;
}

export interface PesertaHadirItem {
  id: string;
  no: number;
  nama: string;
  nip: string;
  jabatan: string;
  instansi?: string;
  jenisKonsumsi?: string;
}

export interface DaftarHadirData {
  id: string;
  scope: ActivityScopeType;
  namaKegiatan: string;
  hariTanggal: string;
  waktu: string;
  tempat: string;
  penyelenggara: string;
  peserta: PesertaHadirItem[];
  mengetahuiJabatan: string;
  mengetahuiNama: string;
  mengetahuiNip: string;
}

export interface PenerimaanSnackData {
  id: string;
  scope: ActivityScopeType;
  namaKegiatan: string;
  hariTanggal: string;
  waktu: string;
  tempat: string;
  penyelenggara: string;
  noBku?: string;
  uraianMenu: string;
  peserta: PesertaHadirItem[];
  mengetahuiJabatan: string;
  mengetahuiNama: string;
  mengetahuiNip: string;
  penyerahJabatan: string;
  penyerahNama: string;
  penyerahNip: string;
}

export type TabType =
  | 'dashboard'
  | 'rkas'
  | 'bku'
  | 'kwitansi'
  | 'tandaterima'
  | 'pajak'
  | 'administrasi'
  | 'verifikasi'
  | 'sppd'
  | 'pengaturan';

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'suspended';

export interface SchoolAccount {
  id: string;
  email: string;
  password?: string;
  npsn: string;
  namaSekolah: string;
  jenjang: 'SD' | 'SMP' | 'SMA' | 'SMK' | 'PAUD' | 'SLB';
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  alamat?: string;
  namaKepsek: string;
  nipKepsek?: string;
  namaBendahara: string;
  nipBendahara?: string;
  noWa: string;
  status: SubscriptionStatus;
  paketLangganan: 'Tahunan' | 'Semester' | 'Trial' | 'Pro';
  masaAktifSampai: string; // YYYY-MM-DD
  catatanAdmin?: string;
  createdAt: string;
}

export interface AuthSession {
  user: SchoolAccount | null;
  isAuthenticated: boolean;
  token?: string;
}
