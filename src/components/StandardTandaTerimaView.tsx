import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  Download,
  Edit3,
  FileSpreadsheet,
  Upload,
  Check,
  X,
  Building2,
  Users,
  Trophy,
  Plane,
  FolderPlus,
  Search,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppSettings, StandardTandaTerimaDoc, StandardTandaTerimaItem } from '../types';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { downloadStandardTandaTerimaPdf } from '../utils/pdfGenerator';
import { TandaTerimaKop } from './TandaTerimaTab';

interface StandardTandaTerimaViewProps {
  doc?: StandardTandaTerimaDoc;
  onUpdateDoc: (updated: StandardTandaTerimaDoc) => void;
  settings: AppSettings;
  allDocs: StandardTandaTerimaDoc[];
  selectedDocId?: string;
  onSelectDocId: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isLomba?: boolean;
  lombaMode?: 'guru' | 'siswa';
  onLombaModeChange?: (mode: 'guru' | 'siswa') => void;
  isLain?: boolean;
  titleIcon?: React.ReactNode;
  subtitleText?: string;
  guruList?: { nama: string; jabatan?: string }[];
  expectedKode?: string;
  emptyReason?: string;
  onCreateManualDoc?: () => void;
}

export const StandardTandaTerimaView: React.FC<StandardTandaTerimaViewProps> = ({
  doc: propDoc,
  onUpdateDoc,
  settings,
  allDocs = [],
  selectedDocId,
  onSelectDocId,
  showToast,
  isLomba = false,
  lombaMode = 'guru',
  onLombaModeChange,
  isLain = false,
  titleIcon,
  subtitleText,
  guruList = [],
  expectedKode,
  emptyReason,
  onCreateManualDoc,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback to first doc in allDocs if doc is undefined
  const doc = propDoc || allDocs[0];

  // Modal State for Adding / Editing Recipient
  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<StandardTandaTerimaItem>({
    id: '',
    nama: '',
    jabatan: '',
    vol: '1 Kegiatan',
    harga: 0,
    jumlah: 0,
  });

  // Modal State for Editing Document Metadata
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [metaForm, setMetaForm] = useState(() => ({
    judulDokumen: doc?.judulDokumen || '',
    noBku: doc?.noBku || '',
    bulan: doc?.bulan || '',
    tgl: doc?.tgl || '',
    namaKegiatan: doc?.namaKegiatan || '',
    kodeKeg: doc?.kodeKeg || '',
    tempatTgl: doc?.tempatTgl || '',
    namaBendahara: doc?.namaBendahara || '',
    nipBendahara: doc?.nipBendahara || '',
  }));

  // Update metaForm when doc changes
  useEffect(() => {
    if (doc) {
      setMetaForm({
        judulDokumen: doc.judulDokumen || '',
        noBku: doc.noBku || '',
        bulan: doc.bulan || '',
        tgl: doc.tgl || '',
        namaKegiatan: doc.namaKegiatan || '',
        kodeKeg: doc.kodeKeg || '',
        tempatTgl: doc.tempatTgl || '',
        namaBendahara: doc.namaBendahara || '',
        nipBendahara: doc.nipBendahara || '',
      });
    }
  }, [doc?.id, doc?.noBku]);

  const isUangHarian =
    doc?.category === 'kkg' ||
    doc?.category === 'k3s' ||
    doc?.category === 'lomba-guru' ||
    doc?.category === 'lomba-siswa' ||
    isLomba ||
    Boolean(doc?.kodeKeg && doc?.kodeKeg.startsWith('03.03.21'));

  // Quick Open Add Recipient
  const handleOpenAddRecipient = () => {
    if (!doc) return;
    setEditingItemIndex(null);
    setItemForm({
      id: `item-${Date.now()}`,
      nama: '',
      jabatan: isLomba && lombaMode === 'siswa' ? 'Siswa' : 'Guru kelas',
      vol: isUangHarian ? '1 Hari' : '1 Kegiatan',
      harga: doc.items && doc.items.length > 0 ? doc.items[0].harga : 120000,
      jumlah: doc.items && doc.items.length > 0 ? doc.items[0].harga : 120000,
    });
    setRecipientModalOpen(true);
  };

  // Quick Open Edit Recipient
  const handleOpenEditRecipient = (index: number) => {
    if (!doc || !doc.items[index]) return;
    setEditingItemIndex(index);
    setItemForm({ ...doc.items[index] });
    setRecipientModalOpen(true);
  };

  // Save Recipient
  const handleSaveRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.nama.trim()) {
      showToast('Nama penerima wajib diisi', 'error');
      return;
    }

    const calculatedJumlah = itemForm.jumlah > 0 ? itemForm.jumlah : itemForm.harga;
    const finalItem: StandardTandaTerimaItem = {
      ...itemForm,
      nama: itemForm.nama.trim(),
      jabatan: itemForm.jabatan.trim() || '-',
      vol: itemForm.vol.trim() || '1 Kegiatan',
      harga: Number(itemForm.harga) || 0,
      jumlah: calculatedJumlah,
    };

    let updatedItems = [...doc.items];
    if (editingItemIndex !== null && editingItemIndex >= 0) {
      updatedItems[editingItemIndex] = finalItem;
    } else {
      updatedItems.push(finalItem);
    }

    const newTotal = updatedItems.reduce((acc, it) => acc + (Number(it.jumlah) || 0), 0);
    onUpdateDoc({
      ...doc,
      items: updatedItems,
      totalJumlah: newTotal,
    });

    setRecipientModalOpen(false);
    showToast(
      editingItemIndex !== null
        ? 'Data penerima berhasil diperbarui!'
        : 'Penerima baru berhasil ditambahkan!',
      'success'
    );
  };

  // Delete Recipient
  const handleDeleteRecipient = (index: number) => {
    const itemToDelete = doc.items[index];
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus "${itemToDelete.nama}" dari daftar penerima?`
    );
    if (!confirmDelete) return;

    const updatedItems = doc.items.filter((_, idx) => idx !== index);
    const newTotal = updatedItems.reduce((acc, it) => acc + (Number(it.jumlah) || 0), 0);

    onUpdateDoc({
      ...doc,
      items: updatedItems,
      totalJumlah: newTotal,
    });
    showToast(`Penerima "${itemToDelete.nama}" berhasil dihapus`, 'info');
  };

  // Open Edit Metadata
  const handleOpenMetaModal = () => {
    setMetaForm({
      judulDokumen: doc.judulDokumen,
      noBku: doc.noBku,
      bulan: doc.bulan,
      tgl: doc.tgl,
      namaKegiatan: doc.namaKegiatan,
      kodeKeg: doc.kodeKeg || '',
      tempatTgl: doc.tempatTgl,
      namaBendahara: doc.namaBendahara,
      nipBendahara: doc.nipBendahara,
    });
    setMetaModalOpen(true);
  };

  // Save Document Metadata
  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDoc({
      ...doc,
      judulDokumen: metaForm.judulDokumen.trim() || doc.judulDokumen,
      noBku: metaForm.noBku.trim() || doc.noBku,
      bulan: metaForm.bulan.trim() || doc.bulan,
      tgl: metaForm.tgl.trim() || doc.tgl,
      namaKegiatan: metaForm.namaKegiatan.trim() || doc.namaKegiatan,
      kodeKeg: metaForm.kodeKeg.trim() || undefined,
      tempatTgl: metaForm.tempatTgl.trim() || doc.tempatTgl,
      namaBendahara: metaForm.namaBendahara.trim() || doc.namaBendahara,
      nipBendahara: metaForm.nipBendahara.trim() || doc.nipBendahara,
    });
    setMetaModalOpen(false);
    showToast('Informasi dokumen tanda terima berhasil diperbarui!', 'success');
  };

  // Download Sample Excel Template for Siswa
  const handleDownloadTemplateExcel = () => {
    const templateData = [
      {
        'No': 1,
        'Nama Siswa': 'Muhammad Rizki',
        'Kelas / Jabatan': 'Siswa Kelas 5',
        'Vol': '1 Kegiatan',
        'Harga / Uang Saku (Rp)': 50000,
        'Jumlah (Rp)': 50000,
      },
      {
        'No': 2,
        'Nama Siswa': 'Siti Nurhaliza',
        'Kelas / Jabatan': 'Siswa Kelas 4',
        'Vol': '1 Kegiatan',
        'Harga / Uang Saku (Rp)': 50000,
        'Jumlah (Rp)': 50000,
      },
      {
        'No': 3,
        'Nama Siswa': 'Ahmad Fauzan',
        'Kelas / Jabatan': 'Siswa Kelas 6',
        'Vol': '1 Kegiatan',
        'Harga / Uang Saku (Rp)': 50000,
        'Jumlah (Rp)': 50000,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penerima Lomba Siswa');
    XLSX.writeFile(workbook, 'Template_Penerima_Lomba_Siswa.xlsx');
    showToast('Template Excel berhasil diunduh. Silakan isi dan impor kembali.', 'success');
  };

  // Import Excel File for Siswa
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          showToast('Berkas Excel kosong atau tidak terbaca.', 'error');
          return;
        }

        const parsedItems: StandardTandaTerimaItem[] = [];

        rawJson.forEach((row, idx) => {
          // Flexible key lookup
          const keys = Object.keys(row);
          const findVal = (regex: RegExp) => {
            const matchedKey = keys.find((k) => regex.test(k.trim()));
            return matchedKey ? row[matchedKey] : undefined;
          };

          const namaVal =
            findVal(/^nama/i) ||
            findVal(/siswa/i) ||
            findVal(/peserta/i) ||
            findVal(/penerima/i) ||
            row['Nama'] ||
            row['Nama Siswa'];

          if (!namaVal || String(namaVal).trim() === '') return;

          const jabatanVal =
            findVal(/kelas|jabatan|tingkat/i) ||
            row['Kelas'] ||
            row['Jabatan'] ||
            'Siswa';

          const volVal = findVal(/vol|volume|kegiatan/i) || row['Vol'] || '1 Kegiatan';

          const hargaRaw =
            findVal(/harga|uang\s*saku|tarif|satuan/i) ||
            row['Harga'] ||
            row['Uang Saku'] ||
            50000;
          const hargaClean =
            typeof hargaRaw === 'number'
              ? hargaRaw
              : Number(String(hargaRaw).replace(/[^0-9]/g, '')) || 50000;

          const jumlahRaw =
            findVal(/jumlah|total|diterima/i) ||
            row['Jumlah'] ||
            row['Total'] ||
            hargaClean;
          const jumlahClean =
            typeof jumlahRaw === 'number'
              ? jumlahRaw
              : Number(String(jumlahRaw).replace(/[^0-9]/g, '')) || hargaClean;

          parsedItems.push({
            id: `excel-item-${idx}-${Date.now()}`,
            nama: String(namaVal).trim(),
            jabatan: String(jabatanVal).trim(),
            vol: String(volVal).trim(),
            harga: hargaClean,
            jumlah: jumlahClean,
          });
        });

        if (parsedItems.length === 0) {
          showToast('Tidak ada baris data siswa yang valid ditemukan dalam Excel.', 'error');
          return;
        }

        const newTotal = parsedItems.reduce((acc, it) => acc + it.jumlah, 0);

        onUpdateDoc({
          ...doc,
          items: parsedItems,
          totalJumlah: newTotal,
        });

        showToast(
          `Berhasil mengimpor ${parsedItems.length} data penerima siswa dari Excel!`,
          'success'
        );
      } catch (err: any) {
        showToast(`Gagal membaca berkas Excel: ${err.message || 'Format tidak valid'}`, 'error');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadPdf = () => {
    if (!doc) return;
    downloadStandardTandaTerimaPdf([doc], settings);
    showToast('Berkas PDF resmi berhasil dibuat dan diunduh!', 'success');
  };

  // Safe Guard Render if no doc is available
  if (!doc) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4 no-print shadow-xs">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          {titleIcon || <Building2 className="w-7 h-7" />}
        </div>
        <div>
          {expectedKode && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold mb-2 border border-amber-200/60">
              <span>Kode: {expectedKode}</span>
              <span>•</span>
              <span>Status: Kosong di BKU</span>
            </div>
          )}
          <h3 className="text-base font-bold text-slate-800">
            Tidak Ada Transaksi Uang Harian Pada BKU
          </h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 leading-relaxed">
            {emptyReason ||
              (expectedKode
                ? `Sesuai aturan penatausahaan BKU: Apabila di BKU tidak ada kode ${expectedKode}, maka tidak ada tanda terima uang harian untuk kegiatan tersebut.`
                : 'Belum ditemukan transaksi yang sesuai pada Buku Kas Umum (BKU). Anda dapat memastikan berkas BKU terunggah pada menu Buku Kas Umum (BKU).')}
          </p>
        </div>
        {onCreateManualDoc && (
          <div className="pt-2">
            <button
              onClick={onCreateManualDoc}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Draft Tanda Terima Manual</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. TOP CONTROL BAR (NO PRINT) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
        {/* Left: Title & Subtitle or BPU Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            {titleIcon}
            <div>
              <h3 className="font-bold text-sm text-slate-800">
                {doc.judulDokumen}
              </h3>
              {subtitleText && (
                <p className="text-[11px] text-slate-500">{subtitleText}</p>
              )}
            </div>
          </div>

          {/* Multiple BPU selector chips if there are multiple */}
          {allDocs.length > 1 && (
            <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400">Pilih Bukti:</span>
              <div className="flex flex-wrap gap-1">
                {allDocs.map((d) => {
                  const isActive = d.id === selectedDocId;
                  return (
                    <button
                      key={d.id}
                      onClick={() => onSelectDocId(d.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.noBku}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lomba format toggle */}
          {isLomba && onLombaModeChange && (
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 mr-1">
              <button
                type="button"
                onClick={() => onLombaModeChange('guru')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  lombaMode === 'guru'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Format Guru
              </button>
              <button
                type="button"
                onClick={() => onLombaModeChange('siswa')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  lombaMode === 'siswa'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Format Siswa
              </button>
            </div>
          )}

          {/* Excel Import & Template for Siswa */}
          {isLomba && lombaMode === 'siswa' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleImportExcel}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                title="Impor daftar siswa dari Excel"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Impor Excel Siswa</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplateExcel}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-2 rounded-lg flex items-center space-x-1 cursor-pointer border border-slate-300 transition-colors"
                title="Unduh Template Format Excel Siswa"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Template</span>
              </button>
            </>
          )}

          {/* Add Recipient button */}
          <button
            type="button"
            onClick={handleOpenAddRecipient}
            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-2 rounded-lg flex items-center space-x-1.5 cursor-pointer border border-blue-200 transition-colors"
            title="Tambah penerima baru ke tabel"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Penerima</span>
          </button>

          {/* Edit Document Info */}
          <button
            type="button"
            onClick={handleOpenMetaModal}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-lg flex items-center space-x-1.5 cursor-pointer border border-slate-200 transition-colors"
            title="Ubah No. BKU, Tanggal, dan Informasi Kegiatan"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Dokumen</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
            title="Unduh Lembar Ini sebagai PDF Resmi"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PDF</span>
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
            title="Cetak langsung menggunakan printer browser"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Lembar Ini</span>
          </button>
        </div>
      </div>

      {/* 2. OFFICIAL PRINTABLE DOCUMENT (100% MATCHING USER SCREENSHOT) */}
      <div className="print-page-portrait bg-white p-8 sm:p-10 rounded-2xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 font-sans space-y-4">
        {/* Kop Surat Resmi */}
        <TandaTerimaKop
          settings={settings}
          desaKelurahan={doc.desaKelurahan}
          kabupaten={doc.kabupaten}
          namaSatuanPendidikan={doc.namaSatuanPendidikan}
        />

        {/* Judul Dokumen (Centered, Bold, Uppercase) */}
        <div className="text-center my-3">
          <h3 className="font-black text-sm sm:text-base text-slate-950 uppercase tracking-wider">
            {doc.judulDokumen}
          </h3>
        </div>

        {/* Metadata Atas & Kotak No. BKU */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 text-xs font-semibold text-slate-900">
          <div className="space-y-1">
            <div className="grid grid-cols-[160px_10px_1fr] items-center">
              <span className="font-normal text-slate-700">Nama Satuan Pendidikan</span>
              <span>:</span>
              <span className="font-bold">{doc.namaSatuanPendidikan || settings.namaSekolah}</span>
            </div>
            <div className="grid grid-cols-[160px_10px_1fr] items-center">
              <span className="font-normal text-slate-700">Desa/Kelurahan</span>
              <span>:</span>
              <span>{doc.desaKelurahan || settings.desaKelurahan || 'Cibungur'}</span>
            </div>
            <div className="grid grid-cols-[160px_10px_1fr] items-center">
              <span className="font-normal text-slate-700">Kabupaten</span>
              <span>:</span>
              <span>{doc.kabupaten || settings.kabupaten || 'Lebak'}</span>
            </div>
            <div className="grid grid-cols-[160px_10px_1fr] items-start">
              <span className="font-normal text-slate-700">Nama Kegiatan</span>
              <span>:</span>
              <span className="font-bold leading-snug">{doc.namaKegiatan}</span>
            </div>
            <div className="grid grid-cols-[160px_10px_1fr] items-center">
              <span className="font-normal text-slate-700">Bulan</span>
              <span>:</span>
              <span className="font-bold uppercase">{doc.bulan}</span>
            </div>
          </div>

          {/* Kotak No. BKU di Kanan Atas (Border Tebal Persegi Panjang) */}
          <div className="border-2 border-slate-950 px-4 py-2 rounded-xs min-w-[170px] flex items-center justify-between self-start sm:self-auto bg-slate-50/50 print:bg-transparent">
            <span className="font-bold text-xs text-slate-950">No. BKU</span>
            <span className="font-black text-sm font-mono text-slate-950 ml-6">
              {doc.noBku}
            </span>
          </div>
        </div>

        {/* Tabel Rincian Penerima (No, Nama, Jabatan, Vol, Harga, Jumlah, Tanda Tangan) */}
        <div className="overflow-x-auto my-3">
          <table className="w-full text-left border-collapse border border-slate-950 text-xs">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-100 text-slate-950 font-black uppercase text-center border-b border-slate-950">
                <th className="py-2.5 px-2 border-r border-slate-950 w-10">No</th>
                <th className="py-2.5 px-3 border-r border-slate-950 text-left">Nama</th>
                <th className="py-2.5 px-3 border-r border-slate-950 text-left">
                  {isLomba && lombaMode === 'siswa' ? 'Jabatan / Kelas' : 'Jabatan'}
                </th>
                <th className="py-2.5 px-3 border-r border-slate-950 text-center w-24">
                  {isUangHarian ? 'Vol (Hari)' : 'Vol'}
                </th>
                <th className="py-2.5 px-3 border-r border-slate-950 text-right w-28">
                  {isUangHarian ? 'Uang Harian' : 'Harga'}
                </th>
                <th className="py-2.5 px-3 border-r border-slate-950 text-right w-32">Jumlah</th>
                <th className="py-2.5 px-3 text-center w-36 border-r border-slate-950">Tanda Tangan</th>
                <th className="py-2 px-1 text-center w-14 border-l border-slate-950 no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-950">
              {doc.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                    Belum ada data penerima. Klik tombol "+ Tambah Penerima" di atas untuk menambahkan baris.
                  </td>
                </tr>
              ) : (
                doc.items.map((item, idx) => (
                  <tr key={item.id || `item-${idx}`} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-2 text-center border-r border-slate-950 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold border-r border-slate-950 text-slate-950">
                      {item.nama}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-950 text-slate-700">
                      {item.jabatan}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-950">
                      {item.vol}
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-slate-950 font-mono">
                      {formatRupiah(item.harga)}
                    </td>
                    <td className="py-2.5 px-3 text-right border-r border-slate-950 font-black font-mono text-slate-950">
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
                    <td className="py-2 px-1 text-center border-l border-slate-950 no-print">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRecipient(idx)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                          title="Ubah baris ini"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecipient(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          title="Hapus baris ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 print:bg-slate-100 font-black border-t-2 border-slate-950">
                <td
                  colSpan={5}
                  className="py-2.5 px-4 text-center uppercase tracking-wider border-r border-slate-950 text-slate-950"
                >
                  JUMLAH
                </td>
                <td className="py-2.5 px-3 text-right border-r border-slate-950 font-mono text-sm text-slate-950 font-black">
                  {formatRupiah(doc.totalJumlah)}
                </td>
                <td className="py-2.5 px-3 border-r border-slate-950"></td>
                <td className="no-print border-l border-slate-950"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 5. TANDA TANGAN (BENDAHARA SEKOLAH DI KANAN BAWAH - PERSIS GAMBAR USER) */}
        <div className="pt-6 flex justify-end">
          <div className="w-64 text-center text-xs font-bold text-slate-900">
            <p className="font-normal text-slate-800 leading-tight">
              {doc.tempatTgl && !doc.tempatTgl.startsWith(',')
                ? doc.tempatTgl
                : `${doc.desaKelurahan || settings.desaKelurahan || 'Cibungur'}, ${
                    doc.tgl ? formatTanggalIndo(doc.tgl) : '12 Agustus 2025'
                  }`}
            </p>
            <p className="font-bold text-slate-950 mb-16 leading-tight mt-0.5">
              Bendahara Sekolah
            </p>
            <p className="font-black underline text-slate-950 text-sm">
              {doc.namaBendahara || settings.namaBendahara || 'ATIKAWATI, S.Pd'}
            </p>
            <p className="text-[11px] font-mono font-normal text-slate-700 mt-0.5">
              NIP. {doc.nipBendahara || settings.nipBendahara || '199306082022212007'}
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH / EDIT PENERIMA */}
      {recipientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-800">
                {editingItemIndex !== null ? 'Ubah Data Penerima' : 'Tambah Penerima Baru'}
              </h4>
              <button
                type="button"
                onClick={() => setRecipientModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipient} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Penerima <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SUHENDRI, S.Pd"
                  value={itemForm.nama}
                  onChange={(e) => setItemForm({ ...itemForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                />
                {/* Suggestions from Guru list if available */}
                {guruList.length > 0 && !isLomba && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400 self-center">Pilih cepat:</span>
                    {guruList.slice(0, 5).map((g, gi) => (
                      <button
                        key={gi}
                        type="button"
                        onClick={() =>
                          setItemForm({
                            ...itemForm,
                            nama: g.nama,
                            jabatan: g.jabatan || itemForm.jabatan,
                          })
                        }
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
                      >
                        {g.nama.split(/[\s,]+/)[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isLomba && lombaMode === 'siswa' ? 'Kelas / Jabatan' : 'Jabatan'}
                </label>
                <input
                  type="text"
                  placeholder={isLomba && lombaMode === 'siswa' ? 'Contoh: Siswa Kelas 5' : 'Contoh: Guru kelas / Kepala Sekolah'}
                  value={itemForm.jabatan}
                  onChange={(e) => setItemForm({ ...itemForm, jabatan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isUangHarian ? 'Volume (Hari)' : 'Volume'}
                  </label>
                  <input
                    type="text"
                    placeholder={isUangHarian ? '1 Hari' : '1 Kegiatan'}
                    value={itemForm.vol}
                    onChange={(e) => setItemForm({ ...itemForm, vol: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isUangHarian ? 'Uang Harian (Rp)' : 'Harga Satuan (Rp)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={itemForm.harga || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setItemForm({
                        ...itemForm,
                        harga: val,
                        jumlah: val, // default jumlah matches harga
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jumlah Total (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={itemForm.jumlah || ''}
                  onChange={(e) => setItemForm({ ...itemForm, jumlah: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Otomatis terhitung dari harga atau sesuaikan jika volume lebih dari 1.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRecipientModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                >
                  Simpan Penerima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INFORMASI DOKUMEN & NO. BKU */}
      {metaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-800">
                Ubah Informasi Dokumen Tanda Terima
              </h4>
              <button
                type="button"
                onClick={() => setMetaModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeta} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Dokumen (Huruf Kapital)
                </label>
                <input
                  type="text"
                  required
                  value={metaForm.judulDokumen}
                  onChange={(e) => setMetaForm({ ...metaForm, judulDokumen: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Bukti BKU
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BPU91"
                    value={metaForm.noBku}
                    onChange={(e) => setMetaForm({ ...metaForm, noBku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bulan / Periode
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Juli 2024"
                    value={metaForm.bulan}
                    onChange={(e) => setMetaForm({ ...metaForm, bulan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Kegiatan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelompok Kerja Kepala Sekolah (K3S)"
                  value={metaForm.namaKegiatan}
                  onChange={(e) => setMetaForm({ ...metaForm, namaKegiatan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode Kegiatan ARKAS (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 02.03.01."
                    value={metaForm.kodeKeg}
                    onChange={(e) => setMetaForm({ ...metaForm, kodeKeg: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tempat & Tanggal Pengesahan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Cigemblong, 16 Agustus 2024"
                    value={metaForm.tempatTgl}
                    onChange={(e) => setMetaForm({ ...metaForm, tempatTgl: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Bendahara Sekolah
                  </label>
                  <input
                    type="text"
                    required
                    value={metaForm.namaBendahara}
                    onChange={(e) => setMetaForm({ ...metaForm, namaBendahara: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP Bendahara
                  </label>
                  <input
                    type="text"
                    value={metaForm.nipBendahara}
                    onChange={(e) => setMetaForm({ ...metaForm, nipBendahara: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMetaModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                >
                  Simpan Informasi Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
