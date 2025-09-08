import { useState } from 'react';
import { ChevronLeft, ChevronRight, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AIChatbot from '@/components/AIChatbot';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { 
      src: 'https://cdn.awsli.com.br/800x800/2455/2455194/produto/167589634/6089c60d48.jpg', 
      alt: 'Livro de Identidade Teológica - 1º Ciclo' 
    },
    { 
      src: 'https://cdn.awsli.com.br/2500x2500/2455/2455194/produto/217602992/08--pentateuco--novo--9h249arscy.png', 
      alt: 'Livro de Pentateuco - 2º Ciclo' 
    },
    { 
      src: 'https://cdn.awsli.com.br/2500x2500/2455/2455194/produto/166275017/efe573577e.jpg', 
      alt: 'Livro de Doutrina de Cristo - 3º Ciclo' 
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-blue-800">
      <header className="bg-gradient-to-r from-blue-900 to-blue-600 p-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">EETAD - Núcleo Palmas - TO</h1>
          </div>
          <div className="flex gap-4 flex-wrap">
            <Link to="/aluno">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105">
                Acesso Aluno
              </Button>
            </Link>
            <Link to="/secretaria">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 px-6 py-3 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105">
                Acesso Secretaria
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-16 text-center bg-white">
        <div className="container mx-auto px-4">
          <div className="relative max-w-2xl mx-auto mb-12 overflow-hidden rounded-xl shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {slides.map((slide, index) => (
                <div key={index} className="min-w-full">
                  <img 
                    src={slide.src} 
                    alt={slide.alt}
                    className="w-full h-full object-contain rounded-lg bg-white/10 backdrop-blur-sm"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Erro ao carregar imagem:', e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
            <Button onClick={prevSlide} className="absolute top-1/2 left-4 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button onClick={nextSlide} className="absolute top-1/2 right-4 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110">
              <ChevronRight className="h-6 w-6" />
            </Button>
            <div className="flex justify-center mt-4 space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-purple-800 bg-clip-text text-transparent mb-6">
            Bem-vindo à EETAD Palmas
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Sistema completo de matrícula e gerenciamento acadêmico para a Escola de Ensino Teológico das Assembléias de Deus - Núcleo Palmas/TO.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-900 to-purple-800 bg-clip-text text-transparent mb-6">
            Informações do Curso
          </h2>
          <p className="text-center text-xl text-gray-700 max-w-3xl mx-auto mb-16 leading-relaxed">
            Nosso curso oferece formação teológica completa com ciclos progressivos, materiais didáticos de qualidade e suporte contínuo.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
            <div className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white font-bold text-xl">1º</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-blue-900 to-purple-800 bg-clip-text text-transparent">
                1º Ciclo - Formação Básica
              </h3>
              <p className="text-gray-600 text-center leading-relaxed mb-6">
                Fundamentos bíblicos e teológicos essenciais para iniciantes na fé cristã.
              </p>
              <div className="text-left">
                <h4 className="font-semibold text-blue-900 mb-3">Disciplinas:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Bibliologia I</li>
                  <li>• Geografia Bíblica</li>
                  <li>• Evangelhos</li>
                  <li>• Homilética I</li>
                  <li>• Doutrinas Fundamentais da Bíblia</li>
                  <li>• Epístolas Paulinas I</li>
                  <li>• Epístolas Gerais</li>
                  <li>• Pentateuco</li>
                  <li>• Hebreus</li>
                  <li>• Epístolas Paulinas II</li>
                  <li>• Epístolas Paulinas III</li>
                  <li>• Livros Históricos</li>
                  <li>• Profetas Maiores</li>
                  <li>• Profetas Menores</li>
                  <li>• Livros Poéticos</li>
                  <li>• Daniel e Apocalipse</li>
                </ul>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white font-bold text-xl">2º</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-purple-900 to-blue-800 bg-clip-text text-transparent">
                2º Ciclo - Formação Intermediária
              </h3>
              <p className="text-gray-600 text-center leading-relaxed mb-6">
                Aprofundamento no conhecimento teológico e ministerial.
              </p>
              <div className="text-left">
                <h4 className="font-semibold text-purple-900 mb-3">Disciplinas:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Seitas e Heresias</li>
                  <li>• Religiões Mundiais</li>
                  <li>• Liderança Cristã</li>
                  <li>• Evang. e Missões</li>
                  <li>• Cristologia</li>
                  <li>• Pneumatologia</li>
                  <li>• Hermenêutica Bíblica I</li>
                  <li>• Escatologia Bíblica</li>
                  <li>• Doutrina da Salvação I</li>
                  <li>• Doutrina de Deus</li>
                  <li>• Educação Cristã</li>
                  <li>• As Doutrinas do Homem e do Pecado</li>
                  <li>• Ética Cristã</li>
                  <li>• História da Igreja</li>
                  <li>• Família Cristã</li>
                  <li>• Homilética</li>
                </ul>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white font-bold text-xl">3º</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-blue-900 to-purple-800 bg-clip-text text-transparent">
                3º Ciclo - Formação Avançada
              </h3>
              <p className="text-gray-600 text-center leading-relaxed mb-6">
                Especialização ministerial e liderança cristã.
              </p>
              <div className="text-left">
                <h4 className="font-semibold text-blue-900 mb-3">Disciplinas:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Identidade Teológica</li>
                  <li>• Doutrina da Salvação II</li>
                  <li>• Oratória Cristã</li>
                  <li>• Teologia do Antigo Testamento</li>
                  <li>• Teologia do Novo Testamento</li>
                  <li>• Apologética</li>
                  <li>• Relacionamento Cristão</li>
                  <li>• Liturgias da Igreja Cristã</li>
                  <li>• Português & Técnicas de Redação</li>
                  <li>• Didática Geral</li>
                  <li>• Hermenêutica Bíblica II</li>
                  <li>• Cosmogonia Bíblica</li>
                  <li>• Grego do Novo Testamento</li>
                  <li>• Bibliologia II</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* AI Chatbot */}
      <AIChatbot userId="home-visitor" />
    </div>
  );
};

export default Home;