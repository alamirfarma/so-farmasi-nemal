import React from 'react';

interface SubmitButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  pendingCount: number;
  totalCount: number;
  submitStep?: 'idle' | 'phase1' | 'phase2';
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  pendingCount,
  totalCount,
  submitStep = 'idle',
}) => {
  const isDisabled = disabled || loading || pendingCount > 0;

  const loadingLabel = submitStep === 'phase1'
    ? 'Mengirim barang kembali...'
    : submitStep === 'phase2'
    ? 'Mengirim bon sarana & stok opname...'
    : 'Mengirim...';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Belum diisi: <strong className="text-yellow-600">{pendingCount}</strong></span>
          <span>Akan dikirim: <strong className="text-blue-600">{totalCount - pendingCount}</strong></span>
        </div>
        <button
          onClick={onClick}
          disabled={isDisabled}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
            flex items-center justify-center gap-2
            ${isDisabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              {loadingLabel}
            </>
          ) : disabled ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Sudah Dikirim
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Kirim Stok Opname
            </>
          )}
        </button>
      </div>
    </div>
  );
};
