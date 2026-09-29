import { ActivityScopeType, AppSettings, DaftarHadirData, PenerimaanSnackData, PesertaHadirItem, SuratUndanganData } from '../types';

export interface ActivityPresetInfo {
  scope: ActivityScopeType;
  title: string;
  badge: string;
  namaKegiatan: string;
  perihal: string;
  tujuanKepada: string;
  agendaAcara: string;
  tempatAcara: string;
  waktuAcara: string;
  uraianMenu: string;
  penandatanganJabatan: string;
}

export const ACTIVITY_PRESETS: Record<ActivityScopeType, ActivityPresetInfo> = {
  kkg: {
    scope: 'kkg',
    title: 'KKG (Kelompok Kerja Guru)',
    badge: 'Gugus / Kecamatan',
    namaKegiatan: 'Pertemuan Rutin Kelompok Kerja Guru (KKG) Gugus 03 Cibungur',
    perihal: 'Undangan Kegiatan Kelompok Kerja Guru (KKG)',
    tujuanKepada: 'Yth. Bapak/Ibu Guru Anggota KKG Gugus 03 Cibungur\ndi Tempat',
    agendaAcara:
      '1. Pembukaan & Pengarahan Pengawas Pembina\n2. Penguatan Implementasi Kurikulum Merdeka & Modul Ajar Berdiferensiasi\n3. Bedah Asesmen Pembelajaran & Rapor Pendidikan\n4. Diskusi dan Tanya Jawab',
    tempatAcara: 'Gedung SDN 1 Cibungur (Gugus 03 Cibungur)',
    waktuAcara: '08.30 WIB s.d. Selesai',
    uraianMenu: 'Snack Box (Kue Tradisional + Roti) & Air Mineral',
    penandatanganJabatan: 'Ketua KKG Gugus 03 Cibungur',
  },
  mkks: {
    scope: 'mkks',
    title: 'MKKS / K3S',
    badge: 'Kelompok Kerja Kepala Sekolah',
    namaKegiatan: 'Rapat Koordinasi Kelompok Kerja Kepala Sekolah (K3S / MKKS)',
    perihal: 'Undangan Rapat Koordinasi MKKS / K3S',
    tujuanKepada: 'Yth. Bapak/Ibu Kepala Sekolah Dasar Wilayah Binaan Kec. Cigemblong\ndi Tempat',
    agendaAcara:
      '1. Evaluasi Pelaporan Penatausahaan BKU & SPJ BOSP Triwulan Berjalan\n2. Sosialisasi Juknis Pelaksanaan Asesmen Nasional (ANBK)\n3. Persiapan Lomba-Lomba Siswa (FLS2N, O2SN, OSN, FTBI)\n4. Koordinasi Kebijakan Dinas Pendidikan',
    tempatAcara: 'Aula Pertemuan K3S / SDN 1 Cibungur',
    waktuAcara: '09.00 WIB s.d. Selesai',
    uraianMenu: 'Snack Box & Kopi/Teh Rehat Rapat',
    penandatanganJabatan: 'Ketua K3S / MKKS',
  },
  rapat_dinas: {
    scope: 'rapat_dinas',
    title: 'Rapat Dinas Sekolah',
    badge: 'Dewan Guru & Tendik',
    namaKegiatan: 'Rapat Dinas Dewan Guru dan Tenaga Kependidikan Satuan Pendidikan',
    perihal: 'Undangan Rapat Dinas Dewan Guru',
    tujuanKepada: 'Yth. Bapak/Ibu Dewan Guru & Tenaga Administrasi SDN 1 Cibungur\ndi Tempat',
    agendaAcara:
      '1. Arahan dan Kebijakan Kepala Satuan Pendidikan\n2. Pembagian Tugas Mengajar dan Tugas Tambahan Guru\n3. Evaluasi Disiplin & Kinerja Tenaga Kependidikan\n4. Penyusunan Rencana Kerja Tahunan & Anggaran Sekolah',
    tempatAcara: 'Ruang Guru / Aula SDN 1 Cibungur',
    waktuAcara: '10.00 WIB s.d. Selesai',
    uraianMenu: 'Snack Box & Makanan Ringan Rapat Dinas',
    penandatanganJabatan: 'Kepala Satuan Pendidikan',
  },
  kkg_sekolah: {
    scope: 'kkg_sekolah',
    title: 'KKG Sekolah (Kombel)',
    badge: 'Di Satuan Pendidikan',
    namaKegiatan: 'Pelaksanaan Komunitas Belajar (Kombel) Guru di Satuan Pendidikan',
    perihal: 'Undangan Kegiatan Komunitas Belajar (KKG Sekolah)',
    tujuanKepada: 'Yth. Bapak/Ibu Pendidik Anggota Komunitas Belajar SDN 1 Cibungur\ndi Tempat',
    agendaAcara:
      '1. Refleksi Pembelajaran Bersama Guru Kelas & Mata Pelajaran\n2. Berbagi Praktik Baik (Best Practice) Pembelajaran Interaktif\n3. Pemanfaatan Platform Merdeka Mengajar (PMM)\n4. Penyusunan Perangkat Ajar Kolaboratif',
    tempatAcara: 'Ruang Komunitas Belajar SDN 1 Cibungur',
    waktuAcara: '13.00 WIB s.d. 15.30 WIB',
    uraianMenu: 'Snack Komunitas Belajar (Kue & Minuman Kemasan)',
    penandatanganJabatan: 'Kepala Satuan Pendidikan',
  },
  lomba: {
    scope: 'lomba',
    title: 'Pelaksanaan Lomba-Lomba',
    badge: 'FLS2N / O2SN / OSN / FTBI',
    namaKegiatan: 'Rapat Koordinasi & Pembinaan Persiapan Lomba Siswa Tingkat Kecamatan / Kabupaten',
    perihal: 'Undangan Rapat Koordinasi Pelaksanaan Lomba',
    tujuanKepada: 'Yth. Bapak/Ibu Guru Pembina & Pendamping Lomba Siswa SDN 1 Cibungur\ndi Tempat',
    agendaAcara:
      '1. Sosialisasi Juknis Pelaksanaan Lomba O2SN, FLS2N, OSN, dan FTBI\n2. Penetapan Jadwal Seleksi Internal Peserta Didik\n3. Penunjukan Guru Pembina / Pendamping Tiap Cabang Lomba\n4. Persiapan Logistik, Seragam, & Transportasi Kontingen',
    tempatAcara: 'Ruang Rapat SDN 1 Cibungur',
    waktuAcara: '09.30 WIB s.d. Selesai',
    uraianMenu: 'Snack Box Konsumsi Pembinaan Lomba',
    penandatanganJabatan: 'Kepala Satuan Pendidikan',
  },
  custom: {
    scope: 'custom',
    title: 'Kegiatan Lainnya',
    badge: 'Kustom Bebas',
    namaKegiatan: 'Rapat Koordinasi Pelaksanaan Kegiatan Pendidikan Satuan Pendidikan',
    perihal: 'Undangan Pelaksanaan Kegiatan',
    tujuanKepada: 'Yth. Bapak/Ibu Guru, Komite Sekolah, dan Undangan\ndi Tempat',
    agendaAcara: '1. Pembukaan\n2. Pembahasan Agenda Kegiatan Utama\n3. Diskusi dan Kesepakatan Bersama\n4. Penutup dan Doa',
    tempatAcara: 'SDN 1 Cibungur',
    waktuAcara: '09.00 WIB s.d. Selesai',
    uraianMenu: 'Snack Box & Konsumsi Acara',
    penandatanganJabatan: 'Kepala Satuan Pendidikan',
  },
};

