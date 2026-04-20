# Aplikasi Stok Opname Farmasi
## RSUD Nene Mallomo

Aplikasi web mobile-friendly untuk melakukan stok opname bulanan obat di farmasi rumah sakit.

## Fitur

✅ Pilih Jenis Barang (OBAT, AMHP, BMHP)  
✅ Pilih Nama Penanggungjawab dari dropdown (nama unik dari kolom PJ)  
✅ Pilih Ruangan (RJ, RI, Depo)  
✅ Pilih Bulan stok opname  
✅ List obat tersortir berdasarkan penanggungjawab & (keluar gudang ≠ 0 ATAU stok pelayanan > 0)  
✅ **3 Input per item**: Barang Kembali, Bon Sarana, Stok Opname  
✅ Data tersimpan lokal (tidak hilang jika browser ditutup - 24 jam)  
✅ Progress tracking (sudah/belum distok opname)  
✅ Validasi sebelum submit  
✅ Kirim data ke Google Spreadsheet  

## Struktur Kolom Spreadsheet (Baru)

| Kolom | Keterangan |
|-------|------------|
| B | ID Barang |
| C | Nama Barang |
| E | Satuan |
| F | Harga Satuan |
| Z-AK | Keluar dari gudang (Jan-Des) |
| **BA-BJ** | **Pelayanan Januari** (10 kolom per bulan) |
| | RJ: Barang Kembali (BA), Bon Sarana (BB), Stok Opname (BC) |
| | RI: Barang Kembali (BD), Bon Sarana (BE), Stok Opname (BF) |
| | Depo: Barang Kembali (BG), Bon Sarana (BH), Stok Opname (BI) |
| | Total (BJ) - Ada rumus, tidak perlu diisi |
| BK-BT | Pelayanan Februari (pola sama) |
| ... | ... |
| FG-FP | Pelayanan Desember |
| FW-GH | Jumlah Stok di Pelayanan (Jan-Des) |
| GI | Penanggungjawab Barang |

**Catatan:** Data mulai dari **baris 9**

## Cara Setup

### 1. Setup Google Apps Script

1. Buka Google Spreadsheet Anda
2. Klik **Extensions** > **Apps Script**
3. Hapus semua kode yang ada
4. Copy-paste seluruh isi file `GOOGLE_APPS_SCRIPT.js` 
5. Klik **Save** (Ctrl+S)
6. Klik **Deploy** > **New Deployment**
7. Klik ⚙️ (gear icon) di sebelah "Select type" > pilih **Web app**
8. Isi konfigurasi:
   - Description: Stok Opname API
   - Execute as: **Me**
   - Who has access: **Anyone**
9. Klik **Deploy**
10. Klik **Authorize access** dan ikuti prosesnya
11. **Copy URL** yang muncul (format: `https://script.google.com/macros/s/xxxxx/exec`)

### Fungsi dalam Script:
| Fungsi | Keterangan |
|--------|------------|
| `onEdit(e)` | Auto-generate ID Barang saat kolom C (Nama Barang) diisi (trigger baris 9+) |
| `doGet(e)` | API untuk mengambil data dari spreadsheet |
| `doPost(e)` | API untuk menyimpan data stok opname ke spreadsheet |

### 2. Konfigurasi Aplikasi

URL Apps Script sudah dikonfigurasi di `src/config.ts`.

Jika URL berubah (setelah New Deployment), update file tersebut.

## Penggunaan

1. Buka aplikasi di browser Android
2. Pilih **Jenis Barang** (OBAT/AMHP/BMHP)
3. Pilih **Bulan** yang akan distok opname
4. Pilih **Nama** Anda dari dropdown
5. Pilih **Ruangan** tempat Anda stok opname
6. Klik **Lihat Daftar Barang**
7. Isi 3 nilai untuk setiap barang:
   - **Barang Kembali**
   - **Bon Sarana**
   - **Stok Opname**
8. Klik **Kirim Stok Opname** setelah semua terisi

## Status Warna

| Warna | Status |
|-------|--------|
| 🟢 Hijau | Sudah lengkap (3 field terisi di spreadsheet) |
| 🔵 Biru | Siap dikirim (semua field sudah diisi) |
| 🟠 Orange | Belum lengkap (beberapa field sudah diisi) |
| 🟡 Kuning | Belum diisi |

## Catatan Penting

- Data yang sudah diinput akan tersimpan di browser (localStorage) selama 24 jam
- Barang dengan field hijau ✓ berarti sudah ada nilainya di spreadsheet
- Tombol "Kirim" tidak akan aktif jika masih ada barang yang belum lengkap
- PJ berserikat (misal "Amiruddin, Sakti, Suwarno") akan muncul di dropdown sebagai nama individual

## Troubleshooting

### Error "Failed to fetch"
- Pastikan URL Apps Script sudah benar dan terbaru
- Pastikan Apps Script sudah di-deploy dengan akses "Anyone"
- Buat **New Deployment** (bukan edit deployment lama)
- Clear cache browser dan coba lagi

### Data tidak masuk ke spreadsheet
- Pastikan Apps Script punya izin edit spreadsheet
- Coba deploy ulang Apps Script dengan "New Deployment"
- Cek Console browser untuk error detail

### Nama PJ tidak muncul
- Pastikan kolom GI (Penanggungjawab) terisi
- Pastikan ada barang dengan keluar gudang ≠ 0 atau stok pelayanan > 0
