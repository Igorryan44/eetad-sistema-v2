import React from 'react';
import { Button } from './ui/button';
import { MessageCircle, Smartphone, Monitor } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from './ui/dropdown-menu';

interface WhatsAppOpenerProps {
  phone?: string;
  message?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function WhatsAppOpener({ 
  phone, 
  message = '',
  variant = 'default',
  size = 'default',
  className = ''
}: WhatsAppOpenerProps) {
  
  // Função para limpar e formatar o número
  const formatPhoneNumber = (phoneNumber: string): string => {
    // Remove todos os caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Se começar com 55 (Brasil), usa como está
    // Senão, adiciona 55 no início
    if (cleanNumber.startsWith('55')) {
      return cleanNumber;
    } else {
      return `55${cleanNumber}`;
    }
  };

  // Função para codificar a mensagem para URL
  const encodeMessage = (msg: string): string => {
    return encodeURIComponent(msg);
  };

  // Função para abrir WhatsApp Web
  const openWhatsAppWeb = () => {
    const baseUrl = 'https://web.whatsapp.com/send';
    const formattedPhone = phone ? formatPhoneNumber(phone) : '';
    const encodedMessage = message ? encodeMessage(message) : '';
    
    let url = baseUrl;
    const params = [];
    
    if (formattedPhone) {
      params.push(`phone=${formattedPhone}`);
    }
    
    if (encodedMessage) {
      params.push(`text=${encodedMessage}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    window.open(url, '_blank');
  };

  // Função para abrir WhatsApp App (móvel/desktop)
  const openWhatsAppApp = () => {
    const baseUrl = 'https://wa.me';
    const formattedPhone = phone ? formatPhoneNumber(phone) : '';
    const encodedMessage = message ? encodeMessage(message) : '';
    
    let url = baseUrl;
    
    if (formattedPhone) {
      url += `/${formattedPhone}`;
    }
    
    if (encodedMessage) {
      url += `?text=${encodedMessage}`;
    }
    
    window.open(url, '_blank');
  };

  // Função para detectar dispositivo e abrir automaticamente
  const openWhatsAppAuto = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      openWhatsAppApp();
    } else {
      openWhatsAppWeb();
    }
  };

  // Função para abrir diretamente no aplicativo (tenta forçar app)
  const openWhatsAppDirect = () => {
    const formattedPhone = phone ? formatPhoneNumber(phone) : '';
    const encodedMessage = message ? encodeMessage(message) : '';
    
    // Tenta primeiro o protocolo whatsapp://
    let whatsappUrl = 'whatsapp://send';
    const params = [];
    
    if (formattedPhone) {
      params.push(`phone=${formattedPhone}`);
    }
    
    if (encodedMessage) {
      params.push(`text=${encodedMessage}`);
    }
    
    if (params.length > 0) {
      whatsappUrl += `?${params.join('&')}`;
    }
    
    // Cria um link temporário para tentar abrir o protocolo
    const link = document.createElement('a');
    link.href = whatsappUrl;
    
    // Tenta abrir o protocolo, se falhar, abre wa.me
    try {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Fallback para wa.me após um pequeno delay
      setTimeout(() => {
        openWhatsAppApp();
      }, 1000);
    } catch (error) {
      openWhatsAppApp();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Abrir WhatsApp
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={openWhatsAppAuto}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Abrir Automaticamente
          <span className="ml-auto text-xs text-muted-foreground">
            Recomendado
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={openWhatsAppWeb}>
          <Monitor className="mr-2 h-4 w-4" />
          WhatsApp Web
          <span className="ml-auto text-xs text-muted-foreground">
            Navegador
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={openWhatsAppApp}>
          <Smartphone className="mr-2 h-4 w-4" />
          WhatsApp App
          <span className="ml-auto text-xs text-muted-foreground">
            wa.me
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={openWhatsAppDirect}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Forçar Aplicativo
          <span className="ml-auto text-xs text-muted-foreground">
            Direto
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default WhatsAppOpener;