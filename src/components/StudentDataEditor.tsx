import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Search, Save, User, GraduationCap } from 'lucide-react';
import { useStudentDataEditor } from '../services/studentDataEditorService';
import { StudentPersonalData, StudentEnrollmentData } from '../services/types';

const StudentDataEditor: React.FC = () => {
  const {
    studentData,
    loading,
    error,
    searchResult,
    fetchStudentData,
    updateStudentData,
    clearData,
  } = useStudentDataEditor();

  const [searchCpf, setSearchCpf] = useState('');
  const [personalFormData, setPersonalFormData] = useState<StudentPersonalData>({
    origemAcademica: '',
    escolaAnterior: '',
    modalidadeAnterior: '',
    congregacao: '',
    nome: '',
    rg: '',
    cpf: '',
    telefone: '',
    email: '',
    sexo: '',
    estadoCivil: '',
    dataNascimento: '',
    ufNascimento: '',
    escolaridade: '',
    profissao: '',
    nacionalidade: '',
    cargoIgreja: '',
    enderecoRua: '',
    cep: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    dataCadastro: '',
    status: '',
  });

  const [enrollmentFormData, setEnrollmentFormData] = useState<StudentEnrollmentData>({
    nome: '',
    cpf: '',
    nucleo: '',
    subnucleo: '',
    ciclo: '',
    data: '',
    status: '',
    observacao: '',
    dataMatricula: '',
  });

  const [activeTab, setActiveTab] = useState('search');

  // Formatar CPF
  const formatCpf = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleSearchCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    setSearchCpf(formatted);
  };

  const handleSearch = async () => {
    if (!searchCpf.trim()) {
      return;
    }

    const cpfNumbers = searchCpf.replace(/\D/g, '');
    await fetchStudentData(cpfNumbers);
  };

  // Efeito para preencher formulários e mudar aba quando dados são encontrados
  React.useEffect(() => {
    if (searchResult === 'found' && studentData.personalData && studentData.enrollmentData) {
      setPersonalFormData(studentData.personalData);
      setEnrollmentFormData(studentData.enrollmentData);
      setActiveTab('personal');
    }
  }, [searchResult, studentData]);

  const handlePersonalDataChange = (field: keyof StudentPersonalData, value: string) => {
    setPersonalFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEnrollmentDataChange = (field: keyof StudentEnrollmentData, value: string | number) => {
    setEnrollmentFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSavePersonalData = async () => {
    const cpfNumbers = searchCpf.replace(/\D/g, '');
    const success = await updateStudentData(cpfNumbers, personalFormData, undefined);
    
    if (success) {
      alert('Dados pessoais atualizados com sucesso!');
    }
  };

  const handleSaveEnrollmentData = async () => {
    const cpfNumbers = searchCpf.replace(/\D/g, '');
    const success = await updateStudentData(cpfNumbers, undefined, enrollmentFormData);
    
    if (success) {
      alert('Dados de matrícula atualizados com sucesso!');
    }
  };

  const handleClear = () => {
    setSearchCpf('');
    clearData();
    setPersonalFormData({
      origemAcademica: '',
      escolaAnterior: '',
      modalidadeAnterior: '',
      congregacao: '',
      nome: '',
      rg: '',
      cpf: '',
      telefone: '',
      email: '',
      sexo: '',
      estadoCivil: '',
      dataNascimento: '',
      ufNascimento: '',
      escolaridade: '',
      profissao: '',
      nacionalidade: '',
      cargoIgreja: '',
      enderecoRua: '',
      cep: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      dataCadastro: '',
      status: '',
    });
    setEnrollmentFormData({
      nome: '',
      cpf: '',
      nucleo: '',
      subnucleo: '',
      ciclo: '',
      data: '',
      status: '',
      observacao: '',
      dataMatricula: '',
    });
    setActiveTab('search');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Editar Dados do Aluno
        </CardTitle>
        <CardDescription>
          Busque e edite dados pessoais e de matrícula dos alunos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Buscar Aluno</TabsTrigger>
            <TabsTrigger value="personal" disabled={searchResult !== 'found'}>
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="enrollment" disabled={searchResult !== 'found'}>
              Matrícula
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search-cpf">CPF do Aluno</Label>
                <Input
                  id="search-cpf"
                  placeholder="000.000.000-00"
                  value={searchCpf}
                  onChange={handleSearchCpfChange}
                  maxLength={14}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} disabled={loading || !searchCpf.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Buscar
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  Limpar
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant={searchResult === 'pending' ? 'default' : 'destructive'}>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {searchResult === 'found' && studentData.personalData && (
              <Alert>
                <AlertDescription>
                  Aluno encontrado: {studentData.personalData.nome} - Dados disponíveis para edição
                </AlertDescription>
              </Alert>
            )}

            {searchResult === 'pending' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  Para efetivar a matrícula deste aluno, acesse a seção "Matrículas Pendentes" no dashboard.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  value={personalFormData.nome}
                  onChange={(e) => handlePersonalDataChange('nome', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={personalFormData.cpf}
                  onChange={(e) => handlePersonalDataChange('cpf', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={personalFormData.rg}
                  onChange={(e) => handlePersonalDataChange('rg', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={personalFormData.email}
                  onChange={(e) => handlePersonalDataChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={personalFormData.telefone}
                  onChange={(e) => handlePersonalDataChange('telefone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={personalFormData.dataNascimento}
                  onChange={(e) => handlePersonalDataChange('dataNascimento', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sexo">Sexo</Label>
                <Select
                  value={personalFormData.sexo}
                  onValueChange={(value) => handlePersonalDataChange('sexo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estadoCivil">Estado Civil</Label>
                <Select
                  value={personalFormData.estadoCivil}
                  onValueChange={(value) => handlePersonalDataChange('estadoCivil', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ufNascimento">UF de Nascimento</Label>
                <Input
                  id="ufNascimento"
                  value={personalFormData.ufNascimento}
                  onChange={(e) => handlePersonalDataChange('ufNascimento', e.target.value)}
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="nacionalidade">Nacionalidade</Label>
                <Input
                  id="nacionalidade"
                  value={personalFormData.nacionalidade}
                  onChange={(e) => handlePersonalDataChange('nacionalidade', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="profissao">Profissão</Label>
                <Input
                  id="profissao"
                  value={personalFormData.profissao}
                  onChange={(e) => handlePersonalDataChange('profissao', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="escolaridade">Escolaridade</Label>
                <Input
                  id="escolaridade"
                  value={personalFormData.escolaridade}
                  onChange={(e) => handlePersonalDataChange('escolaridade', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="congregacao">Congregação</Label>
                <Input
                  id="congregacao"
                  value={personalFormData.congregacao}
                  onChange={(e) => handlePersonalDataChange('congregacao', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cargoIgreja">Cargo na Igreja</Label>
                <Input
                  id="cargoIgreja"
                  value={personalFormData.cargoIgreja}
                  onChange={(e) => handlePersonalDataChange('cargoIgreja', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="enderecoRua">Endereço (Rua)</Label>
                <Input
                  id="enderecoRua"
                  value={personalFormData.enderecoRua}
                  onChange={(e) => handlePersonalDataChange('enderecoRua', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={personalFormData.numero}
                  onChange={(e) => handlePersonalDataChange('numero', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={personalFormData.bairro}
                  onChange={(e) => handlePersonalDataChange('bairro', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={personalFormData.cidade}
                  onChange={(e) => handlePersonalDataChange('cidade', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={personalFormData.uf}
                  onChange={(e) => handlePersonalDataChange('uf', e.target.value)}
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={personalFormData.cep}
                  onChange={(e) => handlePersonalDataChange('cep', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="origemAcademica">Origem Acadêmica</Label>
                <Input
                  id="origemAcademica"
                  value={personalFormData.origemAcademica}
                  onChange={(e) => handlePersonalDataChange('origemAcademica', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="escolaAnterior">Escola Anterior</Label>
                <Input
                  id="escolaAnterior"
                  value={personalFormData.escolaAnterior}
                  onChange={(e) => handlePersonalDataChange('escolaAnterior', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="modalidadeAnterior">Modalidade Anterior</Label>
                <Input
                  id="modalidadeAnterior"
                  value={personalFormData.modalidadeAnterior}
                  onChange={(e) => handlePersonalDataChange('modalidadeAnterior', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={personalFormData.status}
                  onChange={(e) => handlePersonalDataChange('status', e.target.value)}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="dataCadastro">Data de Cadastro</Label>
                <Input
                  id="dataCadastro"
                  value={personalFormData.dataCadastro}
                  onChange={(e) => handlePersonalDataChange('dataCadastro', e.target.value)}
                  disabled
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={handleSavePersonalData} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Dados Pessoais
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="enrollment" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={enrollmentFormData.nome}
                  onChange={(e) => handleEnrollmentDataChange('nome', e.target.value)}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={enrollmentFormData.cpf}
                  onChange={(e) => handleEnrollmentDataChange('cpf', e.target.value)}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="nucleo">Núcleo</Label>
                <Input
                  id="nucleo"
                  value={enrollmentFormData.nucleo}
                  onChange={(e) => handleEnrollmentDataChange('nucleo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="subnucleo">Subnúcleo</Label>
                <Input
                  id="subnucleo"
                  value={enrollmentFormData.subnucleo}
                  onChange={(e) => handleEnrollmentDataChange('subnucleo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="ciclo">Ciclo</Label>
                <Input
                  id="ciclo"
                  value={enrollmentFormData.ciclo}
                  onChange={(e) => handleEnrollmentDataChange('ciclo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  value={enrollmentFormData.data}
                  onChange={(e) => handleEnrollmentDataChange('data', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={enrollmentFormData.status}
                  onValueChange={(value) => handleEnrollmentDataChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="reprovado">Reprovado</SelectItem>
                    <SelectItem value="matriculado">Matriculado</SelectItem>
                    <SelectItem value="cursando">Cursando</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="evadido">Evadido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataMatricula">Data da Matrícula</Label>
                <Input
                  id="dataMatricula"
                  value={enrollmentFormData.dataMatricula}
                  onChange={(e) => handleEnrollmentDataChange('dataMatricula', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="observacao">Observação</Label>
                <Textarea
                  id="observacao"
                  value={enrollmentFormData.observacao}
                  onChange={(e) => handleEnrollmentDataChange('observacao', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={handleSaveEnrollmentData} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Dados de Matrícula
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StudentDataEditor;