export function getKetuaTitleFromKop(scope: ActivityScopeType, settings: AppSettings): string {
  if (scope === 'kkg') {
    const kkg = settings.kopKkg;
    if (kkg?.namaOrganisasi) {
      let org = kkg.namaOrganisasi.trim();
      if (/^ketua\s+/i.test(org)) return org;
      // Convert KELOMPOK KERJA GURU (KKG) into KKG
      org = org.replace(/^kelompok\s+kerja\s+guru\s*(\(kkg\))?\s*/i, 'KKG ').trim();
      return `Ketua ${org}`;
    }
    return 'Ketua KKG Gugus 03 Cibungur';
  }

  if (scope === 'mkks') {
    const mkks = settings.kopMkks;
    if (mkks?.namaOrganisasi) {
      let org = mkks.namaOrganisasi.trim();
      if (/^ketua\s+/i.test(org)) return org;
      org = org.replace(/^musyawarah\s+kerja\s+kepala\s+sekolah\s*(\(mkks\))?\s*/i, 'MKKS ')
               .replace(/^kelompok\s+kerja\s+kepala\s+sekolah\s*(\(k3s\))?\s*/i, 'K3S ').trim();
      return `Ketua ${org}`;
    }
    return 'Ketua K3S / MKKS';
  }

  return 'Kepala Satuan Pendidikan';
}

