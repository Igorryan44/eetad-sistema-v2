
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Student } from "@/pages/Index";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  BookOpen,
  UserCheck,
  Save,
  Loader2,
  Home,
  Globe,
  Briefcase,
  Star
} from "lucide-react";

interface RegistrationFormProps {
  cpf: string;
  onRegistrationComplete: (student: Student) => void;
  onBack: () => void;
}

const RegistrationForm = ({ cpf, onRegistrationComplete, onBack }: RegistrationFormProps) => {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    rg: "",
    fone: "",
    sexo: "",
    dtnascimento: "",
    estcivil: "",
    cidadenascimento: "",
    ufnascimento: "",
    nacionalidade: "Brasileira",
    escolaridade: "",
    profissao: "",
    cargo: "",
    endereco: "",
    cep: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade_alu: "",
    uf: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  const estados = [
    { value: "AC", label: "Acre" },
    { value: "AL", label: "Alagoas" },
    { value: "AP", label: "Amapá" },
    { value: "AM", label: "Amazonas" },
    { value: "BA", label: "Bahia" },
    { value: "CE", label: "Ceará" },
    { value: "DF", label: "Distrito Federal" },
    { value: "ES", label: "Espírito Santo" },
    { value: "GO", label: "Goiás" },
    { value: "MA", label: "Maranhão" },
    { value: "MT", label: "Mato Grosso" },
    { value: "MS", label: "Mato Grosso do Sul" },
    { value: "MG", label: "Minas Gerais" },
    { value: "PA", label: "Pará" },
    { value: "PB", label: "Paraíba" },
    { value: "PR", label: "Paraná" },
    { value: "PE", label: "Pernambuco" },
    { value: "PI", label: "Piauí" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "RN", label: "Rio Grande do Norte" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "RO", label: "Rondônia" },
    { value: "RR", label: "Roraima" },
    { value: "SC", label: "Santa Catarina" },
    { value: "SP", label: "São Paulo" },
    { value: "SE", label: "Sergipe" },
    { value: "TO", label: "Tocantins" }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.nome || !formData.email || !formData.fone) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      const studentData = {
        nome: formData.nome,
        rg: formData.rg,
        cpf: cpf,
        telefone: formData.fone,
        email: formData.email,
        sexo: formData.sexo,
        estado_civil: formData.estcivil,
        data_nascimento: formData.dtnascimento,
        cidade_nascimento: formData.cidadenascimento,
        uf_nascimento: formData.ufnascimento,
        nacionalidade: formData.nacionalidade,
        escolaridade: formData.escolaridade,
        profissao: formData.profissao,
        cargo_igreja: formData.cargo,
        endereco_rua: formData.endereco,
        cep: formData.cep,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade_alu,
        uf: formData.uf
      };

      const response = await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/save-student-personal-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify(studentData)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar dados');
      }

      await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/send-whatsapp-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify({
          type: 'pending_registration',
          studentData: studentData
        })
      });

      await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/send-whatsapp-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        },
        body: JSON.stringify({
          type: 'student_pending',
          studentData: studentData
        })
      });

      try {
        await fetch(`https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/send-email-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
          },
          body: JSON.stringify({
            type: 'pending_registration',
            studentData: {
              nome: studentData.nome,
              email: studentData.email,
              cpf: studentData.cpf,
              telefone: studentData.telefone
            }
          })
        });
      } catch (emailError) {
        console.error('❌ Erro ao enviar email:', emailError);
      }

      toast({
        title: "Solicitação enviada!",
        description: "Seus dados foram enviados para aprovação da secretaria."
      });

      onRegistrationComplete({
        cpf: cpf,
        nome: formData.nome,
        email: formData.email,
        registered: false
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 rounded-2xl blur opacity-30 animate-pulse"></div>
      
      <Card className="relative bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white relative overflow-hidden px-4 py-6 md:px-6 md:py-8">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-300 hover:scale-110 self-start"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3 w-full">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                  <User className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg md:text-2xl font-bold leading-tight">Formulário de Dados Pessoais</CardTitle>
                  <CardDescription className="text-purple-100 text-sm md:text-lg leading-tight">
                    Preencha seus dados para solicitar matrícula
                  </CardDescription>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs md:text-sm text-purple-100">
              <UserCheck className="h-3 w-3 md:h-4 md:w-4" />
              <span>CPF: {cpf}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Dados Pessoais */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Dados Pessoais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="nome" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Digite seu nome completo"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="email" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="rg" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    RG
                  </Label>
                  <Input
                    id="rg"
                    placeholder="Digite seu RG"
                    value={formData.rg}
                    onChange={(e) => handleInputChange("rg", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="fone" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Telefone *
                  </Label>
                  <Input
                    id="fone"
                    placeholder="(DD) 99999-9999"
                    value={formData.fone}
                    onChange={(e) => handleInputChange("fone", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Sexo
                  </Label>
                  <Select value={formData.sexo} onValueChange={(value) => handleInputChange("sexo", value)}>
                    <SelectTrigger className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue placeholder="-- Selecione --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="dtnascimento" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Data de Nascimento
                  </Label>
                  <Input
                    id="dtnascimento"
                    type="date"
                    value={formData.dtnascimento}
                    onChange={(e) => handleInputChange("dtnascimento", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <User className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Estado Civil
                  </Label>
                  <Select value={formData.estcivil} onValueChange={(value) => handleInputChange("estcivil", value)}>
                    <SelectTrigger className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue placeholder="-- Selecione --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                      <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                      <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                      <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="cidadenascimento" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Cidade de Nascimento
                  </Label>
                  <Input
                    id="cidadenascimento"
                    placeholder="Digite a cidade"
                    value={formData.cidadenascimento}
                    onChange={(e) => handleInputChange("cidadenascimento", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    UF de Nascimento
                  </Label>
                  <Select value={formData.ufnascimento} onValueChange={(value) => handleInputChange("ufnascimento", value)}>
                    <SelectTrigger className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue placeholder="-- Selecione --" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="nacionalidade" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Globe className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Nacionalidade
                  </Label>
                  <Input
                    id="nacionalidade"
                    placeholder="Digite sua nacionalidade"
                    value={formData.nacionalidade}
                    onChange={(e) => handleInputChange("nacionalidade", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <BookOpen className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Escolaridade
                  </Label>
                  <Select value={formData.escolaridade} onValueChange={(value) => handleInputChange("escolaridade", value)}>
                    <SelectTrigger className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue placeholder="-- Selecione --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ensino Fundamental">Ensino Fundamental</SelectItem>
                      <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                      <SelectItem value="Ensino Superior">Ensino Superior</SelectItem>
                      <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="profissao" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Profissão
                  </Label>
                  <Input
                    id="profissao"
                    placeholder="Digite sua profissão"
                    value={formData.profissao}
                    onChange={(e) => handleInputChange("profissao", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="cargo" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Cargo na Igreja
                  </Label>
                  <Input
                    id="cargo"
                    placeholder="Digite seu cargo na igreja"
                    value={formData.cargo}
                    onChange={(e) => handleInputChange("cargo", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Endereço</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="endereco" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Home className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    Rua/Avenida
                  </Label>
                  <Input
                    id="endereco"
                    placeholder="Digite o endereço"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange("endereco", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="cep" className="text-sm md:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                    CEP
                  </Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={(e) => handleInputChange("cep", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="numero" className="text-sm md:text-base font-semibold text-gray-700">Número</Label>
                  <Input
                    id="numero"
                    placeholder="123"
                    value={formData.numero}
                    onChange={(e) => handleInputChange("numero", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="complemento" className="text-sm md:text-base font-semibold text-gray-700">Complemento</Label>
                  <Input
                    id="complemento"
                    placeholder="Apto, casa, etc."
                    value={formData.complemento}
                    onChange={(e) => handleInputChange("complemento", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="bairro" className="text-sm md:text-base font-semibold text-gray-700">Bairro</Label>
                  <Input
                    id="bairro"
                    placeholder="Digite o bairro"
                    value={formData.bairro}
                    onChange={(e) => handleInputChange("bairro", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label htmlFor="cidade_alu" className="text-sm md:text-base font-semibold text-gray-700">Cidade</Label>
                  <Input
                    id="cidade_alu"
                    placeholder="Digite a cidade"
                    value={formData.cidade_alu}
                    onChange={(e) => handleInputChange("cidade_alu", e.target.value)}
                    className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                  />
                </div>

                <div className="space-y-2 md:space-y-3">
                  <Label className="text-sm md:text-base font-semibold text-gray-700">UF</Label>
                  <Select value={formData.uf} onValueChange={(value) => handleInputChange("uf", value)}>
                    <SelectTrigger className="h-10 md:h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue placeholder="-- Selecione --" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Botão de envio */}
            <div className="flex justify-center pt-6">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationForm;
