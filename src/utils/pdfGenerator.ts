import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppSettings, BpuGroup, HonorPtkDoc, TukangDoc, StandardTandaTerimaDoc } from '../types';
import { formatRupiah, terbilang, formatTanggalIndo } from './formatters';

export interface PdfExportOptions {
  layoutMode?: 'two-per-page' | 'one-per-page' | 'auto';
  fileName?: string;
}

/**
 * Generate high quality, professional Indonesian BOSP Kwitansi & Nota PDF document
 * Formatted cleanly in A4 Landscape vector format.
 */
export function generateBpuPdf(
  bpuList: BpuGroup[],
  settings: AppSettings,
  options: PdfExportOptions = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const marginX = 8;
  const colWidth = 137;
  const gap = 7;
  const rightColX = marginX + colWidth + gap; // 8 + 137 + 7 = 152mm

  const layoutMode = options.layoutMode || 'auto';

  // Group into pages according to layoutMode
  // If 'two-per-page': 2 pairs per page unless an item is huge
  // If 'one-per-page': 1 pair per page
  // If 'auto': 2 pairs per page if both have <= 5 items, else 1 pair
  const pagesData: BpuGroup[][] = [];

  if (layoutMode === 'one-per-page') {
    bpuList.forEach((bpu) => pagesData.push([bpu]));
  } else if (layoutMode === 'two-per-page') {
    for (let i = 0; i < bpuList.length; i += 2) {
      const page = [bpuList[i]];
      if (bpuList[i + 1]) page.push(bpuList[i + 1]);
      pagesData.push(page);
    }
  } else {
    // Auto mode
    let i = 0;
    while (i < bpuList.length) {
      const current = bpuList[i];
      const next = bpuList[i + 1];
      const currentIsLong = current.items.length > 5;
      const nextIsLong = next && next.items.length > 5;

      if (currentIsLong || !next || nextIsLong) {
        pagesData.push([current]);
        i++;
      } else {
        pagesData.push([current, next]);
        i += 2;
      }
    }
  }

  pagesData.forEach((pageBpus, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage('a4', 'landscape');
    }

    const isSinglePairPage = pageBpus.length === 1;

    if (isSinglePairPage) {
      // Single pair on full page
      const startY = 10;
      const pairHeight = 190;
      renderBpuPair(doc, pageBpus[0], settings, startY, pairHeight, marginX, rightColX, colWidth, true);
    } else {
      // Two pairs on one page
      // Top pair
      const topY = 8;
      const pairHeight = 93;
      renderBpuPair(doc, pageBpus[0], settings, topY, pairHeight, marginX, rightColX, colWidth, false);

      // Dividing cut line
      const dividerY = 104;
      doc.setDrawColor(180, 180, 180);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(marginX, dividerY, marginX + colWidth * 2 + gap, dividerY);
      doc.setLineDashPattern([], 0); // reset

      // Scissor symbol text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text('✁ - - - - - - - - - - - - - - - - - - - - - - - - - - - Potong di sini - - - - - - - - - - - - - - - - - - - - - - - - - - - ✁', pageWidth / 2, dividerY - 1, { align: 'center' });

      // Bottom pair
      const bottomY = 107;
      renderBpuPair(doc, pageBpus[1], settings, bottomY, pairHeight, marginX, rightColX, colWidth, false);
    }

    // Page Number Footer (subtle)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Dokumen Resmi BOSP ${settings.namaSekolah} | Halaman ${pageIndex + 1} dari ${pagesData.length}`,
      pageWidth / 2,
      pageHeight - 3,
      { align: 'center' }
    );
  });

  return doc;
}

/**
 * Render 1 Pair of (Kwitansi on left, Nota on right) at specified Y
 */
function renderBpuPair(
  doc: jsPDF,
  bpu: BpuGroup,
  settings: AppSettings,
  startY: number,
  height: number,
  leftX: number,
  rightX: number,
  width: number,
  isExpanded: boolean
) {
  renderKwitansi(doc, bpu, settings, leftX, startY, width, height, isExpanded);
  renderNota(doc, bpu, settings, rightX, startY, width, height, isExpanded);
}

/**
 * Render Kwitansi Block (Left side)
 */
