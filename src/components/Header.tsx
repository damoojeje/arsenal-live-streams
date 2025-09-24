import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="bg-gradient-to-r from-arsenalRed to-red-700 text-white py-8 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-sf-pro mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-red-100 font-sf-pro">
            {subtitle}
          </p>
        )}
        <div className="mt-4 text-sm text-red-200">
          Live streaming links for top European football clubs
        </div>
      </div>
    </header>
  );
};

export default Header;
