import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSignature,
  Printer,
  Plus,
  Trash2,
  GraduationCap,
  Hammer,
  Users,
  Building2,
  Trophy,
  Plane,
  FolderPlus,
  CheckCircle2,
  Download,
  Edit3,
  CheckSquare,
  Square,
  Search,
  X,
  Check,
  Save,
  Sparkles,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  AppSettings,
  BkuItem,
  RkasItem,
  HonorPtkDoc,
  HonorPtkRecipient,
  GuruItem,
  TandaTerimaHonor,
  TandaTerimaTukang,
  TukangDoc,
  TukangWorker,
  TandaTerimaKkg,
  TandaTerimaMkks,
  TandaTerimaLomba,
  TandaTerimaSppdItem,
  TandaTerimaLainItem,
  StandardTandaTerimaDoc,
  StandardTandaTerimaItem,
} from '../types';
import { formatRupiah, formatNumber, formatTanggalIndo } from '../utils/formatters';
import { downloadHonorPtkPdf, downloadUpahTukangPdf, downloadStandardTandaTerimaPdf } from '../utils/pdfGenerator';
import {
  buildK3sDocs,
  buildMkksDocs,
  buildKkgDocs,
  buildPrioritasPusatDocs,
  buildLombaDocs,
  buildValidasiDocs,
  buildSppdDocs,
  buildLainDocs,
  isHonorBkuRow,
  isKode0406Row,
  isTukangBkuRow,
} from '../utils/tandaTerimaAlgorithms';
import { StandardTandaTerimaView } from './StandardTandaTerimaView';
import {
  initialTukangData,
  initialTukangDocs,
  initialKkgData,
  initialMkksData,
  initialLombaData,
} from '../data/initialData';
import { DAFTAR_BULAN, filterBkuByMonth } from '../utils/monthHelper';

