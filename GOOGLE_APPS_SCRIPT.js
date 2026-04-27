/**
 * ============================================
 * GOOGLE APPS SCRIPT UNTUK STOK OPNAME FARMASI
 * RSUD NENE MALLOMO
 * ============================================
 * 
 * CARA PENGGUNAAN:
 * 1. Buka Google Spreadsheet Anda
 * 2. Klik Extensions > Apps Script
 * 3. Hapus semua kode yang ada, paste kode ini
 * 4. Klik Save (Ctrl+S)
 * 5. Klik Deploy > New Deployment
 * 6. Pilih Type: Web app
 * 7. Execute as: Me
 * 8. Who has access: Anyone
 * 9. Klik Deploy
 * 10. Copy URL yang muncul dan paste ke file src/config.ts
 * 
 * PENTING: Setiap ada perubahan kode, buat NEW DEPLOYMENT baru!
 * (bukan edit deployment lama)
 * 
 * STRUKTUR KOLOM:
 * - Data mulai dari baris 9
 * - B: ID Barang
 * - C: Nama Barang
 * - E: Satuan
 * - F: Harga Satuan
 * - Z-AK: Keluar Gudang (Jan-Des)
 * - BA-FP: Pelayanan per bulan (10 kolom per bulan)
 *   Setiap bulan: RJ(BrgKembali,BonSarana,StokOpname), RI(...), Depo(...), Total
 * - FW-GH: Jumlah Stok di Pelayanan (Jan-Des)
 * - GI: Penanggungjawab
 */

const SPREADSHEET_ID = '159UdTU4A3CSFKTzy34QDEXItCi2w7zmKXQBPoBOaaO0';

// ============================================================
// FUNGSI AUTO-GENERATE ID BARANG (FITUR EXISTING ANDA)
// ============================================================

function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  var sheetName = sheet.getName();

  var prefix = "";

  if (sheetName === "OBAT") {
    prefix = "OBAT_";
  } 
  else if (sheetName === "AMHP") {
    prefix = "AMHP_";
  } 
  else if (sheetName === "BMHP") {
    prefix = "BMHP_";
  } 
  else {
    return; // jika bukan salah satu sheet di atas
  }

  var range = e.range;

  // Trigger saat kolom C diisi mulai baris 9
  if (range.getColumn() == 3 && range.getRow() >= 9) {

    var idCell = sheet.getRange(range.getRow(), 2);

    // Jika ID sudah ada → jangan ubah
    if (idCell.getValue() !== "") return;

    var lastRow = sheet.getLastRow();
    var idRange = sheet.getRange("B9:B" + lastRow).getValues();

    var maxId = 0;

    idRange.forEach(function(row) {
      if (row[0]) {
        var number = parseInt(row[0].replace(prefix,""));
        if (!isNaN(number) && number > maxId) {
          maxId = number;
        }
      }
    });

    var newId = prefix + String(maxId + 1).padStart(7,'0');

    idCell.setValue(newId);
  }
}

// ============================================================
// FUNGSI STOK OPNAME WEB APP
// ============================================================

// Kolom mapping (0-indexed dari kolom A)
const COL = {
  ID_BARANG: 1,         // B (kolom ke-2, index 1)
  NAMA_BARANG: 2,       // C (kolom ke-3, index 2)
  SATUAN: 4,            // E (kolom ke-5, index 4)
  HARGA_SATUAN: 5,      // F (kolom ke-6, index 5)
  PENANGGUNGJAWAB: 190, // GI (kolom ke-191, index 190)
};

// Data mulai dari baris 9
const DATA_START_ROW = 9;

// Keluar Gudang: Z-AK (kolom 26-37 dalam 1-indexed, jadi 25-36 dalam 0-indexed)
const KELUAR_GUDANG_START = 25; // Z = kolom 26 (index 25)