export function getPesertaKkgGugus(settings: AppSettings): PesertaHadirItem[] {
  return [
    { id: 'kkg-1', no: 1, nama: settings.namaBendahara || 'SUHENDRI, S.Pd', nip: settings.nipBendahara || '198208042022211009', jabatan: 'Guru Kelas VI', instansi: settings.namaSekolah || 'SDN 1 Cibungur', jenisKonsumsi: 'Snack Box + Air Mineral' },
    { id: 'kkg-2', no: 2, nama: 'Siti Rohmah, S.Pd', nip: '198511122023212015', jabatan: 'Guru Kelas I', instansi: settings.namaSekolah || 'SDN 1 Cibungur', jenisKonsumsi: 'Snack Box + Air Mineral' },
    { id: 'kkg-3', no: 3, nama: 'Ahmad Fauzi, S.Pd.SD', nip: '198805122019021004', jabatan: 'Guru Kelas IV', instansi: 'SDN 2 Cibungur', jenisKonsumsi: 'Snack Box + Air Mineral' },
    { id: 'kkg-4', no: 4, nama: 'Nurul Hidayati, S.Pd', nip: '199203152020122011', jabatan: 'Guru Kelas V', instansi: 'SDN 2 Cibungur', jenisKonsumsi: 'Snack Box + Air Mineral' },
    { id: 'kkg-5', no: 5, nama: 'Dadan Hamdani, S.Pd', nip: '198607142014031002', jabatan: 'Guru PJOK', instansi: 'SDN 1 Cigemblong', jenisKonsumsi: 'Snack Box + Air Mineral' },
    { id: 'kkg-6', no: 6, nama: 'Encep Suryana, S.Pd', nip: '198901202022211005', jabatan: 'Guru Kelas III', instansi: 'SDN 2 Cigemblong', jenisKonsumsi: 'Snack Box + Air Mineral' },
    { id: 'kkg-7', no: 7, nama: 'Yayan Sofyan, S.Pd', nip: '198409102010011012', jabatan: 'Guru PAI', instansi: 'SDN 3 Cigemblong', jenisKonsumsi: 'Snack Box + Air Mineral' },
    { id: 'kkg-8', no: 8, nama: 'Iwan Setiawan, S.Pd', nip: '199104052019031007', jabatan: 'Guru Kelas II', instansi: 'SDN 1 Mugijaya', jenisKonsumsi: 'Snack Box + Air Mineral' },
  ];
}

