import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BukuPembantuPajakItem, AppSettings } from '../types';

/**
 * Ekspor Buku Pembantu Pajak ke format Excel yang persis 100% dengan dokumen acuan
 */
export const exportBukuPembantuPajakToExcel = (
  items: BukuPembantuPajakItem[],
  namaSekolah?: string,
  tahunAnggaran: string = '2026'
) => {
  const wsData: (string | number)[][] = [];

  // Baris Header Utama
  wsData.push([
    'TANGGAL',
    'NO. KODE',
    'URAIAN',
    'PENERIMAAN / DEBIT',
    '',
    '',
    '',
    '',
    'PENGELUARAN / KREDIT',
    'SALDO',
  ]);

  // Baris Sub-Header di bawah PENERIMAAN / DEBIT
  wsData.push([
    '',
    '',
    '',
    'PPN',
    'PPh 21',
    'PPh 23',
    'PPh 4',
    'SSPD',
    '',
    '',
  ]);

  let totPpn = 0;
  let totPph21 = 0;
  let totPph23 = 0;
  let totPph4 = 0;
  let totSspd = 0;
  let totPengeluaran = 0;

  // Baris Data
  items.forEach((it) => {
    totPpn += it.ppn || 0;
    totPph21 += it.pph21 || 0;
    totPph23 += it.pph23 || 0;
    totPph4 += it.pph4 || 0;
    totSspd += it.sspd || 0;
    totPengeluaran += it.pengeluaran || 0;

    wsData.push([
      it.tanggal || '',
      it.noKode || '',
      it.uraian || '',
      it.ppn > 0 ? it.ppn : '-',
      it.pph21 > 0 ? it.pph21 : '-',
      it.pph23 > 0 ? it.pph23 : '-',
      it.pph4 > 0 ? it.pph4 : '-',
      it.sspd > 0 ? it.sspd : '-',
      it.pengeluaran > 0 ? it.pengeluaran : '-',
      it.saldo > 0 ? it.saldo : '-',
    ]);
  });

  const totPenerimaan = totPpn + totPph21 + totPph23 + totPph4 + totSspd;

  // Baris JUMLAH
  wsData.push([
    'JUMLAH',
    '',
    '',
    totPpn > 0 ? totPpn : '-',
    totPph21 > 0 ? totPph21 : '-',
    totPph23 > 0 ? totPph23 : '-',
    totPph4 > 0 ? totPph4 : '-',
    totSspd > 0 ? totSspd : '-',
    totPengeluaran > 0 ? totPengeluaran : '-',
    totPenerimaan > 0 ? totPenerimaan : '-',
  ]);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merging cells
  ws['!merges'] = [
    // TANGGAL (A1:A2)
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
    // NO. KODE (B1:B2)
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },
    // URAIAN (C1:C2)
    { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },
    // PENERIMAAN / DEBIT (D1:H1)
    { s: { r: 0, c: 3 }, e: { r: 0, c: 7 } },
    // PENGELUARAN / KREDIT (I1:I2)
    { s: { r: 0, c: 8 }, e: { r: 1, c: 8 } },
    // SALDO (J1:J2)
    { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } },
    // JUMLAH merge col A..C
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 2 } },
  ];

  // Column Widths
  ws['!cols'] = [
    { wch: 14 }, // TANGGAL
    { wch: 14 }, // NO KODE
    { wch: 60 }, // URAIAN
    { wch: 12 }, // PPN
    { wch: 12 }, // PPh 21
    { wch: 12 }, // PPh 23
    { wch: 12 }, // PPh 4
    { wch: 14 }, // SSPD
    { wch: 18 }, // PENGELUARAN
    { wch: 14 }, // SALDO
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Buku Pembantu Pajak');

  const cleanSchool = (namaSekolah || 'Buku_Pembantu_Pajak').replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Buku_Pembantu_Pajak_${cleanSchool}_${tahunAnggaran}.xlsx`);
};

/**
 * Parsing file Excel yang diunggah pengguna menjadi BukuPembantuPajakItem[]
 */
export const parseBukuPembantuPajakFromExcel = async (file: File): Promise<BukuPembantuPajakItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Konversi sheet ke array of array
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length < 2) {
          throw new Error('File Excel tidak memiliki baris data yang cukup.');
        }

        // Cari baris data (setelah header)
        // Header biasanya baris 0 dan baris 1 (atau ada judul di atas)
        let headerRowIdx = -1;
        for (let r = 0; r < Math.min(10, rawRows.length); r++) {
          const rowText = rawRows[r].map((c) => String(c).toUpperCase()).join(' ');
          if (rowText.includes('TANGGAL') && (rowText.includes('URAIAN') || rowText.includes('KODE'))) {
            headerRowIdx = r;
            break;
          }
        }

        // Deteksi index kolom secara cerdas & adaptif
        let colIdxTanggal = 0;
        let colIdxKode = 1;
        let colIdxUraian = 2;
        let colIdxPpn = 3;
        let colIdxPph21 = 4;
        let colIdxPph23 = 5;
        let colIdxPph4 = 6;
        let colIdxSspd = 7;
        let colIdxPengeluaran = 8;
        let colIdxSaldo = 9;

        if (headerRowIdx >= 0) {
          const mainH = rawRows[headerRowIdx] || [];
          const subH = rawRows[headerRowIdx + 1] || [];

          mainH.forEach((val, c) => {
            const txt = String(val).toUpperCase();
            if (txt.includes('TANGGAL')) colIdxTanggal = c;
            else if (txt.includes('KODE')) colIdxKode = c;
            else if (txt.includes('URAIAN')) colIdxUraian = c;
            else if (txt.includes('PENGELUARAN') || txt.includes('KREDIT')) colIdxPengeluaran = c;
            else if (txt.includes('SALDO')) colIdxSaldo = c;
          });

          subH.forEach((val, c) => {
            const txt = String(val).toUpperCase();
            if (txt === 'PPN') colIdxPpn = c;
            else if (txt.includes('21')) colIdxPph21 = c;
            else if (txt.includes('23')) colIdxPph23 = c;
            else if (txt.includes('4') || txt.includes('FINAL')) colIdxPph4 = c;
            else if (txt.includes('SSPD') || txt.includes('DAERAH')) colIdxSspd = c;
          });
        }

        const dataStartIdx = headerRowIdx >= 0 ? headerRowIdx + 2 : 2;

        const items: BukuPembantuPajakItem[] = [];

        for (let r = dataStartIdx; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const colTanggalVal = row[colIdxTanggal];
          const colKodeVal = String(row[colIdxKode] || '').trim();
          const colUraianVal = String(row[colIdxUraian] || '').trim();

          const rowCombined = row.map((c) => String(c).toUpperCase()).join(' ');

          // Berhenti jika baris JUMLAH atau baris tanda tangan
          if (
            rowCombined.includes('JUMLAH') ||
            rowCombined.includes('TOTAL') ||
            rowCombined.includes('MENGETAHUI') ||
            rowCombined.includes('KEPALA SEKOLAH')
          ) {
            break;
          }

          // Jika baris kosong semua, lewati
          if (!colTanggalVal && !colKodeVal && !colUraianVal) continue;

          const parseNum = (val: any): number => {
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            if (!val) return 0;
            const str = String(val).replace(/[^0-9,-]/g, '').replace(',', '.');
            const n = parseFloat(str);
            return isNaN(n) ? 0 : n;
          };

          // Format tanggal
          let tglStr = String(colTanggalVal || '').trim();
          if (typeof colTanggalVal === 'number') {
            // Excel serial date to string
            const excelDate = new Date((colTanggalVal - (25567 + 2)) * 86400 * 1000);
            if (!isNaN(excelDate.getTime())) {
              const d = String(excelDate.getDate()).padStart(2, '0');
              const m = String(excelDate.getMonth() + 1).padStart(2, '0');
              const y = excelDate.getFullYear();
              tglStr = `${d}-${m}-${y}`;
            }
          }

          const ppn = parseNum(row[colIdxPpn]);
          const pph21 = parseNum(row[colIdxPph21]);
          const pph23 = parseNum(row[colIdxPph23]);
          const pph4 = parseNum(row[colIdxPph4]);
          const sspd = parseNum(row[colIdxSspd]);
          const pengeluaran = parseNum(row[colIdxPengeluaran]);
          let saldo = parseNum(row[colIdxSaldo]);

          // Jika saldo di baris pengeluaran bernilai 0 dan di baris terima terisi
          const isTerima = colUraianVal.toLowerCase().startsWith('terima');
          const isSetor = colUraianVal.toLowerCase().startsWith('setor');

          if (isTerima && saldo === 0) {
            saldo = ppn + pph21 + pph23 + pph4 + sspd;
          }

          items.push({
            id: `bpp-import-${Date.now()}-${r}`,
            tanggal: tglStr || '02-04-2026',
            noKode: colKodeVal || '04.06.01.',
            uraian: colUraianVal || '',
            ppn,
            pph21,
            pph23,
            pph4,
            sspd,
            pengeluaran,
            saldo: isSetor ? 0 : saldo,
          });
        }

        if (items.length === 0) {
          throw new Error('Tidak ditemukan baris transaksi yang valid di file Excel.');
        }

        resolve(items);
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal memproses file Excel.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file dari perangkat.'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Cetak / Unduh PDF Resmi Buku Pembantu Pajak (Landscape A4)
 */
export const generateBukuPembantuPajakPdf = (
  items: BukuPembantuPajakItem[],
  settings: AppSettings,
  tahunAnggaran: string = '2026'
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 10;
  const marginRight = 10;

  // Header Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BUKU PEMBANTU PAJAK', marginLeft, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`TAHUN ANGGARAN : ${tahunAnggaran}`, marginLeft, 16);
  doc.text(`SATUAN PENDIDIKAN : ${settings.namaSekolah || 'SDN 1 CIBUNGUR'}`, marginLeft, 20);

  // AutoTable Data
  let totPpn = 0;
  let totPph21 = 0;
  let totPph23 = 0;
  let totPph4 = 0;
  let totSspd = 0;
  let totPengeluaran = 0;

  const tableBody = items.map((it) => {
    totPpn += it.ppn || 0;
    totPph21 += it.pph21 || 0;
    totPph23 += it.pph23 || 0;
    totPph4 += it.pph4 || 0;
    totSspd += it.sspd || 0;
    totPengeluaran += it.pengeluaran || 0;

    return [
      it.tanggal,
      it.noKode,
      it.uraian,
      it.ppn > 0 ? it.ppn.toLocaleString('id-ID') : '-',
      it.pph21 > 0 ? it.pph21.toLocaleString('id-ID') : '-',
      it.pph23 > 0 ? it.pph23.toLocaleString('id-ID') : '-',
      it.pph4 > 0 ? it.pph4.toLocaleString('id-ID') : '-',
      it.sspd > 0 ? it.sspd.toLocaleString('id-ID') : '-',
      it.pengeluaran > 0 ? it.pengeluaran.toLocaleString('id-ID') : '-',
      it.saldo > 0 ? it.saldo.toLocaleString('id-ID') : '-',
    ];
  });

  const totPenerimaan = totPpn + totPph21 + totPph23 + totPph4 + totSspd;

  // Header 2 tingkat
  const head = [
    [
      { content: 'TANGGAL', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [187, 247, 208] as [number, number, number] } },
      { content: 'NO. KODE', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [187, 247, 208] as [number, number, number] } },
      { content: 'URAIAN', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [187, 247, 208] as [number, number, number] } },
      { content: 'PENERIMAAN / DEBIT', colSpan: 5, styles: { halign: 'center', valign: 'middle', fillColor: [187, 247, 208] as [number, number, number] } },
      { content: 'PENGELUARAN\n/ KREDIT', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [187, 247, 208] as [number, number, number] } },
      { content: 'SALDO', rowSpan: 2, styles: { halign: 'center', valign: 'middle', fillColor: [187, 247, 208] as [number, number, number] } },
    ],
    [
      { content: 'PPN', styles: { halign: 'center', fillColor: [187, 247, 208] as [number, number, number] } },
      { content: 'PPh 21', styles: { halign: 'center', fillColor: [187, 247, 208] as [number, number, number] } },
      { content: 'PPh 23', styles: { halign: 'center', fillColor: [187, 247, 208] as [number, number, number] } },
      { content: 'PPh 4', styles: { halign: 'center', fillColor: [187, 247, 208] as [number, number, number] } },
      { content: 'SSPD', styles: { halign: 'center', fillColor: [187, 247, 208] as [number, number, number] } },
    ],
  ];

  const foot = [
    [
      { content: 'JUMLAH', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: totPpn > 0 ? totPpn.toLocaleString('id-ID') : '-', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: totPph21 > 0 ? totPph21.toLocaleString('id-ID') : '-', styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totPph23 > 0 ? totPph23.toLocaleString('id-ID') : '-', styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totPph4 > 0 ? totPph4.toLocaleString('id-ID') : '-', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: totSspd > 0 ? totSspd.toLocaleString('id-ID') : '-', styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totPengeluaran > 0 ? totPengeluaran.toLocaleString('id-ID') : '-', styles: { halign: 'right', fontStyle: 'bold' } },
      { content: totPenerimaan > 0 ? totPenerimaan.toLocaleString('id-ID') : '-', styles: { halign: 'right', fontStyle: 'bold' } },
    ],
  ];

  autoTable(doc, {
    startY: 24,
    head: head as any,
    body: tableBody,
    foot: foot as any,
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
      cellPadding: 1.5,
      font: 'helvetica',
    },
    headStyles: {
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
    },
    footStyles: {
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' }, // Tanggal
      1: { cellWidth: 18, halign: 'center' }, // No Kode
      2: { cellWidth: 90, halign: 'left' },   // Uraian
      3: { cellWidth: 16, halign: 'center' }, // PPN
      4: { cellWidth: 18, halign: 'right' },  // PPh 21
      5: { cellWidth: 18, halign: 'right' },  // PPh 23
      6: { cellWidth: 16, halign: 'center' }, // PPh 4
      7: { cellWidth: 20, halign: 'right' },  // SSPD
      8: { cellWidth: 24, halign: 'right' },  // Pengeluaran
      9: { cellWidth: 24, halign: 'right' },  // Saldo
    },
    margin: { left: marginLeft, right: marginRight, top: 24, bottom: 15 },
  });

  const cleanSchool = (settings.namaSekolah || 'Buku_Pembantu_Pajak').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Buku_Pembantu_Pajak_${cleanSchool}_${tahunAnggaran}.pdf`);
};