function renderKwitansi(
  doc: jsPDF,
  bpu: BpuGroup,
  settings: AppSettings,
  x: number,
  y: number,
  width: number,
  height: number,
  isExpanded: boolean
) {
  // Outer Border Box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(x, y, width, height);

  const innerX = x + 3.5;
  const innerWidth = width - 7;
  let currY = y + 4;

  // 1. Kop Surat Kwitansi
  const hasLogo = !!settings.logoSekolah;
  if (hasLogo && settings.logoSekolah) {
    try {
      doc.addImage(settings.logoSekolah, 'PNG', innerX + 0.5, currY - 1, 9, 11);
    } catch {
      // fallback if unparseable
    }
  }

  const textCenterX = hasLogo ? x + width / 2 + 3.5 : x + width / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  const kab = (settings.kabupaten || 'KABUPATEN LEBAK').toUpperCase();
  doc.text(`PEMERINTAH ${kab.includes('KABUPATEN') || kab.includes('KOTA') ? kab : 'KABUPATEN ' + kab}`, textCenterX, currY, { align: 'center' });
  currY += 3.2;

  doc.text('DINAS PENDIDIKAN', textCenterX, currY, { align: 'center' });
  currY += 3.5;

  doc.setFontSize(9);
  doc.text((settings.namaSekolah || 'SDN 1 CIBUNGUR').toUpperCase(), textCenterX, currY, { align: 'center' });
  currY += 2.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const alamatLengkap = `${settings.alamat || ''} ${settings.desaKelurahan || ''} Kec. ${settings.kecamatan || ''}`.trim();
  if (alamatLengkap) {
    doc.text(alamatLengkap, textCenterX, currY, { align: 'center' });
    currY += 2.5;
  }

  // Kop divider line
  doc.setLineWidth(0.5);
  doc.line(innerX, currY, innerX + innerWidth, currY);
  currY += 0.5;
  doc.setLineWidth(0.2);
  doc.line(innerX, currY, innerX + innerWidth, currY);
  currY += 3.5;

  // 2. Title: KWITANSI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('KWITANSI / BUKTI PEMBAYARAN', x + width / 2, currY, { align: 'center' });
  currY += 4.5;

  // Content Rows
  const terbilangStr = terbilang(bpu.totalKeluar) + ' Rupiah';
  const kotaTgl = settings.kotaTanggal || 'Cigemblong';
  const formattedDate = formatTanggalIndo(bpu.tgl);
  const formattedTotal = formatRupiah(bpu.totalKeluar);
  const namaPenerima = bpu.penerimaName || bpu.tokoName || 'Pihak Ketiga / Rekanan';

  let untukPembayaran = bpu.keteranganPembayaran || '';
  if (!untukPembayaran) {
    if (bpu.namaKegiatan) {
      untukPembayaran = bpu.namaKegiatan.toLowerCase().startsWith('belanja')
        ? bpu.namaKegiatan
        : 'Belanja ' + bpu.namaKegiatan;
    } else if (bpu.items.length > 0) {
      untukPembayaran = 'Belanja ' + bpu.items.map((it) => it.uraian).join(', ');
    } else {
      untukPembayaran = 'Belanja Operasional BOSP';
    }
  }

  const rowHeight = isExpanded ? 4.8 : 3.8;
  const labelColWidth = 30;

  // 1. Nomor Bukti (Sejajar rapi dengan baris lainnya)
  const cleanNoBukti = String(bpu.noBukti || '').replace(/[\r\n\t]+/g, ' ').trim();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('No. Bukti', innerX, currY);
  doc.text(`:  ${cleanNoBukti}`, innerX + labelColWidth, currY);
  currY += rowHeight;

  // 2. Kode Rekening (Sejajar tepat di bawah No. Bukti, dibersihkan dari line-break/newline tersembunyi)
  const cleanKodeRek = bpu.kodeRek ? String(bpu.kodeRek).replace(/[\r\n\t\s]+/g, '').trim() : '';
  if (cleanKodeRek) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Kode Rekening', innerX, currY);
    doc.setFont('helvetica', 'normal');
    doc.text(`:  ${cleanKodeRek}`, innerX + labelColWidth, currY);
    currY += rowHeight;
  }

  // 3. Telah Terima Dari
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Telah Terima Dari', innerX, currY);
  doc.setFont('helvetica', 'normal');
  doc.text(`:  Bendahara BOSP ${settings.namaSekolah}`, innerX + labelColWidth, currY);
  currY += rowHeight;

  // 4. Uang Sejumlah
  doc.setFont('helvetica', 'bold');
  doc.text('Uang Sejumlah', innerX, currY);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  // Multi line terbilang box
  const terbilangLines = doc.splitTextToSize(`:  ${terbilangStr}`, innerWidth - labelColWidth - 2);
  doc.text(terbilangLines, innerX + labelColWidth, currY);
  currY += Math.max(rowHeight, terbilangLines.length * 3.4 + 1);

  // 5. Untuk Pembayaran
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Untuk Pembayaran', innerX, currY);
  doc.setFont('helvetica', 'normal');
  const ketLines = doc.splitTextToSize(`:  ${untukPembayaran}`, innerWidth - labelColWidth - 2);
  doc.text(ketLines, innerX + labelColWidth, currY);
  currY += Math.max(rowHeight, ketLines.length * 3.4 + 1.5);

  // Kotak Nominal Rp
  const nominalBoxY = Math.max(currY + 2.5, y + height - 32);
  doc.setFillColor(245, 245, 245);
  doc.rect(innerX, nominalBoxY, 48, 7.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(formattedTotal, innerX + 3, nominalBoxY + 5.2);

  // Materai Note if >= 5.000.000
  const needsMaterai = bpu.totalKeluar >= 5000000;
  if (needsMaterai) {
    const matBoxX = innerX + 51;
    doc.setDrawColor(120, 120, 120);
    doc.setLineDashPattern([1, 1], 0);
    doc.rect(matBoxX, nominalBoxY, 18, 7.5);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text('MATERAI', matBoxX + 9, nominalBoxY + 3.2, { align: 'center' });
    doc.text('Rp 10.000', matBoxX + 9, nominalBoxY + 6.2, { align: 'center' });
    doc.setDrawColor(0, 0, 0);
  }

  // Tanggal Kwitansi
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const tglText = `${kotaTgl}, ${formattedDate}`;
  doc.text(tglText, innerX + innerWidth, nominalBoxY - 1.5, { align: 'right' });

  // Tanda Tangan Section (3 Kolom: Setuju Dibayar, Lunas Dibayar, Penerima Uang)
  const signY = Math.max(nominalBoxY + 9, y + height - (isExpanded ? 24 : 21));
  const col1X = innerX + 18;
  const col2X = innerX + (innerWidth / 2);
  const col3X = innerX + innerWidth - 18;

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Setuju Dibayar,', col1X, signY, { align: 'center' });
  doc.text('Kepala Sekolah', col1X, signY + 3, { align: 'center' });

  doc.text('Lunas Dibayar,', col2X, signY, { align: 'center' });
  doc.text('Bendahara BOSP', col2X, signY + 3, { align: 'center' });

  doc.text('Penerima Uang,', col3X, signY, { align: 'center' });
  doc.text('Pihak Rekanan', col3X, signY + 3, { align: 'center' });

  // Names & NIPs
  const nameY = signY + (isExpanded ? 16 : 13);
  doc.setFont('helvetica', 'bold');
  if (settings.namaKepsek) {
    doc.text(settings.namaKepsek, col1X, nameY, { align: 'center' });
  }
  doc.setFont('helvetica', 'normal');
  if (settings.nipKepsek) {
    doc.text(`NIP. ${settings.nipKepsek}`, col1X, nameY + 3, { align: 'center' });
  }

  doc.setFont('helvetica', 'bold');
  if (settings.namaBendahara) {
    doc.text(settings.namaBendahara, col2X, nameY, { align: 'center' });
  }
  doc.setFont('helvetica', 'normal');
  if (settings.nipBendahara) {
    doc.text(`NIP. ${settings.nipBendahara}`, col2X, nameY + 3, { align: 'center' });
  }

  doc.setFont('helvetica', 'bold');
  if (namaPenerima) {
    doc.text(namaPenerima.length > 22 ? namaPenerima.slice(0, 20) + '...' : namaPenerima, col3X, nameY, { align: 'center' });
  }
  doc.setFont('helvetica', 'normal');
  doc.text('(Tanda Tangan & Cap)', col3X, nameY + 3, { align: 'center' });
}

