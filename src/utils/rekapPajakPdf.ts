import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RekapPajakItem, AppSettings } from '../types';
import { MonthSummaryAdjustment } from './rekapPajakData';

export function formatDotNumber(val: number | undefined | null): string {
  if (!val || val === 0) return '';
  return val.toLocaleString('id-ID');
}

export function formatSummaryDotNumber(val: number | undefined | null): string {
  if (!val || val === 0) return '-';
  return val.toLocaleString('id-ID');
}

export function generateRekapPajakPdf(
  items: RekapPajakItem[],
  settings: AppSettings,
  months: string[] = ['April', 'Mei', 'Juni'],
  summaryAdj?: MonthSummaryAdjustment,
  customTitle?: {
    judul: string;
    subJudul: string;
    wilayah: string;
    lampiran: string;
  }
) {
  // Ukuran A4 Landscape: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const marginX = 10;
  let currentY = 12;

  // 1. HEADER DOKUMEN (PERSIS SCREENSHOT LAMPIRAN 4)
  // Kiri Atas:
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);

  const judul1 = customTitle?.judul || 'REKAPITULASI';
  const judul2 = customTitle?.subJudul || `PEMBAYARAN PAJAK TAHUN ${settings.tahunAnggaran || '2026'}`;
  const judul3 = customTitle?.wilayah || `SEKOLAH DASAR KAB. ${settings.kabupaten?.toUpperCase().replace('KABUPATEN ', '').replace('KAB. ', '') || 'LEBAK'}`;

  doc.text(judul1, marginX, currentY);
  doc.text(judul2, marginX, currentY + 4);
  doc.text(judul3, marginX, currentY + 8);

  // Kanan Atas:
  const lampiran = customTitle?.lampiran || 'Lampiran 4';
  doc.text(lampiran, pageWidth - marginX, currentY, { align: 'right' });

  // 2. HITUNG TOTAL PER BULAN UNTUK ROW JUMLAH
  const m1 = months[0];
  const m2 = months[1];
  const m3 = months[2];

  let totPpn1 = items.reduce((acc, it) => acc + (it.ppn[m1] || 0), 0) + (summaryAdj?.ppn[m1] || 0);
  let totPpn2 = items.reduce((acc, it) => acc + (it.ppn[m2] || 0), 0) + (summaryAdj?.ppn[m2] || 0);
  let totPpn3 = items.reduce((acc, it) => acc + (it.ppn[m3] || 0), 0) + (summaryAdj?.ppn[m3] || 0);

  let totPph21_1 = items.reduce((acc, it) => acc + (it.pph21[m1] || 0), 0) + (summaryAdj?.pph21[m1] || 0);
  let totPph21_2 = items.reduce((acc, it) => acc + (it.pph21[m2] || 0), 0) + (summaryAdj?.pph21[m2] || 0);
  let totPph21_3 = items.reduce((acc, it) => acc + (it.pph21[m3] || 0), 0) + (summaryAdj?.pph21[m3] || 0);

  let totPph23_1 = items.reduce((acc, it) => acc + (it.pph23[m1] || 0), 0) + (summaryAdj?.pph23[m1] || 0);
  let totPph23_2 = items.reduce((acc, it) => acc + (it.pph23[m2] || 0), 0) + (summaryAdj?.pph23[m2] || 0);
  let totPph23_3 = items.reduce((acc, it) => acc + (it.pph23[m3] || 0), 0) + (summaryAdj?.pph23[m3] || 0);

  let totPd1 = items.reduce((acc, it) => acc + (it.pajakDaerah[m1] || 0), 0) + (summaryAdj?.pajakDaerah[m1] || 0);
  let totPd2 = items.reduce((acc, it) => acc + (it.pajakDaerah[m2] || 0), 0) + (summaryAdj?.pajakDaerah[m2] || 0);
  let totPd3 = items.reduce((acc, it) => acc + (it.pajakDaerah[m3] || 0), 0) + (summaryAdj?.pajakDaerah[m3] || 0);

  // 3. SUSUN DATA BODY
  const bodyData = items.map((item, index) => {
    return [
      item.no || index + 1,
      item.npsn || settings.npsn || '',
      item.namaSekolah || settings.namaSekolah || '',
      item.kecamatan || settings.kecamatan || '',
      item.uraianBelanja || '',
      item.sumberDana || 'BOSP REGULER',
      formatDotNumber(item.jumlahBelanja),
      formatDotNumber(item.ppn[m1]),
      formatDotNumber(item.ppn[m2]),
      formatDotNumber(item.ppn[m3]),
      formatDotNumber(item.pph21[m1]),
      formatDotNumber(item.pph21[m2]),
      formatDotNumber(item.pph21[m3]),
      formatDotNumber(item.pph23[m1]),
      formatDotNumber(item.pph23[m2]),
      formatDotNumber(item.pph23[m3]),
      formatDotNumber(item.pajakDaerah[m1]),
      formatDotNumber(item.pajakDaerah[m2]),
      formatDotNumber(item.pajakDaerah[m3]),
      item.tanggalBelanja || '',
      item.tanggalSetorPajak || '',
      item.noNtpn || '',
    ];
  });

  // 4. SUSUN ROW FOOTER JUMLAH
  const footData = [
    [
      {
        content: 'JUMLAH',
        colSpan: 7,
        styles: { halign: 'center' as const, fontStyle: 'bold' as const },
      },
      { content: formatSummaryDotNumber(totPpn1), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPpn2), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPpn3), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPph21_1), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPph21_2), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPph21_3), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPph23_1), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPph23_2), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPph23_3), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPd1), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPd2), styles: { halign: 'center' as const } },
      { content: formatSummaryDotNumber(totPd3), styles: { halign: 'center' as const } },
      { content: '', styles: { halign: 'center' as const } },
      { content: '', styles: { halign: 'center' as const } },
      { content: '', styles: { halign: 'center' as const } },
    ],
  ];

  // 5. AUTOTABLE
  autoTable(doc, {
    startY: 23,
    margin: { left: marginX, right: marginX, bottom: 8 },
    theme: 'plain',
    head: [
      [
        { content: 'No.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'NPSN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'NAMA SEKOLAH', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'KECAMATAN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'URAIAN BELANJA', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'SUMBER\nDANA', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'JUMLAH\nBELANJA', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'PPN', colSpan: 3, styles: { halign: 'center', valign: 'middle' } },
        { content: 'PPH 21', colSpan: 3, styles: { halign: 'center', valign: 'middle' } },
        { content: 'PPH 23', colSpan: 3, styles: { halign: 'center', valign: 'middle' } },
        { content: 'PAJAK DAERAH (SSPD)', colSpan: 3, styles: { halign: 'center', valign: 'middle' } },
        { content: 'TANGGAL\nBELANJA', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'TANGGAL\nSETOR PAJAK', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
        { content: 'NO. NTPN', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      ],
      [
        { content: m1, styles: { halign: 'center', valign: 'middle' } },
        { content: m2, styles: { halign: 'center', valign: 'middle' } },
        { content: m3, styles: { halign: 'center', valign: 'middle' } },
        { content: m1, styles: { halign: 'center', valign: 'middle' } },
        { content: m2, styles: { halign: 'center', valign: 'middle' } },
        { content: m3, styles: { halign: 'center', valign: 'middle' } },
        { content: m1, styles: { halign: 'center', valign: 'middle' } },
        { content: m2, styles: { halign: 'center', valign: 'middle' } },
        { content: m3, styles: { halign: 'center', valign: 'middle' } },
        { content: m1, styles: { halign: 'center', valign: 'middle' } },
        { content: m2, styles: { halign: 'center', valign: 'middle' } },
        { content: m3, styles: { halign: 'center', valign: 'middle' } },
      ],
    ],
    body: bodyData,
    foot: footData,
    styles: {
      font: 'helvetica',
      fontSize: 6.5,
      cellPadding: { top: 1.2, bottom: 1.2, left: 1, right: 1 },
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      fontSize: 6.5,
    },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      fontSize: 6.5,
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' }, // No
      1: { cellWidth: 14, halign: 'center' }, // NPSN
      2: { cellWidth: 26, halign: 'left' }, // NAMA SEKOLAH
      3: { cellWidth: 20, halign: 'left' }, // KECAMATAN
      4: { cellWidth: 54, halign: 'left' }, // URAIAN BELANJA
      5: { cellWidth: 15, halign: 'center' }, // SUMBER DANA
      6: { cellWidth: 15, halign: 'right' }, // JUMLAH BELANJA
      7: { cellWidth: 9, halign: 'right' }, // PPN m1
      8: { cellWidth: 9, halign: 'right' }, // PPN m2
      9: { cellWidth: 9, halign: 'right' }, // PPN m3
      10: { cellWidth: 9, halign: 'right' }, // PPH 21 m1
      11: { cellWidth: 9, halign: 'right' }, // PPH 21 m2
      12: { cellWidth: 9, halign: 'right' }, // PPH 21 m3
      13: { cellWidth: 9, halign: 'right' }, // PPH 23 m1
      14: { cellWidth: 9, halign: 'right' }, // PPH 23 m2
      15: { cellWidth: 9, halign: 'right' }, // PPH 23 m3
      16: { cellWidth: 9, halign: 'right' }, // SSPD m1
      17: { cellWidth: 9, halign: 'right' }, // SSPD m2
      18: { cellWidth: 9, halign: 'right' }, // SSPD m3
      19: { cellWidth: 15, halign: 'center' }, // TGL BELANJA
      20: { cellWidth: 15, halign: 'center' }, // TGL SETOR
      21: { cellWidth: 13, halign: 'center' }, // NTPN
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.25,
  });

  const fileName = `REKAP_PAJAK_LAMPIRAN_4_${(settings.namaSekolah || 'SEKOLAH').replace(/\s+/g, '_')}_${settings.tahunAnggaran || '2026'}.pdf`;
  doc.save(fileName);
}
