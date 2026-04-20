import React from 'react';

interface SelectDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  disabled = false,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                   disabled:bg-gray-100 disabled:text-gray-500
                   text-base appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