/**
 * Render Nota Toko Block (Right side)
 */
function renderNota(
  doc: jsPDF,
  bpu: BpuGroup,
  settings: AppSettings,
  x: number,
  y: number,
  width: number,
  height: number,
  isExpanded: boolean
) {
  // Outer Border Box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(x, y, width, height);

  const innerX = x + 3.5;
  const innerWidth = width - 7;
  let currY = y + 4;

  const namaSekolah = settings.namaSekolah || 'SDN 1 CIBUNGUR';
  const namaToko = bpu.tokoName || `TOKO REKANAN ${namaSekolah}`;
  const notaNo = bpu.noBukti.replace(/[^0-9]/g, '') || bpu.noBukti;
  const kotaTgl = settings.kotaTanggal || 'Cigemblong';
  const formattedDate = formatTanggalIndo(bpu.tgl);
  const formattedTotal = formatRupiah(bpu.totalKeluar);

  // 1. Header Nota
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(namaToko.toUpperCase(), innerX, currY);

  doc.setFontSize(9.5);
  doc.text(`NOTA KONTAN`, innerX + innerWidth, currY, { align: 'right' });
  currY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Penyedia Alat & Kebutuhan Sekolah`, innerX, currY);
  doc.setFont('helvetica', 'bold');
  doc.text(`No. Nota : ${notaNo}`, innerX + innerWidth, currY, { align: 'right' });
  currY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.text(`Kepada Yth : Bendahara ${namaSekolah}`, innerX, currY);
  doc.text(`Tanggal : ${kotaTgl}, ${formattedDate}`, innerX + innerWidth, currY, { align: 'right' });
  currY += 2;

  // Thin separator
  doc.setLineWidth(0.3);
  doc.line(innerX, currY, innerX + innerWidth, currY);
  currY += 1.5;

  // 2. Table of Items using jspdf-autotable
  const tableRows = bpu.items.map((item, idx) => [
    String(idx + 1),
    `${item.vol} ${item.satuan || 'Pcs'}`,
    item.uraian,
    new Intl.NumberFormat('id-ID').format(item.tarif),
    new Intl.NumberFormat('id-ID').format(item.jumlah),
  ]);

  const maxTableHeight = isExpanded ? height - 55 : height - 38;

  autoTable(doc, {
    startY: currY,
    margin: { left: innerX, right: innerX + innerWidth },
    tableWidth: innerWidth,
    head: [['No', 'Banyaknya', 'Nama Barang / Uraian', 'Harga (Rp)', 'Jumlah (Rp)']],
    body: tableRows,
    foot: [['', '', 'JUMLAH TOTAL', '', formattedTotal]],
    styles: {
      fontSize: 6.5,
      cellPadding: 1,
      lineColor: [0, 0, 0],
      lineWidth: 0.15,
      textColor: [0, 0, 0],
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 'auto', halign: 'left' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' },
    },
    theme: 'grid',
  });

  // 3. Bottom Signature & Terbilang
  const afterTableY = (doc as any).lastAutoTable?.finalY || currY + 20;
  const signBoxY = Math.max(afterTableY + 2, y + height - (isExpanded ? 24 : 18));

  // Terbilang Note (bottom-left)
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.text(`Terbilang: ${terbilang(bpu.totalKeluar)} Rupiah`, innerX, signBoxY + 3);

  // Tanda Terima Toko (bottom-right)
  const signRightX = innerX + innerWidth - 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('Tanda Terima / Toko Rekanan,', signRightX, signBoxY, { align: 'center' });

  const tokoNameBottomY = signBoxY + (isExpanded ? 15 : 12);
  doc.setFont('helvetica', 'bold');
  doc.text(`( ${namaToko.length > 24 ? namaToko.slice(0, 22) + '...' : namaToko} )`, signRightX, tokoNameBottomY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text('Cap & Tanda Tangan Toko', signRightX, tokoNameBottomY + 2.8, { align: 'center' });
}

/**
 * Trigger browser download for generated PDF
 */
export function downloadBpuPdf(
  bpuList: BpuGroup[],
  settings: AppSettings,
  options: PdfExportOptions = {}
) {
  const doc = generateBpuPdf(bpuList, settings, options);
  const cleanSchool = (settings.namaSekolah || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_');
  const countStr = `${bpuList.length}_Nota`;
  const defaultName = `Nota_Kwitansi_BOSP_${cleanSchool}_${countStr}.pdf`;
  doc.save(options.fileName || defaultName);
}

/**
 * Generate official Indonesian BOSP Honorarium PTK / GTT PDF Document
 * Exactly matching the official government format in A4 Portrait.
 */
export function generateHonorPtkPdf(
  docsList: HonorPtkDoc[],
  settings: AppSettings
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  docsList.forEach((honorDoc, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage('a4', 'portrait');
    }

    const kabupaten = (honorDoc.kabupaten || settings.kabupaten || 'LEBAK').toUpperCase();
    const namaSekolah = (honorDoc.namaSatuanPendidikan || settings.namaSekolah || 'SDN 1 CIBUNGUR').toUpperCase();
    const kecamatan = (settings.kecamatan || 'CIGEMBLONG').toUpperCase();
    const alamat = settings.alamat || 'Kp. Pasar Kupa';
    const desa = honorDoc.desaKelurahan || settings.desaKelurahan || 'Cibungur';
    const npsn = settings.npsn || '20602599';
    const email = settings.emailSekolah || 'sdnnegerisatucibungur@gmail.com';
    const kodePos = settings.kodePos || '42395';

    // 1. KOP RESMI
    // Logo Pemkab / Satuan Pendidikan on left
    const logoX = marginX + 2;
    const logoY = 12;
    let logoRendered = false;

    if (settings.logoSekolah) {
      try {
        doc.addImage(settings.logoSekolah, 'PNG', logoX, logoY, 15, 19);
        logoRendered = true;
      } catch {
        logoRendered = false;
      }
    }

    if (!logoRendered) {
      doc.setFillColor(235, 240, 250);
      doc.setDrawColor(20, 50, 120);
      doc.roundedRect(logoX, logoY, 14, 18, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(20, 50, 120);
      doc.text('LEBAK', logoX + 7, logoY + 10, { align: 'center' });
    }

    // Kop Text (Centered)
    const kopCenterX = pageWidth / 2 + 5;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`PEMERINTAH KABUPATEN ${kabupaten}`, kopCenterX, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text('DINAS PENDIDIKAN', kopCenterX, 20, { align: 'center' });

    doc.setFontSize(11.5);
    doc.text(`UPTD SATUAN PENDIDIKAN ${namaSekolah}`, kopCenterX, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`KECAMATAN ${kecamatan}`, kopCenterX, 29.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const alamatLine1 = `Alamat: ${alamat}, Desa ${desa}, Kecamatan ${kecamatan}, Kabupaten ${kabupaten}, Provinsi Banten,`;
    const alamatLine2 = `NPSN: ${npsn}, Email: ${email}, Kode Pos ${kodePos}`;
    doc.text(alamatLine1, kopCenterX, 34, { align: 'center' });
    doc.text(alamatLine2, kopCenterX, 37.5, { align: 'center' });

    // Double Rule (Garis Ganda Kop)
    const ruleY1 = 40.5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginX, ruleY1, marginX + contentWidth, ruleY1);
    doc.setLineWidth(0.2);
    doc.line(marginX, ruleY1 + 1.2, marginX + contentWidth, ruleY1 + 1.2);

    // 2. JUDUL DOKUMEN
    const titleY = 48;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text('HONORARIUM PENDIDIK DAN TENAGA KEPENDIDIKAN (PTK)', pageWidth / 2, titleY, {
      align: 'center',
    });

    // 3. METADATA (KIRI) & KOTAK NO. BKU (KANAN)
    const metaY = 56;
    const labelWidth = 42;
    const metaItems = [
      { label: 'Bulan', val: `: ${honorDoc.bulan || 'AGUSTUS 2025'}` },
      { label: 'Nama Satuan Pendidikan', val: `: ${honorDoc.namaSatuanPendidikan || namaSekolah}` },
      { label: 'Desa/Kelurahan', val: `: ${honorDoc.desaKelurahan || desa}` },
      { label: 'Kabupaten', val: `: ${honorDoc.kabupaten || kabupaten}` },
      { label: 'Nama Kegiatan', val: `: ${honorDoc.namaKegiatan || 'Honorarium Guru dan Tenaga Kependidikan'}` },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    metaItems.forEach((item, idx) => {
      const rowY = metaY + idx * 4.8;
      doc.text(item.label, marginX, rowY);
      doc.text(item.val, marginX + labelWidth, rowY);
    });

    // Kotak No. BKU (Right aligned)
    const boxWidth = 52;
    const boxHeight = 10;
    const boxX = marginX + contentWidth - boxWidth;
    const boxY = metaY - 2;

    doc.setLineWidth(0.4);
    doc.rect(boxX, boxY, boxWidth, boxHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('No. BKU', boxX + 4, boxY + 6.5);
    doc.setFontSize(9.5);
    doc.text(honorDoc.noBku || 'BPU98', boxX + boxWidth - 4, boxY + 6.5, { align: 'right' });

    // 4. TABEL PENERIMA HONOR
    const tableStartY = metaY + metaItems.length * 4.8 + 5;

    const tableBody = honorDoc.recipients.map((r, i) => {
      const isOdd = (i + 1) % 2 === 1;
      const ttStr = isOdd ? `${i + 1}.` : `            ${i + 1}.`;
      return [
        i + 1,
        r.nama,
        r.jabatan || 'Guru Kelas',
        r.vol || '1 Bulan',
        formatRupiah(r.harga),
        formatRupiah(r.jumlah),
        ttStr,
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      margin: { left: marginX, right: marginX },
      head: [
        ['No', 'Nama', 'Jabatan', 'Vol', 'Harga', 'Jumlah', 'Tanda Tangan'],
      ],
      body: tableBody,
      foot: [
        [
          {
            content: 'JUMLAH',
            colSpan: 5,
            styles: { halign: 'center', fontStyle: 'bold' },
          },
          {
            content: formatRupiah(honorDoc.totalJumlah),
            styles: { halign: 'right', fontStyle: 'bold' },
          },
          {
            content: '',
            styles: { halign: 'center' },
          },
        ],
      ],
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        textColor: [0, 0, 0],
        minCellHeight: 12,
      },
      headStyles: {
        fontStyle: 'bold',
        halign: 'center',
        fillColor: [245, 245, 245],
        lineWidth: 0.4,
      },
      footStyles: {
        fontStyle: 'bold',
        fillColor: [250, 250, 250],
        lineWidth: 0.4,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 46, halign: 'left', fontStyle: 'bold' },
        2: { cellWidth: 32, halign: 'left' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 26, halign: 'right' },
        5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 22, halign: 'left', valign: 'top' },
      },
    });

    // 5. TANDA TANGAN BENDAHARA (KANAN BAWAH)
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : tableStartY + 50;
    const signBoxY = finalY + 12;
    const signCenterX = marginX + contentWidth - 35;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(honorDoc.tempatTgl || `${desa}, 12 Agustus 2025`, signCenterX, signBoxY, {
      align: 'center',
    });
    doc.text('Bendahara Sekolah', signCenterX, signBoxY + 4.5, { align: 'center' });

    const signNameY = signBoxY + 25;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(honorDoc.namaBendahara || settings.namaBendahara || 'SUHENDRI, S.Pd', signCenterX, signNameY, {
      align: 'center',
    });

    // Underline name
    const nameWidth = doc.getTextWidth(honorDoc.namaBendahara || settings.namaBendahara || 'SUHENDRI, S.Pd');
    doc.setLineWidth(0.3);
    doc.line(signCenterX - nameWidth / 2, signNameY + 0.8, signCenterX + nameWidth / 2, signNameY + 0.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`NIP. ${honorDoc.nipBendahara || settings.nipBendahara || '198208042022211009'}`, signCenterX, signNameY + 4.5, {
      align: 'center',
    });
  });

  return doc;
}

/**
 * Trigger download of official Honorarium PTK / GTT PDF
 */
export function downloadHonorPtkPdf(
  docsList: HonorPtkDoc[],
  settings: AppSettings,
  fileName?: string
) {
  const doc = generateHonorPtkPdf(docsList, settings);
  const cleanSchool = (settings.namaSekolah || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_');
  const countStr = `${docsList.length}_Dokumen`;
  const defaultName = `Tanda_Terima_Honor_PTK_${cleanSchool}_${countStr}.pdf`;
  doc.save(fileName || defaultName);
}

/**
 * Generate official Upah Tukang / Pemeliharaan Sarpras PDF
 * Matches format of Honor GTT with custom columns from user specification:
 * No, Nama, Kualifikasi Pekerjaan, Gaji/Hari (Rp), Jumlah Hari kerja, Jumlah Bruto (Rp), Pajak PPh 21, Diterima, Tanda tangan
 */
export function generateUpahTukangPdf(
  docsList: TukangDoc[],
  settings: AppSettings
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  docsList.forEach((tukangDoc, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage('a4', 'portrait');
    }

    const kabupaten = (tukangDoc.kabupaten || settings.kabupaten || 'LEBAK').toUpperCase();
    const namaSekolah = (tukangDoc.namaSatuanPendidikan || settings.namaSekolah || 'SDN 1 CIBUNGUR').toUpperCase();
    const kecamatan = (settings.kecamatan || 'CIGEMBLONG').toUpperCase();
    const alamat = settings.alamat || 'Kp. Pasar Kupa';
    const desa = tukangDoc.desaKelurahan || settings.desaKelurahan || 'Cibungur';
    const npsn = settings.npsn || '20602599';
    const email = settings.emailSekolah || 'sdnnegerisatucibungur@gmail.com';
    const kodePos = settings.kodePos || '42395';

    // 1. KOP RESMI
    const logoX = marginX + 2;
    const logoY = 12;
    let logoRendered = false;

    if (settings.logoSekolah) {
      try {
        doc.addImage(settings.logoSekolah, 'PNG', logoX, logoY, 15, 19);
        logoRendered = true;
      } catch {
        logoRendered = false;
      }
    }

    if (!logoRendered) {
      doc.setFillColor(235, 240, 250);
      doc.setDrawColor(20, 50, 120);
      doc.roundedRect(logoX, logoY, 14, 18, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(20, 50, 120);
      doc.text('LEBAK', logoX + 7, logoY + 10, { align: 'center' });
    }

    // Kop Text (Centered)
    const kopCenterX = pageWidth / 2 + 5;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`PEMERINTAH KABUPATEN ${kabupaten}`, kopCenterX, 15, { align: 'center' });

    doc.setFontSize(11);
    doc.text('DINAS PENDIDIKAN', kopCenterX, 20, { align: 'center' });

    doc.setFontSize(11.5);
    doc.text(`UPTD SATUAN PENDIDIKAN ${namaSekolah}`, kopCenterX, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`KECAMATAN ${kecamatan}`, kopCenterX, 29.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const alamatLine1 = `Alamat: ${alamat}, Desa ${desa}, Kecamatan ${kecamatan}, Kabupaten ${kabupaten}, Provinsi Banten,`;
    const alamatLine2 = `NPSN: ${npsn}, Email: ${email}, Kode Pos ${kodePos}`;
    doc.text(alamatLine1, kopCenterX, 34, { align: 'center' });
    doc.text(alamatLine2, kopCenterX, 37.5, { align: 'center' });

    // Double Rule
    const ruleY1 = 40.5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginX, ruleY1, marginX + contentWidth, ruleY1);
    doc.setLineWidth(0.2);
    doc.line(marginX, ruleY1 + 1.2, marginX + contentWidth, ruleY1 + 1.2);

    // 2. JUDUL DOKUMEN
    const titleY = 48;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text('DAFTAR TANDA TERIMA PEMBAYARAN UPAH TUKANG', pageWidth / 2, titleY, {
      align: 'center',
    });

    // 3. METADATA (KIRI) & KOTAK NO. BKU (KANAN)
    const metaY = 56;
    const labelWidth = 44;
    const metaItems = [
      { label: 'Bulan / Periode', val: `: ${tukangDoc.bulan || 'APRIL 2026'}` },
      { label: 'Nama Satuan Pendidikan', val: `: ${tukangDoc.namaSatuanPendidikan || namaSekolah}` },
      { label: 'Desa/Kelurahan', val: `: ${tukangDoc.desaKelurahan || desa}` },
      { label: 'Kabupaten', val: `: ${tukangDoc.kabupaten || kabupaten}` },
      { label: 'Nama Kegiatan', val: `: ${tukangDoc.namaKegiatan || 'Pembayaran Upah Tukang'}` },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    metaItems.forEach((item, idx) => {
      const curY = metaY + idx * 4.8;
      doc.setFont('helvetica', 'bold');
      doc.text(item.label, marginX, curY);
      doc.setFont('helvetica', 'normal');
      doc.text(item.val, marginX + labelWidth, curY);
    });

    // Box No. BKU on Right
    const boxWidth = 36;
    const boxHeight = 10;
    const boxX = marginX + contentWidth - boxWidth;
    const boxY = metaY - 2;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(boxX, boxY, boxWidth, boxHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('No. BKU', boxX + 3, boxY + 6.5);
    doc.setFontSize(9);
    doc.text(tukangDoc.noBku || 'BPU56', boxX + boxWidth - 3, boxY + 6.5, { align: 'right' });

    // 4. TABEL UPAH TUKANG SESUAI FORMAT GAMBAR USER
    const tableStartY = metaY + metaItems.length * 4.8 + 5;

    const tableBody = tukangDoc.workers.map((w, i) => [
      i + 1,
      w.nama,
      w.kualifikasi || 'Tukang',
      formatRupiah(w.gajiPerHari),
      `${w.hariKerja} Hari`,
      formatRupiah(w.jumlahBruto),
      w.pajakPph21 > 0 ? formatRupiah(w.pajakPph21) : '0',
      formatRupiah(w.diterima),
      '',
    ]);

    autoTable(doc, {
      startY: tableStartY,
      margin: { left: marginX, right: marginX },
      head: [
        [
          'No',
          'Nama',
          'Kualifikasi\nPekerjaan',
          'Gaji/Hari\n(Rp)',
          'Jumlah\nHari kerja',
          'Jumlah\nBruto (Rp)',
          'Pajak\nPPh 21',
          'Diterima',
          'Tanda\ntangan',
        ],
      ],
      body: tableBody,
      foot: [
        [
          {
            content: 'JUMLAH',
            colSpan: 5,
            styles: { halign: 'center', fontStyle: 'bold' },
          },
          {
            content: formatRupiah(tukangDoc.totalBruto),
            styles: { halign: 'right', fontStyle: 'bold' },
          },
          {
            content: formatRupiah(tukangDoc.totalPajak),
            styles: { halign: 'right', fontStyle: 'bold' },
          },
          {
            content: formatRupiah(tukangDoc.totalDiterima),
            styles: { halign: 'right', fontStyle: 'bold' },
          },
          {
            content: '',
            styles: { halign: 'center' },
          },
        ],
      ],
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        textColor: [0, 0, 0],
        minCellHeight: 11,
      },
      headStyles: {
        fontStyle: 'bold',
        halign: 'center',
        fillColor: [245, 245, 245],
        lineWidth: 0.4,
      },
      footStyles: {
        fontStyle: 'bold',
        fillColor: [250, 250, 250],
        lineWidth: 0.4,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 32, halign: 'left', fontStyle: 'bold' },
        2: { cellWidth: 28, halign: 'left' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 18, halign: 'right' },
        7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 14, halign: 'center' },
      },
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : tableStartY + 50;

    // 5. TANDA TANGAN (KIRI: KEPALA SEKOLAH, KANAN: BENDAHARA SEKOLAH)
    const signBoxY = finalY + 12;
    const kepsekCenterX = marginX + 38;
    const signCenterX = marginX + contentWidth - 38;

    // Left: Kepala Sekolah
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Mengetahui,', kepsekCenterX, signBoxY, { align: 'center' });
    doc.text('Kepala Satuan Pendidikan', kepsekCenterX, signBoxY + 4.5, { align: 'center' });

    const signNameY = signBoxY + 25;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const kepsekName = tukangDoc.namaKepsek || settings.namaKepsek || 'KARNA, S.Pd';
    if (kepsekName) {
      doc.text(kepsekName, kepsekCenterX, signNameY, { align: 'center' });
      const kWidth = doc.getTextWidth(kepsekName);
      doc.setLineWidth(0.3);
      doc.line(kepsekCenterX - kWidth / 2, signNameY + 0.8, kepsekCenterX + kWidth / 2, signNameY + 0.8);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const kepsekNip = tukangDoc.nipKepsek || settings.nipKepsek || '197804072008011010';
    if (kepsekNip) {
      doc.text(`NIP. ${kepsekNip}`, kepsekCenterX, signNameY + 4.5, { align: 'center' });
    }

    // Right: Bendahara
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(tukangDoc.tempatTgl || `${desa}, 10 April 2026`, signCenterX, signBoxY, { align: 'center' });
    doc.text('Bendahara Sekolah / BOSP', signCenterX, signBoxY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const bendaharaName = tukangDoc.namaBendahara || settings.namaBendahara || 'SUHENDRI, S.Pd';
    if (bendaharaName) {
      doc.text(bendaharaName, signCenterX, signNameY, { align: 'center' });
      const bWidth = doc.getTextWidth(bendaharaName);
      doc.setLineWidth(0.3);
      doc.line(signCenterX - bWidth / 2, signNameY + 0.8, signCenterX + bWidth / 2, signNameY + 0.8);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const bendaharaNip = tukangDoc.nipBendahara || settings.nipBendahara || '198208042022211009';
    if (bendaharaNip) {
      doc.text(`NIP. ${bendaharaNip}`, signCenterX, signNameY + 4.5, { align: 'center' });
    }
  });

  return doc;
}

/**
 * Trigger download of official Upah Tukang PDF
 */
export function downloadUpahTukangPdf(
  docsList: TukangDoc[],
  settings: AppSettings,
  fileName?: string
) {
  const doc = generateUpahTukangPdf(docsList, settings);
  const cleanSchool = (settings.namaSekolah || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_');
  const countStr = `${docsList.length}_Dokumen`;
  const defaultName = `Tanda_Terima_Upah_Tukang_${cleanSchool}_${countStr}.pdf`;
  doc.save(fileName || defaultName);
}

/**
 * Generate official Standard Tanda Terima PDF
 * Strictly matching the unified format (No, Nama, Jabatan, Vol, Harga, Jumlah, Tanda Tangan)
 * NO TERBILANG, with official Kop & Bendahara signature
 */
export function generateStandardTandaTerimaPdf(
  docsList: StandardTandaTerimaDoc[],
  settings: AppSettings
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  docsList.forEach((stDoc, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage('a4', 'portrait');
    }

    const kabupaten = (stDoc.kabupaten || settings.kabupaten || 'LEBAK').toUpperCase();
    const namaSekolah = (stDoc.namaSatuanPendidikan || settings.namaSekolah || 'SDN 1 CIBUNGUR').toUpperCase();
    const kecamatan = (settings.kecamatan || 'CIGEMBLONG').toUpperCase();
    const alamat = settings.alamat || 'Jl. Pasar kupa - Cimandiri Laut, Km.01';
    const desa = stDoc.desaKelurahan || settings.desaKelurahan || 'Cibungur';
    const npsn = settings.npsn || '20602599';
    const email = settings.emailSekolah || 'sdnnegerisatucibungur@gmail.com';
    const kodePos = settings.kodePos || '42395';

    // 1. KOP RESMI
    const logoX = marginX + 2;
    const logoY = 11;
    let logoRendered = false;

    if (settings.logoSekolah) {
      try {
        doc.addImage(settings.logoSekolah, 'PNG', logoX, logoY, 15, 19);
        logoRendered = true;
      } catch {
        logoRendered = false;
      }
    }

    if (!logoRendered) {
      doc.setFillColor(235, 240, 250);
      doc.setDrawColor(20, 50, 120);
      doc.roundedRect(logoX, logoY, 14, 18, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(20, 50, 120);
      doc.text('LEBAK', logoX + 7, logoY + 11, { align: 'center' });
    }

    // Text Kop
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`PEMERINTAH KABUPATEN ${kabupaten}`, marginX + contentWidth / 2 + 5, 13.5, { align: 'center' });
    doc.setFontSize(10.5);
    doc.text('DINAS PENDIDIKAN', marginX + contentWidth / 2 + 5, 18, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`UPTD SATUAN PENDIDIKAN ${namaSekolah}`, marginX + contentWidth / 2 + 5, 23, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`KECAMATAN ${kecamatan}`, marginX + contentWidth / 2 + 5, 27.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(
      `Alamat : ${alamat}, Desa ${desa}, Kecamatan ${kecamatan}, Kabupaten ${kabupaten} Provinsi Banten`,
      marginX + contentWidth / 2 + 5,
      31.5,
      { align: 'center' }
    );
    doc.text(
      `NPSN : ${npsn} Email : ${email} Kode Pos : ${kodePos}`,
      marginX + contentWidth / 2 + 5,
      35,
      { align: 'center' }
    );

    // Double line kop surat
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.7);
    doc.line(marginX, 38, marginX + contentWidth, 38);
    doc.setLineWidth(0.2);
    doc.line(marginX, 39.2, marginX + contentWidth, 39.2);

    // 2. JUDUL DOKUMEN (Centered, wrapped cleanly)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const rawJudul = (stDoc.judulDokumen || 'BUKTI PENERIMAAN').toUpperCase();
    const splitJudul: string[] = doc.splitTextToSize(rawJudul, contentWidth - 10);
    const judulY = 44.5;
    splitJudul.forEach((line: string, lIdx: number) => {
      doc.text(line, marginX + contentWidth / 2, judulY + lIdx * 4.8, { align: 'center' });
    });

    // 3. METADATA & KOTAK NO. BKU
    const metaStartY = judulY + splitJudul.length * 4.8 + 2.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const lblW = 42;
    const colX1 = marginX;
    const colX2 = marginX + lblW;
    const colX3 = colX2 + 3;

    // Kotak No. BKU di Kanan Atas
    const boxW = 50;
    const boxH = 11;
    const boxX = marginX + contentWidth - boxW;
    const boxY = metaStartY;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.rect(boxX, boxY, boxW, boxH);
    doc.line(boxX + 22, boxY, boxX + 22, boxY + boxH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('No. BKU', boxX + 11, boxY + 7, { align: 'center' });
    doc.setFontSize(9.5);
    doc.text(stDoc.noBku || '-', boxX + 36, boxY + 7, { align: 'center' });

    // Available width to the left of the No. BKU box
    const leftColMaxW = boxX - colX3 - 4;

    // Row 1: Nama Satuan Pendidikan
    let currentY = metaStartY + 2.5;
    doc.setFont('helvetica', 'normal');
    doc.text('Nama Satuan Pendidikan', colX1, currentY);
    doc.text(':', colX2, currentY);
    doc.setFont('helvetica', 'bold');
    const splitSekolah = doc.splitTextToSize(stDoc.namaSatuanPendidikan || namaSekolah, leftColMaxW);
    doc.text(splitSekolah[0] || '', colX3, currentY);

    // Row 2: Desa/Kelurahan
    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.text('Desa/Kelurahan', colX1, currentY);
    doc.text(':', colX2, currentY);
    doc.text(stDoc.desaKelurahan || desa, colX3, currentY);

    // Row 3: Kabupaten
    currentY += 4.5;
    doc.text('Kabupaten', colX1, currentY);
    doc.text(':', colX2, currentY);
    doc.text(stDoc.kabupaten || kabupaten, colX3, currentY);

    // Row 4: Nama Kegiatan (Dynamic wrap across full width)
    currentY += 5;
    doc.text('Nama Kegiatan', colX1, currentY);
    doc.text(':', colX2, currentY);
    doc.setFont('helvetica', 'bold');

    let cleanNamaKegiatan = stDoc.namaKegiatan || 'Uang Harian Kegiatan';
    if (stDoc.category === 'k3s') {
      cleanNamaKegiatan = 'KELOMPOK KERJA KEPALA SEKOLAH (K3S)';
    } else if (stDoc.category === 'prioritas-pusat') {
      cleanNamaKegiatan = 'PELAPORAN PROGRAM PRIORITAS PUSAT';
    }

    const maxKegiatanWidth = contentWidth - lblW - 5;
    const splitKegiatan: string[] = doc.splitTextToSize(cleanNamaKegiatan, maxKegiatanWidth);
    splitKegiatan.forEach((line: string, kIdx: number) => {
      doc.text(line, colX3, currentY + kIdx * 4.2);
    });
    currentY += (splitKegiatan.length - 1) * 4.2;

    // Row 5: Bulan
    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.text('Bulan', colX1, currentY);
    doc.text(':', colX2, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text((stDoc.bulan || 'AGUSTUS 2025').toUpperCase(), colX3, currentY);

    // 4. TABEL RINCIAN
    const isUangHarianDoc =
      stDoc.category === 'kkg' ||
      stDoc.category === 'k3s' ||
      stDoc.category === 'mkks' ||
      stDoc.category === 'prioritas-pusat' ||
      stDoc.category === 'validasi' ||
      stDoc.category === 'lomba' ||
      stDoc.category === 'lomba-guru' ||
      stDoc.category === 'lomba-siswa' ||
      Boolean(
        stDoc.kodeKeg &&
          (stDoc.kodeKeg.startsWith('03.03.19') ||
            stDoc.kodeKeg.startsWith('03.03.21') ||
            stDoc.kodeKeg.startsWith('03.05.01') ||
            stDoc.kodeKeg.startsWith('04.06.02') ||
            stDoc.kodeKeg.startsWith('04.06') ||
            stDoc.kodeKeg.startsWith('07.05.04'))
      );
    const volHeader = isUangHarianDoc ? 'Vol (Hari)' : 'Vol';
    const hargaHeader = isUangHarianDoc ? 'Uang Harian' : 'Harga';

    const minSignatureHeight = stDoc.items.length <= 2 ? 22 : stDoc.items.length <= 4 ? 18 : 14;

    const tableBody = stDoc.items.map((item, idx) => {
      const isOdd = (idx + 1) % 2 === 1;
      return [
        String(idx + 1),
        item.nama,
        item.jabatan,
        item.vol,
        formatRupiah(item.harga),
        formatRupiah(item.jumlah),
        {
          content: `${idx + 1}.`,
          styles: {
            halign: isOdd ? ('left' as const) : ('right' as const),
            valign: 'top' as const,
            minCellHeight: minSignatureHeight,
            fontSize: 8,
          },
        },
      ];
    });

    const tableStartY = currentY + 5.5;

    autoTable(doc, {
      startY: tableStartY,
      head: [['No', 'Nama', 'Jabatan', volHeader, hargaHeader, 'Jumlah', 'Tanda Tangan']],
      body: tableBody,
      foot: [
        [
          { content: 'JUMLAH', colSpan: 5, styles: { halign: 'center', fontStyle: 'bold', textColor: [15, 23, 42] } },
          { content: formatRupiah(stDoc.totalJumlah), styles: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] } },
          { content: '', styles: { halign: 'center' } },
        ],
      ],
      theme: 'plain',
      styles: {
        fontSize: 8.5,
        textColor: [15, 23, 42],
        lineColor: [15, 23, 42],
        lineWidth: 0.3,
        cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      },
      headStyles: {
        fontStyle: 'bold',
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        halign: 'center',
        valign: 'middle',
        minCellHeight: 8.5,
      },
      footStyles: {
        fontStyle: 'bold',
        fillColor: [255, 255, 255],
        textColor: [15, 23, 42],
        minCellHeight: 8,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 44, halign: 'left', fontStyle: 'bold' },
        2: { cellWidth: 30, halign: 'left' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 28, halign: 'left', valign: 'top' },
      },
      margin: { left: marginX, right: marginX },
    });

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : tableStartY + 50;

    // 5. TANDA TANGAN BENDAHARA (KANAN BAWAH)
    const idealSignBoxY = stDoc.items.length <= 2 ? Math.max(finalY + 16, 135) : finalY + 12;
    const signBoxY = Math.min(idealSignBoxY, pageHeight - 48);
    const signCenterX = marginX + contentWidth - 36;
    const signNameY = signBoxY + 23;

    let cleanTempatTgl = stDoc.tempatTgl?.trim() || '';
    if (!cleanTempatTgl || cleanTempatTgl.startsWith(',')) {
      const cleanDesa = stDoc.desaKelurahan || settings.desaKelurahan || 'Cibungur';
      const cleanDate = stDoc.tgl ? formatTanggalIndo(stDoc.tgl) : '12 Agustus 2025';
      cleanTempatTgl = `${cleanDesa}, ${cleanDate}`;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(cleanTempatTgl, signCenterX, signBoxY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('Bendahara Sekolah', signCenterX, signBoxY + 4.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const bendaharaName = (stDoc.namaBendahara || settings.namaBendahara || 'ATIKAWATI, S.Pd').trim();
    doc.text(bendaharaName, signCenterX, signNameY, { align: 'center' });
    const bWidth = doc.getTextWidth(bendaharaName);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.line(signCenterX - bWidth / 2, signNameY + 0.8, signCenterX + bWidth / 2, signNameY + 0.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const bendaharaNip = (stDoc.nipBendahara || settings.nipBendahara || '199306082022212007').trim();
    if (bendaharaNip) {
      doc.text(`NIP. ${bendaharaNip}`, signCenterX, signNameY + 4.5, { align: 'center' });
    }
  });

  return doc;
}

/**
 * Trigger download of official Standard Tanda Terima PDF
 */
export function downloadStandardTandaTerimaPdf(
  docsList: StandardTandaTerimaDoc[],
  settings: AppSettings,
  fileName?: string
) {
  const doc = generateStandardTandaTerimaPdf(docsList, settings);
  const cleanSchool = (settings.namaSekolah || 'SDN_1_CIBUNGUR').replace(/[^a-zA-Z0-9]/g, '_');
  const countStr = `${docsList.length}`;
  let categoryTag = 'Tanda_Terima';
  if (docsList[0]) {
    const d = docsList[0];
    if (d.category === 'k3s') categoryTag = 'K3S';
    else if (d.category === 'prioritas-pusat') categoryTag = 'PELAPORAN_PROGRAM_PRIORITAS_PUSAT';
    else if (d.category === 'kkg') categoryTag = 'KKG';
    else if (d.category === 'mkks') categoryTag = 'MKKS';
    else if (d.category === 'validasi') categoryTag = 'VALIDASI';
    else if (d.category?.startsWith('lomba')) categoryTag = 'LOMBA';
    else if (d.category === 'sppd') categoryTag = 'SPPD';
    else categoryTag = (d.judulDokumen || 'DOKUMEN').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  }
  const defaultName = `Bukti_Penerimaan_${cleanSchool}_${countStr}_${categoryTag}.pdf`;
  doc.save(fileName || defaultName);
}

