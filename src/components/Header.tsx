import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-900 shadow-md border-b border-blue-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center">
          {/* Logo EETAD centralizada */}
          <div className="flex items-center space-x-4">
            <img 
              src="https://eetad.com.br/wp-content/uploads/2023/07/logo-eetad-safira-200px-300x147.png" 
              alt="EETAD Logo" 
              className="h-10 md:h-12 w-auto object-contain"
            />
            <div className="text-center">
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-white">
                Sistema de Controle de Alunos
              </h1>
              <p className="text-xs md:text-sm text-blue-100">
                Escola de Educação Teológica das Assembleias de Deus
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;