// Pelayanan mulai dari BA (kolom 53 dalam 1-indexed, jadi 52 dalam 0-indexed)
// Setiap bulan 10 kolom:
// - RJ: Barang Kembali (0), Bon Sarana (1), Stok Opname (2)
// - RI: Barang Kembali (3), Bon Sarana (4), Stok Opname (5)
// - Depo: Barang Kembali (6), Bon Sarana (7), Stok Opname (8)
// - Total (9) - ada rumus, tidak diisi manual
const PELAYANAN_START = 52; // BA = kolom 53 (index 52)
const PELAYANAN_COLS_PER_MONTH = 10;

// Offset dalam setiap bulan berdasarkan ruangan
const ROOM_OFFSETS = {
  'RJ': { barangKembali: 0, bonSarana: 1, stokOpname: 2 },
  'RI': { barangKembali: 3, bonSarana: 4, stokOpname: 5 },
  'Depo': { barangKembali: 6, bonSarana: 7, stokOpname: 8 }
};

// Jumlah Stok di Pelayanan: FW-GH (kolom 179-190 dalam 1-indexed, jadi 178-189 dalam 0-indexed)
const STOK_PELAYANAN_START = 178; // FW = kolom 179 (index 178)

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getData') {
      const sheetName = e.parameter.sheet;
      const bulan = parseInt(e.parameter.bulan); // 0-11
      
      if (!sheetName) {
        return createJsonResponse({ error: 'Parameter sheet diperlukan' });
      }
      
      if (isNaN(bulan) || bulan < 0 || bulan > 11) {
        return createJsonResponse({ error: 'Parameter bulan tidak valid (0-11)' });
      }
      
      const result = getData(sheetName, bulan);
      return createJsonResponse(result);
    }
    
    // Default response - bisa digunakan untuk test
    return createJsonResponse({ 
      status: 'OK', 
      message: 'Stok Opname API Ready - RSUD Nene Mallomo',
      usage: 'Add ?action=getData&sheet=OBAT&bulan=0 to test'
    });
    
  } catch (error) {
    return createJsonResponse({ error: error.toString() });
  }
}

function doPost(e) {
  try {
    let data;
    
    // Parse request body
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return createJsonResponse({ error: 'Invalid JSON in request body' });
    }
    
    if (data.action === 'submitStokOpname') {
      const result = submitStokOpname(data.sheet, data.bulan, data.ruangan, data.entries);
      return createJsonResponse(result);
    }

    if (data.action === 'submitBarangKembali') {
      const result = submitBarangKembali(data.sheet, data.bulan, data.ruangan, data.entries);
      return createJsonResponse(result);
    }
    
    return createJsonResponse({ error: 'Invalid action: ' + data.action });
    
  } catch (error) {
    return createJsonResponse({ error: error.toString() });
  }
}

