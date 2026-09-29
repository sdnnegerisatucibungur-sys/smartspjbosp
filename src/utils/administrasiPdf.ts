import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActivityScopeType, AppSettings, DaftarHadirData, PenerimaanSnackData, SuratUndanganData } from '../types';
import { formatTanggalIndo } from './formatters';
import { LOGO_PEMKAB_LEBAK, LOGO_KKG_PRESET, LOGO_MKKS_PRESET } from './logoPresets';
import { getKetuaTitleFromKop } from './administrasiData';

/**
 * Draw official header (Kop Surat)
 * - If scope === 'kkg': Draws KKG Kop with custom KKG logo & identity
 * - If scope === 'mkks': Draws MKKS Kop with custom MKKS logo & identity
 * - Other scopes: Draws standard School Kop following Pengaturan (like Tanda Terima)
 */
function drawKopSurat(
  doc: jsPDF,
  settings: AppSettings,
  scope?: ActivityScopeType,
  startY: number = 10
): number {
  const pageWidth = 210;
  const marginX = 16;
  const isKkg = scope === 'kkg';
  const isMkks = scope === 'mkks';
  const isSpecial = isKkg || isMkks;

  // Determine active logo & texts
  let logoUrl = settings.logoSekolah || LOGO_PEMKAB_LEBAK;
  let baris1 = '';
  let baris2 = '';
  let baris3 = '';
  let baris4 = '';
  let barisAlamat = '';
  let barisKontak = '';

  const kab = (settings.kabupaten || 'LEBAK').toUpperCase();
  const sek = (settings.namaSekolah || 'SDN 1 CIBUNGUR').toUpperCase();
  const kec = (settings.kecamatan || 'CIGEMBLONG').toUpperCase();

  if (isKkg) {
    const kkg = settings.kopKkg;
    logoUrl = kkg?.logo || LOGO_KKG_PRESET;
    baris1 = kkg?.instansiInduk || `PEMERINTAH KABUPATEN ${kab.replace(/^(KAB\.?|KABUPATEN)\s*/i, '')}`;
    baris2 = kkg?.dinas || 'DINAS PENDIDIKAN';
    baris3 = kkg?.namaOrganisasi || 'KELOMPOK KERJA GURU (KKG) GUGUS 02';
    baris4 = kkg?.subOrganisasi || `KECAMATAN ${kec}`;
    barisAlamat = kkg?.alamatSekretariat || `Sekretariat: ${settings.namaSekolah || 'SDN 1 Cibungur'}, ${settings.alamat || 'Kp. Pasarkupa RT 02/03'}`;
    barisKontak = kkg?.kontakSekretariat || `Desa ${settings.desaKelurahan || 'Cibungur'}, Kec. ${settings.kecamatan || 'Cigemblong'} ${settings.kodePos || '42395'} | Email: kkg.cigemblong@gmail.com`;
  } else if (isMkks) {
    const mkks = settings.kopMkks;
    logoUrl = mkks?.logo || LOGO_MKKS_PRESET;
    baris1 = mkks?.instansiInduk || `PEMERINTAH KABUPATEN ${kab.replace(/^(KAB\.?|KABUPATEN)\s*/i, '')}`;
    baris2 = mkks?.dinas || 'DINAS PENDIDIKAN';
    baris3 = mkks?.namaOrganisasi || 'MUSYAWARAH KERJA KEPALA SEKOLAH (MKKS)';
    baris4 = mkks?.subOrganisasi || `SUB RAYON / KECAMATAN ${kec}`;
    barisAlamat = mkks?.alamatSekretariat || `Sekretariat: Kantor K3S / MKKS Kec. ${settings.kecamatan || 'Cigemblong'}`;
    barisKontak = mkks?.kontakSekretariat || `Kabupaten ${settings.kabupaten || 'Lebak'}, Provinsi ${settings.provinsi || 'Banten'} | Kode Pos ${settings.kodePos || '42395'}`;
  } else {
    // Format lain: Kop mengikuti pengaturan sekolah persis seperti Kop Tanda Terima
    logoUrl = settings.logoSekolah || LOGO_PEMKAB_LEBAK;
    baris1 = `PEMERINTAH KABUPATEN ${kab}`;
    baris2 = 'DINAS PENDIDIKAN';
    baris3 = `UPTD SATUAN PENDIDIKAN ${sek}`;
    baris4 = `KECAMATAN ${kec}`;
    barisAlamat = `Alamat: ${settings.alamat || 'Kp. Pasar Kupa'}, Desa ${settings.desaKelurahan || 'Cibungur'}, Kecamatan ${kec}, Kabupaten ${kab}, Provinsi ${settings.provinsi || 'Banten'}`;
    barisKontak = `NPSN: ${settings.npsn || '20602599'}, Email: ${settings.emailSekolah || 'sdnnegerisatucibungur@gmail.com'}, Kode Pos ${settings.kodePos || '42395'}`;
  }

  // Draw Logo on the left
  const logoX = marginX + 2;
  const logoY = startY;
  const logoW = 15;
  const logoH = 19;
  if (logoUrl) {
    try {
      doc.addImage(logoUrl, 'PNG', logoX, logoY, logoW, logoH);
    } catch {
      // Fallback placeholder box
      doc.setDrawColor(20, 50, 120);
      doc.setFillColor(240, 245, 255);
      doc.roundedRect(logoX, logoY, logoW, logoH, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(20, 50, 120);
      doc.text(isKkg ? 'KKG' : isMkks ? 'MKKS' : 'LEBAK', logoX + logoW / 2, logoY + 10, { align: 'center' });
    }
  }

  // Centered Header texts
  doc.setTextColor(15, 23, 42);

  // Baris 1: Instansi Induk
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(baris1, pageWidth / 2, startY + 3, { align: 'center' });

  // Baris 2: Dinas Pendidikan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(baris2, pageWidth / 2, startY + 7.5, { align: 'center' });

  // Baris 3: Nama Organisasi / Satuan Pendidikan (Tebal Paling Menonjol)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(baris3, pageWidth / 2, startY + 12.5, { align: 'center' });

  // Baris 4: Sub Organisasi / Kecamatan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(baris4, pageWidth / 2, startY + 17, { align: 'center' });

  // Baris Alamat
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(barisAlamat, pageWidth / 2, startY + 21, { align: 'center' });

  // Baris Kontak
  doc.setFontSize(7);
  doc.text(barisKontak, pageWidth / 2, startY + 24.5, { align: 'center' });

  // Double horizontal rule
  const lineY = startY + 27;
  doc.setLineWidth(0.8);
  doc.line(marginX, lineY, pageWidth - marginX, lineY);
  doc.setLineWidth(0.2);
  doc.line(marginX, lineY + 0.8, pageWidth - marginX, lineY + 0.8);

  return lineY + 5;
}

/**
 * 1. Generate Surat Undangan PDF
 */
export function generateSuratUndanganPdf(data: SuratUndanganData, settings: AppSettings): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const marginX = 20;
  const pageWidth = 210;

  let curY = drawKopSurat(doc, settings, data.scope, 10);

  // Tanggal Surat (Kanan Atas)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const tglFormatted = data.tglSurat ? formatTanggalIndo(data.tglSurat) : '18 April 2026';
  const kotaTgl = `${data.tempatDitetapkan || settings.desaKelurahan || 'Cibungur'}, ${tglFormatted}`;
  doc.text(kotaTgl, pageWidth - marginX, curY, { align: 'right' });

  curY += 2;

  // Metadata surat (Nomor, Sifat, Lampiran, Hal)
  const metaLeft = marginX;
  doc.setFontSize(10);
  doc.text('Nomor', metaLeft, curY);
  doc.text(`:  ${data.nomorSurat}`, metaLeft + 22, curY);

  doc.text('Sifat', metaLeft, curY + 5);
  doc.text(`:  ${data.sifat}`, metaLeft + 22, curY + 5);

  doc.text('Lampiran', metaLeft, curY + 10);
  doc.text(`:  ${data.lampiran}`, metaLeft + 22, curY + 10);

  doc.text('Hal', metaLeft, curY + 15);
  doc.setFont('helvetica', 'bold');
  doc.text(`:  ${data.perihal}`, metaLeft + 22, curY + 15);

  // Tujuan Undangan (Kepada Yth)
  curY += 24;
  doc.setFont('helvetica', 'normal');
  doc.text('Kepada Yth,', metaLeft, curY);
  const linesTujuan = doc.splitTextToSize(data.tujuanKepada || 'Bapak/Ibu Guru dan Tenaga Kependidikan\ndi Tempat', 80);
  doc.text(linesTujuan, metaLeft, curY + 5);

  curY += 6 + linesTujuan.length * 4.5 + 4;

  // Paragraf Pembuka
  doc.setFont('helvetica', 'normal');
  const pembuka = data.pembukaText || 'Dengan hormat, sehubungan dengan pelaksanaan program kegiatan sekolah, kami mengundang kehadiran Bapak/Ibu pada:';
  const linesPembuka = doc.splitTextToSize(pembuka, pageWidth - marginX * 2);
  doc.text(linesPembuka, marginX, curY);

  curY += linesPembuka.length * 5 + 4;

  // Rincian Pelaksanaan (Indent box)
  const detailX = marginX + 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Hari, Tanggal', detailX, curY);
  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${data.hariTglAcara}`, detailX + 30, curY);

  doc.setFont('helvetica', 'bold');
  doc.text('Waktu', detailX, curY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${data.waktuAcara}`, detailX + 30, curY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Tempat', detailX, curY + 12);
  doc.setFont('helvetica', 'normal');
  const linesTempat = doc.splitTextToSize(data.tempatAcara, pageWidth - detailX - 45);
  doc.text(`:  `, detailX + 30, curY + 12);
  doc.text(linesTempat, detailX + 33, curY + 12);

  const tempatHeight = linesTempat.length * 5;
  const agendaY = curY + 12 + tempatHeight + 1;

  doc.setFont('helvetica', 'bold');
  doc.text('Agenda / Acara', detailX, agendaY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: `, detailX + 30, agendaY);
  const linesAgenda = doc.splitTextToSize(data.agendaAcara || '-', pageWidth - detailX - 45);
  doc.text(linesAgenda, detailX + 33, agendaY);

  curY = agendaY + linesAgenda.length * 5 + 6;

  // Paragraf Penutup
  const penutup = data.penutupText || 'Demikian surat undangan ini kami sampaikan, atas perhatian dan kehadirannya kami ucapkan terima kasih.';
  const linesPenutup = doc.splitTextToSize(penutup, pageWidth - marginX * 2);
  doc.text(linesPenutup, marginX, curY);

  curY += linesPenutup.length * 5 + 12;

  // Tanda Tangan Kanan Bawah
  const signX = pageWidth - marginX - 65;
  const isKkgOrMkks = data.scope === 'kkg' || data.scope === 'mkks';
  doc.setFont('helvetica', 'normal');
  doc.text(
    data.penandatanganJabatan || (isKkgOrMkks ? getKetuaTitleFromKop(data.scope, settings) : 'Kepala Satuan Pendidikan'),
    signX + 32,
    curY,
    { align: 'center' }
  );
  if (!isKkgOrMkks) {
    doc.text(settings.namaSekolah || 'SDN 1 CIBUNGUR', signX + 32, curY + 4.5, { align: 'center' });
    curY += 4.5;
  }

  curY += 24;
  doc.setFont('helvetica', 'bold');
  doc.text(data.penandatanganNama || settings.namaKepsek || 'KARNA, S.Pd', signX + 32, curY, { align: 'center' });
  doc.setLineWidth(0.3);
  const nameWidth = doc.getTextWidth(data.penandatanganNama || settings.namaKepsek || 'KARNA, S.Pd');
  doc.line(signX + 32 - nameWidth / 2, curY + 0.8, signX + 32 + nameWidth / 2, curY + 0.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`NIP. ${data.penandatanganNip || settings.nipKepsek || '197804072008011010'}`, signX + 32, curY + 5, { align: 'center' });

  return doc;
}

/**
 * 2. Generate Daftar Hadir PDF
 * Format Kolom sesuai permintaan: [No, Nama, NIP, Jabatan, Tanda Tangan]
 */
export function generateDaftarHadirPdf(data: DaftarHadirData, settings: AppSettings): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const marginX = 16;
  const pageWidth = 210;
  const isKkgOrMkks = data.scope === 'kkg' || data.scope === 'mkks';

  let curY = drawKopSurat(doc, settings, data.scope, 10);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DAFTAR HADIR PESERTA', pageWidth / 2, curY + 2, { align: 'center' });
  doc.setFontSize(10.5);
  const linesKeg = doc.splitTextToSize(data.namaKegiatan.toUpperCase(), pageWidth - marginX * 2);
  doc.text(linesKeg, pageWidth / 2, curY + 7, { align: 'center' });

  curY += 7 + linesKeg.length * 4.5 + 2;

  // Metadata Table Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Hari / Tanggal  :  ${data.hariTanggal}`, marginX, curY);
  doc.text(`Tempat               :  ${data.tempat}`, pageWidth / 2 + 5, curY);
  doc.text(`Waktu               :  ${data.waktu}`, marginX, curY + 4.5);
  doc.text(`Satuan Pendidikan :  ${data.penyelenggara || settings.namaSekolah || 'SDN 1 CIBUNGUR'}`, pageWidth / 2 + 5, curY + 4.5);

  curY += 9;

  // Format kolom persis: [No, Nama, NIP, Jabatan / Instansi, Tanda Tangan]
  const tableRows = data.peserta.map((p, idx) => {
    const isOdd = (idx + 1) % 2 === 1;
    const ttStr = isOdd ? `${idx + 1}.` : `            ${idx + 1}.`;
    const col4Value = isKkgOrMkks
      ? (p.instansi || p.jabatan || '-')
      : (p.jabatan || p.instansi || '-');

    return [
      String(idx + 1),
      p.nama,
      p.nip && p.nip.trim() !== '' ? p.nip : '-',
      col4Value,
      ttStr,
    ];
  });

  autoTable(doc, {
    startY: curY,
    margin: { left: marginX, right: marginX },
    head: [['No', 'Nama Lengkap', 'NIP', isKkgOrMkks ? 'Instansi' : 'Jabatan', 'Tanda Tangan']],
    body: tableRows,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: [15, 23, 42],
      lineColor: [30, 41, 59],
      lineWidth: 0.25,
      cellPadding: 2.2,
      minCellHeight: 11,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.35,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 55, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 38 },
      3: { halign: 'left', cellWidth: 42 },
      4: { halign: 'left', cellWidth: 33, valign: 'top' },
    },
  });

  // Tanda Tangan Mengetahui
  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : curY + 80;
  const signX = pageWidth - marginX - 65;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${settings.desaKelurahan || 'Cibungur'}, ${data.hariTanggal ? data.hariTanggal.split(',').pop()?.trim() || '' : ''}`, signX + 32, finalY, { align: 'center' });
  doc.text('Mengetahui,', signX + 32, finalY + 4, { align: 'center' });
  doc.text(
    data.mengetahuiJabatan || (isKkgOrMkks ? getKetuaTitleFromKop(data.scope, settings) : 'Kepala Satuan Pendidikan'),
    signX + 32,
    finalY + 8,
    { align: 'center' }
  );

  const nameY = finalY + 28;
  doc.setFont('helvetica', 'bold');
  doc.text(data.mengetahuiNama || settings.namaKepsek || 'KARNA, S.Pd', signX + 32, nameY, { align: 'center' });
  const nw = doc.getTextWidth(data.mengetahuiNama || settings.namaKepsek || 'KARNA, S.Pd');
  doc.setLineWidth(0.3);
  doc.line(signX + 32 - nw / 2, nameY + 0.8, signX + 32 + nw / 2, nameY + 0.8);

  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${data.mengetahuiNip || settings.nipKepsek || '197804072008011010'}`, signX + 32, nameY + 4.5, { align: 'center' });

  return doc;
}

