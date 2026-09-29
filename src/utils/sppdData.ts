import { AppSettings, GuruItem, SppdData } from '../types';

export interface SppdActivityPreset {
  id: string;
  namaKegiatan: string;
  badge: string;
  kategori: string;
  maksudPerjalanan: string;
  tempatBerangkat: string;
  tempatTujuan: string;
  instansiTujuan: string;
  lamaHari: number;
  alatAngkutan: string;
  biayaTransport: number;
  biayaUangHarian: number;
  // Visum defaults
  pejabatTujuanJabatan: string;
  pejabatTujuanNama?: string;
  pejabatTujuanNip?: string;
}

export const SPPD_KEGIATAN_PRESETS: SppdActivityPreset[] = [
  {
    id: 'rakor-bosp-disdik',
    namaKegiatan: 'Rakor & Rekonsiliasi Dana BOSP (Dinas Pendidikan Kab. Lebak)',
    badge: 'Disdik Kab. Lebak',
    kategori: 'Dinas',
    maksudPerjalanan: 'Menghadiri Rapat Koordinasi dan Rekonsiliasi Penatausahaan BKU BOSP Triwulan serta Verifikasi ARKAS 4.1 Tahun Anggaran 2026',
    tempatBerangkat: 'SDN 1 Cibungur',
    tempatTujuan: 'Dinas Pendidikan Kab. Lebak (Rangkasbitung)',
    instansiTujuan: 'Dinas Pendidikan Kabupaten Lebak',
    lamaHari: 1,
    alatAngkutan: 'Kendaraan Darat / Roda Dua',
    biayaTransport: 150000,
    biayaUangHarian: 100000,
    pejabatTujuanJabatan: 'Kepala Dinas Pendidikan Kab. Lebak',
    pejabatTujuanNama: 'H. HARI SETIONO, S.Sos., M.Si.',
    pejabatTujuanNip: '197004121996031004',
  },
  {
    id: 'kkg-gugus',
    namaKegiatan: 'Pertemuan Rutin KKG Gugus 02 (SDN 2 Cibungur)',
    badge: 'KKG Gugus 02',
    kategori: 'KKG',
    maksudPerjalanan: 'Mengikuti Kegiatan Rutin Kelompok Kerja Guru (KKG) Gugus 02 Pengembangan Perangkat Pembelajaran dan Asesmen Kurikulum Merdeka',
    tempatBerangkat: 'SDN 1 Cibungur',
    tempatTujuan: 'SDN 2 Cibungur',
    instansiTujuan: 'SDN 2 Cibungur (Gugus 02 Cigemblong)',
    lamaHari: 1,
    alatAngkutan: 'Kendaraan Darat / Sepeda Motor',
    biayaTransport: 50000,
    biayaUangHarian: 50000,
    pejabatTujuanJabatan: 'Kepala Satuan Pendidikan',
    pejabatTujuanNama: 'Iwan Fathurohman, S.Pd',
    pejabatTujuanNip: '198205172008011002',
  },
  {
    id: 'k3s-mkks',
    namaKegiatan: 'Rapat Kerja K3S / MKKS SD Kecamatan Cigemblong',
    badge: 'K3S / MKKS',
    kategori: 'MKKS',
    maksudPerjalanan: 'Menghadiri Rapat Kerja Musyawarah Kerja Kepala Sekolah (K3S/MKKS) Evaluasi Program Kerja Satuan Pendidikan dan Kalender Akademik',
    tempatBerangkat: 'SDN 1 Cibungur',
    tempatTujuan: 'Sekretariat K3S / PKG Kec. Cigemblong',
    instansiTujuan: 'K3S Satuan Pendidikan SD Kec. Cigemblong',
    lamaHari: 1,
    alatAngkutan: 'Kendaraan Darat',
    biayaTransport: 75000,
    biayaUangHarian: 50000,
    pejabatTujuanJabatan: 'Ketua K3S Kecamatan Cigemblong',
    pejabatTujuanNama: 'H. AHMAD SUHADA, M.Pd.',
    pejabatTujuanNip: '196903151992031006',
  },
  {
    id: 'pelatihan-ikm',
    namaKegiatan: 'Workshop & Pelatihan Implementasi Kurikulum Merdeka (IKM)',
    badge: 'Pelatihan Guru',
    kategori: 'Pelatihan',
    maksudPerjalanan: 'Mengikuti Workshop Peningkatan Kompetensi Pendidik dalam Penerapan Asesmen Diagnostik dan Pembelajaran Berdiferensiasi',
    tempatBerangkat: 'SDN 1 Cibungur',
    tempatTujuan: 'Gedung PGRI / UPTD Pendidikan Wilayah Cibeber - Cigemblong',
    instansiTujuan: 'UPTD Satuan Pendidikan & Pengawas Pembina',
    lamaHari: 1,
    alatAngkutan: 'Kendaraan Darat',
    biayaTransport: 100000,
    biayaUangHarian: 75000,
    pejabatTujuanJabatan: 'Pengawas Satuan Pendidikan Pembina',
    pejabatTujuanNama: 'Drs. H. SURYANA, M.Pd.',
    pejabatTujuanNip: '196808121993031005',
  },
  {
    id: 'lomba-fls2n-o2sn',
    namaKegiatan: 'Pendampingan Peserta Didik Lomba FLS2N, O2SN & OSN',
    badge: 'Lomba Siswa',
    kategori: 'Lomba',
    maksudPerjalanan: 'Mendampingi Peserta Didik dalam Mengikuti Seleksi Olimpiade Olahraga dan Seni (FLS2N & O2SN) Tingkat Kecamatan / Kabupaten',
    tempatBerangkat: 'SDN 1 Cibungur',
    tempatTujuan: 'Gelanggang Olahraga / Lokasi Seleksi Lomba Kec. Cibeber',
    instansiTujuan: 'Panitia Pelaksana Kegiatan Lomba Siswa',
    lamaHari: 1,
    alatAngkutan: 'Kendaraan Darat',
    biayaTransport: 120000,
    biayaUangHarian: 80000,
    pejabatTujuanJabatan: 'Ketua Panitia Lomba / Kepala Satuan Pendidikan di Kec. Cibeber',
    pejabatTujuanNama: '',
    pejabatTujuanNip: '',
  },
  {
    id: 'ijazah-dapodik',
    namaKegiatan: 'Verifikasi Data Ujian & Pengambilan Blanko Ijazah ke Disdik',
    badge: 'Pelayanan Ujian',
    kategori: 'Dinas',
    maksudPerjalanan: 'Melakukan Verifikasi Data Nominasi Tetap (DNT) dan Pengambilan Blanko Ijazah Kelulusan Siswa ke Dinas Pendidikan Kabupaten Lebak',
    tempatBerangkat: 'SDN 1 Cibungur',
    tempatTujuan: 'Bidang Pembinaan SD Dinas Pendidikan Kab. Lebak',
    instansiTujuan: 'Dinas Pendidikan Kabupaten Lebak',
    lamaHari: 1,
    alatAngkutan: 'Kendaraan Darat / Roda Dua',
    biayaTransport: 150000,
    biayaUangHarian: 100000,
    pejabatTujuanJabatan: 'Kepala Bidang Pembinaan SD Disdik Kab. Lebak',
    pejabatTujuanNama: 'HADI MULYA, S.Sos.',
    pejabatTujuanNip: '197107232006041006',
  },
  {
    id: 'kegiatan-kustom',
    namaKegiatan: 'Perjalanan Dinas Khusus / Penugasan Lapangan',
    badge: 'Kustom',
    kategori: 'Kustom',
    maksudPerjalanan: 'Melaksanakan Perjalanan Dinas Dalam Rangka Tugas Kedinasan Satuan Pendidikan',
    tempatBerangkat: 'SDN 1 Cibungur',
    tempatTujuan: 'Kec. Cibeber',
    instansiTujuan: 'Satuan Pendidikan / Instansi Terkait',
    lamaHari: 1,
    alatAngkutan: 'Kendaraan Darat',
    biayaTransport: 100000,
    biayaUangHarian: 75000,
    pejabatTujuanJabatan: 'Kepala Satuan Pendidikan di Kec. Cibeber',
    pejabatTujuanNama: '',
    pejabatTujuanNip: '',
  },
];

