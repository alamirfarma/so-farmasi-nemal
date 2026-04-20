import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-blue-100 text-sm mt-0.5">{subtitle}</p>}
      </div>
    </header>
  );
};