// Helper function untuk response JSON
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getData(sheetName, bulan) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error('Sheet tidak ditemukan: ' + sheetName);
  }
  
  const lastRow = sheet.getLastRow();
  
  // Tidak ada data jika lastRow < DATA_START_ROW
  if (lastRow < DATA_START_ROW) {
    return { items: [], penanggungjawabList: [] };
  }
  
  // Ambil data dari baris DATA_START_ROW sampai lastRow
  // Kita perlu sampai kolom GI (191) minimal
  const numRows = lastRow - DATA_START_ROW + 1;
  const numCols = 195; // Ambil sampai kolom GI + sedikit buffer
  
  const dataRange = sheet.getRange(DATA_START_ROW, 1, numRows, numCols);
  const data = dataRange.getValues();
  
  const items = [];
  const penanggungjawabSet = new Set();
  
  // Hitung kolom untuk bulan yang dipilih
  const keluarGudangCol = KELUAR_GUDANG_START + bulan;
  const pelayananBaseCol = PELAYANAN_START + (bulan * PELAYANAN_COLS_PER_MONTH);
  const stokPelayananCol = STOK_PELAYANAN_START + bulan;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const idBarang = row[COL.ID_BARANG];
    const namaBarang = row[COL.NAMA_BARANG];
    const penanggungjawab = row[COL.PENANGGUNGJAWAB];
    
    // Skip empty rows
    if (!idBarang && !namaBarang) continue;
    
    // Add penanggungjawab to set - extract unique names from comma-separated list
    if (penanggungjawab && penanggungjawab.toString().trim() !== '') {
      const pjString = penanggungjawab.toString().trim();
      // Split by comma and add each name individually
      const names = pjString.split(',').map(n => n.trim()).filter(n => n !== '');
      names.forEach(name => {
        penanggungjawabSet.add(name);
      });
    }
    
    const keluarGudang = parseNumber(row[keluarGudangCol]);
    const stokPelayanan = parseNumber(row[stokPelayananCol]);
    
    // Ambil nilai pelayanan untuk setiap ruangan
    // RJ
    const rjBarangKembali = getCellValue(row[pelayananBaseCol + ROOM_OFFSETS['RJ'].barangKembali]);
    const rjBonSarana = getCellValue(row[pelayananBaseCol + ROOM_OFFSETS['RJ'].bonSarana]);
    const rjStokOpname = getCellValue(row[pelayananBaseCol + ROOM_OFFSETS['RJ'].stokOpname]);
    
    // RI
    const riBarangKembali = getCellValue(row[pelayananBaseCol + ROOM_OFFSETS['RI'].barangKembali]);
    const riBonSarana = getCellValue(row[pelayananBaseCol + ROOM_OFFSETS['RI'].bonSarana]);
    const riStokOpname = getCellValue(row[pelayananBaseCol + ROOM_OFFSETS['RI'].stokOpname]);
    
    // Depo
    const depoBarangKembali = getCellValue(row[pelayananBaseCol + ROOM_OFFSETS['Depo'].barangKembali]);
    const depoBonSarana = getCellValue(row[pelayananBaseCol + ROOM_OFFSETS['Depo'].bonSarana]);
    const depoStokOpname = getCellValue(row[pelayananBaseCol + ROOM_OFFSETS['Depo'].stokOpname]);
    
    items.push({
      row: i + DATA_START_ROW, // Actual row number in spreadsheet
      idBarang: idBarang ? idBarang.toString() : '',
      namaBarang: namaBarang ? namaBarang.toString() : '',
      satuan: row[COL.SATUAN] ? row[COL.SATUAN].toString() : '',
      hargaSatuan: parseNumber(row[COL.HARGA_SATUAN]),
      keluarGudang: keluarGudang,
      stokPelayanan: stokPelayanan,
      penanggungjawab: penanggungjawab ? penanggungjawab.toString().trim() : '',
      // Data pelayanan RJ
      rjBarangKembali: rjBarangKembali,
      rjBonSarana: rjBonSarana,
      rjStokOpname: rjStokOpname,
      // Data pelayanan RI
      riBarangKembali: riBarangKembali,
      riBonSarana: riBonSarana,
      riStokOpname: riStokOpname,
      // Data pelayanan Depo
      depoBarangKembali: depoBarangKembali,
      depoBonSarana: depoBonSarana,
      depoStokOpname: depoStokOpname,
    });
  }
  
  // Sort penanggungjawab list alphabetically
  const penanggungjawabList = Array.from(penanggungjawabSet).sort();
  
  return { 
    items: items, 
    penanggungjawabList: penanggungjawabList,
    debug: {
      sheetName: sheetName,
      bulan: bulan,
      totalRows: items.length,
      totalPJ: penanggungjawabList.length
    }
  };
}

