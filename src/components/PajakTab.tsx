import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Download,
  Upload,
  Plus,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Search,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  AppSettings,
  JenisPajak,
  TaxRecord,
  RekapPajakItem,
  BkuItem,
  BukuPembantuPajakItem,
} from '../types';
import { formatRupiah, formatNumber } from '../utils/formatters';
import { exportPajakToExcel, exportRekapPajakLampiran4ToExcel } from '../utils/excelHelper';
import {
  initialRekapPajakItems,
  defaultMonthAdjustment,
  MonthSummaryAdjustment,
  TRIWULAN_MONTHS,
  syncRekapPajakFromBppAndBku,
  extractTaxesFromBku,
  parseDateInfo,
} from '../utils/rekapPajakData';
import { generateRekapPajakPdf } from '../utils/rekapPajakPdf';
import { initialBukuPembantuPajakItems, sampleBukuPembantuPajakItems } from '../utils/bukuPembantuPajakData';
import {
  exportBukuPembantuPajakToExcel,
  parseBukuPembantuPajakFromExcel,
  generateBukuPembantuPajakPdf,
} from '../utils/bukuPembantuPajakExcel';
import { DAFTAR_BULAN, getTriwulanFromMonth } from '../utils/monthHelper';

interface PajakTabProps {
  settings: AppSettings;
  taxRecords: TaxRecord[];
  onUpdateTaxes: (records: TaxRecord[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  bkuData?: BkuItem[];
  bppItems?: BukuPembantuPajakItem[];
  onUpdateBpp?: (items: BukuPembantuPajakItem[]) => void;
  rekapItems?: RekapPajakItem[];
  onUpdateRekap?: (items: RekapPajakItem[]) => void;
  selectedBulan?: string;
  onBulanChange?: (b: string) => void;
}

export const PajakTab: React.FC<PajakTabProps> = ({
  settings,
  taxRecords,
  onUpdateTaxes,
  showToast,
  bkuData,
  bppItems: propBppItems,
  onUpdateBpp,
  rekapItems: propRekapItems,
  onUpdateRekap,
  selectedBulan = 'Januari',
  onBulanChange,
}) => {
  // Tab switcher: 'buku_pembantu' (format baru sesuai PDF 2 halaman) vs 'lampiran4' (format rekap triwulan)
  const [activeSubTab, setActiveSubTab] = useState<'buku_pembantu' | 'lampiran4'>('buku_pembantu');

  // Internal state fallback jika props tidak disediakan
  const [internalBppItems, setInternalBppItems] = useState<BukuPembantuPajakItem[]>(initialBukuPembantuPajakItems);
  const [internalRekapItems, setInternalRekapItems] = useState<RekapPajakItem[]>(initialRekapPajakItems);

  const bppItems = propBppItems !== undefined ? propBppItems : internalBppItems;
  const setBppItems = (items: BukuPembantuPajakItem[]) => {
    if (onUpdateBpp) {
      onUpdateBpp(items);
    } else {
      setInternalBppItems(items);
    }
  };

  const rekapItems = propRekapItems !== undefined ? propRekapItems : internalRekapItems;
  const setRekapItems = (items: RekapPajakItem[]) => {
    if (onUpdateRekap) {
      onUpdateRekap(items);
    } else {
      setInternalRekapItems(items);
    }
  };

  const [bppSearch, setBppSearch] = useState('');
  const [isBppModalOpen, setIsBppModalOpen] = useState(false);
  const [editingBppId, setEditingBppId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State untuk Tambah/Edit Buku Pembantu Pajak
  const [formBpp, setFormBpp] = useState({
    mode: 'pasangan' as 'pasangan' | 'tunggal', // 'pasangan' = otomatis buat 2 baris (Terima & Setor)
    tanggal: '02-04-2026',
    noKode: '04.06.01.',
    kegiatan: 'Pelaksanaan kegiatan komunitas belajar di satuan pendidikan',
    jenisPajak: 'PPh 23' as 'PPN' | 'PPh 21' | 'PPh 23' | 'PPh 4' | 'SSPD',
    tarifPersen: 2,
    nominalPajak: 4560,
    tipeBaris: 'Terima' as 'Terima' | 'Setor',
  });

  // Perhitungan Jumlah Total Buku Pembantu Pajak
  const totBppPpn = bppItems.reduce((acc, it) => acc + (it.ppn || 0), 0);
  const totBppPph21 = bppItems.reduce((acc, it) => acc + (it.pph21 || 0), 0);
  const totBppPph23 = bppItems.reduce((acc, it) => acc + (it.pph23 || 0), 0);
  const totBppPph4 = bppItems.reduce((acc, it) => acc + (it.pph4 || 0), 0);
  const totBppSspd = bppItems.reduce((acc, it) => acc + (it.sspd || 0), 0);
  const totBppPengeluaran = bppItems.reduce((acc, it) => acc + (it.pengeluaran || 0), 0);
  const totBppPenerimaan = totBppPpn + totBppPph21 + totBppPph23 + totBppPph4 + totBppSspd;

  // Handler Tambah/Edit Buku Pembantu Pajak
  const handleOpenAddBppModal = () => {
    setEditingBppId(null);
    setFormBpp({
      mode: 'pasangan',
      tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
      noKode: '04.06.01.',
      kegiatan: '',
      jenisPajak: 'PPh 23',
      tarifPersen: 2,
      nominalPajak: 0,
      tipeBaris: 'Terima',
    });
    setIsBppModalOpen(true);
  };

  const handleOpenEditBppModal = (item: BukuPembantuPajakItem) => {
    setEditingBppId(item.id);
    let jp: 'PPN' | 'PPh 21' | 'PPh 23' | 'PPh 4' | 'SSPD' = 'PPh 23';
    let nom = item.pengeluaran || 0;
    if (item.ppn > 0) { jp = 'PPN'; nom = item.ppn; }
    else if (item.pph21 > 0) { jp = 'PPh 21'; nom = item.pph21; }
    else if (item.pph23 > 0) { jp = 'PPh 23'; nom = item.pph23; }
    else if (item.pph4 > 0) { jp = 'PPh 4'; nom = item.pph4; }
    else if (item.sspd > 0) { jp = 'SSPD'; nom = item.sspd; }

    const isTerima = item.uraian.toLowerCase().startsWith('terima');
    const cleanKegiatan = item.uraian
      .replace(/^terima\s+/i, '')
      .replace(/^setor\s+/i, '')
      .replace(/^(ppn|pph 21|pph 23|pph 4|sspd)\s+(\d+%\s+)?/i, '');

    setFormBpp({
      mode: 'tunggal',
      tanggal: item.tanggal,
      noKode: item.noKode,
      kegiatan: cleanKegiatan || item.uraian,
      jenisPajak: jp,
      tarifPersen: 2,
      nominalPajak: nom,
      tipeBaris: isTerima ? 'Terima' : 'Setor',
    });
    setIsBppModalOpen(true);
  };

  const handleSaveBpp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBpp.kegiatan.trim() || formBpp.nominalPajak <= 0) {
      showToast('Uraian kegiatan dan nominal pajak harus diisi dengan benar.', 'error');
      return;
    }

    if (editingBppId) {
      // Edit Single Row
      const updated = bppItems.map((it) => {
        if (it.id === editingBppId) {
          const isTerima = formBpp.tipeBaris === 'Terima';
          const prefix = isTerima ? 'Terima' : 'Setor';
          const tarifStr = formBpp.jenisPajak === 'PPh 23' ? '2% ' : formBpp.jenisPajak === 'PPh 21' ? '5% ' : '';
          const fullUraian = `${prefix} ${formBpp.jenisPajak} ${tarifStr}${formBpp.kegiatan.trim()}`;

          return {
            ...it,
            tanggal: formBpp.tanggal.trim(),
            noKode: formBpp.noKode.trim(),
            uraian: fullUraian,
            ppn: isTerima && formBpp.jenisPajak === 'PPN' ? formBpp.nominalPajak : 0,
            pph21: isTerima && formBpp.jenisPajak === 'PPh 21' ? formBpp.nominalPajak : 0,
            pph23: isTerima && formBpp.jenisPajak === 'PPh 23' ? formBpp.nominalPajak : 0,
            pph4: isTerima && formBpp.jenisPajak === 'PPh 4' ? formBpp.nominalPajak : 0,
            sspd: isTerima && formBpp.jenisPajak === 'SSPD' ? formBpp.nominalPajak : 0,
            pengeluaran: !isTerima ? formBpp.nominalPajak : 0,
            saldo: isTerima ? formBpp.nominalPajak : 0,
          };
        }
        return it;
      });
      setBppItems(updated);
      showToast('Baris Buku Pembantu Pajak berhasil diperbarui.', 'success');
    } else {
      if (formBpp.mode === 'pasangan') {
        // Buat 2 baris sekaligus: 1 baris Terima, 1 baris Setor
        const tarifStr = formBpp.jenisPajak === 'PPh 23' ? '2% ' : formBpp.jenisPajak === 'PPh 21' ? '5% ' : '';
        const uraianTerima = `Terima ${formBpp.jenisPajak} ${tarifStr}${formBpp.kegiatan.trim()}`;
        const uraianSetor = `Setor ${formBpp.jenisPajak} ${tarifStr}${formBpp.kegiatan.trim()}`;

        const rowTerima: BukuPembantuPajakItem = {
          id: `bpp-${Date.now()}-1`,
          tanggal: formBpp.tanggal.trim(),
          noKode: formBpp.noKode.trim(),
          uraian: uraianTerima,
          ppn: formBpp.jenisPajak === 'PPN' ? formBpp.nominalPajak : 0,
          pph21: formBpp.jenisPajak === 'PPh 21' ? formBpp.nominalPajak : 0,
          pph23: formBpp.jenisPajak === 'PPh 23' ? formBpp.nominalPajak : 0,
          pph4: formBpp.jenisPajak === 'PPh 4' ? formBpp.nominalPajak : 0,
          sspd: formBpp.jenisPajak === 'SSPD' ? formBpp.nominalPajak : 0,
          pengeluaran: 0,
          saldo: formBpp.nominalPajak,
        };

        const rowSetor: BukuPembantuPajakItem = {
          id: `bpp-${Date.now()}-2`,
          tanggal: formBpp.tanggal.trim(),
          noKode: formBpp.noKode.trim(),
          uraian: uraianSetor,
          ppn: 0,
          pph21: 0,
          pph23: 0,
          pph4: 0,
          sspd: 0,
          pengeluaran: formBpp.nominalPajak,
          saldo: 0,
        };

        setBppItems([...bppItems, rowTerima, rowSetor]);
        showToast('Pasangan transaksi Terima & Setor pajak berhasil ditambahkan.', 'success');
      } else {
        // Single row
        const isTerima = formBpp.tipeBaris === 'Terima';
        const prefix = isTerima ? 'Terima' : 'Setor';
        const tarifStr = formBpp.jenisPajak === 'PPh 23' ? '2% ' : formBpp.jenisPajak === 'PPh 21' ? '5% ' : '';
        const fullUraian = `${prefix} ${formBpp.jenisPajak} ${tarifStr}${formBpp.kegiatan.trim()}`;

        const singleRow: BukuPembantuPajakItem = {
          id: `bpp-${Date.now()}`,
          tanggal: formBpp.tanggal.trim(),
          noKode: formBpp.noKode.trim(),
          uraian: fullUraian,
          ppn: isTerima && formBpp.jenisPajak === 'PPN' ? formBpp.nominalPajak : 0,
          pph21: isTerima && formBpp.jenisPajak === 'PPh 21' ? formBpp.nominalPajak : 0,
          pph23: isTerima && formBpp.jenisPajak === 'PPh 23' ? formBpp.nominalPajak : 0,
          pph4: isTerima && formBpp.jenisPajak === 'PPh 4' ? formBpp.nominalPajak : 0,
          sspd: isTerima && formBpp.jenisPajak === 'SSPD' ? formBpp.nominalPajak : 0,
          pengeluaran: !isTerima ? formBpp.nominalPajak : 0,
          saldo: isTerima ? formBpp.nominalPajak : 0,
        };

        setBppItems([...bppItems, singleRow]);
        showToast('Baris transaksi pajak berhasil ditambahkan.', 'success');
      }
    }

    setIsBppModalOpen(false);
  };

  const handleDeleteBppItem = (id: string) => {
    setBppItems(bppItems.filter((it) => it.id !== id));
    showToast('Baris Buku Pembantu Pajak telah dihapus.', 'info');
  };

  const handleResetBppToEmpty = () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan seluruh data Buku Pembantu Pajak? Data yang dihapus tidak dapat dikembalikan.')) {
      setBppItems([]);
      showToast('Data Buku Pembantu Pajak berhasil dikosongkan.', 'info');
    }
  };

  const handleLoadBppDefaultExample = () => {
    if (window.confirm('Muat contoh data standar resmi (24 baris sesuai dokumen acuan)?')) {
      setBppItems(sampleBukuPembantuPajakItems);
      showToast('Contoh data standar 24 baris berhasil dimuat.', 'success');
    }
  };

  // Handler Export Excel Buku Pembantu Pajak
  const handleExportBppExcel = () => {
    try {
      exportBukuPembantuPajakToExcel(bppItems, settings.namaSekolah, settings.tahunAnggaran || '2026');
      showToast('File Excel Buku Pembantu Pajak berhasil diunduh.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor file Excel.', 'error');
    }
  };

  // Handler Import Excel Buku Pembantu Pajak
  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await parseBukuPembantuPajakFromExcel(file);
      if (importedData && importedData.length > 0) {
        setBppItems(importedData);
        // Otomatis sinkronkan langsung ke Rekap Lampiran 4 dengan presisi 100%
        const synced = syncRekapPajakFromBppAndBku(importedData, bkuData, settings);
        setRekapItems(synced);
        setSummaryAdjustment(defaultMonthAdjustment);
        showToast(
          `Berhasil mengimpor ${importedData.length} baris Buku Pembantu Pajak dan otomatis menyinkronkan ${synced.length} rincian ke Rekap Pajak Lampiran 4 (100% Akurat & Klop)!`,
          'success'
        );
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal membaca file Excel.', 'error');
    } finally {
      // Reset input agar bisa upload file yang sama jika diinginkan
      if (e.target) e.target.value = '';
    }
  };

  // Handler Export PDF Buku Pembantu Pajak
  const handleExportBppPdf = () => {
    try {
      generateBukuPembantuPajakPdf(bppItems, settings, settings.tahunAnggaran || '2026');
      showToast('PDF Resmi Buku Pembantu Pajak berhasil diunduh.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat file PDF.', 'error');
    }
  };

  // =========================================================================
  // STATE REKAPITULASI PEMBAYARAN PAJAK (LAMPIRAN 4)
  // =========================================================================
  const [selectedTw, setSelectedTw] = useState<string>('TW 2');
  const [summaryAdjustment, setSummaryAdjustment] = useState<MonthSummaryAdjustment>(defaultMonthAdjustment);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Sinkronkan pilihan triwulan dengan bulan yang sedang aktif
  useEffect(() => {
    if (selectedBulan && selectedBulan !== 'Semua Bulan') {
      const { triwulan } = getTriwulanFromMonth(selectedBulan);
      const twCode = triwulan.replace('Triwulan ', 'TW ');
      if (TRIWULAN_MONTHS[twCode]) {
        setSelectedTw(twCode);
      }
    }
  }, [selectedBulan]);

  const currentMonths = TRIWULAN_MONTHS[selectedTw] || ['April', 'Mei', 'Juni'];
  const [formRekap, setFormRekap] = useState({
    uraianBelanja: '',
    sumberDana: 'BOSP REGULER',
    jumlahBelanja: 0,
    kategoriPajak: 'PPh 23' as 'PPN' | 'PPh 21' | 'PPh 23' | 'SSPD',
    pilihanBulan: currentMonths[0] || 'April',
    nominalPajak: 0,
    tanggalBelanja: '02/04/2026',
    tanggalSetorPajak: '10/07/2026',
    noNtpn: '',
  });

  const m1 = currentMonths[0];
  const m2 = currentMonths[1];
  const m3 = currentMonths[2];

  // Filter baris rekap yang relevan untuk Triwulan aktif
  const finalRekapList = rekapItems.filter((item) => {
    const sumTaxInTw =
      (item.ppn[m1] || 0) + (item.ppn[m2] || 0) + (item.ppn[m3] || 0) +
      (item.pph21[m1] || 0) + (item.pph21[m2] || 0) + (item.pph21[m3] || 0) +
      (item.pph23[m1] || 0) + (item.pph23[m2] || 0) + (item.pph23[m3] || 0) +
      (item.pajakDaerah[m1] || 0) + (item.pajakDaerah[m2] || 0) + (item.pajakDaerah[m3] || 0);

    if (sumTaxInTw > 0) return true;
    const dInfo = parseDateInfo(item.tanggalSetorPajak || item.tanggalBelanja);
    return dInfo.triwulan === selectedTw;
  });

  const totPpn1 = finalRekapList.reduce((acc, it) => acc + (it.ppn[m1] || 0), 0) + (summaryAdjustment.ppn[m1] || 0);
  const totPpn2 = finalRekapList.reduce((acc, it) => acc + (it.ppn[m2] || 0), 0) + (summaryAdjustment.ppn[m2] || 0);
  const totPpn3 = finalRekapList.reduce((acc, it) => acc + (it.ppn[m3] || 0), 0) + (summaryAdjustment.ppn[m3] || 0);

  const totPph21_1 = finalRekapList.reduce((acc, it) => acc + (it.pph21[m1] || 0), 0) + (summaryAdjustment.pph21[m1] || 0);
  const totPph21_2 = finalRekapList.reduce((acc, it) => acc + (it.pph21[m2] || 0), 0) + (summaryAdjustment.pph21[m2] || 0);
  const totPph21_3 = finalRekapList.reduce((acc, it) => acc + (it.pph21[m3] || 0), 0) + (summaryAdjustment.pph21[m3] || 0);

  const totPph23_1 = finalRekapList.reduce((acc, it) => acc + (it.pph23[m1] || 0), 0) + (summaryAdjustment.pph23[m1] || 0);
  const totPph23_2 = finalRekapList.reduce((acc, it) => acc + (it.pph23[m2] || 0), 0) + (summaryAdjustment.pph23[m2] || 0);
  const totPph23_3 = finalRekapList.reduce((acc, it) => acc + (it.pph23[m3] || 0), 0) + (summaryAdjustment.pph23[m3] || 0);

  const totPd1 = finalRekapList.reduce((acc, it) => acc + (it.pajakDaerah[m1] || 0), 0) + (summaryAdjustment.pajakDaerah[m1] || 0);
  const totPd2 = finalRekapList.reduce((acc, it) => acc + (it.pajakDaerah[m2] || 0), 0) + (summaryAdjustment.pajakDaerah[m2] || 0);
  const totPd3 = finalRekapList.reduce((acc, it) => acc + (it.pajakDaerah[m3] || 0), 0) + (summaryAdjustment.pajakDaerah[m3] || 0);

  const grandTotalTwPpn = totPpn1 + totPpn2 + totPpn3;
  const grandTotalTwPph21 = totPph21_1 + totPph21_2 + totPph21_3;
  const grandTotalTwPph23 = totPph23_1 + totPph23_2 + totPph23_3;
  const grandTotalTwPd = totPd1 + totPd2 + totPd3;

  const grandTotalTwRekap =
    grandTotalTwPpn + grandTotalTwPph21 + grandTotalTwPph23 + grandTotalTwPd;

  // Hitung total Setor dari Buku Pembantu Pajak untuk triwulan yang sama
  const totBppSetorTw = bppItems
    .filter((it) => {
      const dInfo = parseDateInfo(it.tanggal);
      return dInfo.triwulan === selectedTw;
    })
    .reduce((acc, it) => {
      const uraianLower = (it.uraian || '').toLowerCase();
      if (uraianLower.startsWith('setor') || it.pengeluaran > 0) {
        return acc + (it.pengeluaran || (it.ppn + it.pph21 + it.pph23 + it.pph4 + it.sspd));
      }
      return acc;
    }, 0);

  const selisihTw = Math.abs(totBppSetorTw - grandTotalTwRekap);
  const isTwBalanced = selisihTw === 0 || (totBppSetorTw === 0 && grandTotalTwRekap === 0);

  // 1. SINKRONISASI BUKU PEMBANTU PAJAK & BKU KE REKAP LAMPIRAN 4 (100% AKURAT)
  const handleSyncAllTaxes = () => {
    if (!bppItems || bppItems.length === 0) {
      if (bkuData && bkuData.length > 0) {
        handleExtractFromBku();
        return;
      }
      showToast('Buku Pembantu Pajak masih kosong. Silakan upload Excel atau tarik dari BKU terlebih dahulu.', 'info');
      return;
    }

    const synced = syncRekapPajakFromBppAndBku(bppItems, bkuData, settings);
    setRekapItems(synced);
    setSummaryAdjustment(defaultMonthAdjustment);
    showToast(
      `Berhasil menyinkronkan ${synced.length} rincian transaksi pajak dari Buku Pembantu Pajak & BKU ke Rekap Lampiran 4 (100% Akurat & Klop)!`,
      'success'
    );
  };

  // 2. TARIK DARI BKU ARKAS
  const handleExtractFromBku = () => {
    if (!bkuData || bkuData.length === 0) {
      showToast('Data BKU ARKAS masih kosong. Silakan upload file BKU di menu BKU terlebih dahulu.', 'error');
      return;
    }

    const { bppRows, rekapRows } = extractTaxesFromBku(bkuData, settings);
    if (bppRows.length === 0) {
      showToast('Tidak ditemukan transaksi pengeluaran kena pajak di BKU.', 'info');
      return;
    }

    setBppItems(bppRows);
    setRekapItems(rekapRows);
    setSummaryAdjustment(defaultMonthAdjustment);
    showToast(
      `Berhasil mengintegrasikan ${bppRows.length} baris Buku Pembantu Pajak dan ${rekapRows.length} baris Rekap Pajak dari BKU (100% Akurat)!`,
      'success'
    );
  };

  // Download PDF & Excel Rekap Lampiran 4
  const handleDownloadRekapPdf = () => {
    try {
      generateRekapPajakPdf(finalRekapList, settings, currentMonths, summaryAdjustment);
      showToast('PDF Resmi Lampiran 4 Rekapitulasi Pajak berhasil diunduh.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat file PDF.', 'error');
    }
  };

  const handleDownloadRekapExcel = () => {
    try {
      exportRekapPajakLampiran4ToExcel(finalRekapList, settings.namaSekolah, currentMonths, summaryAdjustment);
      showToast('File Excel Rekap Pajak Lampiran 4 berhasil diunduh.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor file Excel.', 'error');
    }
  };

  // Sinkronisasi dari BKU ke Buku Pembantu Pajak
  const handleSyncFromBkuToBpp = () => {
    handleExtractFromBku();
  };

  // Reset (Kosongkan) seluruh transaksi Rekapitulasi Pajak Lampiran 4
  const handleResetRekapToEmpty = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin mengosongkan seluruh data transaksi Rekapitulasi Pajak (Lampiran 4)? Seluruh baris transaksi pada Rekap Pajak akan dihapus.'
      )
    ) {
      setRekapItems([]);
      setSummaryAdjustment(defaultMonthAdjustment);
      showToast('Seluruh transaksi Rekapitulasi Pajak (Lampiran 4) berhasil dikosongkan.', 'info');
    }
  };

  // Muat contoh data acuan Rekapitulasi Pajak Lampiran 4
  const handleLoadRekapDefaultExample = () => {
    if (window.confirm('Muat kembali contoh data standar resmi Rekapitulasi Pajak (Lampiran 4)?')) {
      setRekapItems(initialRekapPajakItems);
      setSummaryAdjustment(defaultMonthAdjustment);
      showToast('Contoh data standar Rekapitulasi Pajak berhasil dimuat.', 'success');
    }
  };

  // Hapus satu baris transaksi dari Rekap Pajak Lampiran 4
  const handleDeleteRekapItem = (id: string) => {
    setRekapItems(rekapItems.filter((it) => it.id !== id));
    showToast('Baris transaksi Rekap Pajak telah dihapus.', 'info');
  };

  return (
    <div id="tab-pajak-view" className="space-y-6">
      {/* Hidden File Input untuk Import Excel */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />

      {/* Tab Switcher & Top Action Panel */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full">
                Format Standar Buku Pembantu Pajak BOSP
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md">
                Tahun Anggaran {settings.tahunAnggaran || '2026'}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Buku Pembantu Pajak & Rekapitulasi Pajak
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola pencatatan Penerimaan / Debit (PPN, PPh 21, PPh 23, PPh 4, SSPD), Pengeluaran / Kredit, serta Impor & Ekspor Excel
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Dropdown Pilihan Bulan Pajak */}
            {onBulanChange && (
              <div className="flex items-center space-x-1.5 bg-blue-50/90 px-3 py-1.5 rounded-xl border border-blue-300 text-xs shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-[#0b4382]" />
                <label className="text-[#093262] font-extrabold text-[11px] whitespace-nowrap">
                  Bulan:
                </label>
                <select
                  id="select-pajak-bulan"
                  value={selectedBulan}
                  onChange={(e) => onBulanChange(e.target.value)}
                  className="bg-transparent text-xs font-black text-[#072449] focus:outline-none cursor-pointer"
                  title="Pilih Bulan Pajak SPJ"
                >
                  {DAFTAR_BULAN.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Semua Bulan">Semua Bulan (1 Tahun)</option>
                </select>
              </div>
            )}

            {/* Tombol Import Excel */}
            <button
              onClick={handleTriggerImport}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Impor file Excel Buku Pembantu Pajak (.xlsx / .xls)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>

            {/* Tombol Export Excel */}
            <button
              onClick={activeSubTab === 'buku_pembantu' ? handleExportBppExcel : handleDownloadRekapExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Ekspor ke format Excel persis seperti dokumen asli"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>

            {/* Tombol Unduh PDF */}
            <button
              onClick={activeSubTab === 'buku_pembantu' ? handleExportBppPdf : handleDownloadRekapPdf}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Unduh format PDF A4 Landscape 100% identik dengan foto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>

            {/* Tombol Cetak */}
            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Cetak langsung ke kertas A4 Landscape"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak (Print)</span>
            </button>

            {/* Tombol Tambah Baris */}
            <button
              onClick={activeSubTab === 'buku_pembantu' ? handleOpenAddBppModal : () => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pajak</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Buku Pembantu Pajak (PDF 2 Halaman) vs Lampiran 4 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSubTab('buku_pembantu')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === 'buku_pembantu'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Buku Pembantu Pajak (Format Sesuai Dokumen)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('lampiran4')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === 'lampiran4'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lampiran 4 Rekapitulasi Pajak (Triwulan)</span>
            </button>
          </div>

          {activeSubTab === 'buku_pembantu' && (
            <div className="flex items-center flex-wrap gap-2">
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bppSearch}
                  onChange={(e) => setBppSearch(e.target.value)}
                  placeholder="Cari uraian / kode..."
                  className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <button
                onClick={handleResetBppToEmpty}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl border border-rose-200 flex items-center space-x-1 cursor-pointer transition-colors"
                title="Kosongkan seluruh data Buku Pembantu Pajak"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset (Kosongkan)</span>
              </button>

              <button
                onClick={handleLoadBppDefaultExample}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center space-x-1 cursor-pointer transition-colors"
                title="Muat kembali 24 baris data contoh dokumen acuan"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Muat Contoh (24 Baris)</span>
              </button>

              {bkuData && bkuData.length > 0 && (
                <button
                  onClick={handleSyncFromBkuToBpp}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl border border-blue-200 flex items-center space-x-1 cursor-pointer"
                  title="Ambil transaksi belanja dari BKU dan buat pasangan Terima & Setor"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Tarik Belanja BKU</span>
                </button>
              )}
            </div>
          )}

          {activeSubTab === 'lampiran4' && (
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
                {['TW 1', 'TW 2', 'TW 3', 'TW 4'].map((tw) => (
                  <button
                    key={tw}
                    onClick={() => setSelectedTw(tw)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedTw === tw
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tw} ({TRIWULAN_MONTHS[tw][0].substring(0, 3)}-{TRIWULAN_MONTHS[tw][2].substring(0, 3)})
                  </button>
                ))}
              </div>

              {/* Tombol Reset (Kosongkan) Rekap Pajak */}
              <button
                type="button"
                onClick={handleResetRekapToEmpty}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl border border-rose-200 flex items-center space-x-1 cursor-pointer transition-colors"
                title="Kosongkan seluruh data transaksi Rekapitulasi Pajak Lampiran 4"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset (Kosongkan)</span>
              </button>

              {/* Tombol Muat Contoh Rekap Pajak */}
              <button
                type="button"
                onClick={handleLoadRekapDefaultExample}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center space-x-1 cursor-pointer transition-colors"
                title="Muat kembali data contoh acuan Lampiran 4"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Muat Contoh</span>
              </button>

              {/* Tombol Sinkronkan dari BPP & BKU */}
              <button
                type="button"
                onClick={handleSyncAllTaxes}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1 cursor-pointer"
                title="Sinkronkan ulang data dari Buku Pembantu Pajak & BKU"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Sinkronkan Ulang</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BANNER INTEGRASI BKU ↔ BUKU PEMBANTU PAJAK ↔ REKAPITULASI LAMPIRAN 4      */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[10px] font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Pusat Integrasi Pajak 100% Akurat
              </span>
              {isTwBalanced ? (
                <span className="px-2.5 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" /> {selectedTw}: 100% Sinkron & Klop
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-300" /> {selectedTw}: Ada Selisih Rp {selisihTw.toLocaleString('id-ID')}
                </span>
              )}
            </div>
            <h3 className="text-base font-black tracking-tight mt-1.5 text-white">
              Integrasi Terpadu BKU ARKAS ↔ Buku Pembantu Pajak ↔ Rekap Pajak (Lampiran 4)
            </h3>
            <p className="text-xs text-blue-200/90 leading-relaxed mt-0.5">
              Otomatis menghubungkan nilai belanja BKU, setoran Buku Pembantu Pajak, dan rincian per bulan Lampiran 4 agar angka 100% tepat dan tidak ada selisih.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleSyncAllTaxes}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              title="Sinkronkan Buku Pembantu Pajak & BKU ke Rekap Lampiran 4 agar 100% tepat"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Sinkronkan 100% ke Rekap</span>
            </button>

            {bkuData && bkuData.length > 0 && (
              <button
                type="button"
                onClick={handleExtractFromBku}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                title="Tarik seluruh belanja kena pajak dari BKU ARKAS"
              >
                <Layers className="w-4 h-4" />
                <span>Tarik dari BKU ({bkuData.length} Baris)</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-blue-200 text-[10px] block">Total Belanja BKU</span>
            <span className="font-black text-white font-mono text-xs">
              Rp {bkuData?.reduce((acc, b) => acc + (b.keluar || 0), 0).toLocaleString('id-ID') || 0}
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-blue-200 text-[10px] block">Total Setor BPP ({selectedTw})</span>
            <span className="font-black text-white font-mono text-xs">
              Rp {totBppSetorTw.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-blue-200 text-[10px] block">Total Rekap Lampiran 4 ({selectedTw})</span>
            <span className="font-black text-white font-mono text-xs">
              Rp {grandTotalTwRekap.toLocaleString('id-ID')}
            </span>
          </div>
          <div className={`rounded-xl p-2.5 backdrop-blur-xs ${isTwBalanced ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
            <span className="text-[10px] block opacity-80">Status Keseimbangan</span>
            <span className="font-black font-mono text-xs flex items-center gap-1">
              {isTwBalanced ? '✓ 100% Akurat (Rp 0)' : `Selisih Rp ${selisihTw.toLocaleString('id-ID')}`}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN 1: BUKU PEMBANTU PAJAK - FORMAT PERSIS 100% SESUAI PDF DOKUMEN   */}
      {/* ========================================================================= */}
      {activeSubTab === 'buku_pembantu' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-xs space-y-4 font-sans text-black overflow-x-auto print:p-0 print:border-none print:shadow-none">
          {/* Header Identitas Buku Pembantu Pajak */}
          <div className="flex justify-between items-start pt-1 pb-2">
            <div className="text-left font-black tracking-tight leading-tight text-slate-900 text-xs sm:text-sm">
              <p className="text-base uppercase tracking-wider">BUKU PEMBANTU PAJAK</p>
              <p>TAHUN ANGGARAN {settings.tahunAnggaran || '2026'}</p>
              <p>
                {settings.namaSekolah?.toUpperCase() || 'SDN 1 CIBUNGUR'} - KECAMATAN{' '}
                {settings.kecamatan?.toUpperCase() || 'CIGEMBLONG'}
              </p>
            </div>
          </div>

          {/* TABEL BUKU PEMBANTU PAJAK PERSIS SEPERTI GAMBAR */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[10px] sm:text-[11px] leading-tight text-black">
              <thead>
                {/* Baris Header 1: TANGGAL | NO. KODE | URAIAN | PENERIMAAN / DEBIT (Hijau Muda) | PENGELUARAN/KREDIT | SALDO */}
                <tr className="bg-white text-black font-extrabold text-center border-b border-black">
                  <th
                    rowSpan={2}
                    className="py-2 px-2 border border-black w-20 align-middle bg-[#bbf7d0]"
                  >
                    TANGGAL
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2 px-2 border border-black w-20 align-middle bg-[#bbf7d0]"
                  >
                    NO. KODE
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2 px-3 border border-black min-w-[260px] text-center align-middle bg-[#bbf7d0]"
                  >
                    URAIAN
                  </th>
                  <th
                    colSpan={5}
                    className="py-2 px-2 border border-black text-center align-middle bg-[#bbf7d0]"
                  >
                    PENERIMAAN / DEBIT
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2 px-2 border border-black w-24 align-middle bg-[#bbf7d0] leading-tight"
                  >
                    PENGELU-<br />ARAN/KREDIT
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2 px-2 border border-black w-20 align-middle bg-[#bbf7d0]"
                  >
                    SALDO
                  </th>
                  <th
                    rowSpan={2}
                    className="py-2 px-1 border border-black w-14 align-middle bg-[#bbf7d0] no-print"
                  >
                    Aksi
                  </th>
                </tr>

                {/* Baris Header 2: Sub-Kolom Penerimaan / Debit */}
                <tr className="text-black font-extrabold text-center border-b border-black bg-[#bbf7d0]">
                  <th className="py-1 px-1.5 border border-black w-14 text-center">PPN</th>
                  <th className="py-1 px-1.5 border border-black w-16 text-center">PPh 21</th>
                  <th className="py-1 px-1.5 border border-black w-16 text-center">PPh 23</th>
                  <th className="py-1 px-1.5 border border-black w-14 text-center">PPh 4</th>
                  <th className="py-1 px-1.5 border border-black w-16 text-center">SSPD</th>
                </tr>
              </thead>

              <tbody>
                {(() => {
                  const filtered = bppItems.filter((it) => {
                    if (!bppSearch) return true;
                    const q = bppSearch.toLowerCase();
                    return (
                      it.uraian.toLowerCase().includes(q) ||
                      it.noKode.toLowerCase().includes(q) ||
                      it.tanggal.includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={11} className="py-8 px-4 text-center border border-black bg-slate-50/40">
                          <div className="flex flex-col items-center justify-center space-y-1.5 text-slate-500">
                            <p className="font-bold text-slate-800 text-xs">
                              {bppItems.length === 0
                                ? 'Data Buku Pembantu Pajak Kosong'
                                : 'Tidak ada data yang cocok dengan pencarian'}
                            </p>
                            <p className="text-[11px] text-slate-500 max-w-md">
                              {bppItems.length === 0
                                ? 'Buku Pembantu Pajak telah dikosongkan. Anda dapat menambahkan data melalui Import Excel, Tarik Belanja BKU, atau klik Tambah Pajak.'
                                : 'Coba gunakan kata kunci lain untuk mencari transaksi.'}
                            </p>
                            {bppItems.length === 0 && (
                              <button
                                onClick={handleLoadBppDefaultExample}
                                className="mt-2 text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors cursor-pointer no-print"
                              >
                                Muat Contoh Dokumen Acuan (24 Baris)
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 print:hover:bg-transparent">
                      {/* Tanggal */}
                      <td className="py-1.5 px-2 text-center border border-black font-mono whitespace-nowrap">
                        {item.tanggal}
                      </td>

                      {/* No Kode */}
                      <td className="py-1.5 px-2 text-center border border-black font-mono">
                        {item.noKode}
                      </td>

                      {/* Uraian */}
                      <td className="py-1.5 px-2.5 text-left border border-black font-medium leading-snug">
                        {item.uraian}
                      </td>

                      {/* Kolom PPN */}
                      <td className="py-1.5 px-1.5 text-center border border-black font-mono">
                        {item.ppn > 0 ? item.ppn.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Kolom PPh 21 */}
                      <td className="py-1.5 px-1.5 text-right border border-black font-mono">
                        {item.pph21 > 0 ? item.pph21.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Kolom PPh 23 */}
                      <td className="py-1.5 px-1.5 text-right border border-black font-mono">
                        {item.pph23 > 0 ? item.pph23.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Kolom PPh 4 */}
                      <td className="py-1.5 px-1.5 text-center border border-black font-mono">
                        {item.pph4 > 0 ? item.pph4.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Kolom SSPD */}
                      <td className="py-1.5 px-1.5 text-right border border-black font-mono">
                        {item.sspd > 0 ? item.sspd.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Kolom Pengeluaran / Kredit */}
                      <td className="py-1.5 px-2 text-right border border-black font-mono">
                        {item.pengeluaran > 0 ? item.pengeluaran.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Kolom Saldo */}
                      <td className="py-1.5 px-2 text-right border border-black font-mono font-semibold">
                        {item.saldo > 0 ? item.saldo.toLocaleString('id-ID') : '-'}
                      </td>

                      {/* Kolom Aksi (No Print) */}
                      <td className="py-1 px-1 text-center border border-black no-print">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEditBppModal(item)}
                            className="p-1 text-slate-600 hover:text-blue-600 cursor-pointer"
                            title="Edit baris ini"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteBppItem(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>

              {/* Baris JUMLAH Persis Seperti di Halaman 2 Gambar */}
              <tfoot>
                <tr className="bg-white font-extrabold text-black border-t-2 border-black">
                  <td colSpan={3} className="py-2 px-3 text-center border border-black font-black text-xs">
                    JUMLAH
                  </td>

                  {/* PPN */}
                  <td className="py-2 px-1.5 text-center border border-black font-mono">
                    {totBppPpn > 0 ? totBppPpn.toLocaleString('id-ID') : '-'}
                  </td>

                  {/* PPh 21 */}
                  <td className="py-2 px-1.5 text-right border border-black font-mono">
                    {totBppPph21 > 0 ? totBppPph21.toLocaleString('id-ID') : '-'}
                  </td>

                  {/* PPh 23 */}
                  <td className="py-2 px-1.5 text-right border border-black font-mono">
                    {totBppPph23 > 0 ? totBppPph23.toLocaleString('id-ID') : '-'}
                  </td>

                  {/* PPh 4 */}
                  <td className="py-2 px-1.5 text-center border border-black font-mono">
                    {totBppPph4 > 0 ? totBppPph4.toLocaleString('id-ID') : '-'}
                  </td>

                  {/* SSPD */}
                  <td className="py-2 px-1.5 text-right border border-black font-mono">
                    {totBppSspd > 0 ? totBppSspd.toLocaleString('id-ID') : '-'}
                  </td>

                  {/* PENGELUARAN / KREDIT */}
                  <td className="py-2 px-2 text-right border border-black font-mono font-black">
                    {totBppPengeluaran > 0 ? totBppPengeluaran.toLocaleString('id-ID') : '-'}
                  </td>

                  {/* SALDO */}
                  <td className="py-2 px-2 text-right border border-black font-mono font-black">
                    {totBppPenerimaan > 0 ? totBppPenerimaan.toLocaleString('id-ID') : '-'}
                  </td>

                  {/* Aksi */}
                  <td className="py-2 px-1 text-center border border-black no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 2: REKAPITULASI PEMBAYARAN PAJAK (LAMPIRAN 4)                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'lampiran4' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4 font-sans text-black overflow-x-auto print:p-0 print:border-none print:shadow-none">
          {/* Header Dokumen: Kiri REKAPITULASI, Kanan Lampiran 4 */}
          <div className="flex justify-between items-start pt-1 pb-2">
            <div className="text-left font-black tracking-tight leading-tight text-slate-900 text-xs sm:text-sm">
              <p>REKAPITULASI</p>
              <p>PEMBAYARAN PAJAK TAHUN {settings.tahunAnggaran || '2026'}</p>
              <p>
                SEKOLAH DASAR KAB.{' '}
                {settings.kabupaten?.toUpperCase().replace('KABUPATEN ', '').replace('KAB. ', '') || 'LEBAK'}
              </p>
            </div>

            <div className="text-right font-black text-slate-900 text-xs sm:text-sm">
              <p>Lampiran 4</p>
            </div>
          </div>

          {/* Status Sinkronisasi Triwulan Aktif */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs gap-2 no-print">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-bold text-slate-800">
                Periode: <span className="text-blue-700 font-extrabold">{selectedTw} ({m1}, {m2}, {m3})</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-slate-600">
                Total Belanja Triwulan: <span className="font-mono font-bold text-slate-800">Rp {finalRekapList.reduce((acc, it) => acc + (it.jumlahBelanja || 0), 0).toLocaleString('id-ID')}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-slate-600">
                Total Pajak Disetor: <span className="font-mono font-bold text-slate-900">Rp {grandTotalTwRekap.toLocaleString('id-ID')}</span>
              </span>
              {isTwBalanced ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> 100% Sesuai BPP
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSyncAllTaxes}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 cursor-pointer"
                  title="Klik untuk menyamakan dengan Buku Pembantu Pajak"
                >
                  <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" /> Selisih Rp {selisihTw.toLocaleString('id-ID')} (Klik Sinkronkan)
                </button>
              )}

              {/* Tombol Reset / Kosongkan Rekap Pajak */}
              {rekapItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetRekapToEmpty}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer transition-colors"
                  title="Kosongkan seluruh transaksi Rekapitulasi Pajak Lampiran 4"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Kosongkan Rekap
                </button>
              )}
            </div>
          </div>

          {/* TABEL RESMI 19 KOLOM DENGAN BORDER HITAM MURNI */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-[10px] sm:text-[11px] leading-tight text-black">
              <thead>
                <tr className="bg-white text-black font-extrabold text-center border-b border-black">
                  <th rowSpan={2} className="py-1.5 px-1 border border-black w-7 align-middle">
                    No.
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1 border border-black w-16 align-middle">
                    NPSN
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 border border-black w-28 align-middle">
                    NAMA SEKOLAH
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 border border-black w-24 align-middle">
                    KECAMATAN
                  </th>
                  <th rowSpan={2} className="py-1.5 px-2 border border-black min-w-[200px] text-center align-middle">
                    URAIAN BELANJA
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 border border-black w-20 align-middle">
                    SUMBER<br />DANA
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 border border-black w-20 align-middle">
                    JUMLAH<br />BELANJA
                  </th>
                  <th colSpan={3} className="py-1 px-1 border border-black text-center align-middle">
                    PPN
                  </th>
                  <th colSpan={3} className="py-1 px-1 border border-black text-center align-middle">
                    PPH 21
                  </th>
                  <th colSpan={3} className="py-1 px-1 border border-black text-center align-middle">
                    PPH 23
                  </th>
                  <th colSpan={3} className="py-1 px-1 border border-black text-center align-middle">
                    PAJAK DAERAH (SSPD)
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 border border-black w-20 align-middle">
                    TANGGAL<br />BELANJA
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 border border-black w-20 align-middle">
                    TANGGAL<br />SETOR PAJAK
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1.5 border border-black w-20 align-middle">
                    NO. NTPN
                  </th>
                  <th rowSpan={2} className="py-1.5 px-1 border border-black w-10 align-middle text-center no-print">
                    AKSI
                  </th>
                </tr>

                <tr className="bg-white text-black font-extrabold text-center border-b border-black">
                  <th className="py-1 px-1 border border-black w-12 text-center">{m1}</th>
                  <th className="py-1 px-1 border border-black w-12 text-center">{m2}</th>
                  <th className="py-1 px-1 border border-black w-12 text-center">{m3}</th>
                  <th className="py-1 px-1 border border-black w-12 text-center">{m1}</th>
                  <th className="py-1 px-1 border border-black w-12 text-center">{m2}</th>
                  <th className="py-1 px-1 border border-black w-12 text-center">{m3}</th>
                  <th className="py-1 px-1 border border-black w-12 text-center">{m1}</th>
                  <th className="py-1 px-1 border border-black w-12 text-center">{m2}</th>
                  <th className="py-1 px-1 border border-black w-12 text-center">{m3}</th>
                  <th className="py-1 px-1 border border-black w-14 text-center">{m1}</th>
                  <th className="py-1 px-1 border border-black w-14 text-center">{m2}</th>
                  <th className="py-1 px-1 border border-black w-14 text-center">{m3}</th>
                </tr>
              </thead>

              <tbody>
                {finalRekapList.length > 0 ? (
                  finalRekapList.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 print:hover:bg-transparent">
                      <td className="py-1 px-1 text-center border border-black font-medium">{item.no || idx + 1}</td>
                      <td className="py-1 px-1 text-center border border-black font-mono">
                        {item.npsn || settings.npsn}
                      </td>
                      <td className="py-1 px-1.5 text-left border border-black font-semibold">
                        {item.namaSekolah || settings.namaSekolah}
                      </td>
                      <td className="py-1 px-1.5 text-left border border-black">
                        {item.kecamatan || settings.kecamatan}
                      </td>
                      <td className="py-1 px-2 text-left border border-black font-medium leading-snug">
                        {item.uraianBelanja}
                      </td>
                      <td className="py-1 px-1 text-center border border-black whitespace-nowrap">
                        {item.sumberDana || 'BOSP REGULER'}
                      </td>
                      <td className="py-1 px-1.5 text-right border border-black font-mono">
                        {item.jumlahBelanja ? item.jumlahBelanja.toLocaleString('id-ID') : ''}
                      </td>

                      {/* Kolom PPN */}
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.ppn[m1] ? item.ppn[m1].toLocaleString('id-ID') : ''}
                      </td>
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.ppn[m2] ? item.ppn[m2].toLocaleString('id-ID') : ''}
                      </td>
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.ppn[m3] ? item.ppn[m3].toLocaleString('id-ID') : ''}
                      </td>

                      {/* Kolom PPH 21 */}
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.pph21[m1] ? item.pph21[m1].toLocaleString('id-ID') : ''}
                      </td>
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.pph21[m2] ? item.pph21[m2].toLocaleString('id-ID') : ''}
                      </td>
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.pph21[m3] ? item.pph21[m3].toLocaleString('id-ID') : ''}
                      </td>

                      {/* Kolom PPH 23 */}
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.pph23[m1] ? item.pph23[m1].toLocaleString('id-ID') : ''}
                      </td>
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.pph23[m2] ? item.pph23[m2].toLocaleString('id-ID') : ''}
                      </td>
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.pph23[m3] ? item.pph23[m3].toLocaleString('id-ID') : ''}
                      </td>

                      {/* Kolom Pajak Daerah (SSPD) */}
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.pajakDaerah[m1] ? item.pajakDaerah[m1].toLocaleString('id-ID') : ''}
                      </td>
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.pajakDaerah[m2] ? item.pajakDaerah[m2].toLocaleString('id-ID') : ''}
                      </td>
                      <td className="py-1 px-1 text-right border border-black font-mono">
                        {item.pajakDaerah[m3] ? item.pajakDaerah[m3].toLocaleString('id-ID') : ''}
                      </td>

                      {/* Tanggal & NTPN */}
                      <td className="py-1 px-1 text-center border border-black font-mono whitespace-nowrap">
                        {item.tanggalBelanja}
                      </td>
                      <td className="py-1 px-1 text-center border border-black font-mono whitespace-nowrap">
                        {item.tanggalSetorPajak}
                      </td>
                      <td className="py-1 px-1 text-center border border-black font-mono">
                        {item.noNtpn || ''}
                      </td>
                      <td className="py-1 px-1 text-center border border-black no-print">
                        <button
                          type="button"
                          onClick={() => handleDeleteRekapItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer transition-colors rounded hover:bg-red-50"
                          title="Hapus baris ini dari Rekapitulasi Pajak"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={20} className="py-8 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <AlertTriangle className="w-8 h-8 text-amber-500 opacity-60" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">Data Rekapitulasi Pajak untuk periode {selectedTw} kosong (0 baris).</p>
                          <p className="text-[11px] text-slate-500">Anda dapat menyinkronkan data dari Buku Pembantu Pajak & BKU, atau memuat contoh data standar.</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleSyncAllTaxes}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1 shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Sinkronkan Pajak (100% Akurat)</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleLoadRekapDefaultExample}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 cursor-pointer flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                            <span>Muat Contoh Standar</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Baris JUMLAH */}
              <tfoot>
                <tr className="bg-white font-extrabold text-black border-t-2 border-black">
                  <td colSpan={7} className="py-1.5 px-2 text-center border border-black font-black">
                    JUMLAH
                  </td>

                  {/* Total PPN */}
                  <td className="py-1.5 px-1 text-center border border-black font-mono">
                    {totPpn1 > 0 ? totPpn1.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="py-1.5 px-1 text-center border border-black font-mono">
                    {totPpn2 > 0 ? totPpn2.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="py-1.5 px-1 text-center border border-black font-mono">
                    {totPpn3 > 0 ? totPpn3.toLocaleString('id-ID') : '-'}
                  </td>

                  {/* Total PPH 21 */}
                  <td className="py-1.5 px-1 text-right border border-black font-mono">
                    {totPph21_1 > 0 ? totPph21_1.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="py-1.5 px-1 text-center border border-black font-mono">
                    {totPph21_2 > 0 ? totPph21_2.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="py-1.5 px-1 text-center border border-black font-mono">
                    {totPph21_3 > 0 ? totPph21_3.toLocaleString('id-ID') : '-'}
                  </td>

                  {/* Total PPH 23 */}
                  <td className="py-1.5 px-1 text-right border border-black font-mono">
                    {totPph23_1 > 0 ? totPph23_1.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="py-1.5 px-1 text-right border border-black font-mono">
                    {totPph23_2 > 0 ? totPph23_2.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="py-1.5 px-1 text-right border border-black font-mono">
                    {totPph23_3 > 0 ? totPph23_3.toLocaleString('id-ID') : '-'}
                  </td>

                  {/* Total Pajak Daerah (SSPD) */}
                  <td className="py-1.5 px-1 text-right border border-black font-mono">
                    {totPd1 > 0 ? totPd1.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="py-1.5 px-1 text-right border border-black font-mono">
                    {totPd2 > 0 ? totPd2.toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="py-1.5 px-1 text-right border border-black font-mono">
                    {totPd3 > 0 ? totPd3.toLocaleString('id-ID') : '-'}
                  </td>

                  <td className="py-1.5 px-1 text-center border border-black font-mono"></td>
                  <td className="py-1.5 px-1 text-center border border-black font-mono"></td>
                  <td className="py-1.5 px-1 text-center border border-black font-mono"></td>
                  <td className="py-1.5 px-1 text-center border border-black font-mono no-print"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT BUKU PEMBANTU PAJAK                                   */}
      {/* ========================================================================= */}
      {isBppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingBppId ? 'Edit Baris Buku Pembantu Pajak' : 'Tambah Transaksi Buku Pembantu Pajak'}
              </h3>
              <button
                onClick={() => setIsBppModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBpp} className="space-y-3 text-xs">
              {!editingBppId && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800">Mode Entri:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setFormBpp({ ...formBpp, mode: 'pasangan' })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        formBpp.mode === 'pasangan' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
                      }`}
                    >
                      Otomatis Terima & Setor (2 Baris)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormBpp({ ...formBpp, mode: 'tunggal' })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        formBpp.mode === 'tunggal' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
                      }`}
                    >
                      1 Baris Saja
                    </button>
                  </div>
                </div>
              )}

              {formBpp.mode === 'tunggal' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Transaksi</label>
                  <select
                    value={formBpp.tipeBaris}
                    onChange={(e) =>
                      setFormBpp({ ...formBpp, tipeBaris: e.target.value as 'Terima' | 'Setor' })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Terima">Penerimaan / Debit (Terima Pajak)</option>
                    <option value="Setor">Pengeluaran / Kredit (Setor Pajak)</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal *</label>
                  <input
                    type="text"
                    required
                    value={formBpp.tanggal}
                    onChange={(e) => setFormBpp({ ...formBpp, tanggal: e.target.value })}
                    placeholder="02-04-2026"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Kode Rekening *</label>
                  <input
                    type="text"
                    required
                    value={formBpp.noKode}
                    onChange={(e) => setFormBpp({ ...formBpp, noKode: e.target.value })}
                    placeholder="04.06.01."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Pajak *</label>
                <select
                  value={formBpp.jenisPajak}
                  onChange={(e) =>
                    setFormBpp({
                      ...formBpp,
                      jenisPajak: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="PPh 23">PPh 23 (Tarif 2%)</option>
                  <option value="SSPD">SSPD / Pajak Daerah (Tarif 10%)</option>
                  <option value="PPh 21">PPh 21 (Honorarium / Pegawai Non-PNS Tarif 5%)</option>
                  <option value="PPN">PPN (11%)</option>
                  <option value="PPh 4">PPh 4 (Sewa Gedung / Jasa Konstruksi)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Uraian Kegiatan *</label>
                <textarea
                  required
                  rows={2}
                  value={formBpp.kegiatan}
                  onChange={(e) => setFormBpp({ ...formBpp, kegiatan: e.target.value })}
                  placeholder="Contoh: Pelaksanaan kegiatan komunitas belajar di satuan pendidikan"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Pajak (Rp) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formBpp.nominalPajak || ''}
                  onChange={(e) => setFormBpp({ ...formBpp, nominalPajak: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-black text-sm text-blue-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBppModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