/**
 * Generate full default SPPD with official Visum fields
 */
export function createDefaultSppd(
  settings: AppSettings,
  presetId: string = 'rakor-bosp-disdik',
  guruId?: string | number,
  nomorUrut: number = 1
): SppdData {
  const preset =
    SPPD_KEGIATAN_PRESETS.find((p) => p.id === presetId) ||
    SPPD_KEGIATAN_PRESETS[0];

  const guru = guruId
    ? settings.guruList.find((g) => String(g.id) === String(guruId))
    : settings.guruList[0] || {
        id: 'g-1',
        nama: settings.namaKepsek || 'KARNA, S.Pd',
        nip: settings.nipKepsek || '197804072008011010',
        jabatan: 'Kepala Sekolah',
        gol: 'Pembina / IV.a',
        status: 'PNS',
      };

  const today = new Date().toISOString().split('T')[0];
  const year = settings.tahunAnggaran || new Date().getFullYear().toString();
  const padNum = String(nomorUrut).padStart(2, '0');

  const tempatAsal = settings.namaSekolah || 'SDN 1 Cibungur';
  const kotaAsal = settings.desaKelurahan ? `${settings.desaKelurahan} (${settings.kecamatan || 'Cigemblong'})` : (settings.kotaTanggal || 'Cigemblong');

  return {
    id: `sppd-${Date.now()}-${nomorUrut}`,
    kegiatanPresetId: preset.id,
    namaKegiatan: preset.namaKegiatan,
    noSuratTugas: `800/${padNum}/ST-SDN1CBG/${year}`,
    noSppd: `090/${padNum}/SPPD-BOSP/${year}`,
    tglSurat: today,
    pegawaiId: String(guru?.id || ''),
    pegawaiNama: guru?.nama || settings.namaKepsek || 'KARNA, S.Pd',
    pegawaiNip: guru?.nip || settings.nipKepsek || '197804072008011010',
    pegawaiPangkatGol: guru?.gol || (guru?.status === 'PNS' ? 'Penata Muda / III.a' : '-'),
    pegawaiJabatan: guru?.jabatan || 'Kepala Sekolah',
    tingkatBiaya: 'Tingkat C / Biasa',
    maksudPerjalanan: preset.maksudPerjalanan,
    alatAngkutan: preset.alatAngkutan,
    tempatBerangkat: tempatAsal,
    tempatTujuan: preset.tempatTujuan,
    lamaHari: preset.lamaHari,
    tglBerangkat: today,
    tglKembali: today,
    bebanAnggaran: `BOSP Reguler TA ${year} ${settings.namaSekolah}`,
    mataAnggaran: '5.1.02.04.01.0001 (Belanja Perjalanan Dinas Dalam Kota)',
    instansiTujuan: preset.instansiTujuan,
    biayaTransport: preset.biayaTransport,
    biayaUangHarian: preset.biayaUangHarian,
    biayaPenginapan: 0,
    biayaLainLain: 0,

    // Visum Lembar Belakang (Halaman 2 Resmi)
    ppkJabatan: 'PEJABAT PEMBUAT KOMITMEN',
    ppkNama: settings.namaKepsek || 'KARNA, S.Pd',
    ppkNip: settings.nipKepsek || '197804072008011010',

    // II. Tiba di & Berangkat dari (Tempat Tujuan)
    visumTibaDi: preset.tempatTujuan,
    visumTglTiba: today,
    visumTibaJabatan: preset.pejabatTujuanJabatan,
    visumTibaNama: preset.pejabatTujuanNama || '',
    visumTibaNip: preset.pejabatTujuanNip || '',

    visumBerangkatDari: preset.tempatTujuan,
    visumBerangkatKe: `${tempatAsal} (${kotaAsal})`,
    visumTglBerangkatKembali: today,
    visumBerangkatJabatan: preset.pejabatTujuanJabatan,
    visumBerangkatNama: preset.pejabatTujuanNama || '',
    visumBerangkatNip: preset.pejabatTujuanNip || '',

    // III & IV
    visumTahap3: {
      tibaDi: '',
      tglTiba: '',
      pejabatTibaJabatan: '',
      pejabatTibaNama: '',
      pejabatTibaNip: '',
      berangkatDari: '',
      ke: '',
      tglBerangkat: '',
      pejabatBerangkatJabatan: '',
      pejabatBerangkatNama: '',
      pejabatBerangkatNip: '',
    },
    visumTahap4: {
      tibaDi: '',
      tglTiba: '',
      pejabatTibaJabatan: '',
      pejabatTibaNama: '',
      pejabatTibaNip: '',
      berangkatDari: '',
      ke: '',
      tglBerangkat: '',
      pejabatBerangkatJabatan: '',
      pejabatBerangkatNama: '',
      pejabatBerangkatNip: '',
    },

    // V. Tiba di (Kembali ke Kedudukan)
    kembaliTibaDi: `${tempatAsal} (${kotaAsal})`,
    kembaliTglTiba: today,

    // VI. Catatan lain-lain
    catatanLain: '',
  };
}
