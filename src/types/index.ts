export interface ItemObat {
  row: number;
  idBarang: string;
  namaBarang: string;
  satuan: string;
  hargaSatuan: number;
  keluarGudang: number;
  stokPelayanan: number;
  penanggungjawab: string;
  // Data pelayanan RJ
  rjBarangKembali: number | string;
  rjBonSarana: number | string;
  rjStokOpname: number | string;
  // Data pelayanan RI
  riBarangKembali: number | string;
  riBonSarana: number | string;
  riStokOpname: number | string;
  // Data pelayanan Depo
  depoBarangKembali: number | string;
  depoBonSarana: number | string;
  depoStokOpname: number | string;
}

export interface StokOpnameEntry {
  row: number;
  idBarang: string;
  namaBarang: string;
  barangKembali: number | string;
  bonSarana: number | string;
  stokOpname: number | string;
  satuan: string;
}

export interface PelayananValues {
  barangKembali: number | string;
  bonSarana: number | string;
  stokOpname: number | string;
}

export interface LocalStorageData {
  nama: string;
  ruangan: string;
  bulan: string;
  sheet: string;
  entries: Record<number, PelayananValues>; // row -> values
  timestamp: number;
}

export type Ruangan = 'RJ' | 'RI' | 'Depo';
export type SheetName = 'OBAT' | 'AMHP' | 'BMHP';

export const BULAN_LIST = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const RUANGAN_LIST: Ruangan[] = ['RJ', 'RI', 'Depo'];
export const SHEET_LIST: SheetName[] = ['OBAT', 'AMHP', 'BMHP'];
