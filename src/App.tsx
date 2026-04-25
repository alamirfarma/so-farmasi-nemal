import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { SelectDropdown } from './components/SelectDropdown';
import { ItemCard } from './components/ItemCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Toast } from './components/Toast';
import { SubmitButton } from './components/SubmitButton';
import { StatsCard } from './components/StatsCard';
import { useLocalStorage } from './hooks/useLocalStorage';
import { fetchData, submitStokOpname } from './services/api';
import { ItemObat, PelayananValues, BULAN_LIST, RUANGAN_LIST, SHEET_LIST, SheetName, Ruangan } from './types';

export default function App() {
  // Selection states
  const [sheet, setSheet] = useState<string>('');
  const [nama, setNama] = useState<string>('');
  const [ruangan, setRuangan] = useState<string>('');
  const [bulan, setBulan] = useState<string>('');

  // Data states
  const [allItems, setAllItems] = useState<ItemObat[]>([]);
  const [penanggungjawabList, setPenanggungjawabList] = useState<string[]>([]);
  const [entries, setEntries] = useState<Record<number, PelayananValues>>({});

  // UI states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showForm, setShowForm] = useState(true);

  // Local storage
  const { data: savedData, saveData, clearData } = useLocalStorage();

  // Restore saved session
  useEffect(() => {
    if (savedData) {
      setSheet(savedData.sheet);
      setNama(savedData.nama);
      setRuangan(savedData.ruangan);
      setBulan(savedData.bulan);
      setEntries(savedData.entries);
    }
  }, [savedData]);

  // Helper function to get existing values from spreadsheet based on ruangan
  const getExistingValues = useCallback((item: ItemObat, room: string): PelayananValues => {
    switch (room) {
      case 'RJ':
        return {
          barangKembali: item.rjBarangKembali,
          bonSarana: item.rjBonSarana,
          stokOpname: item.rjStokOpname,
        };
      case 'RI':
        return {
          barangKembali: item.riBarangKembali,
          bonSarana: item.riBonSarana,
          stokOpname: item.riStokOpname,
        };
      case 'Depo':
        return {
          barangKembali: item.depoBarangKembali,
          bonSarana: item.depoBonSarana,
          stokOpname: item.depoStokOpname,
        };
      default:
        return { barangKembali: '', bonSarana: '', stokOpname: '' };
    }
  }, []);

  // Check if all 3 fields are filled (either from existing or from entries)
  const isItemComplete = useCallback((item: ItemObat, room: string, currentEntries: Record<number, PelayananValues>): boolean => {
    const existing = getExistingValues(item, room);
    const entry = currentEntries[item.row];

    const barangKembali = entry?.barangKembali !== undefined && entry.barangKembali !== '' 
      ? entry.barangKembali 
      : existing.barangKembali;
    const bonSarana = entry?.bonSarana !== undefined && entry.bonSarana !== '' 
      ? entry.bonSarana 
      : existing.bonSarana;
    const stokOpname = entry?.stokOpname !== undefined && entry.stokOpname !== '' 
      ? entry.stokOpname 
      : existing.stokOpname;

    return barangKembali !== '' && bonSarana !== '' && stokOpname !== '';
  }, [getExistingValues]);

  // Filter items based on penanggungjawab (includes) and (keluar gudang != 0 OR stok pelayanan > 0)
  const filteredItems = useMemo(() => {
    if (!nama) return [];
    return allItems.filter(item => {
      const pjLower = item.penanggungjawab.toLowerCase();
      const namaLower = nama.toLowerCase();
      const isPJMatch = pjLower.includes(namaLower);
      const hasStock = item.keluarGudang !== 0 || item.stokPelayanan > 0;
      return isPJMatch && hasStock;
    });
  }, [allItems, nama]);

  // Group items by nama barang and accumulate stok pelayanan
  const groupedItems = useMemo(() => {
    const groups = new Map<string, {
      namaBarang: string;
      satuan: string;
      totalStokPelayanan: number;
      items: ItemObat[];
    }>();

    filteredItems.forEach(item => {
      const existing = groups.get(item.namaBarang);
      if (existing) {
        existing.totalStokPelayanan += item.stokPelayanan;
        existing.items.push(item);
      } else {
        groups.set(item.namaBarang, {
          namaBarang: item.namaBarang,
          satuan: item.satuan,
          totalStokPelayanan: item.stokPelayanan,
          items: [item],
        });
      }
    });

    return Array.from(groups.values());
  }, [filteredItems]);

  // Calculate stats based on grouped items
  const stats = useMemo(() => {
    const total = groupedItems.length;
    const filled = groupedItems.filter(group => {
      return group.items.every(item => isItemComplete(item, ruangan, entries));
    }).length;
    
    return {
      total,
      filled,
      pending: total - filled,
    };
  }, [groupedItems, entries, ruangan, isItemComplete]);

  // Load data when sheet and bulan change
  const loadData = useCallback(async () => {
    if (!sheet || !bulan) return;

    setLoading(true);
    try {
      const bulanIndex = BULAN_LIST.indexOf(bulan);
      const data = await fetchData(sheet as SheetName, bulanIndex);
      
      setAllItems(data.items);
      setPenanggungjawabList(data.penanggungjawabList);
    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : 'Gagal memuat data', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [sheet, bulan]);

  useEffect(() => {
    if (sheet && bulan) {
      loadData();
    }
  }, [sheet, bulan, loadData]);

  // Handle value change - nilai bebas tanpa batasan stok
  const handleValueChange = useCallback((namaBarang: string, field: keyof PelayananValues, value: number | string) => {
    setEntries(prev => {
      const group = groupedItems.find(g => g.namaBarang === namaBarang);
      if (!group) return prev;

      const newEntries = { ...prev };
      const firstItem = group.items[0];

      // Simpan ke item pertama
      const existing = newEntries[firstItem.row] || { barangKembali: '', bonSarana: '', stokOpname: '' };
      newEntries[firstItem.row] = { ...existing, [field]: value };

      // Item lain (duplikat nama) set ke 0
      group.items.slice(1).forEach(item => {
        const existingOther = newEntries[item.row] || { barangKembali: '', bonSarana: '', stokOpname: '' };
        newEntries[item.row] = { ...existingOther, [field]: 0 };
      });

      // Save to local storage
      if (nama && ruangan && bulan && sheet) {
        saveData({ nama, ruangan, bulan, sheet, entries: newEntries });
      }
      return newEntries;
    });
  }, [nama, ruangan, bulan, sheet, saveData, groupedItems]);

  // Handle form submit to show items
  const handleStartStokOpname = () => {
    if (!sheet || !nama || !ruangan || !bulan) {
      setToast({ message: 'Mohon lengkapi semua pilihan', type: 'warning' });
      return;
    }
    setSubmitted(false);
    setShowForm(false);
  };

  // Handle confirm dialog open
  const handleConfirmOpen = () => {
    // Check for incomplete groups
    const incompleteGroups = groupedItems.filter(group => {
      return !group.items.every(item => isItemComplete(item, ruangan, entries));
    });

    if (incompleteGroups.length > 0) {
      setToast({
        message: `Masih ada barang "${incompleteGroups[0].namaBarang}" yang belum distok opname`,
        type: 'warning',
      });
      return;
    }

    const entriesToSubmit = filteredItems.filter(item => entries[item.row]);
    if (entriesToSubmit.length === 0) {
      setToast({ message: 'Semua barang sudah distok opname sebelumnya', type: 'success' });
      return;
    }

    setShowConfirm(true);
  };

  // Handle actual submit after confirmation
  const handleSubmit = async () => {
    setShowConfirm(false);

    const entriesToSubmit = filteredItems
      .filter(item => entries[item.row])
      .map(item => {
        const entry = entries[item.row];
        return {
          row: item.row,
          barangKembali: entry.barangKembali,
          bonSarana: entry.bonSarana,
          stokOpname: entry.stokOpname,
        };
      });

    setSubmitting(true);
    try {
      const bulanIndex = BULAN_LIST.indexOf(bulan);
      
      await submitStokOpname({
        sheet: sheet as SheetName,
        bulan: bulanIndex,
        ruangan,
        entries: entriesToSubmit,
      });
      
      setToast({ message: 'Stok opname berhasil dikirim!', type: 'success' });
      setSubmitted(true);
      clearData();
      
      // Reload data tapi jangan reset entries agar nilai tetap tampil
      await loadData();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Gagal mengirim data',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reset to form
  const handleBack = () => {
    setShowForm(true);
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        title="Stok Opname Farmasi" 
        subtitle={showForm ? "RSUD Nene Mallomo" : `${nama} • ${ruangan === 'RJ' ? 'Rawat Jalan' : ruangan === 'RI' ? 'Rawat Inap' : 'Depo'} • ${bulan}`}
      />

      <main className="max-w-lg mx-auto px-4 py-4 pb-32">
        {showForm ? (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Form Stok Opname
            </h2>

            <SelectDropdown
              label="Jenis Barang"
              value={sheet}
              onChange={setSheet}
              options={SHEET_LIST.map(s => ({ value: s, label: s }))}
              placeholder="Pilih jenis barang..."
            />

            <SelectDropdown
              label="Bulan"
              value={bulan}
              onChange={setBulan}
              options={BULAN_LIST.map((b) => ({ value: b, label: b }))}
              placeholder="Pilih bulan..."
            />

            {loading && <LoadingSpinner message="Memuat data..." />}

            {!loading && penanggungjawabList.length > 0 && (
              <>
                <SelectDropdown
                  label="Nama Penanggungjawab"
                  value={nama}
                  onChange={setNama}
                  options={penanggungjawabList.map(n => ({ value: n, label: n }))}
                  placeholder="Pilih nama Anda..."
                />

                <SelectDropdown
                  label="Ruangan"
                  value={ruangan}
                  onChange={setRuangan}
                  options={RUANGAN_LIST.map(r => ({ value: r, label: r === 'RJ' ? 'Rawat Jalan (RJ)' : r === 'RI' ? 'Rawat Inap (RI)' : 'Depo' }))}
                  placeholder="Pilih ruangan..."
                />
              </>
            )}

            <button
              onClick={handleStartStokOpname}
              disabled={!sheet || !nama || !ruangan || !bulan || loading}
              className={`w-full mt-4 py-3 px-4 rounded-lg font-semibold text-white transition-all
                ${!sheet || !nama || !ruangan || !bulan || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
            >
              Lihat Daftar Barang
            </button>
          </div>
        ) : (
          <>
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-blue-600 mb-4 hover:text-blue-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali ke halaman sebelumnya
            </button>

            {/* Banner submitted */}
            {submitted && (
              <div className="mb-4 p-4 bg-green-50 border border-green-300 rounded-xl flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-green-800">Stok opname berhasil dikirim</p>
                  <p className="text-sm text-green-700">Data sudah tersimpan ke spreadsheet. Tombol kirim dinonaktifkan.</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <StatsCard 
              total={stats.total}
              filled={stats.filled}
              pending={stats.pending}
            />

            {/* Items List */}
            {groupedItems.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500">Tidak ada barang untuk distok opname</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  Menampilkan {groupedItems.length} barang
                </p>
                {groupedItems.map(group => {
                  const firstItem = group.items[0];
                  const currentValues = entries[firstItem.row] || { barangKembali: '', bonSarana: '', stokOpname: '' };
                  
                  const totalStokOpname = group.items.reduce((sum, item) => {
                    const val = entries[item.row]?.stokOpname;
                    return sum + (typeof val === 'number' ? val : (val === '' ? 0 : parseFloat(val) || 0));
                  }, 0);

                  const isComplete = group.items.every(item => isItemComplete(item, ruangan, entries));

                  return (
                    <ItemCard
                      key={group.namaBarang}
                      namaBarang={group.namaBarang}
                      satuan={group.satuan}
                      stokPelayanan={group.totalStokPelayanan}
                      currentValues={{
                        barangKembali: currentValues.barangKembali,
                        bonSarana: currentValues.bonSarana,
                        stokOpname: totalStokOpname || currentValues.stokOpname,
                      }}
                      isComplete={isComplete}
                      ruangan={ruangan as Ruangan}
                      readOnly={submitted}
                      onValueChange={(field, value) => handleValueChange(group.namaBarang, field, value)}
                    />
                  );
                })}
              </div>
            )}

            {/* Submit Button */}
            {groupedItems.length > 0 && (
              <SubmitButton
                onClick={handleConfirmOpen}
                loading={submitting}
                disabled={submitted}
                pendingCount={stats.pending}
                totalCount={stats.total}
              />
            )}
          </>
        )}
      </main>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Pengiriman</h3>
            </div>
            <p className="text-gray-600 mb-2 text-sm">
              Anda akan mengirim data stok opname untuk:
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-5 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Jenis Barang</span>
                <span className="font-medium text-gray-900">{sheet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Penanggungjawab</span>
                <span className="font-medium text-gray-900">{nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ruangan</span>
                <span className="font-medium text-gray-900">{ruangan === 'RJ' ? 'Rawat Jalan' : ruangan === 'RI' ? 'Rawat Inap' : 'Depo'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bulan</span>
                <span className="font-medium text-gray-900">{bulan}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                <span className="text-gray-500">Jumlah Barang</span>
                <span className="font-bold text-blue-700">{stats.filled} item</span>
              </div>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
              ⚠️ Setelah dikirim, tombol kirim akan dinonaktifkan. Pastikan semua data sudah benar.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                Ya, Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