function submitStokOpname(sheetName, bulan, ruangan, entries) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error('Sheet tidak ditemukan: ' + sheetName);
  }
  
  if (!entries || entries.length === 0) {
    return { success: true, message: 'Tidak ada data untuk disimpan' };
  }
  
  // Validate ruangan
  if (!ROOM_OFFSETS[ruangan]) {
    throw new Error('Ruangan tidak valid: ' + ruangan);
  }
  
  // Calculate base column for this month (1-indexed for getRange)
  const pelayananBaseCol = PELAYANAN_START + (bulan * PELAYANAN_COLS_PER_MONTH) + 1;
  
  // Get column offsets for this ruangan
  const offsets = ROOM_OFFSETS[ruangan];
  const colBarangKembali = pelayananBaseCol + offsets.barangKembali;
  const colBonSarana = pelayananBaseCol + offsets.bonSarana;
  const colStokOpname = pelayananBaseCol + offsets.stokOpname;
  
  // Update each entry
  let updatedCount = 0;
  for (const entry of entries) {
    if (entry.row) {
      // Set Barang Kembali
      if (entry.barangKembali !== undefined && entry.barangKembali !== '') {
        sheet.getRange(entry.row, colBarangKembali).setValue(parseNumber(entry.barangKembali));
      }
      
      // Set Bon Sarana
      if (entry.bonSarana !== undefined && entry.bonSarana !== '') {
        sheet.getRange(entry.row, colBonSarana).setValue(parseNumber(entry.bonSarana));
      }
      
      // Set Stok Opname
      if (entry.stokOpname !== undefined && entry.stokOpname !== '') {
        sheet.getRange(entry.row, colStokOpname).setValue(parseNumber(entry.stokOpname));
      }
      
      updatedCount++;
    }
  }
  
  return { 
    success: true, 
    message: 'Berhasil menyimpan ' + updatedCount + ' data',
    updatedCount: updatedCount 
  };
}

// Helper: Get cell value, preserve empty string
function getCellValue(value) {
  if (value === '' || value === null || value === undefined) return '';
  return value;
}

// Helper: Parse number
function parseNumber(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

// ============================================================
// FUNGSI TEST - Jalankan manual di Apps Script Editor
// ============================================================

function testGetData() {
  const result = getData('OBAT', 0); // Test dengan sheet OBAT, bulan Januari (0)
  Logger.log('Total items: ' + result.items.length);
  Logger.log('Total PJ: ' + result.penanggungjawabList.length);
  Logger.log('PJ List: ' + JSON.stringify(result.penanggungjawabList));
  if (result.items.length > 0) {
    Logger.log('Sample item: ' + JSON.stringify(result.items[0]));
  }
}

function testSubmit() {
  const result = submitStokOpname('OBAT', 0, 'RJ', [
    { row: 9, barangKembali: 0, bonSarana: 5, stokOpname: 10 },
    { row: 10, barangKembali: 1, bonSarana: 3, stokOpname: 8 }
  ]);
  Logger.log(JSON.stringify(result));
}

function submitBarangKembali(sheetName, bulan, ruangan, entries) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('Sheet tidak ditemukan: ' + sheetName);
  }

  if (!entries || entries.length === 0) {
    return { success: true, message: 'Tidak ada data barang kembali untuk disimpan' };
  }

  if (!ROOM_OFFSETS[ruangan]) {
    throw new Error('Ruangan tidak valid: ' + ruangan);
  }

  const pelayananBaseCol = PELAYANAN_START + (bulan * PELAYANAN_COLS_PER_MONTH) + 1;
  const offsets = ROOM_OFFSETS[ruangan];
  const colBarangKembali = pelayananBaseCol + offsets.barangKembali;

  let updatedCount = 0;
  for (const entry of entries) {
    if (entry.row) {
      const value = (entry.barangKembali !== undefined && entry.barangKembali !== '')
        ? parseNumber(entry.barangKembali)
        : 0;
      sheet.getRange(entry.row, colBarangKembali).setValue(value);
      updatedCount++;
    }
  }

  // Flush agar formula stok pelayanan langsung terupdate sebelum tahap 2
  SpreadsheetApp.flush();

  return {
    success: true,
    message: 'Berhasil menyimpan ' + updatedCount + ' data barang kembali',
    updatedCount: updatedCount
  };
}
