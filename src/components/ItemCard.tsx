import React, { useState, useEffect } from 'react';
import { PelayananValues, Ruangan } from '../types';

interface ItemCardProps {
  namaBarang: string;
  satuan: string;
  stokPelayanan: number;
  currentValues: PelayananValues;
  isComplete: boolean;
  ruangan: Ruangan;
  readOnly?: boolean;
  onValueChange: (field: keyof PelayananValues, value: number | string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  namaBarang,
  satuan,
  stokPelayanan,
  currentValues,
  isComplete,
  readOnly = false,
  onValueChange,
}) => {
  const [inputBarangKembali, setInputBarangKembali] = useState<string>('');
  const [inputBonSarana, setInputBonSarana] = useState<string>('');
  const [inputStokOpname, setInputStokOpname] = useState<string>('');

  // Initialize inputs from current values
  useEffect(() => {
    setInputBarangKembali(currentValues.barangKembali !== '' ? String(currentValues.barangKembali) : '');
    setInputBonSarana(currentValues.bonSarana !== '' ? String(currentValues.bonSarana) : '');
    setInputStokOpname(currentValues.stokOpname !== '' ? String(currentValues.stokOpname) : '');
  }, [currentValues]);

  const handleBlur = (field: keyof PelayananValues, value: string) => {
    if (readOnly) return;
    const numValue = value === '' ? '' : parseFloat(value) || 0;
    onValueChange(field, numValue);
  };

  // Determine card status color
  const getStatusColor = (): string => {
    if (readOnly && isComplete) {
      return 'border-green-500 bg-green-50'; // Sudah dikirim
    }
    if (isComplete) {
      const hasNewValues = inputBarangKembali !== '' || inputBonSarana !== '' || inputStokOpname !== '';
      if (hasNewValues) {
        return 'border-blue-500 bg-blue-50'; // Siap kirim
      }
      return 'border-green-500 bg-green-50'; // Sudah ada di spreadsheet
    }
    const hasAnyValue = inputBarangKembali !== '' || inputBonSarana !== '' || inputStokOpname !== '';
    if (hasAnyValue) {
      return 'border-orange-400 bg-orange-50'; // Sebagian terisi
    }
    return 'border-gray-300 bg-white'; // Belum diisi
  };

  const inputClass = `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors
    ${readOnly
      ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
      : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'}`;

  return (
    <div className={`mb-3 p-4 rounded-lg border-2 ${getStatusColor()} transition-all`}>
      {/* Header: Nama Barang */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 text-base">{namaBarang}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Satuan: {satuan}
          </span>
          <span className="flex items-center gap-1 font-medium text-blue-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Jumlah Stok di Pelayanan: {stokPelayanan}
          </span>
        </div>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 gap-3">
        {/* Barang Kembali */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Barang Kembali
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={inputBarangKembali}
            onChange={(e) => !readOnly && setInputBarangKembali(e.target.value)}
            onBlur={(e) => handleBlur('barangKembali', e.target.value)}
            placeholder="0"
            readOnly={readOnly}
            className={inputClass}
          />
        </div>

        {/* Bon Sarana */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Bon Sarana
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={inputBonSarana}
            onChange={(e) => !readOnly && setInputBonSarana(e.target.value)}
            onBlur={(e) => handleBlur('bonSarana', e.target.value)}
            placeholder="0"
            readOnly={readOnly}
            className={inputClass}
          />
        </div>

        {/* Stok Opname */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Stok Opname
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={inputStokOpname}
            onChange={(e) => !readOnly && setInputStokOpname(e.target.value)}
            onBlur={(e) => handleBlur('stokOpname', e.target.value)}
            placeholder="0"
            readOnly={readOnly}
            className={inputClass}
          />
        </div>
      </div>

      {/* Status Badge */}
      {isComplete && (
        <div className="mt-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-medium text-green-700">
            {readOnly ? 'Sudah dikirim' : 'Lengkap'}
          </span>
        </div>
      )}
    </div>
  );
};