export function getPesertaMkks(settings: AppSettings): PesertaHadirItem[] {
  return [
    { id: 'mkks-1', no: 1, nama: settings.namaKepsek || 'KARNA, S.Pd', nip: settings.nipKepsek || '197804072008011010', jabatan: 'Kepala Sekolah', instansi: settings.namaSekolah || 'SDN 1 Cibungur', jenisKonsumsi: 'Snack Box + Kopi/Teh' },
    { id: 'mkks-2', no: 2, nama: 'H. Mulyadi, M.Pd', nip: '197206151998031005', jabatan: 'Kepala Sekolah', instansi: 'SDN 2 Cibungur', jenisKonsumsi: 'Snack Box + Kopi/Teh' },
    { id: 'mkks-3', no: 3, nama: 'Drs. H. Suryana', nip: '196908121994121002', jabatan: 'Kepala Sekolah', instansi: 'SDN 1 Cigemblong', jenisKonsumsi: 'Snack Box + Kopi/Teh' },
    { id: 'mkks-4', no: 4, nama: 'Hj. Siti Aminah, S.Pd.M.M', nip: '197403201997022001', jabatan: 'Kepala Sekolah', instansi: 'SDN 2 Cigemblong', jenisKonsumsi: 'Snack Box + Kopi/Teh' },
    { id: 'mkks-5', no: 5, nama: 'Tb. Hendra, S.Pd', nip: '197705182003121004', jabatan: 'Kepala Sekolah', instansi: 'SDN 3 Cigemblong', jenisKonsumsi: 'Snack Box + Kopi/Teh' },
    { id: 'mkks-6', no: 6, nama: 'Asep Saepudin, S.Pd.SD', nip: '197509142005011008', jabatan: 'Kepala Sekolah', instansi: 'SDN 1 Mugijaya', jenisKonsumsi: 'Snack Box + Kopi/Teh' },
    { id: 'mkks-7', no: 7, nama: 'Rohaeti, S.Pd.SD', nip: '197611022006042013', jabatan: 'Kepala Sekolah', instansi: 'SDN 2 Mugijaya', jenisKonsumsi: 'Snack Box + Kopi/Teh' },
  ];
}

export function getPesertaFromGuruList(settings: AppSettings): PesertaHadirItem[] {
  if (!settings.guruList || settings.guruList.length === 0) {
    return [
      { id: 'p-1', no: 1, nama: settings.namaKepsek || 'KARNA, S.Pd', nip: settings.nipKepsek || '197804072008011010', jabatan: 'Kepala Sekolah', instansi: settings.namaSekolah || 'SDN 1 Cibungur', jenisKonsumsi: 'Snack Box + Air Mineral' },
      { id: 'p-2', no: 2, nama: settings.namaBendahara || 'SUHENDRI, S.Pd', nip: settings.nipBendahara || '198208042022211009', jabatan: 'Bendahara BOSP / Guru Kelas', instansi: settings.namaSekolah || 'SDN 1 Cibungur', jenisKonsumsi: 'Snack Box + Air Mineral' },
      { id: 'p-3', no: 3, nama: 'Siti Rohmah, S.Pd', nip: '198511122023212015', jabatan: 'Guru Kelas 1', instansi: settings.namaSekolah || 'SDN 1 Cibungur', jenisKonsumsi: 'Snack Box + Air Mineral' },
      { id: 'p-4', no: 4, nama: 'Dedi Kurniawan, S.Pd.SD', nip: '199002152019031008', jabatan: 'Guru PJOK', instansi: settings.namaSekolah || 'SDN 1 Cibungur', jenisKonsumsi: 'Snack Box + Air Mineral' },
      { id: 'p-5', no: 5, nama: 'Rina Marlina, S.Pd', nip: '-', jabatan: 'Guru Agama Islam', instansi: settings.namaSekolah || 'SDN 1 Cibungur', jenisKonsumsi: 'Snack Box + Air Mineral' },
      { id: 'p-6', no: 6, nama: 'KARTANI, S.H', nip: '-', jabatan: 'Guru Kelas', instansi: settings.namaSekolah || 'SDN 1 Cibungur', jenisKonsumsi: 'Snack Box + Air Mineral' },
    ];
  }

  return settings.guruList.map((g, idx) => ({
    id: `p-${g.id || idx + 1}`,
    no: idx + 1,
    nama: g.nama,
    nip: g.nip && g.nip.trim() !== '' ? g.nip : '-',
    jabatan: g.jabatan || 'Guru',
    instansi: settings.namaSekolah || 'SDN 1 Cibungur',
    jenisKonsumsi: 'Snack Box + Air Mineral',
  }));
}

