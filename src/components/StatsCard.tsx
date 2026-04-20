import React from 'react';

interface StatsCardProps {
  total: number;
  filled: number;
  pending: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ total, filled, pending }) => {
  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-700">Progress Stok Opname</h3>
        <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-gray-500">Total</p>
          <p className="font-semibold text-gray-900">{total}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <p className="text-gray-500">Terisi</p>
          <p className="font-semibold text-green-600">{filled}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-2">
          <p className="text-gray-500">Belum</p>
          <p className="font-semibold text-yellow-600">{pending}</p>
        </div>
      </div>
    </div>
  );
};