interface TandaTerimaTabProps {
  settings: AppSettings;
  bkuData?: BkuItem[];
  rkasData?: RkasItem[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  selectedBulan?: string;
  onBulanChange?: (b: string) => void;
}

type SubTabKey =
  | 'gtt'
  | 'tukang'
  | 'kkg'
  | 'k3s'
  | 'mkks'
  | 'prioritas_pusat'
  | 'lomba'
  | 'validasi'
  | 'sppd'
  | 'lain';

export interface ArkasKegiatanPreset {
  kodeKeg: string;
  namaKegiatan: string;
  keterangan: string;
}

export const ARKAS_TUKANG_PRESETS: ArkasKegiatanPreset[] = [
  {
    kodeKeg: '05.08.01.',
    namaKegiatan: '05.08.01. Pemeliharaan Bangunan Gedung Sekolah (Upah Tukang)',
    keterangan: 'Pemeliharaan dan perbaikan gedung sekolah, upah tenaga kerja tukang bangunan',
  },
  {
    kodeKeg: '03.04.01.',
    namaKegiatan: '03.04.01. Pemeliharaan dan Perbaikan Ruang Kelas',
    keterangan: 'Pengecatan dinding, perbaikan plafon, pintu, jendela, lantai ruang kelas',
  },
  {
    kodeKeg: '03.04.02.',
    namaKegiatan: '03.04.02. Pemeliharaan dan Perbaikan Ruang Guru / TU / Kepala Sekolah',
    keterangan: 'Perbaikan sarana ruang guru, ruang kepala sekolah, ruang administrasi',
  },
  {
    kodeKeg: '03.04.03.',
    namaKegiatan: '03.04.03. Pemeliharaan dan Perbaikan Kamar Mandi / Toilet / Sanitasi Sekolah',
    keterangan: 'Perbaikan pipa air, kloset, kran air, bak mandi, saluran pembuangan',
  },
  {
    kodeKeg: '03.04.04.',
    namaKegiatan: '03.04.04. Pemeliharaan dan Perbaikan Instalasi Listrik dan Air',
    keterangan: 'Penggantian kabel, stop kontak, saklar, sekring, lampu penerangan, pompa air',
  },
  {
    kodeKeg: '03.04.05.',
    namaKegiatan: '03.04.05. Pemeliharaan Pagar, Saluran Air, Lapangan, dan Lingkungan Sekolah',
    keterangan: 'Perbaikan pagar sekolah, pembersihan selokan/drainase, perataan halaman',
  },
  {
    kodeKeg: '03.04.06.',
    namaKegiatan: '03.04.06. Pengecatan Gedung dan Ruang Belajar Sekolah',
    keterangan: 'Pengecatan dinding luar sekolah, kusen, lisplang gedung sekolah',
  },
  {
    kodeKeg: '03.04.07.',
    namaKegiatan: '03.04.07. Pemeliharaan dan Perbaikan Sarana Prasarana Lainnya',
    keterangan: 'Perbaikan atap bocor, genteng, talang seng, lisplang lapuk',
  },
];

function getBulanTahunIndo(tglStr: string): string {
  if (!tglStr) return 'AGUSTUS 2025';
  const parts = tglStr.split(/[-/]/);
  if (parts.length >= 3) {
    const monthNames = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    let monthIdx = -1;
    let year = parts[2];
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parts[0];
      monthIdx = parseInt(parts[1], 10) - 1;
    } else {
      // DD-MM-YYYY
      monthIdx = parseInt(parts[1], 10) - 1;
    }
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${monthNames[monthIdx]} ${year}`;
    }
  }
  return tglStr.toUpperCase();
}

/**
 * Algoritma pencocokan nama & jabatan penerima honor dengan Master Guru di Pengaturan
 */
export function resolvePtkFromGuruList(
  rawNama: string,
  uraian: string,
  guruList: GuruItem[]
): { nama: string; jabatan: string; matchedGuru?: GuruItem } {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/^(bpk|ibu|guru|ptk|gtt|tas|ops|operator|sdn|sd)\.?\s+/gi, '')
      .replace(/[^a-z0-9]/g, '');

  const cRaw = clean(rawNama);
  const cUraian = clean(uraian);

  // 1. Direct match by extracted rawNama against guruList
  if (cRaw && cRaw.length >= 3) {
    for (const g of guruList) {
      const cG = clean(g.nama);
      if (cG === cRaw || (cG.length >= 4 && cRaw.includes(cG)) || (cRaw.length >= 4 && cG.includes(cRaw))) {
        return { nama: g.nama, jabatan: g.jabatan, matchedGuru: g };
      }
    }
  }

  // 2. Check if any guru from guruList has their name contained in uraian
  for (const g of guruList) {
    const cG = clean(g.nama);
    if (cG.length >= 4 && cUraian.includes(cG)) {
      return { nama: g.nama, jabatan: g.jabatan, matchedGuru: g };
    }
  }

  // 3. Check first word of guru name (e.g. "Kartani", "Syifa", "Aji", "Siti", "Dedi", "Rina")
  for (const g of guruList) {
    const firstNameG = clean(g.nama.split(/[\s,]+/)[0]);
    if (firstNameG.length >= 4 && (cRaw.includes(firstNameG) || cUraian.includes(firstNameG))) {
      return { nama: g.nama, jabatan: g.jabatan, matchedGuru: g };
    }
  }

  // 4. Keyword heuristic based on uraian if not registered in guruList
  let fallbackJabatan = 'Guru Kelas';
  const low = uraian.toLowerCase();
  if (low.includes('administrasi') || low.includes('tas')) {
    fallbackJabatan = 'Tenaga Administrasi Sekolah (TAS)';
  } else if (low.includes('operator') || low.includes('ops')) {
    fallbackJabatan = 'Tenaga Kependidikan / Operator';
  } else if (low.includes('pjok') || low.includes('olahraga') || low.includes('penjas')) {
    fallbackJabatan = 'Guru PJOK';
  } else if (low.includes('pai') || low.includes('agama')) {
    fallbackJabatan = 'Guru Agama Islam';
  } else if (low.includes('satpam') || low.includes('penjaga') || low.includes('kebersihan')) {
    fallbackJabatan = 'Tenaga Kebersihan / Penjaga';
  } else if (low.includes('gtt') || low.includes('guru')) {
    fallbackJabatan = 'Guru Kelas';
  }

  return {
    nama: rawNama.trim() || 'Guru / Tenaga Pendidik',
    jabatan: fallbackJabatan,
  };
}

// =========================================================================
// STANDARDIZED KOP SURAT (IDENTICAL FOR ALL TANDA TERIMA IN ACCORDANCE WITH GOV RULES)
// =========================================================================
export const TandaTerimaKop: React.FC<{
  settings: AppSettings;
  desaKelurahan?: string;
  kabupaten?: string;
  namaSatuanPendidikan?: string;
}> = ({ settings, desaKelurahan, kabupaten, namaSatuanPendidikan }) => {
  const kab = (kabupaten || settings.kabupaten || 'LEBAK').toUpperCase();
  const sek = (namaSatuanPendidikan || settings.namaSekolah || 'SDN 1 CIBUNGUR').toUpperCase();
  const kec = (settings.kecamatan || 'CIGEMBLONG').toUpperCase();
  const desa = desaKelurahan || settings.desaKelurahan || 'Cibungur';
  const alamat = settings.alamat || 'Kp. Pasar Kupa';
  const npsn = settings.npsn || '20602599';
  const email = settings.emailSekolah || 'sdnnegerisatucibungur@gmail.com';
  const kodePos = settings.kodePos || '42395';

  return (
    <div className="relative pb-3 mb-4 font-sans">
      <div className="flex items-start">
        {/* Logo Pemkab / Satuan Pendidikan */}
        <div className="w-20 pt-1 shrink-0 flex justify-center">
          {settings.logoSekolah ? (
            <img
              src={settings.logoSekolah}
              alt="Logo Satuan Pendidikan"
              className="w-16 h-20 object-contain drop-shadow-xs"
            />
          ) : (
            <div className="w-16 h-20 border-2 border-slate-900 rounded-b-2xl bg-amber-50/50 flex flex-col items-center justify-center p-1 text-center shadow-xs">
              <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center font-bold text-[10px] text-blue-900 bg-white">
                ★
              </div>
              <span className="text-[9px] font-black text-slate-900 mt-1 uppercase tracking-tighter">
                LEBAK
              </span>
            </div>
          )}
        </div>

        {/* Centered Dinas & School Heading */}
        <div className="grow text-center pr-20">
          <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide leading-tight">
            PEMERINTAH KABUPATEN {kab}
          </h4>
          <h3 className="font-bold text-base text-slate-900 uppercase tracking-wide leading-tight">
            DINAS PENDIDIKAN
          </h3>
          <h2 className="font-black text-lg text-slate-900 uppercase tracking-wide leading-tight">
            UPTD SATUAN PENDIDIKAN {sek}
          </h2>
          <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide leading-tight">
            KECAMATAN {kec}
          </h4>
          <p className="text-[10px] text-slate-700 leading-tight mt-1">
            Alamat: {alamat}, Desa {desa}, Kecamatan {kec}, Kabupaten {kab}, Provinsi Banten,
          </p>
          <p className="text-[10px] text-slate-700 leading-tight">
            NPSN: {npsn}, Email: {email}, Kode Pos {kodePos}
          </p>
        </div>
      </div>

      {/* Garis Ganda Kop Surat Resmi */}
      <div className="mt-3">
        <div className="border-t-[2.5px] border-slate-950"></div>
        <div className="border-t-[1px] border-slate-950 mt-[1.5px]"></div>
      </div>
    </div>
  );
};

// =========================================================================
// STANDARDIZED METADATA & KOTAK BKU / KODE REKENING
// =========================================================================
export const TandaTerimaMetadata: React.FC<{
  bulan: string;
  namaSatuanPendidikan: string;
  desaKelurahan: string;
  kabupaten: string;
  namaKegiatan: string;
  noBku: string;
  labelBku?: string;
}> = ({
  bulan,
  namaSatuanPendidikan,
  desaKelurahan,
  kabupaten,
  namaKegiatan,
  noBku,
  labelBku = 'No. BKU',
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 text-xs font-semibold text-slate-900">
      {/* Sisi Kiri: Metadata Kegiatan */}
      <div className="space-y-1">
        <div className="grid grid-cols-[160px_10px_1fr] items-center">
          <span className="font-normal text-slate-700">Bulan / Periode</span>
          <span>:</span>
          <span className="font-bold uppercase">{bulan}</span>
        </div>
        <div className="grid grid-cols-[160px_10px_1fr] items-center">
          <span className="font-normal text-slate-700">Nama Satuan Pendidikan</span>
          <span>:</span>
          <span className="font-bold">{namaSatuanPendidikan}</span>
        </div>
        <div className="grid grid-cols-[160px_10px_1fr] items-center">
          <span className="font-normal text-slate-700">Desa/Kelurahan</span>
          <span>:</span>
          <span>{desaKelurahan}</span>
        </div>
        <div className="grid grid-cols-[160px_10px_1fr] items-center">
          <span className="font-normal text-slate-700">Kabupaten</span>
          <span>:</span>
          <span>{kabupaten}</span>
        </div>
        <div className="grid grid-cols-[160px_10px_1fr] items-center">
          <span className="font-normal text-slate-700">Nama Kegiatan</span>
          <span>:</span>
          <span className="font-bold">{namaKegiatan}</span>
        </div>
      </div>

      {/* Sisi Kanan: Kotak No. BKU / Kode Rekening Resmi */}
      <div className="border-2 border-slate-950 px-4 py-2 rounded-xs min-w-[180px] flex items-center justify-between self-start sm:self-auto bg-slate-50/50 print:bg-transparent">
        <span className="font-bold text-xs text-slate-950">{labelBku}</span>
        <span className="font-black text-sm font-mono text-slate-950 ml-6">
          {noBku}
        </span>
      </div>
    </div>
  );
};

// =========================================================================
// STANDARDIZED OFFICIAL 2-PARTY SIGNATURE BLOCK
// =========================================================================
export const TandaTerimaSignatures: React.FC<{
  settings: AppSettings;
  tempatTgl?: string;
  namaBendahara?: string;
  nipBendahara?: string;
  namaKepsek?: string;
  nipKepsek?: string;
  jabatanKepsek?: string;
  jabatanBendahara?: string;
}> = ({
  settings,
  tempatTgl,
  namaBendahara,
  nipBendahara,
  namaKepsek,
  nipKepsek,
  jabatanKepsek = 'Kepala Satuan Pendidikan',
  jabatanBendahara = 'Bendahara Sekolah / BOSP',
}) => {
  const tglStr = tempatTgl || `${settings.desaKelurahan || 'Cibungur'}, ${settings.kotaTanggal || '15 April 2026'}`;
  return (
    <div className="pt-8 grid grid-cols-2 text-center text-xs font-bold text-slate-900">
      <div>
        <p className="mb-14 leading-tight">
          Mengetahui,<br />
          {jabatanKepsek}
        </p>
        <p className="font-black underline text-slate-950 text-sm min-h-[1.25rem]">
          {namaKepsek || settings.namaKepsek || ''}
        </p>
        <p className="text-[11px] font-mono font-normal text-slate-700 mt-0.5">
          {(nipKepsek || settings.nipKepsek) ? `NIP. ${nipKepsek || settings.nipKepsek}` : ''}
        </p>
      </div>

      <div>
        <p className="font-normal text-slate-800 leading-tight">
          {tglStr}
        </p>
        <p className="font-bold text-slate-950 mb-14 leading-tight">
          {jabatanBendahara}
        </p>
        <p className="font-black underline text-slate-950 text-sm">
          {namaBendahara || settings.namaBendahara || 'SUHENDRI, S.Pd'}
        </p>
        <p className="text-[11px] font-mono font-normal text-slate-700 mt-0.5">
          NIP. {nipBendahara || settings.nipBendahara || '198208042022211009'}
        </p>
      </div>
    </div>
  );
};

export const TandaTerimaTab: React.FC<TandaTerimaTabProps> = ({
  settings,
  bkuData = [],
  rkasData = [],
  showToast,
  selectedBulan = 'Januari',
  onBulanChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('gtt');

  // Filter BKU data untuk bulan yang dipilih
  const monthlyBkuData = useMemo(() => {
    if (!selectedBulan || selectedBulan === 'Semua Bulan') return bkuData;
    return filterBkuByMonth(bkuData, selectedBulan);
  }, [bkuData, selectedBulan]);

  // Custom overrides for Honor documents (when user edits a BPU)
  const [customOverrides, setCustomOverrides] = useState<Record<string, HonorPtkDoc>>({});
  const [manualDocs, setManualDocs] = useState<HonorPtkDoc[]>([]);

  // Modal State for Editing / Adding
  const [editingDoc, setEditingDoc] = useState<HonorPtkDoc | null>(null);

  // Quick Edit Recipient state (for editing an individual recipient & jabatan on the fly)
  const [quickEditRecipient, setQuickEditRecipient] = useState<{
    docNoBku: string;
    recipientIndex: number;
    nama: string;
    jabatan: string;
    vol: string;
    harga: number;
  } | null>(null);

  // Search filter for BPU checklist
  const [searchBpuQuery, setSearchBpuQuery] = useState('');

  // 1. ALGORITMA EKSTRAKSI DOKUMEN HONOR GTT DARI BKU & RKAS
  const derivedHonorDocs = useMemo<HonorPtkDoc[]>(() => {
    if (!monthlyBkuData || monthlyBkuData.length === 0) {
      return [];
    }

    // Filter BKU rows matching Honor (Hanya kode program/kegiatan 07.12. dan seterusnya untuk GTT dan Tenaga Administrasi)
    const honorBkuRows = monthlyBkuData.filter((row) => isHonorBkuRow(row, rkasData));

    if (honorBkuRows.length === 0) {
      return [];
    }

    // Group rows by noBukti
    const map = new Map<string, BkuItem[]>();
    honorBkuRows.forEach((row) => {
      const existing = map.get(row.noBukti) || [];
      existing.push(row);
      map.set(row.noBukti, existing);
    });

    const docs: HonorPtkDoc[] = [];

    map.forEach((rows, noBku) => {
      const first = rows[0];
      const bulan = getBulanTahunIndo(first.tgl);

      // Nama kegiatan menyesuaikan dengan format dokumen (jangan menggunakan nama standar)
      const namaKegiatan = 'Honorarium Guru dan Tenaga Kependidikan';

      const recipients: HonorPtkRecipient[] = rows.map((r, idx) => {
        // Extract recipient name
        let rawNama = r.penerimaName || '';
        if (!rawNama) {
          const parenMatch = r.uraian.match(/\(([^)]+)\)/);
          if (
            parenMatch &&
            !parenMatch[1].toLowerCase().includes('bulan') &&
            !parenMatch[1].toLowerCase().includes('hari') &&
            !parenMatch[1].toLowerCase().includes('porsi')
          ) {
            rawNama = parenMatch[1];
          } else {
            const hyphenSplit = r.uraian.split(/[-–]/);
            if (hyphenSplit.length > 1) {
              rawNama = hyphenSplit[hyphenSplit.length - 1].trim();
            } else {
              rawNama = r.uraian;
            }
          }
        }

        // SMART RESOLUTION: Ambil nama dan jabatan resmi dari daftar guru di Pengaturan
        const resolved = resolvePtkFromGuruList(rawNama, r.uraian, settings.guruList || []);

        const vol = '1 Bulan';
        const harga = r.keluar;
        const jumlah = r.keluar;

        return {
          no: idx + 1,
          nama: resolved.nama,
          jabatan: resolved.jabatan,
          vol,
          harga,
          jumlah,
        };
      });

      const totalJumlah = recipients.reduce((sum, r) => sum + r.jumlah, 0);
      const tempatTgl = `${settings.desaKelurahan || 'Cibungur'}, ${formatTanggalIndo(first.tgl)}`;

      docs.push({
        id: `ptk-${noBku}`,
        noBku,
        bulan,
        tgl: first.tgl,
        namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
        desaKelurahan: settings.desaKelurahan || 'Cibungur',
        kabupaten: settings.kabupaten || 'Lebak',
        namaKegiatan,
        kodeKeg: first.kodeKeg,
        kodeRek: first.kodeRek,
        recipients,
        totalJumlah,
        tempatTgl,
        namaBendahara: settings.namaBendahara || 'SUHENDRI, S.Pd',
        nipBendahara: settings.nipBendahara || '198208042022211009',
        namaKepsek: settings.namaKepsek,
        nipKepsek: settings.nipKepsek,
      });
    });

    return docs;
  }, [monthlyBkuData, rkasData, settings]);

  // Default fallback if no BKU is parsed yet, matching exact user uploaded PDF (BPU98)
  const defaultHonorDoc: HonorPtkDoc = useMemo(
    () => ({
      id: 'ptk-BPU98',
      noBku: 'BPU98',
      bulan: 'AGUSTUS 2025',
      tgl: '12-08-2025',
      namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
      desaKelurahan: settings.desaKelurahan || 'Cibungur',
      kabupaten: settings.kabupaten || 'Lebak',
      namaKegiatan: 'Honorarium Guru dan Tenaga Kependidikan',
      kodeKeg: '07.12.01.',
      kodeRek: '5.1.02.02.01.0013',
      recipients: [
        {
          no: 1,
          nama: 'KARTANI, S.H',
          jabatan:
            settings.guruList?.find((g) =>
              g.nama.toLowerCase().includes('kartani')
            )?.jabatan || 'Guru Kelas',
          vol: '1 Bulan',
          harga: 1000000,
          jumlah: 1000000,
        },
      ],
      totalJumlah: 1000000,
      tempatTgl: `${settings.desaKelurahan || 'Cigemblong'}, 12 Agustus 2025`,
      namaBendahara: settings.namaBendahara || 'SUHENDRI, S.Pd',
      nipBendahara: settings.nipBendahara || '198208042022211009',
      namaKepsek: settings.namaKepsek,
      nipKepsek: settings.nipKepsek,
    }),
    [settings]
  );

  // Merged all available honor documents
  const allHonorDocs = useMemo<HonorPtkDoc[]>(() => {
    // Only derive honor docs from BKU or manualDocs; do not show dummy BPU98 when BKU is empty
    const list = derivedHonorDocs;
    const withOverrides = list.map((doc) => customOverrides[doc.noBku] || doc);
    return [...withOverrides, ...manualDocs];
  }, [derivedHonorDocs, customOverrides, manualDocs]);

  // 2. CHECKBOX SELECTION LIST BY NO. BUKTI (LIKE KWITANSI)
  const [selectedBpus, setSelectedBpus] = useState<string[]>(() => {
    return allHonorDocs.map((d) => d.noBku);
  });

  // Ensure newly loaded docs get selected by default
  React.useEffect(() => {
    if (allHonorDocs.length > 0) {
      setSelectedBpus((prev) => {
        const valid = new Set(allHonorDocs.map((d) => d.noBku));
        const filteredPrev = prev.filter((k) => valid.has(k));
        if (filteredPrev.length === 0) {
          return allHonorDocs.map((d) => d.noBku);
        }
        return filteredPrev;
      });
    }
  }, [allHonorDocs]);

  const toggleBpuSelection = (noBku: string) => {
    setSelectedBpus((prev) =>
      prev.includes(noBku) ? prev.filter((k) => k !== noBku) : [...prev, noBku]
    );
  };

  const handleSelectAllBpus = () => {
    setSelectedBpus(allHonorDocs.map((d) => d.noBku));
  };

  const handleDeselectAllBpus = () => {
    setSelectedBpus([]);
  };

  // Filtered documents according to user checkbox selection
  const selectedDocs = useMemo(() => {
    return allHonorDocs.filter((doc) => selectedBpus.includes(doc.noBku));
  }, [allHonorDocs, selectedBpus]);

  const totalSelectedNominal = useMemo(() => {
    return selectedDocs.reduce((sum, d) => sum + d.totalJumlah, 0);
  }, [selectedDocs]);

  // Search filter for selection chips
  const filteredChips = useMemo(() => {
    if (!searchBpuQuery.trim()) return allHonorDocs;
    const q = searchBpuQuery.toLowerCase();
    return allHonorDocs.filter(
      (d) =>
        d.noBku.toLowerCase().includes(q) ||
        d.namaKegiatan.toLowerCase().includes(q) ||
        d.recipients.some((r) => r.nama.toLowerCase().includes(q))
    );
  }, [allHonorDocs, searchBpuQuery]);

  // Export handlers
  const handleDownloadSelectedPdf = () => {
    if (selectedDocs.length === 0) {
      showToast('Pilih minimal satu No. Bukti BKU untuk diunduh', 'error');
      return;
    }
    downloadHonorPtkPdf(selectedDocs, settings);
    showToast(`Berhasil mengunduh ${selectedDocs.length} Berkas PDF Tanda Terima Honor PTK`, 'success');
  };

  const handleDownloadSinglePdf = (doc: HonorPtkDoc) => {
    downloadHonorPtkPdf([doc], settings, `Tanda_Terima_Honor_PTK_${doc.noBku}.pdf`);
    showToast(`Mengunduh PDF untuk ${doc.noBku}`, 'success');
  };

  const handlePrint = () => {
    if (selectedDocs.length === 0) {
      showToast('Pilih minimal satu No. Bukti BKU untuk dicetak', 'error');
      return;
    }
    window.print();
  };

  // Open edit modal
  const handleOpenEditModal = (doc: HonorPtkDoc) => {
    // Deep clone to allow safe editing
    setEditingDoc(JSON.parse(JSON.stringify(doc)));
  };

  const handleCreateNewManualDoc = () => {
    const nextNumber = allHonorDocs.length + 100;
    const newDoc: HonorPtkDoc = {
      id: `ptk-manual-${Date.now()}`,
      noBku: `BPU${nextNumber}`,
      bulan: 'AGUSTUS 2025',
      tgl: '12-08-2025',
      namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
      desaKelurahan: settings.desaKelurahan || 'Cibungur',
      kabupaten: settings.kabupaten || 'Lebak',
      namaKegiatan: 'Honorarium Guru dan Tenaga Kependidikan',
      kodeKeg: '07.12.01.',
      kodeRek: '5.1.02.02.01.0013',
      recipients: [
        {
          no: 1,
          nama: 'Nama Guru / Tendik',
          jabatan: 'Guru Kelas',
          vol: '1 Bulan',
          harga: 1000000,
          jumlah: 1000000,
        },
      ],
      totalJumlah: 1000000,
      tempatTgl: `${settings.desaKelurahan || 'Cigemblong'}, 12 Agustus 2025`,
      namaBendahara: settings.namaBendahara || 'SUHENDRI, S.Pd',
      nipBendahara: settings.nipBendahara || '198208042022211009',
      namaKepsek: settings.namaKepsek,
      nipKepsek: settings.nipKepsek,
    };
    setEditingDoc(newDoc);
  };

  const handleSaveEditedDoc = () => {
    if (!editingDoc) return;
    if (!editingDoc.noBku.trim()) {
      showToast('No. BKU tidak boleh kosong', 'error');
      return;
    }

    // Recalculate recipient totals
    const updatedRecipients = editingDoc.recipients.map((r, i) => ({
      ...r,
      no: i + 1,
      jumlah: (Number(r.harga) || 0),
    }));
    const updatedTotal = updatedRecipients.reduce((sum, r) => sum + r.jumlah, 0);

    const finalizedDoc: HonorPtkDoc = {
      ...editingDoc,
      recipients: updatedRecipients,
      totalJumlah: updatedTotal,
    };

    setCustomOverrides((prev) => ({
      ...prev,
      [finalizedDoc.noBku]: finalizedDoc,
    }));

    // If it's a new manual doc not yet in manualDocs
    if (!allHonorDocs.some((d) => d.noBku === finalizedDoc.noBku)) {
      setManualDocs((prev) => [...prev, finalizedDoc]);
    }

    // Ensure it is selected
    if (!selectedBpus.includes(finalizedDoc.noBku)) {
      setSelectedBpus((prev) => [...prev, finalizedDoc.noBku]);
    }

    setEditingDoc(null);
    showToast(`Perubahan Dokumen ${finalizedDoc.noBku} berhasil disimpan!`, 'success');
  };

  const handleOpenQuickEditRecipient = (doc: HonorPtkDoc, idx: number) => {
    const rec = doc.recipients[idx];
    setQuickEditRecipient({
      docNoBku: doc.noBku,
      recipientIndex: idx,
      nama: rec.nama,
      jabatan: rec.jabatan,
      vol: rec.vol || '1 Bulan',
      harga: rec.harga,
    });
  };

  const handleSaveQuickEditRecipient = () => {
    if (!quickEditRecipient) return;
    const { docNoBku, recipientIndex, nama, jabatan, vol, harga } = quickEditRecipient;

    const targetDoc = allHonorDocs.find((d) => d.noBku === docNoBku);
    if (!targetDoc) return;

    const newRecipients = [...targetDoc.recipients];
    newRecipients[recipientIndex] = {
      ...newRecipients[recipientIndex],
      nama: nama.trim() || newRecipients[recipientIndex].nama,
      jabatan: jabatan.trim() || newRecipients[recipientIndex].jabatan,
      vol: vol || '1 Bulan',
      harga,
      jumlah: harga,
    };

    const updatedDoc: HonorPtkDoc = {
      ...targetDoc,
      recipients: newRecipients,
      totalJumlah: newRecipients.reduce((sum, r) => sum + r.jumlah, 0),
    };

    setCustomOverrides((prev) => ({
      ...prev,
      [docNoBku]: updatedDoc,
    }));

    setQuickEditRecipient(null);
    showToast(`Jabatan & data penerima honor untuk No. Bukti ${docNoBku} berhasil diperbarui!`, 'success');
  };

  // Sub Tab 2: Tukang (Format persis Honor GTT & Kolom Sesuai Format Gambar & Kode ARKAS)
  const [customTukangOverrides, setCustomTukangOverrides] = useState<Record<string, TukangDoc>>({});
  const [manualTukangDocs, setManualTukangDocs] = useState<TukangDoc[]>([]);
  const [editingTukangDoc, setEditingTukangDoc] = useState<TukangDoc | null>(null);
  const [selectedTukangBpus, setSelectedTukangBpus] = useState<string[]>([]);
  const [searchTukangBpuQuery, setSearchTukangBpuQuery] = useState('');
  const [quickEditTukangWorker, setQuickEditTukangWorker] = useState<{
    docNoBku: string;
    workerIndex: number;
    nama: string;
    kualifikasi: string;
    gajiPerHari: number;
    hariKerja: number;
    pajakPph21: number;
  } | null>(null);

  // Derivasi dokumen Tukang dari BKU & ARKAS
  const derivedTukangDocs = useMemo<TukangDoc[]>(() => {
    if (!monthlyBkuData || monthlyBkuData.length === 0) {
      return [];
    }

    // HANYA proses transaksi yang memenuhi kriteria Upah Tukang & Ongkos Kerja (Bahan material bangunan masuk ke Nota Toko)
    const tukangBkuRows = monthlyBkuData.filter((row) => isTukangBkuRow(row, rkasData));

    if (tukangBkuRows.length === 0) {
      return [];
    }

    const map = new Map<string, BkuItem[]>();
    tukangBkuRows.forEach((row) => {
      const existing = map.get(row.noBukti) || [];
      existing.push(row);
      map.set(row.noBukti, existing);
    });

    const docs: TukangDoc[] = [];

    map.forEach((rows, noBku) => {
      const first = rows[0];
      const bulan = getBulanTahunIndo(first.tgl);

      // Nama kegiatan menyesuaikan dengan format dokumen: Pembayaran Upah Tukang
      const namaKegiatan = 'Pembayaran Upah Tukang';
      let kodeKeg = first.kodeKeg || '05.08.01.';
      const matchingRkas = rkasData?.find(
        (r) =>
          (r.kodeProg && (r.kodeProg.startsWith('05.08.01') || r.kodeProg === first.kodeKeg || r.kodeProg.startsWith('03.04'))) ||
          (r.kodeRek && r.kodeRek === first.kodeRek) ||
          (r.uraian && /pemeliharaan|tukang|sarpras/i.test(r.uraian))
      );
      if (matchingRkas && matchingRkas.kodeProg) {
        kodeKeg = matchingRkas.kodeProg;
      }

      // Generate workers from BKU amount
      const totalKeluar = rows.reduce((acc, r) => acc + (r.keluar || 0), 0);
      let workers: TukangWorker[] = [];

      if (rows.length === 1 && totalKeluar > 0) {
        const days = 2;
        const kepalaDaily = 120000;
        const tukangDaily = 100000;
        const pphRate = 0.005;

        const kepalaBruto = kepalaDaily * days;
        const kepalaPajak = Math.round(kepalaBruto * pphRate);
        const kepalaNetto = kepalaBruto - kepalaPajak;

        const tukangBruto = tukangDaily * days;
        const tukangPajak = Math.round(tukangBruto * pphRate);
        const tukangNetto = tukangBruto - tukangPajak;

        workers = [
          {
            id: `${noBku}-tk-1`,
            nama: 'Udin Samsudin',
            kualifikasi: 'Kepala Tukang',
            gajiPerHari: kepalaDaily,
            hariKerja: days,
            jumlahBruto: kepalaBruto,
            pajakPph21: kepalaPajak,
            diterima: kepalaNetto,
          },
          {
            id: `${noBku}-tk-2`,
            nama: 'Kuswara',
            kualifikasi: 'Tukang',
            gajiPerHari: tukangDaily,
            hariKerja: days,
            jumlahBruto: tukangBruto,
            pajakPph21: tukangPajak,
            diterima: tukangNetto,
          },
        ];
      } else {
        workers = rows.map((r, i) => {
          const amount = r.keluar || 200000;
          const days = 2;
          const daily = Math.round(amount / days);
          const pph = Math.round(amount * 0.005);
          return {
            id: `${noBku}-tk-${i + 1}`,
            nama: r.uraian.replace(/pembayaran upah tukang|upah tukang|jasa tukang/i, '').trim() || `Tukang ${i + 1}`,
            kualifikasi: i === 0 ? 'Kepala Tukang' : 'Tukang',
            gajiPerHari: daily,
            hariKerja: days,
            jumlahBruto: amount,
            pajakPph21: pph,
            diterima: amount - pph,
          };
        });
      }

      const totalBruto = workers.reduce((s, w) => s + w.jumlahBruto, 0);
      const totalPajak = workers.reduce((s, w) => s + w.pajakPph21, 0);
      const totalDiterima = workers.reduce((s, w) => s + w.diterima, 0);

      docs.push({
        id: `tukang-doc-${noBku}`,
        noBku,
        bulan,
        tgl: first.tgl || '10-04-2026',
        namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
        desaKelurahan: settings.desaKelurahan || 'Cibungur',
        kabupaten: settings.kabupaten || 'Lebak',
        namaKegiatan,
        kodeKeg,
        kodeRek: first.kodeRek || '5.1.02.02.01.0013',
        workers,
        totalBruto,
        totalPajak,
        totalDiterima,
        tempatTgl: `${settings.desaKelurahan || 'Cibungur'}, ${first.tgl ? formatTanggalIndo(first.tgl) : '10 April 2026'}`,
        namaBendahara: settings.namaBendahara || 'SUHENDRI, S.Pd',
        nipBendahara: settings.nipBendahara || '198208042022211009',
        namaKepsek: settings.namaKepsek || 'KARNA, S.Pd',
        nipKepsek: settings.nipKepsek || '197804072008011010',
      });
    });

    return docs;
  }, [monthlyBkuData, rkasData, settings]);

  // Gabungan semua dokumen Tukang (termasuk manual & overrides)
  const allTukangDocs = useMemo<TukangDoc[]>(() => {
    const baseDocs =
      derivedTukangDocs.length > 0
        ? derivedTukangDocs
        : bkuData && bkuData.length > 0
        ? []
        : initialTukangDocs;

    const docs = baseDocs.map((doc) => {
      if (customTukangOverrides[doc.noBku]) {
        return customTukangOverrides[doc.noBku];
      }
      return doc;
    });

    manualTukangDocs.forEach((mDoc) => {
      const existsIdx = docs.findIndex((d) => d.noBku === mDoc.noBku);
      if (existsIdx >= 0) {
        docs[existsIdx] = customTukangOverrides[mDoc.noBku] || mDoc;
      } else {
        docs.push(customTukangOverrides[mDoc.noBku] || mDoc);
      }
    });

    return docs;
  }, [derivedTukangDocs, customTukangOverrides, manualTukangDocs]);

  // Inisialisasi & sinkronisasi selectedTukangBpus
  useEffect(() => {
    if (allTukangDocs.length > 0) {
      setSelectedTukangBpus((prev) => {
        if (prev.length === 0) {
          return allTukangDocs.map((d) => d.noBku);
        }
        const valid = new Set(allTukangDocs.map((d) => d.noBku));
        const filtered = prev.filter((k) => valid.has(k));
        return filtered.length === 0 ? allTukangDocs.map((d) => d.noBku) : filtered;
      });
    }
  }, [allTukangDocs]);

  const toggleTukangBpuSelection = (noBku: string) => {
    setSelectedTukangBpus((prev) =>
      prev.includes(noBku) ? prev.filter((k) => k !== noBku) : [...prev, noBku]
    );
  };

  const handleSelectAllTukangBpus = () => {
    setSelectedTukangBpus(allTukangDocs.map((d) => d.noBku));
  };

  const handleDeselectAllTukangBpus = () => {
    setSelectedTukangBpus([]);
  };

  const selectedTukangDocs = useMemo(() => {
    return allTukangDocs.filter((doc) => selectedTukangBpus.includes(doc.noBku));
  }, [allTukangDocs, selectedTukangBpus]);

  const totalSelectedTukangBruto = useMemo(() => {
    return selectedTukangDocs.reduce((sum, d) => sum + d.totalBruto, 0);
  }, [selectedTukangDocs]);

  const totalSelectedTukangDiterima = useMemo(() => {
    return selectedTukangDocs.reduce((sum, d) => sum + d.totalDiterima, 0);
  }, [selectedTukangDocs]);

  const filteredTukangChips = useMemo(() => {
    if (!searchTukangBpuQuery.trim()) return allTukangDocs;
    const q = searchTukangBpuQuery.toLowerCase();
    return allTukangDocs.filter(
      (d) =>
        d.noBku.toLowerCase().includes(q) ||
        d.namaKegiatan.toLowerCase().includes(q) ||
        d.workers.some((w) => w.nama.toLowerCase().includes(q) || w.kualifikasi.toLowerCase().includes(q))
    );
  }, [allTukangDocs, searchTukangBpuQuery]);

  const handleDownloadSelectedTukangPdf = () => {
    if (selectedTukangDocs.length === 0) {
      showToast('Pilih minimal satu berkas Upah Tukang untuk diunduh', 'error');
      return;
    }
    downloadUpahTukangPdf(selectedTukangDocs, settings);
    showToast(`Mengunduh ${selectedTukangDocs.length} berkas Tanda Terima Upah Tukang Resmi PDF`, 'success');
  };

  const handleDownloadSingleTukangPdf = (doc: TukangDoc) => {
    downloadUpahTukangPdf([doc], settings, `Tanda_Terima_Upah_Tukang_${doc.noBku}.pdf`);
    showToast(`Mengunduh PDF Upah Tukang untuk ${doc.noBku}`, 'success');
  };

  const handlePrintTukang = () => {
    if (selectedTukangDocs.length === 0) {
      showToast('Pilih minimal satu berkas Upah Tukang untuk dicetak', 'error');
      return;
    }
    window.print();
  };

  const handleOpenEditTukangModal = (doc: TukangDoc) => {
    setEditingTukangDoc(JSON.parse(JSON.stringify(doc)));
  };

  const handleCreateNewManualTukangDoc = () => {
    const nextNumber = allTukangDocs.length + 50;
    const newDoc: TukangDoc = {
      id: `tukang-manual-${Date.now()}`,
      noBku: `BPU${nextNumber}`,
      bulan: 'APRIL 2026',
      tgl: '10-04-2026',
      namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
      desaKelurahan: settings.desaKelurahan || 'Cibungur',
      kabupaten: settings.kabupaten || 'Lebak',
      namaKegiatan: 'Pembayaran Upah Tukang',
      kodeKeg: '03.04.01.',
      kodeRek: '5.1.02.02.01.0013',
      workers: [
        {
          id: `tk-new-1`,
          nama: 'Udin Samsudin',
          kualifikasi: 'Kepala Tukang',
          gajiPerHari: 120000,
          hariKerja: 2,
          jumlahBruto: 240000,
          pajakPph21: 1200,
          diterima: 238800,
        },
        {
          id: `tk-new-2`,
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
      tempatTgl: `${settings.desaKelurahan || 'Cibungur'}, 10 April 2026`,
      namaBendahara: settings.namaBendahara || 'SUHENDRI, S.Pd',
      nipBendahara: settings.nipBendahara || '198208042022211009',
      namaKepsek: settings.namaKepsek || 'KARNA, S.Pd',
      nipKepsek: settings.nipKepsek || '197804072008011010',
    };

    setManualTukangDocs((prev) => [...prev, newDoc]);
    setSelectedTukangBpus((prev) => [...prev, newDoc.noBku]);
    setEditingTukangDoc(newDoc);
    showToast(`Membuat lembar Upah Tukang baru (${newDoc.noBku})`, 'info');
  };

  const handleSaveEditedTukangDoc = () => {
    if (!editingTukangDoc) return;

    // Recalculate totals
    const recalculatedWorkers = editingTukangDoc.workers.map((w) => {
      const bruto = (w.gajiPerHari || 0) * (w.hariKerja || 0);
      const pajak = w.pajakPph21 || 0;
      const netto = bruto - pajak;
      return {
        ...w,
        jumlahBruto: bruto,
        diterima: netto,
      };
    });

    const totalBruto = recalculatedWorkers.reduce((sum, w) => sum + w.jumlahBruto, 0);
    const totalPajak = recalculatedWorkers.reduce((sum, w) => sum + w.pajakPph21, 0);
    const totalDiterima = recalculatedWorkers.reduce((sum, w) => sum + w.diterima, 0);

    const finalizedDoc: TukangDoc = {
      ...editingTukangDoc,
      workers: recalculatedWorkers,
      totalBruto,
      totalPajak,
      totalDiterima,
    };

    setCustomTukangOverrides((prev) => ({
      ...prev,
      [finalizedDoc.noBku]: finalizedDoc,
    }));

    setEditingTukangDoc(null);
    showToast(`Dokumen Upah Tukang ${finalizedDoc.noBku} berhasil disimpan!`, 'success');
  };

  const handleSaveQuickEditTukangWorker = () => {
    if (!quickEditTukangWorker) return;

    const { docNoBku, workerIndex, nama, kualifikasi, gajiPerHari, hariKerja, pajakPph21 } = quickEditTukangWorker;
    const targetDoc = allTukangDocs.find((d) => d.noBku === docNoBku);
    if (!targetDoc) return;

    const updatedWorkers = [...targetDoc.workers];
    const bruto = (gajiPerHari || 0) * (hariKerja || 0);
    const netto = bruto - (pajakPph21 || 0);

    updatedWorkers[workerIndex] = {
      ...updatedWorkers[workerIndex],
      nama,
      kualifikasi,
      gajiPerHari,
      hariKerja,
      jumlahBruto: bruto,
      pajakPph21,
      diterima: netto,
    };

    const totalBruto = updatedWorkers.reduce((sum, w) => sum + w.jumlahBruto, 0);
    const totalPajak = updatedWorkers.reduce((sum, w) => sum + w.pajakPph21, 0);
    const totalDiterima = updatedWorkers.reduce((sum, w) => sum + w.diterima, 0);

    const updatedDoc: TukangDoc = {
      ...targetDoc,
      workers: updatedWorkers,
      totalBruto,
      totalPajak,
      totalDiterima,
    };

    setCustomTukangOverrides((prev) => ({
      ...prev,
      [docNoBku]: updatedDoc,
    }));

    setQuickEditTukangWorker(null);
    showToast(`Data pekerja pada No. Bukti ${docNoBku} berhasil diperbarui!`, 'success');
  };

  // Sub Tab: KKG (Unified Standard Format - Kode 04.06.02.)
  const [kkgDocs, setKkgDocs] = useState<StandardTandaTerimaDoc[]>(() =>
    buildKkgDocs(bkuData, rkasData, settings)
  );
  const [selectedKkgDocId, setSelectedKkgDocId] = useState<string>(() =>
    kkgDocs[0]?.id || ''
  );

  // Sub Tab: K3S (Unified Standard Format - Kode 04.06.02.)
  const [k3sDocs, setK3sDocs] = useState<StandardTandaTerimaDoc[]>(() =>
    buildK3sDocs(bkuData, rkasData, settings)
  );
  const [selectedK3sDocId, setSelectedK3sDocId] = useState<string>(() =>
    k3sDocs[0]?.id || ''
  );

  // Sub Tab: MKKS (Unified Standard Format - Kode 04.06.02.)
  const [mkksDocs, setMkksDocs] = useState<StandardTandaTerimaDoc[]>(() =>
    buildMkksDocs(bkuData, rkasData, settings)
  );
  const [selectedMkksDocId, setSelectedMkksDocId] = useState<string>(() =>
    mkksDocs[0]?.id || ''
  );

  // Sub Tab: Prioritas Pusat (Unified Standard Format - Kode 03.05.01.)
  const [prioritasPusatDocs, setPrioritasPusatDocs] = useState<StandardTandaTerimaDoc[]>(() =>
    buildPrioritasPusatDocs(bkuData, rkasData, settings)
  );
  const [selectedPrioritasPusatDocId, setSelectedPrioritasPusatDocId] = useState<string>(() =>
    prioritasPusatDocs[0]?.id || ''
  );

  // Sub Tab: Validasi (Unified Standard Format - Kode 07.05.04.)
  const [validasiDocs, setValidasiDocs] = useState<StandardTandaTerimaDoc[]>(() =>
    buildValidasiDocs(bkuData, rkasData, settings)
  );
  const [selectedValidasiDocId, setSelectedValidasiDocId] = useState<string>(() =>
    validasiDocs[0]?.id || ''
  );

  // Sub Tab: Lomba (Guru & Siswa - Kode 03.03.19.)
  const [lombaMode, setLombaMode] = useState<'guru' | 'siswa'>('guru');
  const [lombaGuruDocs, setLombaGuruDocs] = useState<StandardTandaTerimaDoc[]>(() =>
    buildLombaDocs(bkuData, rkasData, settings, 'guru')
  );
  const [lombaSiswaDocs, setLombaSiswaDocs] = useState<StandardTandaTerimaDoc[]>(() =>
    buildLombaDocs(bkuData, rkasData, settings, 'siswa')
  );
  const [selectedLombaDocId, setSelectedLombaDocId] = useState<string>(() =>
    lombaGuruDocs[0]?.id || ''
  );

  // Sub Tab: SPPD (Unified Standard Format)
  const [sppdDocs, setSppdDocs] = useState<StandardTandaTerimaDoc[]>(() =>
    buildSppdDocs(bkuData, rkasData, settings)
  );
  const [selectedSppdDocId, setSelectedSppdDocId] = useState<string>(() =>
    sppdDocs[0]?.id || ''
  );

  // Sub Tab: Lain-lain (Unified Standard Format)
  const [lainDocs, setLainDocs] = useState<StandardTandaTerimaDoc[]>(() =>
    buildLainDocs(bkuData, rkasData, settings)
  );
  const [selectedLainDocId, setSelectedLainDocId] = useState<string>(() =>
    lainDocs[0]?.id || ''
  );

  // Auto-detect and sync documents when new BKU or ARKAS data is loaded
  useEffect(() => {
    if (monthlyBkuData) {
      const detectedK3s = buildK3sDocs(monthlyBkuData, rkasData, settings);
      setK3sDocs(detectedK3s);
      setSelectedK3sDocId((prev) => (detectedK3s.some((d) => d.id === prev) ? prev : detectedK3s[0]?.id || ''));

      const detectedMkks = buildMkksDocs(monthlyBkuData, rkasData, settings);
      setMkksDocs(detectedMkks);
      setSelectedMkksDocId((prev) => (detectedMkks.some((d) => d.id === prev) ? prev : detectedMkks[0]?.id || ''));

      const detectedKkg = buildKkgDocs(monthlyBkuData, rkasData, settings);
      setKkgDocs(detectedKkg);
      setSelectedKkgDocId((prev) => (detectedKkg.some((d) => d.id === prev) ? prev : detectedKkg[0]?.id || ''));

      const detectedPrioritas = buildPrioritasPusatDocs(monthlyBkuData, rkasData, settings);
      setPrioritasPusatDocs(detectedPrioritas);
      setSelectedPrioritasPusatDocId((prev) => (detectedPrioritas.some((d) => d.id === prev) ? prev : detectedPrioritas[0]?.id || ''));

      const detectedValidasi = buildValidasiDocs(monthlyBkuData, rkasData, settings);
      setValidasiDocs(detectedValidasi);
      setSelectedValidasiDocId((prev) => (detectedValidasi.some((d) => d.id === prev) ? prev : detectedValidasi[0]?.id || ''));

      const detectedLombaGuru = buildLombaDocs(monthlyBkuData, rkasData, settings, 'guru');
      setLombaGuruDocs(detectedLombaGuru);

      const detectedLombaSiswa = buildLombaDocs(monthlyBkuData, rkasData, settings, 'siswa');
      setLombaSiswaDocs(detectedLombaSiswa);

      const detectedSppd = buildSppdDocs(monthlyBkuData, rkasData, settings);
      setSppdDocs(detectedSppd);
      setSelectedSppdDocId((prev) => (detectedSppd.some((d) => d.id === prev) ? prev : detectedSppd[0]?.id || ''));
    }
  }, [monthlyBkuData, rkasData, settings]);

  // Derived current documents
  const currentKkgDoc = kkgDocs.find((d) => d.id === selectedKkgDocId) || kkgDocs[0];
  const currentK3sDoc = k3sDocs.find((d) => d.id === selectedK3sDocId) || k3sDocs[0];
  const currentMkksDoc = mkksDocs.find((d) => d.id === selectedMkksDocId) || mkksDocs[0];
  const currentPrioritasDoc = prioritasPusatDocs.find((d) => d.id === selectedPrioritasPusatDocId) || prioritasPusatDocs[0];
  const currentValidasiDoc = validasiDocs.find((d) => d.id === selectedValidasiDocId) || validasiDocs[0];
  const currentLombaGuruDoc = lombaGuruDocs.find((d) => d.id === selectedLombaDocId) || lombaGuruDocs[0];
  const currentLombaSiswaDoc = lombaSiswaDocs.find((d) => d.id === selectedLombaDocId) || lombaSiswaDocs[0];
  const currentSppdDoc = sppdDocs.find((d) => d.id === selectedSppdDocId) || sppdDocs[0];
  const currentLainDoc = lainDocs.find((d) => d.id === selectedLainDocId) || lainDocs[0];

  // Helper untuk menambah draft manual bila BKU kosong
  const handleCreateManualMkksDoc = () => {
    const newDoc: StandardTandaTerimaDoc = {
      id: `mkks-manual-${Date.now()}`,
      category: 'mkks',
      judulDokumen: 'BUKTI PENERIMAAN UANG HARIAN MUSYAWARAH KERJA KEPALA SEKOLAH (MKKS)',
      noBku: `BPU${mkksDocs.length + 80}`,
      bulan: 'Agustus 2025',
      tgl: '12-08-2025',
      namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
      desaKelurahan: settings.desaKelurahan || 'Cibungur',
      kabupaten: settings.kabupaten || 'Lebak',
      namaKegiatan: 'Koordinasi dan Pelaksanaan Kegiatan MKKS',
      kodeKeg: '04.06.02.',
      kodeRek: '5.1.02.04.01.0001',
      items: [
        {
          id: `mkks-manual-item-1`,
          nama: settings.namaKepsek || 'KARNA, S.Pd',
          jabatan: 'Kepala Sekolah',
          vol: '1 Hari',
          harga: 200000,
          jumlah: 200000,
        },
      ],
      totalJumlah: 200000,
      tempatTgl: `${settings.desaKelurahan || 'Cibungur'}, 12 Agustus 2025`,
      namaBendahara: settings.namaBendahara || 'SUHENDRI, S.Pd',
      nipBendahara: settings.nipBendahara || '198208042022211009',
      namaKepsek: settings.namaKepsek || '',
      nipKepsek: settings.nipKepsek || '',
    };
    setMkksDocs((prev) => [newDoc, ...prev]);
    setSelectedMkksDocId(newDoc.id);
    showToast('Draft Tanda Terima MKKS manual berhasil dibuat!', 'success');
  };

  const handleCreateManualK3sDoc = () => {
    const newDoc: StandardTandaTerimaDoc = {
      id: `k3s-manual-${Date.now()}`,
      category: 'k3s',
      judulDokumen: 'BUKTI PENERIMAAN KELOMPOK KERJA KEPALA SEKOLAH (K3S)',
      noBku: `BPU${k3sDocs.length + 85}`,
      bulan: 'Agustus 2025',
      tgl: '12-08-2025',
      namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
      desaKelurahan: settings.desaKelurahan || 'Cibungur',
      kabupaten: settings.kabupaten || 'Lebak',
      namaKegiatan: 'KELOMPOK KERJA KEPALA SEKOLAH (K3S)',
      kodeKeg: '04.06.02.',
      kodeRek: '5.1.02.04.01.0001',
      items: [
        {
          id: `k3s-manual-item-1`,
          nama: settings.namaKepsek || 'KARNA, S.Pd',
          jabatan: 'Kepala Sekolah',
          vol: '1 Hari',
          harga: 200000,
          jumlah: 200000,
        },
      ],
      totalJumlah: 200000,
      tempatTgl: `${settings.desaKelurahan || 'Cibungur'}, 12 Agustus 2025`,
      namaBendahara: settings.namaBendahara || 'ATIKAWATI, S.Pd',
      nipBendahara: settings.nipBendahara || '199306082022212007',
      namaKepsek: settings.namaKepsek || 'KARNA, S.Pd',
      nipKepsek: settings.nipKepsek || '196705081991031008',
    };
    setK3sDocs((prev) => [newDoc, ...prev]);
    setSelectedK3sDocId(newDoc.id);
    showToast('Draft Tanda Terima K3S manual berhasil dibuat!', 'success');
  };

  const handleCreateManualKkgDoc = () => {
    const newDoc: StandardTandaTerimaDoc = {
      id: `kkg-manual-${Date.now()}`,
      category: 'kkg',
      judulDokumen: 'BUKTI PENERIMAAN KELOMPOK KERJA GURU (KKG)',
      noBku: `BPU${kkgDocs.length + 70}`,
      bulan: 'Agustus 2025',
      tgl: '12-08-2025',
      namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
      desaKelurahan: settings.desaKelurahan || 'Cibungur',
      kabupaten: settings.kabupaten || 'Lebak',
      namaKegiatan: 'KELOMPOK KERJA GURU (KKG)',
      kodeKeg: '04.06.02.',
      kodeRek: '5.1.02.04.01.0001',
      items: [
        {
          id: `kkg-manual-item-1`,
          nama: settings.guruList?.[0]?.nama || 'Nama Guru',
          jabatan: settings.guruList?.[0]?.jabatan || 'Guru Kelas',
          vol: '1 Hari',
          harga: 150000,
          jumlah: 150000,
        },
      ],
      totalJumlah: 150000,
      tempatTgl: `${settings.desaKelurahan || 'Cibungur'}, 12 Agustus 2025`,
      namaBendahara: settings.namaBendahara || 'ATIKAWATI, S.Pd',
      nipBendahara: settings.nipBendahara || '199306082022212007',
      namaKepsek: settings.namaKepsek || 'KARNA, S.Pd',
      nipKepsek: settings.nipKepsek || '196705081991031008',
    };
    setKkgDocs((prev) => [newDoc, ...prev]);
    setSelectedKkgDocId(newDoc.id);
    showToast('Draft Tanda Terima KKG manual berhasil dibuat!', 'success');
  };

  const handleCreateManualPrioritasDoc = () => {
    const newDoc: StandardTandaTerimaDoc = {
      id: `prioritas-manual-${Date.now()}`,
      category: 'prioritas-pusat',
      judulDokumen: 'BUKTI PENERIMAAN PELAPORAN PROGRAM PRIORITAS PUSAT',
      noBku: `BPU${prioritasPusatDocs.length + 65}`,
      bulan: 'Agustus 2025',
      tgl: '15-08-2025',
      namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
      desaKelurahan: settings.desaKelurahan || 'Cibungur',
      kabupaten: settings.kabupaten || 'Lebak',
      namaKegiatan: 'PELAPORAN PROGRAM PRIORITAS PUSAT',
      kodeKeg: '03.05.01.',
      kodeRek: '5.1.02.04.01.0001',
      items: [
        {
          id: `prioritas-manual-item-1`,
          nama: settings.namaKepsek || 'KARNA, S.Pd',
          jabatan: 'Kepala Sekolah',
          vol: '1 Hari',
          harga: 300000,
          jumlah: 300000,
        },
      ],
      totalJumlah: 300000,
      tempatTgl: `${settings.desaKelurahan || 'Cibungur'}, 15 Agustus 2025`,
      namaBendahara: settings.namaBendahara || 'ATIKAWATI, S.Pd',
      nipBendahara: settings.nipBendahara || '199306082022212007',
      namaKepsek: settings.namaKepsek || 'KARNA, S.Pd',
      nipKepsek: settings.nipKepsek || '196705081991031008',
    };
    setPrioritasPusatDocs((prev) => [newDoc, ...prev]);
    setSelectedPrioritasPusatDocId(newDoc.id);
    showToast('Draft Tanda Terima Prioritas Pusat manual berhasil dibuat!', 'success');
  };

  const handleCreateManualValidasiDoc = () => {
    const newDoc: StandardTandaTerimaDoc = {
      id: `validasi-manual-${Date.now()}`,
      category: 'validasi',
      judulDokumen: 'BUKTI PENERIMAAN UANG HARIAN VALIDASI DATA POKOK PENDIDIKAN',
      noBku: `BPU${validasiDocs.length + 60}`,
      bulan: 'Agustus 2025',
      tgl: '18-08-2025',
      namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
      desaKelurahan: settings.desaKelurahan || 'Cibungur',
      kabupaten: settings.kabupaten || 'Lebak',
      namaKegiatan: 'Validasi Data Pokok Pendidikan',
      kodeKeg: '07.05.04.',
      kodeRek: '5.1.02.04.01.0001',
      items: [
        {
          id: `validasi-manual-item-1`,
          nama: 'Operator Pendataan Dapodik',
          jabatan: 'Operator / Petugas Validasi',
          vol: '1 Hari',
          harga: 300000,
          jumlah: 300000,
        },
      ],
      totalJumlah: 300000,
      tempatTgl: `${settings.desaKelurahan || 'Cibungur'}, 18 Agustus 2025`,
      namaBendahara: settings.namaBendahara || 'SUHENDRI, S.Pd',
      nipBendahara: settings.nipBendahara || '198208042022211009',
      namaKepsek: settings.namaKepsek || '',
      nipKepsek: settings.nipKepsek || '',
    };
    setValidasiDocs((prev) => [newDoc, ...prev]);
    setSelectedValidasiDocId(newDoc.id);
    showToast('Draft Tanda Terima Validasi manual berhasil dibuat!', 'success');
  };

  const handleCreateManualLombaDoc = () => {
    const newDoc: StandardTandaTerimaDoc = {
      id: `lomba-manual-${Date.now()}`,
      category: lombaMode === 'guru' ? 'lomba-guru' : 'lomba-siswa',
      lombaType: lombaMode,
      judulDokumen:
        lombaMode === 'guru'
          ? 'BUKTI PENERIMAAN PELAKSANAAN LOMBA (GURU PENDAMPING)'
          : 'BUKTI PENERIMAAN PELAKSANAAN LOMBA (PESERTA SISWA)',
      noBku: `BPU${(lombaMode === 'guru' ? lombaGuruDocs.length : lombaSiswaDocs.length) + 75}`,
      bulan: 'Agustus 2025',
      tgl: '20-08-2025',
      namaSatuanPendidikan: settings.namaSekolah || 'SDN 1 CIBUNGUR',
      desaKelurahan: settings.desaKelurahan || 'Cibungur',
      kabupaten: settings.kabupaten || 'Lebak',
      namaKegiatan: 'PELAKSANAAN LOMBA',
      kodeKeg: '03.03.19.',
      kodeRek: '5.1.02.04.01.0001',
      items: [
        {
          id: `lomba-manual-item-1`,
          nama: lombaMode === 'guru' ? (settings.guruList?.[0]?.nama || 'Guru Pendamping') : 'Peserta Didik (Siswa)',
          jabatan: lombaMode === 'guru' ? 'Guru Pembina / Pendamping' : 'Siswa Peserta Lomba',
          vol: '1 Hari',
          harga: lombaMode === 'guru' ? 150000 : 50000,
          jumlah: lombaMode === 'guru' ? 150000 : 50000,
        },
      ],
      totalJumlah: lombaMode === 'guru' ? 150000 : 50000,
      tempatTgl: `${settings.desaKelurahan || 'Cibungur'}, 20 Agustus 2025`,
      namaBendahara: settings.namaBendahara || 'SUHENDRI, S.Pd',
      nipBendahara: settings.nipBendahara || '198208042022211009',
      namaKepsek: settings.namaKepsek || '',
      nipKepsek: settings.nipKepsek || '',
    };
    if (lombaMode === 'guru') {
      setLombaGuruDocs((prev) => [newDoc, ...prev]);
    } else {
      setLombaSiswaDocs((prev) => [newDoc, ...prev]);
    }
    setSelectedLombaDocId(newDoc.id);
    showToast(`Draft Tanda Terima Lomba (${lombaMode === 'guru' ? 'Guru' : 'Siswa'}) manual berhasil dibuat!`, 'success');
  };

  const subTabs: { key: SubTabKey; label: string }[] = [
    { key: 'gtt', label: 'GTT' },
    { key: 'tukang', label: 'Tukang' },
    { key: 'kkg', label: 'KKG' },
    { key: 'k3s', label: 'K3S' },
    { key: 'mkks', label: 'MKKS' },
    { key: 'prioritas_pusat', label: 'Prioritas Pusat' },
    { key: 'lomba', label: 'Lomba' },
    { key: 'validasi', label: 'Validasi' },
    { key: 'sppd', label: 'SPPD' },
    { key: 'lain', label: 'Lain-lain' },
  ];

  const handlePrintActiveSubTab = () => {
    if (activeSubTab === 'gtt') {
      handlePrint();
    } else if (activeSubTab === 'tukang') {
      handlePrintTukang();
    } else {
      window.print();
    }
  };

  const handleDownloadActiveSubTabPdf = () => {
    if (activeSubTab === 'gtt') {
      handleDownloadSelectedPdf();
    } else if (activeSubTab === 'tukang') {
      handleDownloadSelectedTukangPdf();
    } else if (activeSubTab === 'kkg') {
      if (!currentKkgDoc) return showToast('Belum ada berkas KKG untuk diunduh', 'error');
      downloadStandardTandaTerimaPdf([currentKkgDoc], settings);
      showToast('Mengunduh berkas PDF KKG', 'success');
    } else if (activeSubTab === 'k3s') {
      if (!currentK3sDoc) return showToast('Belum ada berkas K3S untuk diunduh', 'error');
      downloadStandardTandaTerimaPdf([currentK3sDoc], settings);
      showToast('Mengunduh berkas PDF K3S', 'success');
    } else if (activeSubTab === 'mkks') {
      if (!currentMkksDoc) return showToast('Belum ada berkas MKKS untuk diunduh', 'error');
      downloadStandardTandaTerimaPdf([currentMkksDoc], settings);
      showToast('Mengunduh berkas PDF MKKS', 'success');
    } else if (activeSubTab === 'prioritas_pusat') {
      if (!currentPrioritasDoc) return showToast('Belum ada berkas Prioritas Pusat untuk diunduh', 'error');
      downloadStandardTandaTerimaPdf([currentPrioritasDoc], settings);
      showToast('Mengunduh berkas PDF Prioritas Pusat', 'success');
    } else if (activeSubTab === 'lomba') {
      const activeDoc = lombaMode === 'guru' ? currentLombaGuruDoc : currentLombaSiswaDoc;
      if (!activeDoc) return showToast('Belum ada berkas Lomba untuk diunduh', 'error');
      downloadStandardTandaTerimaPdf([activeDoc], settings);
      showToast('Mengunduh berkas PDF Lomba', 'success');
    } else if (activeSubTab === 'validasi') {
      if (!currentValidasiDoc) return showToast('Belum ada berkas Validasi untuk diunduh', 'error');
      downloadStandardTandaTerimaPdf([currentValidasiDoc], settings);
      showToast('Mengunduh berkas PDF Validasi', 'success');
    } else if (activeSubTab === 'sppd') {
      if (!currentSppdDoc) return showToast('Belum ada berkas SPPD untuk diunduh', 'error');
      downloadStandardTandaTerimaPdf([currentSppdDoc], settings);
      showToast('Mengunduh berkas PDF SPPD', 'success');
    } else if (activeSubTab === 'lain') {
      if (!currentLainDoc) return showToast('Belum ada berkas untuk diunduh', 'error');
      downloadStandardTandaTerimaPdf([currentLainDoc], settings);
      showToast('Mengunduh berkas PDF', 'success');
    }
  };

  return (
    <div id="tab-tandaterima-view" className="space-y-6">
      {/* Top Header with Unified Dropdown & Action Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
                Modul Tanda Terima Dana BOSP
              </span>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded-full">
                Penerimaan & Uang Harian
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Terintegrasi BKU & ARKAS</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Tanda Terima {subTabs.find((o) => o.key === activeSubTab)?.label}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeSubTab === 'gtt' && 'Format lembar tanda terima resmi honorarium GTT / Tendik Dinas Pendidikan.'}
              {activeSubTab === 'tukang' && 'Format tanda terima upah tukang dan ongkos tenaga kerja pemeliharaan sarpras.'}
              {activeSubTab === 'kkg' && 'Format tanda terima uang harian Kelompok Kerja Guru (KKG).'}
              {activeSubTab === 'k3s' && 'Format tanda terima uang harian Kelompok Kerja Kepala Sekolah (K3S).'}
              {activeSubTab === 'mkks' && 'Format tanda terima uang harian Musyawarah Kerja Kepala Sekolah (MKKS).'}
              {activeSubTab === 'prioritas_pusat' && 'Format tanda terima uang harian koordinasi dan pelaporan Program Prioritas Pusat.'}
              {activeSubTab === 'lomba' && 'Format tanda terima uang harian kegiatan lomba siswa & guru pendamping.'}
              {activeSubTab === 'validasi' && 'Format tanda terima uang harian validasi data pokok pendidikan.'}
              {activeSubTab === 'sppd' && 'Format tanda terima biaya perjalanan dinas (SPPD).'}
              {activeSubTab === 'lain' && 'Format tanda terima pembayaran pengeluaran lainnya.'}
            </p>
          </div>

          {/* 1 KELOMPOK DENGAN DROPDOWN DAN CETAK */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-2 rounded-2xl border border-slate-200/90 shadow-2xs">
            {/* Dropdown Pemilihan Jenis */}
            <div className="flex items-center space-x-2 px-1">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Pilih Jenis:</span>
              <div className="relative">
                <select
                  id="select-jenis-tandaterima"
                  value={activeSubTab}
                  onChange={(e) => setActiveSubTab(e.target.value as SubTabKey)}
                  className="bg-white text-slate-800 font-bold text-xs pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-300 shadow-2xs hover:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none min-w-[140px]"
                >
                  {subTabs.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Dropdown Pemilihan Bulan */}
            {onBulanChange && (
              <div className="flex items-center space-x-2 px-1">
                <span className="text-xs font-bold text-[#093262] whitespace-nowrap">Bulan:</span>
                <div className="relative">
                  <select
                    id="select-tandaterima-bulan"
                    value={selectedBulan}
                    onChange={(e) => onBulanChange(e.target.value)}
                    className="bg-blue-50/90 text-[#072449] font-black text-xs pl-3 pr-8 py-2.5 rounded-xl border border-blue-300 shadow-2xs hover:border-[#0b4382] focus:outline-hidden focus:ring-2 focus:ring-[#0b4382] cursor-pointer appearance-none min-w-[130px]"
                  >
                    {DAFTAR_BULAN.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                    <option value="Semua Bulan">Semua Bulan (1 Tahun)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#0b4382] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Kelompok Tombol Aksi: Tambah, Unduh PDF, & Cetak Langsung */}
            {activeSubTab === 'gtt' && (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-tambah-honor-manual"
                  onClick={handleCreateNewManualDoc}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-1 cursor-pointer transition-colors"
                  title="Tambah BPU Manual"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tambah</span>
                </button>
                <button
                  id="btn-download-honor-pdf"
                  onClick={handleDownloadSelectedPdf}
                  disabled={selectedDocs.length === 0}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  title="Unduh Berkas PDF Resmi"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  id="btn-cetak-honor-print"
                  onClick={handlePrint}
                  disabled={selectedDocs.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  title="Cetak Langsung"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
              </div>
            )}

            {activeSubTab === 'tukang' && (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-tambah-tukang-manual"
                  onClick={handleCreateNewManualTukangDoc}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-1 cursor-pointer transition-colors"
                  title="Tambah Berkas Tukang"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tambah</span>
                </button>
                <button
                  id="btn-download-tukang-pdf"
                  onClick={handleDownloadSelectedTukangPdf}
                  disabled={selectedTukangDocs.length === 0}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  title="Unduh Berkas PDF Resmi"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  id="btn-cetak-tukang-print"
                  onClick={handlePrintTukang}
                  disabled={selectedTukangDocs.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  title="Cetak Langsung"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
              </div>
            )}

            {/* Untuk format Standard (KKG, K3S, MKKS, Prioritas, Lomba, Validasi, SPPD, Lain) */}
            {activeSubTab !== 'gtt' && activeSubTab !== 'tukang' && (
              <div className="flex items-center gap-1.5">
                {activeSubTab === 'kkg' && (
                  <button
                    onClick={handleCreateManualKkgDoc}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Tambah Draft KKG Manual"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tambah</span>
                  </button>
                )}
                {activeSubTab === 'k3s' && (
                  <button
                    onClick={handleCreateManualK3sDoc}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Tambah Draft K3S Manual"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Tambah</span>
                  </button>
                )}
                {activeSubTab === 'mkks' && (
                  <button
                    onClick={handleCreateManualMkksDoc}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Tambah Draft MKKS Manual"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tambah</span>
                  </button>
                )}
                {activeSubTab === 'prioritas_pusat' && (
                  <button
                    onClick={handleCreateManualPrioritasDoc}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Tambah Draft Prioritas Manual"
                  >
                    <Plus className="w-3.5 h-3.5 text-teal-600" />
                    <span>Tambah</span>
                  </button>
                )}
                {activeSubTab === 'lomba' && (
                  <button
                    onClick={handleCreateManualLombaDoc}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Tambah Draft Lomba Manual"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tambah</span>
                  </button>
                )}
                {activeSubTab === 'validasi' && (
                  <button
                    onClick={handleCreateManualValidasiDoc}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-300 shadow-2xs flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Tambah Draft Validasi Manual"
                  >
                    <Plus className="w-3.5 h-3.5 text-violet-600" />
                    <span>Tambah</span>
                  </button>
                )}
                <button
                  id="btn-download-standard-pdf"
                  onClick={handleDownloadActiveSubTabPdf}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  title="Unduh Berkas PDF Resmi"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF</span>
                </button>
                <button
                  id="btn-cetak-standard-print"
                  onClick={handlePrintActiveSubTab}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                  title="Cetak Langsung"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SUB TAB 1: HONOR GTT / TENDIK */}
      {activeSubTab === 'gtt' && (
        <div className="space-y-6">
          {allHonorDocs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3 no-print shadow-xs">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Belum Ada Data Honor Guru (BKU Kosong)
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Silakan unggah berkas BKU (Buku Kas Umum) yang memuat transaksi belanja honorarium guru/pegawai pada menu <strong>Buku Kas Umum (BKU)</strong>, atau tambahkan bukti honor secara manual.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCreateNewManualDoc}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Bukti Honor Manual</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* COMPACT CHECKLIST SELECTION LIKE KWITANSI (USER PREFERRED DESIGN) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">
                  Pilih No. Bukti BKU untuk Dicetak / Diunduh:
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  ({selectedDocs.length} dipilih)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search Filter */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari BPU / Nama..."
                    value={searchBpuQuery}
                    onChange={(e) => setSearchBpuQuery(e.target.value)}
                    className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-36 sm:w-44"
                  />
                  {searchBpuQuery && (
                    <button
                      onClick={() => setSearchBpuQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Select / Deselect All */}
                <button
                  onClick={handleSelectAllBpus}
                  className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  onClick={handleDeselectAllBpus}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Compact Chips Grid (No prices, clean BPU badges with edit action) */}
            <div className="flex flex-wrap gap-2 pt-1">
              {filteredChips.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">
                  Tidak ada No. Bukti BKU yang cocok dengan pencarian "{searchBpuQuery}".
                </div>
              ) : (
                filteredChips.map((doc) => {
                  const isChecked = selectedBpus.includes(doc.noBku);
                  return (
                    <div
                      key={doc.noBku}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs ${
                        isChecked
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => toggleBpuSelection(doc.noBku)}
                        className="flex items-center space-x-1.5 cursor-pointer focus:outline-hidden"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-mono tracking-tight">{doc.noBku}</span>
                      </button>

                      {/* Edit Button directly on each chip */}
                      <button
                        title={`Edit / Ubah data ${doc.noBku}`}
                        onClick={() => handleOpenEditModal(doc)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded transition-colors cursor-pointer ml-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Info Summary Footer */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {selectedDocs.length} dari {allHonorDocs.length} Dokumen BPU Terpilih
                </span>
                <span>•</span>
                <span className="font-bold text-slate-700">
                  Total Honor: {formatRupiah(totalSelectedNominal)}
                </span>
              </div>
              <div className="text-[11px] text-blue-600 font-medium">
                Klik ikon pensil di samping No. Bukti untuk mengubah data sebelum mencetak.
              </div>
            </div>
          </div>

          {/* EMPTY STATE ALERT */}
          {selectedDocs.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center space-y-2 no-print">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="font-bold text-sm">Tidak Ada Dokumen yang Dipilih</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                Silakan ceklis minimal satu No. Bukti BKU pada daftar di atas atau klik tombol "Pilih Semua" untuk menampilkan dan mencetak lembar tanda terima.
              </p>
              <button
                onClick={handleSelectAllBpus}
                className="mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Pilih Semua Dokumen
              </button>
            </div>
          )}

          {/* DOKUMEN TANDA TERIMA CETAK (PERSIS FORMAT PEMERINTAH / GAMBAR USER) */}
          {selectedDocs.map((doc, docIdx) => (
            <div
              key={doc.noBku}
              className="space-y-2 print:space-y-0"
              style={{ pageBreakAfter: docIdx < selectedDocs.length - 1 ? 'always' : 'auto' }}
            >
              {/* Card Action Header for Screen View */}
              <div className="bg-slate-100 px-5 py-2.5 rounded-t-2xl border border-slate-200 flex items-center justify-between no-print">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-bold font-mono text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    No. BKU: {doc.noBku}
                  </span>
                  <span className="text-slate-600 font-medium hidden sm:inline">
                    Bulan: <strong className="text-slate-800">{doc.bulan}</strong>
                  </span>
                  <span className="text-slate-400 hidden md:inline">|</span>
                  <span className="text-slate-500 text-[11px] hidden md:inline">
                    Kode ARKAS: <span className="font-mono font-bold text-slate-700">{doc.kodeKeg || '07.12.01.'}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(doc)}
                    className="text-xs bg-white hover:bg-slate-50 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit Dokumen</span>
                  </button>
                  <button
                    onClick={() => handleDownloadSinglePdf(doc)}
                    className="text-xs bg-white hover:bg-slate-50 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-600" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* AUTHENTIC OFFICIAL DOCUMENT SHEET (A4 PORTRAIT) */}
              <div className="bg-white p-8 sm:p-10 rounded-b-2xl sm:rounded-2xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 font-sans print-page-portrait">
                {/* 1. KOP SURAT RESMI */}
                <TandaTerimaKop
                  settings={settings}
                  desaKelurahan={doc.desaKelurahan}
                  kabupaten={doc.kabupaten}
                  namaSatuanPendidikan={doc.namaSatuanPendidikan}
                />

                {/* 2. JUDUL DOKUMEN */}
                <div className="text-center my-4">
                  <h3 className="font-black text-sm sm:text-base text-slate-950 uppercase tracking-wider underline">
                    DAFTAR TANDA TERIMA HONORARIUM PENDIDIK DAN TENAGA KEPENDIDIKAN (PTK)
                  </h3>
                </div>

                {/* 3. METADATA ATAS & KOTAK NO. BKU */}
                <TandaTerimaMetadata
                  bulan={doc.bulan}
                  namaSatuanPendidikan={doc.namaSatuanPendidikan}
                  desaKelurahan={doc.desaKelurahan}
                  kabupaten={doc.kabupaten}
                  namaKegiatan={doc.namaKegiatan}
                  noBku={doc.noBku}
                  labelBku="No. BKU"
                />

                {/* 4. TABEL RINCIAN PENERIMA HONOR */}
                <div className="overflow-x-auto my-3">
                  <table className="w-full border-collapse border border-slate-950 text-xs">
                    <thead>
                      <tr className="bg-slate-100 print:bg-slate-200 text-slate-950 font-black uppercase text-center border-b border-slate-950">
                        <th className="py-2 px-2 border-r border-slate-950 w-10">No</th>
                        <th className="py-2 px-3 border-r border-slate-950 text-left">Nama</th>
                        <th className="py-2 px-3 border-r border-slate-950 text-left w-48">Jabatan</th>
                        <th className="py-2 px-3 border-r border-slate-950 text-center w-24">Vol</th>
                        <th className="py-2 px-3 border-r border-slate-950 text-right w-32">Harga</th>
                        <th className="py-2 px-3 border-r border-slate-950 text-right w-32">Jumlah</th>
                        <th className="py-2 px-3 text-center w-36">Tanda Tangan</th>
                        <th className="py-2 px-2 text-center w-16 border-l border-slate-950 no-print">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-950">
                      {doc.recipients.map((item, idx) => (
                        <tr key={idx} className="group/row hover:bg-blue-50/20">
                          <td className="py-2.5 px-2 text-center border-r border-slate-950 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-bold border-r border-slate-950 text-slate-950">
                            {item.nama}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-950 text-slate-800">
                            <div className="flex items-center justify-between gap-1 group/jab">
                              <span>{item.jabatan}</span>
                              <button
                                type="button"
                                onClick={() => handleOpenQuickEditRecipient(doc, idx)}
                                className="no-print opacity-70 group-hover/jab:opacity-100 hover:opacity-100 text-blue-600 hover:text-blue-800 hover:bg-blue-100/70 p-1 rounded-md transition-all cursor-pointer"
                                title="Ubah Jabatan / Nama Penerima ini"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-950 text-center text-slate-800">
                            {item.vol || '1 Bulan'}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-950 text-right font-mono font-medium">
                            {formatRupiah(item.harga)}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-950 text-right font-mono font-bold text-slate-950">
                            {formatRupiah(item.jumlah)}
                          </td>
                          <td className="h-14 py-2 px-3 border-r border-slate-950 align-top font-mono text-[11px]">
                            {(idx + 1) % 2 === 1 ? (
                              <span className="block text-left font-semibold text-slate-800">
                                {idx + 1}.
                              </span>
                            ) : (
                              <span className="block text-right pr-4 font-semibold text-slate-800">
                                {idx + 1}.
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center border-l border-slate-950 no-print">
                            <button
                              type="button"
                              onClick={() => handleOpenQuickEditRecipient(doc, idx)}
                              className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                              title="Edit Jabatan / Penerima"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 print:bg-slate-100 font-black border-t-2 border-slate-950">
                        <td
                          colSpan={5}
                          className="py-2.5 px-4 text-center uppercase tracking-wider border-r border-slate-950 text-slate-950"
                        >
                          JUMLAH
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-950 font-mono text-sm text-slate-950">
                          {formatRupiah(doc.totalJumlah)}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-950"></td>
                        <td className="py-2.5 px-2 text-center no-print border-l border-slate-950"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 5. TANDA TANGAN PENGESAHAN (KEPALA SEKOLAH & BENDAHARA) */}
                <TandaTerimaSignatures
                  settings={settings}
                  tempatTgl={doc.tempatTgl || `${doc.desaKelurahan}, 12 Agustus 2025`}
                  namaBendahara={doc.namaBendahara}
                  nipBendahara={doc.nipBendahara}
                  namaKepsek={doc.namaKepsek}
                  nipKepsek={doc.nipKepsek}
                />
              </div>
            </div>
          ))}

          {/* EDIT & CUSTOMIZE MODAL */}
          {editingDoc && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-base">
                      Edit Dokumen Tanda Terima Honor ({editingDoc.noBku})
                    </h3>
                  </div>
                  <button
                    onClick={() => setEditingDoc(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                  {/* Section 1: Data Pokok Dokumen */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Informasi Lembar Tanda Terima
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          No. BKU (No. Bukti) *
                        </label>
                        <input
                          type="text"
                          value={editingDoc.noBku}
                          onChange={(e) =>
                            setEditingDoc({ ...editingDoc, noBku: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          placeholder="misal: BPU98"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Bulan Pembayaran *
                        </label>
                        <input
                          type="text"
                          value={editingDoc.bulan}
                          onChange={(e) =>
                            setEditingDoc({ ...editingDoc, bulan: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          placeholder="misal: AGUSTUS 2025"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tempat & Tanggal TTD *
                        </label>
                        <input
                          type="text"
                          value={editingDoc.tempatTgl}
                          onChange={(e) =>
                            setEditingDoc({ ...editingDoc, tempatTgl: e.target.value })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          placeholder="misal: Cigemblong, 12 Agustus 2025"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Satuan Pendidikan
                        </label>
                        <input
                          type="text"
                          value={editingDoc.namaSatuanPendidikan}
                          onChange={(e) =>
                            setEditingDoc({
                              ...editingDoc,
                              namaSatuanPendidikan: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Kegiatan (dari ARKAS)
                        </label>
                        <input
                          type="text"
                          value={editingDoc.namaKegiatan}
                          onChange={(e) =>
                            setEditingDoc({
                              ...editingDoc,
                              namaKegiatan: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Tabel Penerima Honor */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Daftar Penerima Honor ({editingDoc.recipients.length} Orang)
                      </h4>
                      <button
                        onClick={() => {
                          const newRec: HonorPtkRecipient = {
                            no: editingDoc.recipients.length + 1,
                            nama: 'Nama Guru / PTK Baru',
                            jabatan: 'Guru Kelas',
                            vol: '1 Bulan',
                            harga: 1000000,
                            jumlah: 1000000,
                          };
                          setEditingDoc({
                            ...editingDoc,
                            recipients: [...editingDoc.recipients, newRec],
                          });
                        }}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-blue-200 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Penerima</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <tr>
                            <th className="py-2 px-2 text-center w-10">No</th>
                            <th className="py-2 px-2 text-left">Nama Penerima</th>
                            <th className="py-2 px-2 text-left w-36">Jabatan</th>
                            <th className="py-2 px-2 text-center w-20">Vol</th>
                            <th className="py-2 px-2 text-right w-32">Honor (Rp)</th>
                            <th className="py-2 px-1 text-center w-10">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {editingDoc.recipients.map((rec, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-2 text-center font-bold text-slate-500">
                                {rIdx + 1}
                              </td>
                              <td className="py-1.5 px-2">
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={rec.nama}
                                    onChange={(e) => {
                                      const copy = [...editingDoc.recipients];
                                      copy[rIdx].nama = e.target.value;
                                      setEditingDoc({ ...editingDoc, recipients: copy });
                                    }}
                                    placeholder="Nama Lengkap"
                                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                  />
                                  {settings.guruList && settings.guruList.length > 0 && (
                                    <select
                                      defaultValue=""
                                      onChange={(e) => {
                                        const gId = e.target.value;
                                        if (!gId) return;
                                        const g = settings.guruList?.find((item) => String(item.id) === gId);
                                        if (g) {
                                          const copy = [...editingDoc.recipients];
                                          copy[rIdx].nama = g.nama;
                                          copy[rIdx].jabatan = g.jabatan;
                                          if (g.honorPerBulan && g.honorPerBulan > 0) {
                                            copy[rIdx].harga = g.honorPerBulan;
                                            copy[rIdx].jumlah = g.honorPerBulan;
                                          }
                                          setEditingDoc({ ...editingDoc, recipients: copy });
                                        }
                                        e.target.value = '';
                                      }}
                                      className="w-full text-[10px] text-blue-700 bg-blue-50/70 border border-blue-200 rounded px-1.5 py-0.5 font-medium cursor-pointer"
                                    >
                                      <option value="">⚡ Pilih dari Master Guru...</option>
                                      {settings.guruList.map((g) => (
                                        <option key={g.id} value={g.id}>
                                          {g.nama} ({g.jabatan})
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  list="jabatan-modal-datalist"
                                  value={rec.jabatan}
                                  onChange={(e) => {
                                    const copy = [...editingDoc.recipients];
                                    copy[rIdx].jabatan = e.target.value;
                                    setEditingDoc({ ...editingDoc, recipients: copy });
                                  }}
                                  placeholder="Jabatan"
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="text"
                                  value={rec.vol}
                                  onChange={(e) => {
                                    const copy = [...editingDoc.recipients];
                                    copy[rIdx].vol = e.target.value;
                                    setEditingDoc({ ...editingDoc, recipients: copy });
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-center focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-1.5 px-2">
                                <input
                                  type="number"
                                  value={rec.harga}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    const copy = [...editingDoc.recipients];
                                    copy[rIdx].harga = val;
                                    copy[rIdx].jumlah = val;
                                    setEditingDoc({ ...editingDoc, recipients: copy });
                                  }}
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-right font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                />
                              </td>
                              <td className="py-1.5 px-1 text-center">
                                <button
                                  disabled={editingDoc.recipients.length <= 1}
                                  onClick={() => {
                                    const copy = editingDoc.recipients.filter(
                                      (_, i) => i !== rIdx
                                    );
                                    setEditingDoc({ ...editingDoc, recipients: copy });
                                  }}
                                  className="text-rose-500 hover:text-rose-700 disabled:opacity-20 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                          <tr>
                            <td colSpan={4} className="py-2 px-3 text-right uppercase">
                              Total Jumlah:
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-sm text-blue-700">
                              {formatRupiah(
                                editingDoc.recipients.reduce(
                                  (sum, r) => sum + (Number(r.harga) || 0),
                                  0
                                )
                              )}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Section 3: Data Bendahara */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Penandatangan (Bendahara Sekolah)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Bendahara
                        </label>
                        <input
                          type="text"
                          value={editingDoc.namaBendahara}
                          onChange={(e) =>
                            setEditingDoc({
                              ...editingDoc,
                              namaBendahara: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          NIP Bendahara
                        </label>
                        <input
                          type="text"
                          value={editingDoc.nipBendahara}
                          onChange={(e) =>
                            setEditingDoc({
                              ...editingDoc,
                              nipBendahara: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <datalist id="jabatan-modal-datalist">
                    {Array.from(
                      new Set([
                        ...(settings.guruList?.map((g) => g.jabatan) || []),
                        'Guru Kelas',
                        'Guru Kelas 1',
                        'Guru Kelas 2',
                        'Guru Kelas 3',
                        'Guru Kelas 4',
                        'Guru Kelas 5',
                        'Guru Kelas 6',
                        'Guru PJOK',
                        'Guru Agama Islam',
                        'Tenaga Administrasi Sekolah (TAS)',
                        'Tenaga Kependidikan / Operator',
                        'Penjaga Sekolah / Satpam',
                        'Tenaga Kebersihan',
                      ])
                    ).map((j) => (
                      <option key={j} value={j} />
                    ))}
                  </datalist>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setEditingDoc(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEditedDoc}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QUICK EDIT PENERIMA & JABATAN MODAL */}
          {quickEditRecipient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs no-print animate-in fade-in">
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-blue-50/60">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Edit Penerima & Jabatan
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        No. Bukti BKU: <span className="font-mono font-bold text-blue-700">{quickEditRecipient.docNoBku}</span> (Penerima ke-{quickEditRecipient.recipientIndex + 1})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setQuickEditRecipient(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  {/* Quick Select from settings.guruList */}
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <label className="block font-bold text-blue-900">
                      ⚡ Pilih dari Daftar Guru (Pengaturan):
                    </label>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (!selectedId) return;
                        const matched = settings.guruList?.find((g) => String(g.id) === selectedId);
                        if (matched) {
                          setQuickEditRecipient((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  nama: matched.nama,
                                  jabatan: matched.jabatan,
                                  harga: matched.honorPerBulan && matched.honorPerBulan > 0 ? matched.honorPerBulan : prev.harga,
                                }
                              : null
                          );
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="">-- Pilih Guru / Tenaga Pendidik --</option>
                      {settings.guruList?.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nama} — [{g.jabatan}] ({g.status})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-blue-700">
                      Memilih guru di atas akan otomatis mengisi nama dan jabatan sesuai data master pengaturan.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Penerima Honor *
                    </label>
                    <input
                      type="text"
                      value={quickEditRecipient.nama}
                      onChange={(e) =>
                        setQuickEditRecipient({
                          ...quickEditRecipient,
                          nama: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="Nama lengkap dan gelar"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        Jabatan *
                      </label>
                      <span className="text-[10px] text-blue-600 font-semibold">
                        Dapat disesuaikan bebas
                      </span>
                    </div>
                    <input
                      type="text"
                      list="jabatan-quick-list"
                      value={quickEditRecipient.jabatan}
                      onChange={(e) =>
                        setQuickEditRecipient({
                          ...quickEditRecipient,
                          jabatan: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-blue-50/40 border border-slate-300 rounded-xl font-bold text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="misal: Guru Kelas / TAS / Operator"
                    />
                    <datalist id="jabatan-quick-list">
                      {Array.from(
                        new Set([
                          ...(settings.guruList?.map((g) => g.jabatan) || []),
                          'Guru Kelas',
                          'Guru Kelas 1',
                          'Guru Kelas 2',
                          'Guru Kelas 3',
                          'Guru Kelas 4',
                          'Guru Kelas 5',
                          'Guru Kelas 6',
                          'Guru PJOK',
                          'Guru Agama Islam',
                          'Tenaga Administrasi Sekolah (TAS)',
                          'Tenaga Kependidikan / Operator',
                          'Penjaga Sekolah / Satpam',
                          'Tenaga Kebersihan',
                        ])
                      ).map((j) => (
                        <option key={j} value={j} />
                      ))}
                    </datalist>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        'Guru Kelas',
                        'Tenaga Administrasi Sekolah (TAS)',
                        'Tenaga Kependidikan / Operator',
                        'Guru PJOK',
                        'Guru Agama Islam',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setQuickEditRecipient({
                              ...quickEditRecipient,
                              jabatan: preset,
                            })
                          }
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Volume / Periode
                      </label>
                      <input
                        type="text"
                        value={quickEditRecipient.vol}
                        onChange={(e) =>
                          setQuickEditRecipient({
                            ...quickEditRecipient,
                            vol: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-center font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        placeholder="1 Bulan"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Besaran Honor (Rp)
                      </label>
                      <input
                        type="number"
                        value={quickEditRecipient.harga}
                        onChange={(e) =>
                          setQuickEditRecipient({
                            ...quickEditRecipient,
                            harga: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-right focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setQuickEditRecipient(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuickEditRecipient}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* SUB TAB 2: UPAH TUKANG */}
      {activeSubTab === 'tukang' && (
        <div className="space-y-6">
          {allTukangDocs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4 no-print shadow-xs">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                <Hammer className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold mb-2 border border-amber-200/60">
                  <span>Kode: 05.08.01.</span>
                  <span>•</span>
                  <span>Status: Kosong di BKU</span>
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Tidak Ada Transaksi Upah Tukang Pada BKU
                </h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 leading-relaxed">
                  Untuk Upah Tukang mengambil dari Kode 05.08.01. (Pemeliharaan Bangunan Gedung Sekolah). Apabila di BKU tidak ada transaksi upah tukang dengan kode tersebut, maka daftar tanda terima upah tukang kosong.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleCreateNewManualTukangDoc}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Berkas Tukang Manual</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* COMPACT CHECKLIST SELECTION LIKE KWITANSI / HONOR GTT */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">
                  Pilih No. Bukti BKU untuk Dicetak / Diunduh:
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  ({selectedTukangDocs.length} dipilih)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search Filter */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari BPU / Nama Tukang..."
                    value={searchTukangBpuQuery}
                    onChange={(e) => setSearchTukangBpuQuery(e.target.value)}
                    className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 w-36 sm:w-48"
                  />
                  {searchTukangBpuQuery && (
                    <button
                      onClick={() => setSearchTukangBpuQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Select / Deselect All */}
                <button
                  onClick={handleSelectAllTukangBpus}
                  className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                >
                  Pilih Semua
                </button>
                <button
                  onClick={handleDeselectAllTukangBpus}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            {/* Compact Chips Grid */}
            <div className="flex flex-wrap gap-2 pt-1">
              {filteredTukangChips.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">
                  Tidak ada No. Bukti BKU yang cocok dengan pencarian "{searchTukangBpuQuery}".
                </div>
              ) : (
                filteredTukangChips.map((doc) => {
                  const isChecked = selectedTukangBpus.includes(doc.noBku);
                  return (
                    <div
                      key={doc.noBku}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs ${
                        isChecked
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <button
                        onClick={() => toggleTukangBpuSelection(doc.noBku)}
                        className="flex items-center space-x-1.5 cursor-pointer focus:outline-hidden"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-mono tracking-tight">{doc.noBku}</span>
                      </button>

                      {/* Edit Button directly on each chip */}
                      <button
                        title={`Edit / Ubah data ${doc.noBku}`}
                        onClick={() => handleOpenEditTukangModal(doc)}
                        className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100/50 rounded transition-colors cursor-pointer ml-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Info Summary Footer */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {selectedTukangDocs.length} dari {allTukangDocs.length} Dokumen BPU Terpilih
                </span>
                <span>•</span>
                <span className="font-bold text-slate-700">
                  Total Diterima: {formatRupiah(totalSelectedTukangDiterima)}
                </span>
              </div>
              <div className="text-[11px] text-amber-700 font-medium">
                Format tanda terima terstandarisasi ARKAS & Dinas Pendidikan Kab. Lebak.
              </div>
            </div>
          </div>

          {/* EMPTY STATE ALERT */}
          {selectedTukangDocs.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-2xl text-center space-y-2 no-print">
              <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="font-bold text-sm">Tidak Ada Dokumen Upah Tukang yang Dipilih</h4>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                Silakan ceklis minimal satu No. Bukti BKU pada daftar di atas atau klik tombol "Pilih Semua" untuk menampilkan dan mencetak lembar tanda terima upah tukang.
              </p>
              <button
                onClick={handleSelectAllTukangBpus}
                className="mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Pilih Semua Dokumen
              </button>
            </div>
          )}

          {/* DOKUMEN TANDA TERIMA CETAK (PERSIS FORMAT PEMERINTAH / GAMBAR USER & PERSIS HONOR GTT) */}
          {selectedTukangDocs.map((doc, docIdx) => (
            <div
              key={doc.noBku}
              className="space-y-2 print:space-y-0"
              style={{ pageBreakAfter: docIdx < selectedTukangDocs.length - 1 ? 'always' : 'auto' }}
            >
              {/* Card Action Header for Screen View */}
              <div className="bg-slate-100 px-5 py-2.5 rounded-t-2xl border border-slate-200 flex items-center justify-between no-print">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-bold font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    No. BKU: {doc.noBku}
                  </span>
                  <span className="text-slate-600 font-medium hidden sm:inline">
                    Bulan: <strong className="text-slate-800">{doc.bulan}</strong>
                  </span>
                  <span className="text-slate-400 hidden md:inline">|</span>
                  <span className="text-slate-500 text-[11px] hidden md:inline">
                    Kode ARKAS: <span className="font-mono font-bold text-slate-700">{doc.kodeKeg || '03.04.01.'}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditTukangModal(doc)}
                    className="text-xs bg-white hover:bg-slate-50 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Edit Dokumen</span>
                  </button>
                  <button
                    onClick={() => handleDownloadSingleTukangPdf(doc)}
                    className="text-xs bg-white hover:bg-slate-50 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-600" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* AUTHENTIC OFFICIAL DOCUMENT SHEET (A4 PORTRAIT) */}
              <div className="bg-white p-8 sm:p-10 rounded-b-2xl sm:rounded-2xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 font-sans print-page-portrait space-y-4">
                {/* 1. KOP SURAT RESMI */}
                <TandaTerimaKop
                  settings={settings}
                  desaKelurahan={doc.desaKelurahan}
                  kabupaten={doc.kabupaten}
                  namaSatuanPendidikan={doc.namaSatuanPendidikan}
                />

                {/* 2. JUDUL DOKUMEN */}
                <div className="text-center my-4">
                  <h3 className="font-black text-sm sm:text-base text-slate-950 uppercase tracking-wider underline">
                    DAFTAR TANDA TERIMA UPAH TUKANG & PEMELIHARAAN SARANA SEKOLAH
                  </h3>
                </div>

                {/* 3. METADATA ATAS & KOTAK NO. BKU */}
                <TandaTerimaMetadata
                  bulan={doc.bulan}
                  namaSatuanPendidikan={doc.namaSatuanPendidikan}
                  desaKelurahan={doc.desaKelurahan}
                  kabupaten={doc.kabupaten}
                  namaKegiatan={doc.namaKegiatan}
                  noBku={doc.noBku}
                  labelBku="No. BKU"
                />

                {/* 4. TABEL RINCIAN PEKERJA TUKANG (KOLOM SESUAI FORMAT GAMBAR USER) */}
                <div className="overflow-x-auto my-3">
                  <table className="w-full border-collapse border border-slate-950 text-xs">
                    <thead>
                      <tr className="bg-slate-100 print:bg-slate-200 text-slate-950 font-black uppercase text-center border-b border-slate-950">
                        <th className="py-2.5 px-2 border-r border-slate-950 w-10">No</th>
                        <th className="py-2.5 px-3 border-r border-slate-950 text-left">Nama</th>
                        <th className="py-2.5 px-3 border-r border-slate-950 text-left w-44">Kualifikasi Pekerjaan</th>
                        <th className="py-2.5 px-3 border-r border-slate-950 text-right w-28">Gaji/Hari (Rp)</th>
                        <th className="py-2.5 px-2 border-r border-slate-950 text-center w-24">Jumlah Hari kerja</th>
                        <th className="py-2.5 px-3 border-r border-slate-950 text-right w-32">Jumlah Bruto (Rp)</th>
                        <th className="py-2.5 px-3 border-r border-slate-950 text-right w-28">Pajak PPh 21</th>
                        <th className="py-2.5 px-3 border-r border-slate-950 text-right w-32">Diterima</th>
                        <th className="py-2.5 px-3 text-center w-36">Tanda tangan</th>
                        <th className="py-2.5 px-2 text-center w-16 border-l border-slate-950 no-print">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-950">
                      {doc.workers.map((worker, idx) => (
                        <tr key={worker.id || idx} className="group/row hover:bg-amber-50/20">
                          <td className="py-2.5 px-2 text-center border-r border-slate-950 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-bold border-r border-slate-950 text-slate-950">
                            {worker.nama}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-950 text-slate-800">
                            <div className="flex items-center justify-between gap-1 group/kual">
                              <span>{worker.kualifikasi}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setQuickEditTukangWorker({
                                    docNoBku: doc.noBku,
                                    workerIndex: idx,
                                    nama: worker.nama,
                                    kualifikasi: worker.kualifikasi,
                                    gajiPerHari: worker.gajiPerHari,
                                    hariKerja: worker.hariKerja,
                                    pajakPph21: worker.pajakPph21,
                                  })
                                }
                                className="no-print opacity-70 group-hover/kual:opacity-100 hover:opacity-100 text-amber-600 hover:text-amber-800 hover:bg-amber-100/70 p-1 rounded-md transition-all cursor-pointer"
                                title="Ubah data pekerja ini"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-950 text-right font-mono text-slate-800">
                            {formatRupiah(worker.gajiPerHari)}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-950 text-center font-bold text-slate-900">
                            {worker.hariKerja} Hari
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-950 text-right font-mono font-medium text-slate-950">
                            {formatRupiah(worker.jumlahBruto)}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-950 text-right font-mono text-slate-800">
                            {formatRupiah(worker.pajakPph21)}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-950 text-right font-mono font-black text-slate-950">
                            {formatRupiah(worker.diterima)}
                          </td>
                          <td className="h-14 py-2 px-3 border-r border-slate-950 align-top font-mono text-[11px]">
                            {(idx + 1) % 2 === 1 ? (
                              <span className="block text-left font-semibold text-slate-800">
                                {idx + 1}.
                              </span>
                            ) : (
                              <span className="block text-right pr-4 font-semibold text-slate-800">
                                {idx + 1}.
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center border-l border-slate-950 no-print">
                            <button
                              type="button"
                              onClick={() =>
                                setQuickEditTukangWorker({
                                  docNoBku: doc.noBku,
                                  workerIndex: idx,
                                  nama: worker.nama,
                                  kualifikasi: worker.kualifikasi,
                                  gajiPerHari: worker.gajiPerHari,
                                  hariKerja: worker.hariKerja,
                                  pajakPph21: worker.pajakPph21,
                                })
                              }
                              className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                              title="Edit Data Pekerja"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 print:bg-slate-100 font-black border-t-2 border-slate-950">
                        <td
                          colSpan={5}
                          className="py-2.5 px-4 text-center uppercase tracking-wider border-r border-slate-950 text-slate-950"
                        >
                          JUMLAH TOTAL:
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-950 font-mono text-sm text-slate-950">
                          {formatRupiah(doc.totalBruto)}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-950 font-mono text-xs text-slate-950">
                          {formatRupiah(doc.totalPajak)}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-950 font-mono text-sm text-slate-950">
                          {formatRupiah(doc.totalDiterima)}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-950"></td>
                        <td className="py-2.5 px-2 text-center no-print border-l border-slate-950"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 5. TANDA TANGAN PENGESAHAN (KEPALA SEKOLAH & BENDAHARA - KOSONG TANPA TITIK-TITIK) */}
                <TandaTerimaSignatures
                  settings={settings}
                  tempatTgl={doc.tempatTgl || `${doc.desaKelurahan}, ${doc.tgl ? formatTanggalIndo(doc.tgl) : '10 April 2026'}`}
                  namaBendahara={doc.namaBendahara}
                  nipBendahara={doc.nipBendahara}
                  namaKepsek={doc.namaKepsek}
                  nipKepsek={doc.nipKepsek}
                />
              </div>
            </div>
          ))}

          {/* MODAL EDIT FULL DOKUMEN TUKANG */}
          {editingTukangDoc && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                      <Hammer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        Edit Lembar Upah Tukang — {editingTukangDoc.noBku}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Sesuaikan Nama Kegiatan ARKAS, data kualifikasi, hari kerja, dan rincian pekerja tukang.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingTukangDoc(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto text-xs">
                  {/* Meta Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        No. Bukti BKU *
                      </label>
                      <input
                        type="text"
                        value={editingTukangDoc.noBku}
                        onChange={(e) =>
                          setEditingTukangDoc({
                            ...editingTukangDoc,
                            noBku: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Bulan & Tahun Dokumen *
                      </label>
                      <input
                        type="text"
                        value={editingTukangDoc.bulan}
                        onChange={(e) =>
                          setEditingTukangDoc({
                            ...editingTukangDoc,
                            bulan: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Tanggal Bukti (DD-MM-YYYY)
                      </label>
                      <input
                        type="text"
                        value={editingTukangDoc.tgl}
                        onChange={(e) =>
                          setEditingTukangDoc({
                            ...editingTukangDoc,
                            tgl: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* ARKAS Integration Selector & Inputs */}
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-700" />
                        <span className="font-bold text-amber-950 text-xs">
                          Kode Program & Nama Kegiatan ARKAS (Standar Kemendikbud)
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-semibold">
                        Pilih Preset ARKAS atau Tulis Bebas
                      </span>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Pilih Preset Kegiatan Standar ARKAS:
                      </label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const found = ARKAS_TUKANG_PRESETS.find((p) => p.kodeKeg === val);
                          if (found) {
                            setEditingTukangDoc({
                              ...editingTukangDoc,
                              kodeKeg: found.kodeKeg,
                              namaKegiatan: found.namaKegiatan,
                            });
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                      >
                        <option value="">-- Pilih Kode & Nama Kegiatan ARKAS --</option>
                        {ARKAS_TUKANG_PRESETS.map((preset) => (
                          <option key={preset.kodeKeg} value={preset.kodeKeg}>
                            {preset.namaKegiatan}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Kode Program ARKAS
                        </label>
                        <input
                          type="text"
                          value={editingTukangDoc.kodeKeg || ''}
                          onChange={(e) =>
                            setEditingTukangDoc({
                              ...editingTukangDoc,
                              kodeKeg: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          placeholder="03.04.01."
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block font-bold text-slate-700 mb-1">
                          Nama Kegiatan Lengkap Sesuai ARKAS *
                        </label>
                        <input
                          type="text"
                          value={editingTukangDoc.namaKegiatan}
                          onChange={(e) =>
                            setEditingTukangDoc({
                              ...editingTukangDoc,
                              namaKegiatan: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          placeholder="misal: 03.04.01. Pemeliharaan dan Perbaikan Ruang Kelas"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Workers List Management */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                        <Hammer className="w-4 h-4 text-amber-600" />
                        <span>Daftar Rincian Pekerja / Tukang</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newWorker: TukangWorker = {
                            id: `tk-${Date.now()}`,
                            nama: 'Tukang Tambahan',
                            kualifikasi: 'Tukang',
                            gajiPerHari: 100000,
                            hariKerja: 2,
                            jumlahBruto: 200000,
                            pajakPph21: 1000,
                            diterima: 199000,
                          };
                          setEditingTukangDoc({
                            ...editingTukangDoc,
                            workers: [...editingTukangDoc.workers, newWorker],
                          });
                        }}
                        className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-3 py-1.5 rounded-lg border border-amber-200 flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Pekerja</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <tr>
                            <th className="py-2.5 px-3 w-8 text-center">No</th>
                            <th className="py-2.5 px-3">Nama Pekerja</th>
                            <th className="py-2.5 px-3 w-40">Kualifikasi</th>
                            <th className="py-2.5 px-3 w-28 text-right">Gaji/Hari (Rp)</th>
                            <th className="py-2.5 px-3 w-24 text-center">Hari Kerja</th>
                            <th className="py-2.5 px-3 w-28 text-right">Bruto (Rp)</th>
                            <th className="py-2.5 px-3 w-24 text-right">PPh 21</th>
                            <th className="py-2.5 px-3 w-28 text-right">Diterima (Rp)</th>
                            <th className="py-2.5 px-2 w-10 text-center">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {editingTukangDoc.workers.map((w, wIdx) => {
                            const bruto = (w.gajiPerHari || 0) * (w.hariKerja || 0);
                            const netto = bruto - (w.pajakPph21 || 0);
                            return (
                              <tr key={w.id || wIdx} className="hover:bg-slate-50">
                                <td className="py-2 px-2 text-center text-slate-500 font-medium">{wIdx + 1}</td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={w.nama}
                                    onChange={(e) => {
                                      const updated = [...editingTukangDoc.workers];
                                      updated[wIdx] = { ...updated[wIdx], nama: e.target.value };
                                      setEditingTukangDoc({ ...editingTukangDoc, workers: updated });
                                    }}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-bold text-slate-900"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    list="kualifikasi-presets-list"
                                    value={w.kualifikasi}
                                    onChange={(e) => {
                                      const updated = [...editingTukangDoc.workers];
                                      updated[wIdx] = { ...updated[wIdx], kualifikasi: e.target.value };
                                      setEditingTukangDoc({ ...editingTukangDoc, workers: updated });
                                    }}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-medium text-slate-800"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={w.gajiPerHari}
                                    onChange={(e) => {
                                      const updated = [...editingTukangDoc.workers];
                                      const val = Number(e.target.value) || 0;
                                      const newBruto = val * (updated[wIdx].hariKerja || 0);
                                      updated[wIdx] = {
                                        ...updated[wIdx],
                                        gajiPerHari: val,
                                        jumlahBruto: newBruto,
                                        diterima: newBruto - (updated[wIdx].pajakPph21 || 0),
                                      };
                                      setEditingTukangDoc({ ...editingTukangDoc, workers: updated });
                                    }}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={w.hariKerja}
                                    onChange={(e) => {
                                      const updated = [...editingTukangDoc.workers];
                                      const val = Number(e.target.value) || 0;
                                      const newBruto = (updated[wIdx].gajiPerHari || 0) * val;
                                      updated[wIdx] = {
                                        ...updated[wIdx],
                                        hariKerja: val,
                                        jumlahBruto: newBruto,
                                        diterima: newBruto - (updated[wIdx].pajakPph21 || 0),
                                      };
                                      setEditingTukangDoc({ ...editingTukangDoc, workers: updated });
                                    }}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center font-bold"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-medium text-slate-900">
                                  {formatRupiah(bruto)}
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={w.pajakPph21}
                                    onChange={(e) => {
                                      const updated = [...editingTukangDoc.workers];
                                      const val = Number(e.target.value) || 0;
                                      updated[wIdx] = {
                                        ...updated[wIdx],
                                        pajakPph21: val,
                                        diterima: (updated[wIdx].jumlahBruto || 0) - val,
                                      };
                                      setEditingTukangDoc({ ...editingTukangDoc, workers: updated });
                                    }}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-amber-900">
                                  {formatRupiah(netto)}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    disabled={editingTukangDoc.workers.length <= 1}
                                    onClick={() => {
                                      const filtered = editingTukangDoc.workers.filter((_, i) => i !== wIdx);
                                      setEditingTukangDoc({ ...editingTukangDoc, workers: filtered });
                                    }}
                                    className="text-rose-500 hover:text-rose-700 disabled:opacity-30 disabled:cursor-not-allowed p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <datalist id="kualifikasi-presets-list">
                      <option value="Kepala Tukang" />
                      <option value="Tukang" />
                      <option value="Tukang Kayu" />
                      <option value="Tukang Bangunan" />
                      <option value="Tukang Cat" />
                      <option value="Tukang Listrik" />
                      <option value="Pekerja / Laden" />
                    </datalist>
                  </div>

                  {/* Signers Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nama Kepala Satuan Pendidikan
                      </label>
                      <input
                        type="text"
                        value={editingTukangDoc.namaKepsek || ''}
                        onChange={(e) =>
                          setEditingTukangDoc({
                            ...editingTukangDoc,
                            namaKepsek: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nama Bendahara BOSP
                      </label>
                      <input
                        type="text"
                        value={editingTukangDoc.namaBendahara || ''}
                        onChange={(e) =>
                          setEditingTukangDoc({
                            ...editingTukangDoc,
                            namaBendahara: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingTukangDoc(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedTukangDoc}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Dokumen Upah Tukang</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL QUICK EDIT WORKER */}
          {quickEditTukangWorker && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Edit Data Pekerja Tukang
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        No. Bukti: <span className="font-mono font-bold">{quickEditTukangWorker.docNoBku}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setQuickEditTukangWorker(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Pekerja Tukang *
                    </label>
                    <input
                      type="text"
                      value={quickEditTukangWorker.nama}
                      onChange={(e) =>
                        setQuickEditTukangWorker({
                          ...quickEditTukangWorker,
                          nama: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      placeholder="Nama lengkap pekerja"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        Kualifikasi Pekerjaan *
                      </label>
                      <span className="text-[10px] text-amber-700 font-semibold">
                        Keahlian / Posisi Kerja
                      </span>
                    </div>
                    <input
                      type="text"
                      value={quickEditTukangWorker.kualifikasi}
                      onChange={(e) =>
                        setQuickEditTukangWorker({
                          ...quickEditTukangWorker,
                          kualifikasi: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      placeholder="misal: Kepala Tukang / Tukang"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        'Kepala Tukang',
                        'Tukang',
                        'Tukang Kayu',
                        'Tukang Bangunan',
                        'Tukang Cat',
                        'Pekerja / Laden',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setQuickEditTukangWorker({
                              ...quickEditTukangWorker,
                              kualifikasi: preset,
                            })
                          }
                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-[10px] text-slate-600 font-medium transition-colors cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Gaji / Hari (Rp) *
                      </label>
                      <input
                        type="number"
                        value={quickEditTukangWorker.gajiPerHari}
                        onChange={(e) =>
                          setQuickEditTukangWorker({
                            ...quickEditTukangWorker,
                            gajiPerHari: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-right font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Jumlah Hari Kerja *
                      </label>
                      <input
                        type="number"
                        value={quickEditTukangWorker.hariKerja}
                        onChange={(e) =>
                          setQuickEditTukangWorker({
                            ...quickEditTukangWorker,
                            hariKerja: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-center font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Pajak PPh 21 (Rp)
                      </label>
                      <input
                        type="number"
                        value={quickEditTukangWorker.pajakPph21}
                        onChange={(e) =>
                          setQuickEditTukangWorker({
                            ...quickEditTukangWorker,
                            pajakPph21: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-right font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-500 font-medium">Total Diterima (Netto):</span>
                      <span className="font-mono font-black text-sm text-slate-900">
                        {formatRupiah(
                          (quickEditTukangWorker.gajiPerHari * quickEditTukangWorker.hariKerja) -
                          quickEditTukangWorker.pajakPph21
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setQuickEditTukangWorker(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuickEditTukangWorker}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* SUB TAB 3: KKG (Kode 04.06.02.) */}
      {activeSubTab === 'kkg' && (
        <StandardTandaTerimaView
          doc={currentKkgDoc}
          onUpdateDoc={(updated) => {
            setKkgDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
          settings={settings}
          allDocs={kkgDocs}
          selectedDocId={selectedKkgDocId || kkgDocs[0]?.id}
          onSelectDocId={setSelectedKkgDocId}
          showToast={showToast}
          titleIcon={<Users className="w-5 h-5 text-emerald-600" />}
          subtitleText="Tanda Terima Kelompok Kerja Guru (KKG) - Kode 04.06.02. Uang Harian Sesuai BKU & RKAS"
          guruList={settings.guruList}
          expectedKode="04.06.02."
          emptyReason="Untuk KKG mengambil dari Kode 04.06.02. Uang Harian. Apabila di BKU tidak ada kode 04.06.02. tersebut, berarti tidak ada uang harian untuk kegiatan tersebut."
          onCreateManualDoc={handleCreateManualKkgDoc}
        />
      )}

      {/* SUB TAB 4: K3S (Kode 04.06.02.) */}
      {activeSubTab === 'k3s' && (
        <StandardTandaTerimaView
          doc={currentK3sDoc}
          onUpdateDoc={(updated) => {
            setK3sDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
          settings={settings}
          allDocs={k3sDocs}
          selectedDocId={selectedK3sDocId || k3sDocs[0]?.id}
          onSelectDocId={setSelectedK3sDocId}
          showToast={showToast}
          titleIcon={<Building2 className="w-5 h-5 text-indigo-600" />}
          subtitleText="Tanda Terima Kelompok Kerja Kepala Sekolah (K3S) - Kode 04.06.02. Uang Harian Sesuai BKU & RKAS"
          guruList={settings.guruList}
          expectedKode="04.06.02."
          emptyReason="Untuk K3S mengambil dari Kode 04.06.02. Uang Harian. Apabila di BKU tidak ada kode 04.06.02. tersebut, berarti tidak ada uang harian untuk kegiatan tersebut."
          onCreateManualDoc={handleCreateManualK3sDoc}
        />
      )}

      {/* SUB TAB 5: MKKS (Kode 04.06.02.) */}
      {activeSubTab === 'mkks' && (
        <StandardTandaTerimaView
          doc={currentMkksDoc}
          onUpdateDoc={(updated) => {
            setMkksDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
          settings={settings}
          allDocs={mkksDocs}
          selectedDocId={selectedMkksDocId || mkksDocs[0]?.id}
          onSelectDocId={setSelectedMkksDocId}
          showToast={showToast}
          titleIcon={<Building2 className="w-5 h-5 text-blue-600" />}
          subtitleText="Tanda Terima Musyawarah Kerja Kepala Sekolah (MKKS) - Kode 04.06.02. Uang Harian Sesuai BKU & RKAS"
          guruList={settings.guruList}
          expectedKode="04.06.02."
          emptyReason="Untuk MKKS mengambil dari Kode 04.06.02. Uang Harian. Jika tidak ada kode tersebut dalam BKU berarti kosong."
          onCreateManualDoc={handleCreateManualMkksDoc}
        />
      )}

      {/* SUB TAB 6: PRIORITAS PUSAT (Kode 03.05.01.) */}
      {activeSubTab === 'prioritas_pusat' && (
        <StandardTandaTerimaView
          doc={currentPrioritasDoc}
          onUpdateDoc={(updated) => {
            setPrioritasPusatDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
          settings={settings}
          allDocs={prioritasPusatDocs}
          selectedDocId={selectedPrioritasPusatDocId || prioritasPusatDocs[0]?.id}
          onSelectDocId={setSelectedPrioritasPusatDocId}
          showToast={showToast}
          titleIcon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
          subtitleText="Kegiatan koordinasi dan pelaporan untuk mendukung Program Prioritas Pusat (Program Indonesia Pintar, BOSP, Sekolah Penggerak, dll.) - Kode 03.05.01."
          guruList={settings.guruList}
          expectedKode="03.05.01."
          emptyReason="Menambah Penerimaan Dari kode 03.05.01. Uang Harian Kegiatan koordinasi dan pelaporan untuk mendukung Program Prioritas Pusat (Program Indonesia Pintar, BOSP, Sekolah Penggerak, dll.). Jika tidak ada transaksi kode tersebut dalam BKU berarti kosong."
          onCreateManualDoc={handleCreateManualPrioritasDoc}
        />
      )}

      {/* SUB TAB 7: LOMBA (Kode 03.03.19.) */}
      {activeSubTab === 'lomba' && (
        <StandardTandaTerimaView
          doc={lombaMode === 'guru' ? currentLombaGuruDoc : currentLombaSiswaDoc}
          onUpdateDoc={(updated) => {
            if (lombaMode === 'guru') {
              setLombaGuruDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            } else {
              setLombaSiswaDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            }
          }}
          settings={settings}
          allDocs={lombaMode === 'guru' ? lombaGuruDocs : lombaSiswaDocs}
          selectedDocId={selectedLombaDocId || (lombaMode === 'guru' ? lombaGuruDocs[0]?.id : lombaSiswaDocs[0]?.id)}
          onSelectDocId={setSelectedLombaDocId}
          showToast={showToast}
          isLomba={true}
          lombaMode={lombaMode}
          onLombaModeChange={(mode) => {
            setLombaMode(mode);
            setSelectedLombaDocId(mode === 'guru' ? lombaGuruDocs[0]?.id : lombaSiswaDocs[0]?.id);
          }}
          titleIcon={<Trophy className="w-5 h-5 text-amber-500" />}
          subtitleText={
            lombaMode === 'guru'
              ? 'Tanda Terima Uang Harian Pelaksanaan Lomba (Kode 03.03.19.) - Guru Pembina / Pendamping'
              : 'Tanda Terima Uang Harian Pelaksanaan Lomba (Kode 03.03.19.) - Siswa Peserta (Mendukung Impor Excel)'
          }
          guruList={settings.guruList}
          expectedKode="03.03.19."
          emptyReason="Untuk lomba kodenya 03.03.19. Uang Harian Pelaksanaan Lomba Siswa & Guru Pendamping. Apabila di BKU tidak ada kode 03.03.19. tersebut, berarti tidak ada uang harian untuk kegiatan tersebut."
          onCreateManualDoc={handleCreateManualLombaDoc}
        />
      )}

      {/* SUB TAB 8: VALIDASI (Kode 07.05.04.) */}
      {activeSubTab === 'validasi' && (
        <StandardTandaTerimaView
          doc={currentValidasiDoc}
          onUpdateDoc={(updated) => {
            setValidasiDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
          settings={settings}
          allDocs={validasiDocs}
          selectedDocId={selectedValidasiDocId || validasiDocs[0]?.id}
          onSelectDocId={setSelectedValidasiDocId}
          showToast={showToast}
          titleIcon={<CheckSquare className="w-5 h-5 text-violet-600" />}
          subtitleText="Tanda Terima Uang Harian Validasi Data Pokok Pendidikan - Kode 07.05.04. Sesuai BKU & RKAS"
          guruList={settings.guruList}
          expectedKode="07.05.04."
          emptyReason="Penerimaan Validasi mengambil datanya dari kode 07.05.04. Apabila di BKU tidak ada kode 07.05.04. tersebut, berarti tanda terima validasi kosong."
          onCreateManualDoc={handleCreateManualValidasiDoc}
        />
      )}

      {/* SUB TAB 9: SPPD */}
      {activeSubTab === 'sppd' && (
        <StandardTandaTerimaView
          doc={currentSppdDoc}
          onUpdateDoc={(updated) => {
            setSppdDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
          settings={settings}
          allDocs={sppdDocs}
          selectedDocId={selectedSppdDocId || sppdDocs[0]?.id}
          onSelectDocId={setSelectedSppdDocId}
          showToast={showToast}
          titleIcon={<Plane className="w-5 h-5 text-blue-600" />}
          subtitleText="Tanda Terima Bukti Biaya Perjalanan Dinas (SPPD) - Format Resmi BOSP"
          guruList={settings.guruList}
          expectedKode="5.1.02.04"
          emptyReason="Belum ada transaksi Biaya Perjalanan Dinas (SPPD) pada Buku Kas Umum (BKU)."
        />
      )}

      {/* SUB TAB 10: LAIN-LAIN */}
      {activeSubTab === 'lain' && (
        <StandardTandaTerimaView
          doc={currentLainDoc}
          onUpdateDoc={(updated) => {
            setLainDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          }}
          settings={settings}
          allDocs={lainDocs}
          selectedDocId={selectedLainDocId || lainDocs[0]?.id}
          onSelectDocId={setSelectedLainDocId}
          showToast={showToast}
          isLain={true}
          titleIcon={<FolderPlus className="w-5 h-5 text-violet-600" />}
          subtitleText="Tanda Terima Penerimaan Lain-lain - Judul Kegiatan & Penerima Bebas Disesuaikan"
          guruList={settings.guruList}
          expectedKode="Lainnya"
          emptyReason="Belum ada transaksi penerimaan lainnya."
        />
      )}
    </div>
  );
};
