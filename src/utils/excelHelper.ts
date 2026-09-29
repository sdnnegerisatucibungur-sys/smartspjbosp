import * as XLSX from 'xlsx';
import { BkuItem, RkasItem, TaxRecord } from '../types';
import { parseIndonesianNumber } from './formatters';
import { isTarikTunaiRow, isSaldoAwalRow } from './monthHelper';

export function parseRkasExcel(fileData: ArrayBuffer): RkasItem[] {
  const data = new Uint8Array(fileData);
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const parsedData: RkasItem[] = [];
  let headerRowIdx = -1;

  for (let i = 0; i < json.length; i++) {
    const rowStr = (json[i] || []).join(' ').toLowerCase();
    if (
      rowStr.includes('uraian') ||
      (rowStr.includes('rekening') && rowStr.includes('jumlah')) ||
      (rowStr.includes('satuan') && rowStr.includes('tarif'))
    ) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    // Fallback: search for first row containing 'uraian' or 'kegiatan'
    for (let i = 0; i < json.length; i++) {
      const rowStr = (json[i] || []).join(' ').toLowerCase();
      if (rowStr.includes('uraian') || rowStr.includes('kegiatan')) {
        headerRowIdx = i;
        break;
      }
    }
  }

  let colNo = 0;
  let colRek = 1;
  let colProg = 2;
  let colUraian = 3;
  let colVol = 4;
  let colSatuan = 5;
  let colTarif = 6;
  let colJumlah = 7;
  let colTw1 = 8;
  let colTw2 = 9;
  let colTw3 = 10;
  let colTw4 = 11;

  let startRow = 0;

  if (headerRowIdx !== -1) {
    const headerRow = json[headerRowIdx] || [];
    headerRow.forEach((cell, idx) => {
      const str = String(cell || '').toLowerCase().trim();
      if (/^no(\.|\b)|nomor\s*urut/i.test(str)) colNo = idx;
      else if (/kode\s*rek|rekening/i.test(str)) colRek = idx;
      else if (/kode\s*prog|program/i.test(str)) colProg = idx;
      else if (/uraian|kegiatan|nama\s*barang/i.test(str)) colUraian = idx;
      else if (/^vol|volume|kuantitas/i.test(str)) colVol = idx;
      else if (/satuan/i.test(str)) colSatuan = idx;
      else if (/tarif|harga/i.test(str)) colTarif = idx;
      else if (/jumlah|total/i.test(str)) colJumlah = idx;
      else if (/tw\s*1|tw\s*i\b|triwulan\s*1|triwulan\s*i\b/i.test(str)) colTw1 = idx;
      else if (/tw\s*2|tw\s*ii\b|triwulan\s*2|triwulan\s*ii\b/i.test(str)) colTw2 = idx;
      else if (/tw\s*3|tw\s*iii\b|triwulan\s*3|triwulan\s*iii\b/i.test(str)) colTw3 = idx;
      else if (/tw\s*4|tw\s*iv\b|triwulan\s*4|triwulan\s*iv\b/i.test(str)) colTw4 = idx;
    });

    startRow = headerRowIdx + 1;
    // Skip numbering guide row if present (e.g. 1 2 3 4 5...)
    if (startRow < json.length && String(json[startRow][colNo] || json[startRow][0]).trim() === '1') {
      const isGuideRow = (json[startRow] || []).filter((c) => String(c).trim() === '1' || String(c).trim() === '2').length >= 2;
      if (isGuideRow) {
        startRow++;
      }
    }
  }

  for (let i = startRow; i < json.length; i++) {
    const row = json[i];
    if (!row || row.length === 0) continue;

    const no = row[colNo] !== undefined ? String(row[colNo]).trim() : '';
    const kodeRek = row[colRek] !== undefined ? String(row[colRek]).replace(/[\r\n\t\s]+/g, '').trim() : '';
    const kodeProg = row[colProg] !== undefined ? String(row[colProg]).replace(/[\r\n\t\s]+/g, '').trim() : '';
    const uraian = row[colUraian] !== undefined ? String(row[colUraian]).replace(/[\r\n\t]+/g, ' ').trim() : '';

    if (!uraian && !kodeRek && !kodeProg) continue;

    const vol = row[colVol] !== undefined ? String(row[colVol]).trim() : '';
    const satuan = row[colSatuan] !== undefined ? String(row[colSatuan]).trim() : '';
    const tarif = row[colTarif] !== undefined ? parseIndonesianNumber(row[colTarif]) : 0;
    const jumlah = row[colJumlah] !== undefined ? parseIndonesianNumber(row[colJumlah]) : 0;
    const tw1 = row[colTw1] !== undefined ? parseIndonesianNumber(row[colTw1]) : 0;
    const tw2 = row[colTw2] !== undefined ? parseIndonesianNumber(row[colTw2]) : 0;
    const tw3 = row[colTw3] !== undefined ? parseIndonesianNumber(row[colTw3]) : 0;
    const tw4 = row[colTw4] !== undefined ? parseIndonesianNumber(row[colTw4]) : 0;

    const isHeader = (!kodeRek || kodeRek === '-') && (!!kodeProg || !vol || (jumlah > 0 && tarif === 0));

    parsedData.push({
      id: `rkas-${i}-${Date.now()}`,
      no: no || String(parsedData.length + 1),
      kodeRek,
      kodeProg,
      uraian,
      vol,
      satuan,
      tarif,
      jumlah: jumlah || (parseFloat(vol) || 1) * tarif,
      tw1,
      tw2,
      tw3,
      tw4,
      isHeader,
    });
  }

  return parsedData;
}