export function createDefaultUndangan(
  scope: ActivityScopeType,
  settings: AppSettings,
  idSuffix: string = '1'
): SuratUndanganData {
  const preset = ACTIVITY_PRESETS[scope] || ACTIVITY_PRESETS.kkg;
  const isSekolahHead = scope === 'rapat_dinas' || scope === 'kkg_sekolah' || scope === 'lomba' || scope === 'custom';
  const namaPenandatangan = settings.namaKepsek || 'KARNA, S.Pd';
  const nipPenandatangan = settings.nipKepsek || '197804072008011010';
  const jabatanPenandatangan = getKetuaTitleFromKop(scope, settings);

  return {
    id: `undangan-${scope}-${idSuffix}`,
    scope,
    namaKegiatan: preset.namaKegiatan,
    nomorSurat: `421.2/0${idSuffix}8/SD-01/${settings.tahunAnggaran || '2026'}`,
    sifat: 'Penting',
    lampiran: '-',
    perihal: preset.perihal,
    tglSurat: '2026-04-18',
    tempatDitetapkan: settings.desaKelurahan || 'Cibungur',
    tujuanKepada: preset.tujuanKepada,
    pembukaText:
      'Dalam rangka meningkatkan mutu layanan pendidikan serta kelancaran pelaksanaan program kegiatan, dengan ini kami mengundang Bapak/Ibu untuk hadir pada rapat/pertemuan yang akan diselenggarakan pada:',
    hariTglAcara: 'Selasa, 21 April 2026',
    waktuAcara: preset.waktuAcara,
    tempatAcara: preset.tempatAcara,
    agendaAcara: preset.agendaAcara,
    penutupText:
      'Mengingat pentingnya agenda tersebut di atas, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya. Atas perhatian, kerja sama, dan kehadirannya kami sampaikan terima kasih.',
    penandatanganJabatan: jabatanPenandatangan,
    penandatanganNama: namaPenandatangan,
    penandatanganNip: nipPenandatangan,
  };
}

export function createDefaultDaftarHadir(
  scope: ActivityScopeType,
  settings: AppSettings,
  idSuffix: string = '1'
): DaftarHadirData {
  const preset = ACTIVITY_PRESETS[scope] || ACTIVITY_PRESETS.kkg;
  const pesertaList =
    scope === 'kkg'
      ? getPesertaKkgGugus(settings)
      : scope === 'mkks'
      ? getPesertaMkks(settings)
      : getPesertaFromGuruList(settings);

  return {
    id: `hadir-${scope}-${idSuffix}`,
    scope,
    namaKegiatan: preset.namaKegiatan,
    hariTanggal: 'Selasa, 21 April 2026',
    waktu: preset.waktuAcara,
    tempat: preset.tempatAcara,
    penyelenggara: settings.namaSekolah || 'SDN 1 CIBUNGUR',
    peserta: pesertaList,
    mengetahuiJabatan: getKetuaTitleFromKop(scope, settings),
    mengetahuiNama: settings.namaKepsek || 'KARNA, S.Pd',
    mengetahuiNip: settings.nipKepsek || '197804072008011010',
  };
}

export function createDefaultPenerimaanSnack(
  scope: ActivityScopeType,
  settings: AppSettings,
  idSuffix: string = '1'
): PenerimaanSnackData {
  const preset = ACTIVITY_PRESETS[scope] || ACTIVITY_PRESETS.kkg;
  const pesertaList =
    scope === 'kkg'
      ? getPesertaKkgGugus(settings)
      : scope === 'mkks'
      ? getPesertaMkks(settings)
      : getPesertaFromGuruList(settings);

  return {
    id: `snack-${scope}-${idSuffix}`,
    scope,
    namaKegiatan: preset.namaKegiatan,
    hariTanggal: 'Selasa, 21 April 2026',
    waktu: preset.waktuAcara,
    tempat: preset.tempatAcara,
    penyelenggara: settings.namaSekolah || 'SDN 1 CIBUNGUR',
    noBku: scope === 'kkg_sekolah' ? 'BPU47' : scope === 'rapat_dinas' ? 'BPU32' : 'BPU65',
    uraianMenu: preset.uraianMenu,
    peserta: pesertaList,
    mengetahuiJabatan: getKetuaTitleFromKop(scope, settings),
    mengetahuiNama: settings.namaKepsek || 'KARNA, S.Pd',
    mengetahuiNip: settings.nipKepsek || '197804072008011010',
    penyerahJabatan: 'Bendahara BOSP',
    penyerahNama: settings.namaBendahara || 'SUHENDRI, S.Pd',
    penyerahNip: settings.nipBendahara || '198208042022211009',
  };
}
