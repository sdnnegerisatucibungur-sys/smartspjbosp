import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppSettings, SppdData } from '../types';
import { formatTanggalIndo, formatRupiah, terbilang } from './formatters';

export function generateSppdPdf(
  sppd: SppdData,
  settings: AppSettings,
  targetSheet: 'all' | 'lembar1' | 'lembar2' | 'lembar3' = 'lembar2',
  options?: {
    useManualSignatureTujuan?: boolean;
    emptyRow1?: boolean;
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isManualTujuan = options?.useManualSignatureTujuan ?? true;
  const emptyRow1 = options?.emptyRow1 ?? true;

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178mm

  const ppkNama = sppd.ppkNama || settings.namaKepsek || 'HADI MULYA, S.Sos';
  const ppkNip = sppd.ppkNip || settings.nipKepsek || '197107232006041006';
  const ppkJabatan = sppd.ppkJabatan || 'PEJABAT PEMBUAT KOMITMEN';

  const tempatAsal = sppd.tempatBerangkat || settings.namaSekolah || 'SDN 1 Cibungur';
  const kotaAsal = settings.desaKelurahan ? `${settings.desaKelurahan} (${settings.kecamatan || 'Cigemblong'})` : (settings.kotaTanggal || 'Cigemblong');
  const tglBerangkat = sppd.tglBerangkat || sppd.tglSurat;
  const tglKembali = sppd.tglKembali || tglBerangkat;

  // Render Kop Surat Resmi
  const drawKop = (yStart: number = 12) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('PEMERINTAH KABUPATEN LEBAK', pageWidth / 2, yStart, { align: 'center' });
    doc.text('DINAS PENDIDIKAN', pageWidth / 2, yStart + 4.5, { align: 'center' });
    doc.setFontSize(13);
    doc.text((settings.namaSekolah || 'SDN 1 CIBUNGUR').toUpperCase(), pageWidth / 2, yStart + 9.5, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    const alamat = `${settings.alamat || 'Kp. Cibungur Desa Cibungur Kec. Cigemblong'} - Kab. Lebak, Banten`;
    doc.text(alamat, pageWidth / 2, yStart + 14, { align: 'center' });

    // Garis Kop Ganda
    doc.setLineWidth(0.8);
    doc.line(margin, yStart + 16.5, pageWidth - margin, yStart + 16.5);
    doc.setLineWidth(0.2);
    doc.line(margin, yStart + 17.5, pageWidth - margin, yStart + 17.5);

    return yStart + 22;
  };

  // ==========================================
  // LEMBAR 1: SPPD DEPAN
  // ==========================================
  const renderLembar1 = (isFirstPage: boolean) => {
    if (!isFirstPage) doc.addPage();

    const yKop = drawKop(12);

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('SURAT PERINTAH PERJALANAN DINAS', pageWidth / 2, yKop + 2, { align: 'center' });
    doc.text('( S P P D )', pageWidth / 2, yKop + 6.5, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text(`Nomor : ${sppd.noSppd || '090/015/SPPD-BOSP/2026'}`, pageWidth / 2, yKop + 11, { align: 'center' });

    // Table Lembar 1
    const rows = [
      ['1.', 'Pejabat Pembuat Komitmen / Yang Memberi Perintah', ppkNama],
      ['2.', 'Nama / NIP Pegawai yang diperintahkan', `${sppd.pegawaiNama}\nNIP. ${sppd.pegawaiNip || '-'}`],
      ['3.', 'a. Pangkat dan Golongan menurut PP No. 6 Tahun 1997\nb. Jabatan / Instansi\nc. Tingkat Biaya Perjalanan Dinas', `a. ${sppd.pegawaiPangkatGol || '-'}\nb. ${sppd.pegawaiJabatan || 'Guru'}\nc. ${sppd.tingkatBiaya || 'Tingkat C / Biasa'}`],
      ['4.', 'Maksud Perjalanan Dinas', sppd.maksudPerjalanan || 'Melaksanakan Tugas Kedinasan'],
      ['5.', 'Alat angkutan yang dipergunakan', sppd.alatAngkutan || 'Kendaraan Darat'],
      ['6.', 'a. Tempat berangkat\nb. Tempat tujuan', `a. ${sppd.tempatBerangkat || tempatAsal}\nb. ${sppd.tempatTujuan}`],
      ['7.', 'a. Lamanya Perjalanan Dinas\nb. Tanggal berangkat\nc. Tanggal harus kembali', `a. ${sppd.lamaHari || 1} hari\nb. ${formatTanggalIndo(tglBerangkat)}\nc. ${formatTanggalIndo(tglKembali)}`],
      ['8.', 'Pengikut : Nama / Tanggal Lahir', '-'],
      ['9.', 'Pembebanan Anggaran\na. Instansi\nb. Mata Anggaran', `a. ${sppd.bebanAnggaran || 'BOSP'}\nb. ${sppd.mataAnggaran || '5.1.02.04.01.0001'}`],
      ['10.', 'Keterangan lain-lain', 'Dilaksanakan dengan penuh rasa tanggung jawab'],
    ];

    autoTable(doc, {
      startY: yKop + 14,
      margin: { left: margin, right: margin },
      head: [],
      body: rows,
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8.5,
        cellPadding: 2,
        textColor: 20,
        lineColor: 40,
        lineWidth: 0.25,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 70, fontStyle: 'normal' },
        2: { cellWidth: contentWidth - 80, fontStyle: 'normal' },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;

    // Tanda Tangan Kanan
    const signX = pageWidth - margin - 65;
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Dikeluarkan di : ${settings.kotaTanggal || 'Cigemblong'}`, signX, finalY);
    doc.text(`Pada tanggal   : ${formatTanggalIndo(tglBerangkat)}`, signX, finalY + 4);

    doc.setFont('times', 'bold');
    doc.text(ppkJabatan, signX, finalY + 11);
    doc.text((settings.namaSekolah || 'SDN 1 CIBUNGUR'), signX, finalY + 15);

    doc.text(ppkNama, signX, finalY + 36);
    doc.setLineWidth(0.3);
    doc.line(signX, finalY + 37, signX + 55, finalY + 37);
    doc.setFont('times', 'normal');
    doc.text(`NIP. ${ppkNip}`, signX, finalY + 41);
  };

  // =========================================================================
  // DOKUMEN SPPD RESMI LEMBAR 2: 100% PERSIS KERTAS A4 (MARGIN ~0.5 CM)
  // =========================================================================
  const renderLembar2 = (isFirstPage: boolean) => {
    if (!isFirstPage) doc.addPage();

    // Halaman A4 portrait: 210 x 297 mm
    // Margin sekitar 0.5 cm (5 mm) agar proporsional dan profesional
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2); // 200 mm
    const colWidth = contentWidth / 2; // 100 mm
    const startY = 5; // 0.5 cm dari tepi atas

    let currentY = startY;
    doc.setDrawColor(0);
    doc.setTextColor(0);
    doc.setLineWidth(0.3);

    // ==========================================
    // DIMENSI BARIS I s/d V: UKURAN HARUS SAMA PERSIS
    // ==========================================
    const rowH = 50; // Tinggi sama persis 50mm untuk Baris I, II, III, IV, dan V

    // ==========================================
    // ROW I (2 Kolom Baris Pertama: Kosong atau terisi)
    // ==========================================
    doc.rect(margin, currentY, contentWidth, rowH);
    doc.line(margin + colWidth, currentY, margin + colWidth, currentY + rowH);

    // Jika opsi emptyRow1 dimatikan, isi data keberangkatan I di kanan:
    if (!emptyRow1) {
      const rx1 = margin + colWidth + 5;
      let ry1 = currentY + 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('I.   Berangkat dari', rx1, ry1);
      doc.text(`:  ${sppd.tempatBerangkat || tempatAsal}`, rx1 + 30, ry1);
      doc.text('     (Tempat Kedudukan)', rx1, ry1 + 4.5);
      doc.text('     Ke', rx1, ry1 + 9);
      doc.text(`:  ${sppd.tempatTujuan}`, rx1 + 30, ry1 + 9);
      doc.text('     Pada Tanggal', rx1, ry1 + 13.5);
      doc.text(`:  ${formatTanggalIndo(tglBerangkat)}`, rx1 + 30, ry1 + 13.5);

      const sign1X = margin + colWidth + (colWidth / 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(ppkNama, sign1X, currentY + 41, { align: 'center' });
      doc.setLineWidth(0.25);
      const nameWidth1 = doc.getTextWidth(ppkNama);
      doc.line(sign1X - (nameWidth1 / 2), currentY + 41.6, sign1X + (nameWidth1 / 2), currentY + 41.6);
      doc.setFont('helvetica', 'normal');
      doc.text(`NIP. ${ppkNip}`, sign1X, currentY + 45.5, { align: 'center' });
    }

    currentY += rowH;

    // ==========================================
    // ROW II (2 Kolom Baris Ke-2: Tiba di & Berangkat dari)
    // ==========================================
    doc.rect(margin, currentY, contentWidth, rowH);
    doc.line(margin + colWidth, currentY, margin + colWidth, currentY + rowH);

    // Kiri: II. Tiba di
    const lx2 = margin + 5;
    let ly2 = currentY + 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('II.  Tiba di', lx2, ly2);
    doc.text(`:  ${sppd.visumTibaDi || sppd.tempatTujuan}`, lx2 + 28, ly2);
    doc.text('      Pada tanggal', lx2, ly2 + 4.5);
    doc.text(`:  ${formatTanggalIndo(sppd.visumTglTiba || tglBerangkat)}`, lx2 + 28, ly2 + 4.5);

    const sign2LeftX = margin + (colWidth / 2);
    const pejabatTibaNama = sppd.visumTibaNama || '';
    const pejabatTibaNip = sppd.visumTibaNip || '';

    if (!isManualTujuan && pejabatTibaNama) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(pejabatTibaNama, sign2LeftX, currentY + 41, { align: 'center' });
      const wName = doc.getTextWidth(pejabatTibaNama);
      doc.line(sign2LeftX - (wName / 2), currentY + 41.6, sign2LeftX + (wName / 2), currentY + 41.6);
      doc.setFont('helvetica', 'normal');
      doc.text(`NIP. ${pejabatTibaNip || '-'}`, sign2LeftX, currentY + 45.5, { align: 'center' });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('......................................................', sign2LeftX, currentY + 41, { align: 'center' });
      doc.text('NIP...................................................', sign2LeftX, currentY + 45.5, { align: 'center' });
    }

    // Kanan: Berangkat dari
    const rx2 = margin + colWidth + 5;
    let ry2 = currentY + 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Berangkat dari', rx2, ry2);
    doc.text(`:  ${sppd.visumBerangkatDari || sppd.tempatTujuan}`, rx2 + 28, ry2);
    doc.text('Ke', rx2, ry2 + 4.5);
    doc.text(`:  ${sppd.visumBerangkatKe || `${tempatAsal} (${kotaAsal})`}`, rx2 + 28, ry2 + 4.5);
    doc.text('Pada Tanggal', rx2, ry2 + 9);
    doc.text(`:  ${formatTanggalIndo(sppd.visumTglBerangkatKembali || tglKembali)}`, rx2 + 28, ry2 + 9);

    const sign2RightX = margin + colWidth + (colWidth / 2);
    const pejabatBerangkatNama = sppd.visumBerangkatNama || '';
    const pejabatBerangkatNip = sppd.visumBerangkatNip || '';

    if (!isManualTujuan && pejabatBerangkatNama) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(pejabatBerangkatNama, sign2RightX, currentY + 41, { align: 'center' });
      const wName = doc.getTextWidth(pejabatBerangkatNama);
      doc.line(sign2RightX - (wName / 2), currentY + 41.6, sign2RightX + (wName / 2), currentY + 41.6);
      doc.setFont('helvetica', 'normal');
      doc.text(`NIP. ${pejabatBerangkatNip || '-'}`, sign2RightX, currentY + 45.5, { align: 'center' });
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('......................................................', sign2RightX, currentY + 41, { align: 'center' });
      doc.text('NIP. .................................................', sign2RightX, currentY + 45.5, { align: 'center' });
    }

    currentY += rowH;

    // ==========================================
    // ROW III (Persis SPPD WAJIB KERTAS A4.pdf)
    // ==========================================
    doc.rect(margin, currentY, contentWidth, rowH);
    doc.line(margin + colWidth, currentY, margin + colWidth, currentY + rowH);

    const lx3 = margin + 5;
    let ly3 = currentY + 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('III.  Tiba di', lx3, ly3);
    doc.text(':', lx3 + 28, ly3);
    doc.text('       Pada tanggal', lx3, ly3 + 4.5);
    doc.text(':', lx3 + 28, ly3 + 4.5);

    const sign3LeftX = margin + (colWidth / 2);
    doc.text('......................................................', sign3LeftX, currentY + 41, { align: 'center' });
    doc.text('NIP...................................................', sign3LeftX, currentY + 45.5, { align: 'center' });

    const rx3 = margin + colWidth + 5;
    let ry3 = currentY + 6;
    doc.text('Berangkat dari', rx3, ry3);
    doc.text(':', rx3 + 28, ry3);
    doc.text('Ke', rx3, ry3 + 4.5);
    doc.text(':', rx3 + 28, ry3 + 4.5);
    doc.text('Pada Tanggal', rx3, ry3 + 9);
    doc.text(':', rx3 + 28, ry3 + 9);

    const sign3RightX = margin + colWidth + (colWidth / 2);
    doc.text('......................................................', sign3RightX, currentY + 41, { align: 'center' });
    doc.text('NIP. .................................................', sign3RightX, currentY + 45.5, { align: 'center' });

    currentY += rowH;

    // ==========================================
    // ROW IV (Persis SPPD WAJIB KERTAS A4.pdf)
    // ==========================================
    doc.rect(margin, currentY, contentWidth, rowH);
    doc.line(margin + colWidth, currentY, margin + colWidth, currentY + rowH);

    const lx4 = margin + 5;
    let ly4 = currentY + 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('IV.   Tiba di', lx4, ly4);
    doc.text(':', lx4 + 28, ly4);
    doc.text('       Pada tanggal', lx4, ly4 + 4.5);
    doc.text(':', lx4 + 28, ly4 + 4.5);

    const sign4LeftX = margin + (colWidth / 2);
    doc.text('......................................................', sign4LeftX, currentY + 41, { align: 'center' });
    doc.text('NIP...................................................', sign4LeftX, currentY + 45.5, { align: 'center' });

    const rx4 = margin + colWidth + 5;
    let ry4 = currentY + 6;
    doc.text('Berangkat dari', rx4, ry4);
    doc.text(':', rx4 + 28, ry4);
    doc.text('Ke', rx4, ry4 + 4.5);
    doc.text(':', rx4 + 28, ry4 + 4.5);
    doc.text('Pada Tanggal', rx4, ry4 + 9);
    doc.text(':', rx4 + 28, ry4 + 9);

    const sign4RightX = margin + colWidth + (colWidth / 2);
    doc.text('......................................................', sign4RightX, currentY + 41, { align: 'center' });
    doc.text('NIP. .................................................', sign4RightX, currentY + 45.5, { align: 'center' });

    currentY += rowH;

    // ==========================================
    // ROW V (Persis SPPD WAJIB KERTAS A4.pdf)
    // ==========================================
    doc.rect(margin, currentY, contentWidth, rowH);
    doc.line(margin + colWidth, currentY, margin + colWidth, currentY + rowH);

    const lx5 = margin + 5;
    let ly5 = currentY + 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('V.    Tiba di', lx5, ly5);
    doc.text(':', lx5 + 28, ly5);
    doc.text('       Pada tanggal', lx5, ly5 + 4.5);
    doc.text(':', lx5 + 28, ly5 + 4.5);

    const sign5LeftX = margin + (colWidth / 2);
    doc.text('......................................................', sign5LeftX, currentY + 41, { align: 'center' });
    doc.text('NIP...................................................', sign5LeftX, currentY + 45.5, { align: 'center' });

    const rx5 = margin + colWidth + 5;
    let ry5 = currentY + 6;
    doc.text('Berangkat dari', rx5, ry5);
    doc.text(':', rx5 + 28, ry5);
    doc.text('Ke', rx5, ry5 + 4.5);
    doc.text(':', rx5 + 28, ry5 + 4.5);
    doc.text('Pada Tanggal', rx5, ry5 + 9);
    doc.text(':', rx5 + 28, ry5 + 9);

    const sign5RightX = margin + colWidth + (colWidth / 2);
    doc.text('......................................................', sign5RightX, currentY + 41, { align: 'center' });
    doc.text('NIP. .................................................', sign5RightX, currentY + 45.5, { align: 'center' });

    currentY += rowH;

    // ==========================================
    // ROW VI: (Baris penuh tanpa pembagi vertikal - Persis SPPD WAJIB KERTAS A4.pdf)
    // ==========================================
    const row6H = 8;
    doc.rect(margin, currentY, contentWidth, row6H);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('VI.', margin + 4, currentY + 5.5);
    if (sppd.catatanLain) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(sppd.catatanLain, margin + 14, currentY + 5.5);
    }

    currentY += row6H;

    // ==========================================
    // ROW VII: PERHATIAN (Di Bawah Tabel - Persis SPPD WAJIB KERTAS A4.pdf)
    // ==========================================
    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('VII. PERHATIAN :', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const perhatianText = 'Pejabat yang berwenang menerbitkan SPPD, Pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat, serta bendaharawan bertanggungjawab berdasarkan peraturan-peraturan Keuangan Negara apabila negara menderita rugi akibat kesalahan, kelalaian dan kealpaannya.';
    const splitPerhatian = doc.splitTextToSize(perhatianText, contentWidth - 2);
    doc.text(splitPerhatian, margin + 4, currentY + 4);
  };

  // ==========================================
  // LEMBAR 3: RINCIAN BIAYA RIIL & BUKTI PENGELUARAN
  // ==========================================
  const renderLembar3 = (isFirstPage: boolean) => {
    if (!isFirstPage) doc.addPage();

    const yKop = drawKop(12);

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('RINCIAN BIAYA RIIL PERJALANAN DINAS', pageWidth / 2, yKop + 2, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Lampiran SPPD Nomor : ${sppd.noSppd || '090/015/SPPD-BOSP/2026'}`, pageWidth / 2, yKop + 6.5, { align: 'center' });

    const totalBiaya =
      (sppd.biayaTransport || 0) +
      (sppd.biayaUangHarian || 0) +
      (sppd.biayaPenginapan || 0) +
      (sppd.biayaLainLain || 0);

    const rowsBiaya = [
      ['1.', `Biaya Transportasi Darat PP (${sppd.tempatBerangkat || tempatAsal} - ${sppd.tempatTujuan})`, formatRupiah(sppd.biayaTransport || 0), 'Sesuai Standar Biaya Masukan'],
      ['2.', `Uang Harian Perjalanan Dinas (${sppd.lamaHari || 1} Hari)`, formatRupiah(sppd.biayaUangHarian || 0), `${sppd.lamaHari || 1} hari`],
    ];

    if ((sppd.biayaPenginapan || 0) > 0) {
      rowsBiaya.push(['3.', 'Biaya Penginapan / Hotel', formatRupiah(sppd.biayaPenginapan), 'Biaya Riil']);
    }
    if ((sppd.biayaLainLain || 0) > 0) {
      rowsBiaya.push(['4.', 'Biaya Lain-lain / Tol / Parkir', formatRupiah(sppd.biayaLainLain), 'Bukti Riil']);
    }

    // Baris Jumlah
    rowsBiaya.push(['', 'JUMLAH TOTAL', formatRupiah(totalBiaya), '']);

    autoTable(doc, {
      startY: yKop + 10,
      margin: { left: margin, right: margin },
      head: [['No', 'Perincian Biaya Riil', 'Jumlah (Rp)', 'Keterangan']],
      body: rowsBiaya,
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8.5,
        cellPadding: 2.5,
        textColor: 20,
        lineColor: 40,
        lineWidth: 0.25,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 20,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 85 },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: contentWidth - 135 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 4;

    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.text(`Terbilang : ${terbilang(totalBiaya)} rupiah`, margin, finalY);

    // Dua Tanda Tangan: Kiri Mengetahui PPK, Kanan Yang Menerima
    const signY = finalY + 8;
    const leftSignX = margin + 5;
    const rightSignX = pageWidth - margin - 65;

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text('Mengetahui / Menyetujui,', leftSignX, signY);
    doc.setFont('times', 'bold');
    doc.text(ppkJabatan, leftSignX, signY + 4);
    doc.text((settings.namaSekolah || 'SDN 1 CIBUNGUR'), leftSignX, signY + 8);

    doc.text(ppkNama, leftSignX, signY + 30);
    doc.line(leftSignX, signY + 30.5, leftSignX + 50, signY + 30.5);
    doc.setFont('times', 'normal');
    doc.text(`NIP. ${ppkNip}`, leftSignX, signY + 34.5);

    // Kanan: Yang Menerima
    doc.setFont('times', 'normal');
    doc.text(`${settings.kotaTanggal || 'Cigemblong'}, ${formatTanggalIndo(tglBerangkat)}`, rightSignX, signY);
    doc.text('Yang Menerima /', rightSignX, signY + 4);
    doc.setFont('times', 'bold');
    doc.text('Pegawai yang Melakukan Perjalanan', rightSignX, signY + 8);

    doc.text(sppd.pegawaiNama, rightSignX, signY + 30);
    doc.line(rightSignX, signY + 30.5, rightSignX + 50, signY + 30.5);
    doc.setFont('times', 'normal');
    doc.text(`NIP. ${sppd.pegawaiNip || '-'}`, rightSignX, signY + 34.5);
  };

  // Execution based on targetSheet
  if (targetSheet === 'lembar1') {
    renderLembar1(true);
  } else if (targetSheet === 'lembar2') {
    renderLembar2(true);
  } else if (targetSheet === 'lembar3') {
    renderLembar3(true);
  } else {
    // all
    renderLembar1(true);
    renderLembar2(false);
    renderLembar3(false);
  }

  const filename = `SPPD_${sppd.pegawaiNama.replace(/[^a-zA-Z0-9]/g, '_')}_${sppd.noSppd.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
}