export function parseBkuExcel(fileData: ArrayBuffer): BkuItem[] {
  const data = new Uint8Array(fileData);
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const parsedData: BkuItem[] = [];
  let headerRowIdx = -1;

  for (let i = 0; i < json.length; i++) {
    const rowStr = (json[i] || []).join(' ').toLowerCase();
    if (
      rowStr.includes('tanggal') ||
      rowStr.includes('tgl') ||
      (rowStr.includes('uraian') && (rowStr.includes('bukti') || rowStr.includes('pengeluaran') || rowStr.includes('penerimaan')))
    ) {
      headerRowIdx = i;
      break;
    }
  }

  let colTgl = 0;
  let colKodeKeg = 1;
  let colKodeRek = 2;
  let colNoBukti = 3;
  let colUraian = 4;
  let colTerima = 5;
  let colKeluar = 6;
  let colSaldo = 7;

  let startRow = 0;

  if (headerRowIdx !== -1) {
    const headerRow = json[headerRowIdx] || [];
    let detectedTgl = -1;
    let detectedUraian = -1;

    headerRow.forEach((cell, idx) => {
      const str = String(cell || '').toLowerCase().trim();
      if (/tgl|tanggal/i.test(str)) {
        colTgl = idx;
        detectedTgl = idx;
      } else if (/kegiatan|kode\s*keg|kode\s*prog|program|^kd\s*keg/i.test(str)) {
        colKodeKeg = idx;
      } else if (/rekening|kode\s*rek|^kd\s*rek/i.test(str)) {
        colKodeRek = idx;
      } else if (/^no\.?\s*kode|^kode$/i.test(str)) {
        if (colKodeKeg === 1) colKodeKeg = idx;
        else colKodeRek = idx;
      } else if (/bukti|bpu|no\.?\s*bukti/i.test(str)) {
        colNoBukti = idx;
      } else if (/uraian|keterangan|transaksi/i.test(str)) {
        colUraian = idx;
        detectedUraian = idx;
      } else if (/terima|penerimaan|debet|debit/i.test(str)) {
        colTerima = idx;
      } else if (/keluar|pengeluaran|kredit/i.test(str)) {
        colKeluar = idx;
      } else if (/saldo/i.test(str)) {
        colSaldo = idx;
      }
    });

    startRow = headerRowIdx + 1;
    // Check if next row is a column index guide (1 2 3 4 5 6 7 8)
    if (startRow < json.length) {
      const isGuideRow = (json[startRow] || []).filter((c) => String(c).trim() === '1' || String(c).trim() === '2').length >= 2;
      if (isGuideRow) {
        startRow++;
      }
    }
  }

  let runningSaldo = 0;

  for (let i = startRow; i < json.length; i++) {
    const row = json[i];
    if (!row || row.length === 0) continue;

    let rawTgl = row[colTgl] !== undefined ? String(row[colTgl]).trim() : '';
    let tgl = rawTgl;

    // Format excel date serial if numeric (e.g. 45398)
    if (!isNaN(Number(rawTgl)) && Number(rawTgl) > 30000 && Number(rawTgl) < 60000) {
      const dateObj = new Date(Math.round((Number(rawTgl) - 25569) * 86400 * 1000));
      tgl = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;
    } else if (rawTgl.includes('/')) {
      // Convert DD/MM/YYYY or YYYY/MM/DD to DD-MM-YYYY
      const parts = rawTgl.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          tgl = `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
        } else {
          tgl = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
        }
      }
    }

    const kodeKeg = row[colKodeKeg] !== undefined ? String(row[colKodeKeg]).replace(/[\r\n\t\s]+/g, '').trim() : '';
    const kodeRek = row[colKodeRek] !== undefined ? String(row[colKodeRek]).replace(/[\r\n\t\s]+/g, '').trim() : '';
    const noBukti = row[colNoBukti] !== undefined ? String(row[colNoBukti]).replace(/[\r\n\t]+/g, ' ').trim() : '';
    const uraian = row[colUraian] !== undefined ? String(row[colUraian]).replace(/[\r\n\t]+/g, ' ').trim() : '';
    const terima = row[colTerima] !== undefined ? parseIndonesianNumber(row[colTerima]) : 0;
    const keluar = row[colKeluar] !== undefined ? parseIndonesianNumber(row[colKeluar]) : 0;
    const rawSaldoCell = row[colSaldo];
    const hasSaldoInExcel =
      rawSaldoCell !== undefined &&
      rawSaldoCell !== null &&
      String(rawSaldoCell).trim() !== '' &&
      String(rawSaldoCell).trim() !== '-';
    let saldo = hasSaldoInExcel ? parseIndonesianNumber(rawSaldoCell) : 0;

    if (!tgl && !uraian && !terima && !keluar && !kodeRek && !noBukti) continue;

    const isAwal = isSaldoAwalRow({ uraian, noBukti });
    const isTarik = isTarikTunaiRow({ uraian, noBukti });

    if (!hasSaldoInExcel) {
      if (isAwal) {
        runningSaldo = runningSaldo + terima;
        saldo = runningSaldo;
      } else if (isTarik) {
        saldo = runningSaldo;
      } else {
        runningSaldo = runningSaldo + terima - keluar;
        saldo = runningSaldo;
      }
    } else {
      runningSaldo = saldo;
    }

    parsedData.push({
      id: `bku-${i}-${Date.now()}`,
      tgl: tgl || '01-01-2026',
      kodeKeg,
      kodeRek,
      noBukti: noBukti || (keluar > 0 ? `BPU-${String(parsedData.length + 1).padStart(3, '0')}` : '-'),
      uraian: uraian || '-',
      terima,
      keluar,
      saldo,
    });
  }

  return parsedData;
}

export function exportRkasToExcel(rkasList: RkasItem[], schoolName: string): void {
  const wsData: (string | number)[][] = [
    [`KERTAS KERJA RKAS BOSP - ${schoolName.toUpperCase()}`],
    ['TAHUN ANGGARAN 2026'],
    [''],
    ['No', 'Kode Rekening', 'Kode Program', 'Uraian', 'Volume', 'Satuan', 'Tarif', 'Jumlah', 'Triwulan 1', 'Triwulan 2', 'Triwulan 3', 'Triwulan 4'],
  ];

  rkasList.forEach((item) => {
    wsData.push([
      item.no,
      item.kodeRek,
      item.kodeProg,
      item.uraian,
      String(item.vol || ''),
      item.satuan || '',
      item.tarif,
      item.jumlah,
      item.tw1,
      item.tw2,
      item.tw3,
      item.tw4,
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'RKAS');
  XLSX.writeFile(wb, `RKAS_BOSP_${schoolName.replace(/\s+/g, '_')}_2026.xlsx`);
}

export function exportBkuToExcel(bkuList: BkuItem[], schoolName: string): void {
  const wsData: (string | number)[][] = [
    [`BUKU KAS UMUM (BKU) - ${schoolName.toUpperCase()}`],
    ['SUMBER DANA BOSP REGULER TAHUN 2026'],
    [''],
    ['Tanggal', 'Kode Kegiatan', 'Kode Rekening', 'No. Bukti', 'Uraian Transaksi', 'Penerimaan', 'Pengeluaran', 'Saldo'],
  ];

  bkuList.forEach((item) => {
    wsData.push([
      item.tgl,
      item.kodeKeg,
      item.kodeRek,
      item.noBukti,
      item.uraian,
      item.terima,
      item.keluar,
      item.saldo,
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'BKU');
  XLSX.writeFile(wb, `BKU_BOSP_${schoolName.replace(/\s+/g, '_')}.xlsx`);
}

export function exportPajakToExcel(taxes: TaxRecord[], schoolName: string): void {
  const wsData: (string | number)[][] = [
    [`BUKU PEMBANTU PAJAK BOSP - ${schoolName.toUpperCase()}`],
    ['TAHUN ANGGARAN 2026'],
    [''],
    ['No', 'Tanggal', 'No. Bukti', 'Uraian', 'Jenis Pajak', 'DPP / Nilai Transaksi', 'Tarif (%)', 'Nominal Pajak', 'Kode Billing', 'NTPN', 'Status Setor', 'Tgl Setor'],
  ];

  taxes.forEach((t, i) => {
    wsData.push([
      i + 1,
      t.tgl,
      t.noBukti,
      t.uraian,
      t.jenisPajak,
      t.dpp,
      t.tarifPersen,
      t.nominalPajak,
      t.kodeBilling || '-',
      t.ntpn || '-',
      t.statusSetor,
      t.tglSetor || '-',
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Pajak BOSP');
  XLSX.writeFile(wb, `Buku_Pajak_BOSP_${schoolName.replace(/\s+/g, '_')}.xlsx`);
}

export function exportRekapPajakLampiran4ToExcel(
  items: any[],
  schoolName: string,
  months: string[] = ['April', 'Mei', 'Juni'],
  summaryAdj?: any
): void {
  const m1 = months[0];
  const m2 = months[1];
  const m3 = months[2];

  const wsData: (string | number)[][] = [
    ['REKAPITULASI', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Lampiran 4'],
    ['PEMBAYARAN PAJAK TAHUN 2026'],
    ['SEKOLAH DASAR KAB. LEBAK'],
    [''],
    [
      'No.',
      'NPSN',
      'NAMA SEKOLAH',
      'KECAMATAN',
      'URAIAN BELANJA',
      'SUMBER DANA',
      'JUMLAH BELANJA',
      'PPN',
      '',
      '',
      'PPH 21',
      '',
      '',
      'PPH 23',
      '',
      '',
      'PAJAK DAERAH (SSPD)',
      '',
      '',
      'TANGGAL BELANJA',
      'TANGGAL SETOR PAJAK',
      'NO. NTPN',
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      m1,
      m2,
      m3,
      m1,
      m2,
      m3,
      m1,
      m2,
      m3,
      m1,
      m2,
      m3,
      '',
      '',
      '',
    ],
  ];

  items.forEach((item, idx) => {
    wsData.push([
      item.no || idx + 1,
      item.npsn || '',
      item.namaSekolah || '',
      item.kecamatan || '',
      item.uraianBelanja || '',
      item.sumberDana || 'BOSP REGULER',
      item.jumlahBelanja || 0,
      item.ppn[m1] || '',
      item.ppn[m2] || '',
      item.ppn[m3] || '',
      item.pph21[m1] || '',
      item.pph21[m2] || '',
      item.pph21[m3] || '',
      item.pph23[m1] || '',
      item.pph23[m2] || '',
      item.pph23[m3] || '',
      item.pajakDaerah[m1] || '',
      item.pajakDaerah[m2] || '',
      item.pajakDaerah[m3] || '',
      item.tanggalBelanja || '',
      item.tanggalSetorPajak || '',
      item.noNtpn || '',
    ]);
  });

  // Hitung total
  const totPpn1 = items.reduce((acc, it) => acc + (it.ppn[m1] || 0), 0) + (summaryAdj?.ppn[m1] || 0);
  const totPpn2 = items.reduce((acc, it) => acc + (it.ppn[m2] || 0), 0) + (summaryAdj?.ppn[m2] || 0);
  const totPpn3 = items.reduce((acc, it) => acc + (it.ppn[m3] || 0), 0) + (summaryAdj?.ppn[m3] || 0);

  const totPph21_1 = items.reduce((acc, it) => acc + (it.pph21[m1] || 0), 0) + (summaryAdj?.pph21[m1] || 0);
  const totPph21_2 = items.reduce((acc, it) => acc + (it.pph21[m2] || 0), 0) + (summaryAdj?.pph21[m2] || 0);
  const totPph21_3 = items.reduce((acc, it) => acc + (it.pph21[m3] || 0), 0) + (summaryAdj?.pph21[m3] || 0);

  const totPph23_1 = items.reduce((acc, it) => acc + (it.pph23[m1] || 0), 0) + (summaryAdj?.pph23[m1] || 0);
  const totPph23_2 = items.reduce((acc, it) => acc + (it.pph23[m2] || 0), 0) + (summaryAdj?.pph23[m2] || 0);
  const totPph23_3 = items.reduce((acc, it) => acc + (it.pph23[m3] || 0), 0) + (summaryAdj?.pph23[m3] || 0);

  const totPd1 = items.reduce((acc, it) => acc + (it.pajakDaerah[m1] || 0), 0) + (summaryAdj?.pajakDaerah[m1] || 0);
  const totPd2 = items.reduce((acc, it) => acc + (it.pajakDaerah[m2] || 0), 0) + (summaryAdj?.pajakDaerah[m2] || 0);
  const totPd3 = items.reduce((acc, it) => acc + (it.pajakDaerah[m3] || 0), 0) + (summaryAdj?.pajakDaerah[m3] || 0);

  wsData.push([
    'JUMLAH',
    '',
    '',
    '',
    '',
    '',
    '',
    totPpn1 || '-',
    totPpn2 || '-',
    totPpn3 || '-',
    totPph21_1 || '-',
    totPph21_2 || '-',
    totPph21_3 || '-',
    totPph23_1 || '-',
    totPph23_2 || '-',
    totPph23_3 || '-',
    totPd1 || '-',
    totPd2 || '-',
    totPd3 || '-',
    '',
    '',
    '',
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merges
  ws['!merges'] = [
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // No
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // NPSN
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // Nama Sekolah
    { s: { r: 4, c: 3 }, e: { r: 5, c: 3 } }, // Kecamatan
    { s: { r: 4, c: 4 }, e: { r: 5, c: 4 } }, // Uraian Belanja
    { s: { r: 4, c: 5 }, e: { r: 5, c: 5 } }, // Sumber Dana
    { s: { r: 4, c: 6 }, e: { r: 5, c: 6 } }, // Jumlah Belanja
    { s: { r: 4, c: 7 }, e: { r: 4, c: 9 } }, // PPN (3 kol)
    { s: { r: 4, c: 10 }, e: { r: 4, c: 12 } }, // PPH 21 (3 kol)
    { s: { r: 4, c: 13 }, e: { r: 4, c: 15 } }, // PPH 23 (3 kol)
    { s: { r: 4, c: 16 }, e: { r: 4, c: 18 } }, // SSPD (3 kol)
    { s: { r: 4, c: 19 }, e: { r: 5, c: 19 } }, // Tgl Belanja
    { s: { r: 4, c: 20 }, e: { r: 5, c: 20 } }, // Tgl Setor
    { s: { r: 4, c: 21 }, e: { r: 5, c: 21 } }, // NTPN
    { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 6 } }, // JUMLAH
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Lampiran 4 Rekap Pajak');
  XLSX.writeFile(wb, `REKAP_PAJAK_LAMPIRAN_4_${schoolName.replace(/\s+/g, '_')}_2026.xlsx`);
}

