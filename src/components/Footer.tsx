import React from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Ministério - Coluna Esquerda */}
          <div className="space-y-6">
            {/* Ministério */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Ministério</h3>
              <div className="mb-4">
                <img 
                  src="https://admissaoprv.com.br/wp-content/uploads/2023/11/Logo-PRV-Texto-Branco.png" 
                  alt="Logo PRV" 
                  className="h-16 mb-4"
                />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Assembléia de Deus Ministério Missão - PRV</p>
                <p className="text-gray-300">
                  <a 
                    href="https://admissaoprv.com.br/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors"
                  >
                    admissaoprv.com.br
                  </a>
                </p>
                <div className="text-gray-300">
                  <p>ASR-SE 75, Alameda 2, Lote 53</p>
                  <p>Plano Diretor Sul</p>
                  <p>Palmas-Tocantins – Brasil</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-núcleos - Coluna Direita */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Sub-núcleos</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div className="text-gray-300">
                  <p>1 - ARNO 44</p>
                  <p>2 - Sede</p>
                  <p>3 - Aureny III</p>
                  <p>4 - Taquarí</p>
                </div>
                <div className="text-gray-300">
                  <p>5 - Morada do Sol II</p>
                  <p>6 - Luzimanges</p>
                  <p>7 - Colinas - TO</p>
                </div>
              </div>
            </div>

            {/* Site Oficial - EETAD */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Site Oficial</h3>
              <div className="mb-4">
                <img 
                  src="https://eetad.com.br/wp-content/uploads/2023/07/logo-eetad-safira-200px-300x147.png" 
                  alt="Logo EETAD" 
                  className="h-16 mb-4"
                />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Escola de Educação Teológica das Assembleias de Deus no Brasil</p>
                <p className="text-gray-300">
                  <a 
                    href="https://eetad.com.br/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors"
                  >
                    eetad.com.br
                  </a>
                </p>
                <div className="text-gray-300">
                  <p>Rua Pr. Bernhard Johnson, 500</p>
                  <p>Tijuco das Telhas</p>
                  <p>Campinas, SP – CEP: 13086-600</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Redes Sociais */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Redes Sociais</h3>
            <div className="flex justify-center items-center space-x-6">
              <a 
                href="https://www.facebook.com/missaoprvidas" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-blue-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a 
                href="https://www.instagram.com/admissaoprv.oficial" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-blue-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="https://www.youtube.com/admissaoprv" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-blue-400 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; 2024 EETAD - Núcleo Palmas - TO. Todos os direitos reservados.</p>
          <p className="mt-2 text-sm">Sistema de Controle de Alunos</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;