/**
 * 3. Generate Penerimaan Snack PDF
 * Format Kolom: [No, Nama, NIP, Jabatan/Instansi, Jenis Konsumsi, Tanda Tangan]
 */
export function generatePenerimaanSnackPdf(data: PenerimaanSnackData, settings: AppSettings): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const marginX = 16;
  const pageWidth = 210;
  const isKkgOrMkks = data.scope === 'kkg' || data.scope === 'mkks';

  let curY = drawKopSurat(doc, settings, data.scope, 10);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('TANDA TERIMA PENERIMAAN KONSUMSI / SNACK', pageWidth / 2, curY + 2, { align: 'center' });
  doc.setFontSize(10);
  const linesKeg = doc.splitTextToSize(data.namaKegiatan.toUpperCase(), pageWidth - marginX * 2);
  doc.text(linesKeg, pageWidth / 2, curY + 6.5, { align: 'center' });

  curY += 6.5 + linesKeg.length * 4.5 + 2;

  // Metadata Table Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Hari / Tanggal  :  ${data.hariTanggal}`, marginX, curY);
  doc.text(`Menu Konsumsi :  ${data.uraianMenu || 'Snack Box & Air Mineral'}`, pageWidth / 2 + 5, curY);
  doc.text(`Tempat               :  ${data.tempat}`, marginX, curY + 4.5);
  doc.text(`No. BKU Ref   :  ${data.noBku ? `${data.noBku} (Dana BOSP)` : '-'}`, pageWidth / 2 + 5, curY + 4.5);

  curY += 9;

  // Format kolom: [No, Nama, NIP, Jabatan / Instansi, Konsumsi, Tanda Tangan]
  const tableRows = data.peserta.map((p, idx) => {
    const isOdd = (idx + 1) % 2 === 1;
    const ttStr = isOdd ? `${idx + 1}.` : `            ${idx + 1}.`;
    const col4Value = isKkgOrMkks
      ? (p.instansi || p.jabatan || '-')
      : (p.jabatan || p.instansi || '-');

    return [
      String(idx + 1),
      p.nama,
      p.nip && p.nip.trim() !== '' ? p.nip : '-',
      col4Value,
      p.jenisKonsumsi || data.uraianMenu || '1 Box Snack',
      ttStr,
    ];
  });

  autoTable(doc, {
    startY: curY,
    margin: { left: marginX, right: marginX },
    head: [['No', 'Nama Lengkap', 'NIP', isKkgOrMkks ? 'Instansi' : 'Jabatan', 'Uraian Konsumsi', 'Tanda Tangan']],
    body: tableRows,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: [15, 23, 42],
      lineColor: [30, 41, 59],
      lineWidth: 0.25,
      cellPadding: 2.2,
      minCellHeight: 11,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.35,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { halign: 'left', cellWidth: 50, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'left', cellWidth: 32 },
      4: { halign: 'left', cellWidth: 26 },
      5: { halign: 'left', cellWidth: 26, valign: 'top' },
    },
  });

  // Tanda Tangan Ganda: Kiri (Yang Menyerahkan) & Kanan (Mengetahui Kepala Sekolah)
  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : curY + 80;
  const leftColX = marginX + 30;
  const rightColX = pageWidth - marginX - 35;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Kiri: Yang Menyerahkan
  doc.text('Yang Menyerahkan,', leftColX, finalY + 4, { align: 'center' });
  doc.text(data.penyerahJabatan || 'Bendahara BOSP', leftColX, finalY + 8, { align: 'center' });

  const leftSignY = finalY + 28;
  doc.setFont('helvetica', 'bold');
  doc.text(data.penyerahNama || settings.namaBendahara || 'SUHENDRI, S.Pd', leftColX, leftSignY, { align: 'center' });
  const lnw = doc.getTextWidth(data.penyerahNama || settings.namaBendahara || 'SUHENDRI, S.Pd');
  doc.setLineWidth(0.3);
  doc.line(leftColX - lnw / 2, leftSignY + 0.8, leftColX + lnw / 2, leftSignY + 0.8);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${data.penyerahNip || settings.nipBendahara || '198208042022211009'}`, leftColX, leftSignY + 4.5, { align: 'center' });

  // Kanan: Mengetahui
  doc.text(`${settings.desaKelurahan || 'Cibungur'}, ${data.hariTanggal ? data.hariTanggal.split(',').pop()?.trim() || '' : ''}`, rightColX, finalY, { align: 'center' });
  doc.text('Mengetahui,', rightColX, finalY + 4, { align: 'center' });
  doc.text(
    data.mengetahuiJabatan || (isKkgOrMkks ? getKetuaTitleFromKop(data.scope, settings) : 'Kepala Satuan Pendidikan'),
    rightColX,
    finalY + 8,
    { align: 'center' }
  );

  const rightSignY = finalY + 28;
  doc.setFont('helvetica', 'bold');
  doc.text(data.mengetahuiNama || settings.namaKepsek || 'KARNA, S.Pd', rightColX, rightSignY, { align: 'center' });
  const rnw = doc.getTextWidth(data.mengetahuiNama || settings.namaKepsek || 'KARNA, S.Pd');
  doc.line(rightColX - rnw / 2, rightSignY + 0.8, rightColX + rnw / 2, rightSignY + 0.8);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${data.mengetahuiNip || settings.nipKepsek || '197804072008011010'}`, rightColX, rightSignY + 4.5, { align: 'center' });

  return doc;
}
