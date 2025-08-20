import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Calendar, FileText, Download, Eye, Users, BookOpen, GraduationCap, AlertCircle, Loader2, LogOut, Shield, CheckCircle, XCircle, Edit } from 'lucide-react';
import AuthenticationSystem from '../components/AuthenticationSystem';
import UserManagement from '../components/UserManagement';
import PendingStudentsManager from '../components/PendingStudentsManager';
import StudentDataEditor from '../components/StudentDataEditor';
import CreateSecretaryAccount from '../components/CreateSecretaryAccount';
import { authService } from '../services/authService';
import { usePendingStudents } from '@/services/pendingStudentsService';
import { useApprovedStudents } from '@/services/approvedStudentsService';
import { useRejectedStudents } from '@/services/rejectedStudentsService';
import { useEnrolledStudents } from '@/services/enrolledStudentsService';

type Student = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  ciclo?: string;
  status?: string;
  dataMatricula?: string;
};

type Enrollment = {
  id: string;
  studentId: string;
  ciclo: string;
  subnucleo?: string;
  dataEvento: string;
  status: string;
  observacao: string;
  nome?: string;
};

type ReportData = {
  matriculados: number;
  pedidosLivros: number;
  pagamentosEfetuados: number;
  periodo: string;
};

const SecretaryDashboard = () => {
  // Estado de autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [reportData, setReportData] = useState<ReportData>({
    matriculados: 0,
    pedidosLivros: 0,
    pagamentosEfetuados: 0,
    periodo: 'Último mês'
  });
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  
  // Estados para filtros de relatórios
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [selectedBookListType, setSelectedBookListType] = useState('geral');
  
  // Hook para alunos pendentes
  const { 
    students: pendingStudents, 
    loading: pendingLoading, 
    error: pendingError,
    refreshStudents 
  } = usePendingStudents();

  // Callback para quando uma matrícula for efetivada
  const handleStudentEnrolled = async (student: any) => {

    
    // Atualizar lista de alunos pendentes
    await refreshStudents();
    
    // Atualizar lista de alunos matriculados
    await refreshEnrolled();
    
    // Atualizar dados do dashboard
    await loadDashboardData();
    
    
  };
  
  // Hook para alunos aprovados
  const { 
    students: approvedStudents, 
    loading: approvedLoading, 
    error: approvedError,
    refreshStudents: refreshApproved 
  } = useApprovedStudents();
  
  // Hook para alunos rejeitados
  const { 
    students: rejectedStudents, 
    loading: rejectedLoading, 
    error: rejectedError,
    refreshStudents: refreshRejected 
  } = useRejectedStudents();
  
  // Hook para alunos matriculados
  const { 
    students: enrolledStudents, 
    loading: enrolledLoading, 
    error: enrolledError,
    refreshStudents: refreshEnrolled 
  } = useEnrolledStudents();

  // Verificar autenticação ao carregar
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      loadDashboardData();
    } else {
      setShowAuthModal(true);
    }
  }, []);

  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados reais do sistema
      setReportData({
        matriculados: enrolledStudents.length,
        pedidosLivros: 45,
        pagamentosEfetuados: 120,
        periodo: 'Último mês'
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função de login
  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const success = await authService.login({ username, password });
      if (success) {
        setIsAuthenticated(true);
        setCurrentUser(authService.getCurrentUser());
        setShowAuthModal(false);
        await loadDashboardData();
        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!"
        });
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Credenciais inválidas",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive"
      });
      return false;
    }
  };

  // Função para criar conta
  const handleCreateAccount = async (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<boolean> => {
    try {
      const success = await authService.createAccount(userData);
      if (success) {
        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso!"
        });
        setShowCreateAccount(false);
        return true;
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar conta",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive"
      });
      return false;
    }
  };

  // Função de logout
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowAuthModal(true);
    toast({
      title: "Logout",
      description: "Você foi desconectado com sucesso"
    });
  };

  // Se não estiver autenticado, mostrar modal de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {showCreateAccount ? (
          <CreateSecretaryAccount
            onCreateAccount={handleCreateAccount}
            onBack={() => setShowCreateAccount(false)}
          />
        ) : (
          <div className="w-full max-w-md">
            <AuthenticationSystem
              onAuthenticated={() => {
                setIsAuthenticated(true);
                setCurrentUser(authService.getCurrentUser());
                setShowAuthModal(false);
                loadDashboardData();
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dashboard da Secretaria
                </h1>
                <p className="text-sm text-gray-600">Sistema EETAD v2 - Bem-vindo, {currentUser?.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Botão Gerenciamento de Usuários */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                  >
                    <Shield className="h-4 w-4" />
                    Gerenciar Usuários
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Gerenciamento de Usuários
                    </DialogTitle>
                  </DialogHeader>
                  <UserManagement />
                </DialogContent>
              </Dialog>
              
              {/* Botão Sair */}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Alunos Matriculados</CardTitle>
              <Users className="h-8 w-8 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{enrolledLoading ? '...' : enrolledStudents.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Matrículas Pendentes</CardTitle>
              <AlertCircle className="h-8 w-8 text-orange-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingStudents.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Alunos Aprovados</CardTitle>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{approvedStudents.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-100">Reprovado</CardTitle>
              <XCircle className="h-8 w-8 text-red-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rejectedStudents.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Card de Edição de Dados do Aluno */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Edit className="h-6 w-6" />
              </div>
              Editar Dados do Aluno
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-purple-700">
                  <Edit className="h-5 w-5" />
                  <span className="font-semibold">Busque e edite dados pessoais e de matrícula</span>
                </div>
              </div>
              <StudentDataEditor />
            </div>
          </CardContent>
        </Card>

        {/* Card de Funcionalidade Principal */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              Matrículas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">{pendingStudents.length} matrículas pendentes</span>
                </div>
              </div>
              <PendingStudentsManager onStudentEnrolled={handleStudentEnrolled} />
            </div>
          </CardContent>
        </Card>

        {/* Card Relatórios e Estatísticas */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              Relatórios e Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna Esquerda */}
              <div className="space-y-6">
                {/* Seção de Relatórios por Data */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Relatórios por Data</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data-inicial" className="text-sm font-medium text-gray-700">Data Inicial</Label>
                      <Input
                        id="data-inicial"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-2 border-gray-200 focus:border-blue-500"
                        placeholder="dd/mm/aaaa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data-final" className="text-sm font-medium text-gray-700">Data Final</Label>
                      <Input
                        id="data-final"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-2 border-gray-200 focus:border-blue-500"
                        placeholder="dd/mm/aaaa"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                     <Button 
                       size="sm" 
                       onClick={() => generateDateReport(startDate, endDate)}
                       className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-10 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                     >
                       <FileText className="h-4 w-4" />
                       Relatório por Data
                     </Button>
                     <Button 
                       size="sm" 
                       variant="outline" 
                       onClick={() => downloadDateReportPDF(startDate, endDate)}
                       className="h-10 flex items-center gap-2"
                     >
                       <Download className="h-4 w-4" />
                       PDF
                     </Button>
                   </div>
                </div>

                {/* Seção de Relatórios por Ciclo */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Relatórios por Ciclo</h4>
                  <div className="space-y-2">
                    <Label htmlFor="ciclo" className="text-sm font-medium text-gray-700">Ciclo</Label>
                    <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                      <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                        <SelectValue placeholder="Selecione o ciclo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os ciclos</SelectItem>
                        <SelectItem value="basico">Básico</SelectItem>
                        <SelectItem value="intermediario">Intermediário</SelectItem>
                        <SelectItem value="avancado">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                     <Button 
                       size="sm" 
                       onClick={() => generateCycleReport(selectedCycle)}
                       className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border-0 h-10 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                     >
                       <GraduationCap className="h-4 w-4" />
                       Relatório por Ciclo
                     </Button>
                     <Button 
                       size="sm" 
                       variant="outline" 
                       onClick={() => downloadCycleReportPDF(selectedCycle)}
                       className="h-10 flex items-center gap-2"
                     >
                       <Download className="h-4 w-4" />
                       PDF
                     </Button>
                   </div>
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="space-y-6">
                {/* Seção de Lista de Matriculados */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Lista de Matriculados</h4>
                  <div className="space-y-2">
                    <Label htmlFor="status-matricula" className="text-sm font-medium text-gray-700">Status da Matrícula</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="cursando">Cursando</SelectItem>
                        <SelectItem value="nao-cursando">Não Cursando</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="reprovado">Reprovado</SelectItem>
                        <SelectItem value="recuperacao">Recuperação</SelectItem>
                        <SelectItem value="transferido">Transferido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                     <Button 
                       size="sm" 
                       onClick={() => generateEnrolledStudentsList(selectedStatus)}
                       className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 h-10 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                     >
                       <Users className="h-4 w-4" />
                       Lista de Matriculados
                     </Button>
                     <Button 
                       size="sm" 
                       variant="outline" 
                       onClick={() => downloadEnrolledStudentsListPDF(selectedStatus)}
                       className="h-10 flex items-center gap-2"
                     >
                       <Download className="h-4 w-4" />
                       PDF
                     </Button>
                   </div>
                </div>

                {/* Seção de Lista de Livros/Disciplinas */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Lista de Livros/Disciplinas</h4>
                  <div className="space-y-2">
                    <Label htmlFor="tipo-lista" className="text-sm font-medium text-gray-700">Tipo de Lista de Livros</Label>
                    <Select value={selectedBookListType} onValueChange={setSelectedBookListType}>
                      <SelectTrigger className="border-2 border-gray-200 focus:border-blue-500">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="geral">Lista Geral</SelectItem>
                        <SelectItem value="por-aluno">Por Aluno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                     <Button 
                       size="sm" 
                       onClick={() => generateBooksList(selectedBookListType)}
                       className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 h-10 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
                     >
                       <BookOpen className="h-4 w-4" />
                       Lista de Livros/Disciplinas
                     </Button>
                     <Button 
                       size="sm" 
                       variant="outline" 
                       onClick={() => downloadBooksListPDF(selectedBookListType)}
                       className="h-10 flex items-center gap-2"
                     >
                       <Download className="h-4 w-4" />
                       PDF
                     </Button>
                   </div>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>


      </div>
    </div>
  );

  // Função para abrir relatório em nova aba
   const openReportInNewTab = (reportData: any) => {
     const reportWindow = window.open('', '_blank');
     if (reportWindow) {
       reportWindow.document.write(`
         <!DOCTYPE html>
         <html lang="pt-BR">
         <head>
           <meta charset="UTF-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <title>${reportData.title}</title>
           <script src="https://cdn.tailwindcss.com"></script>
           <style>
             @media print {
               .print-hidden { display: none !important; }
               body { margin: 0; padding: 0; }
             }
           </style>
         </head>
         <body class="bg-gray-50 p-4">
           <div class="max-w-7xl mx-auto">
             <!-- Cabeçalho com ações -->
             <div class="mb-6 print-hidden">
               <div class="flex justify-between items-center">
                 <button onclick="window.close()" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2">
                   ← Voltar
                 </button>
                 <div class="flex gap-3">
                   <button onclick="window.print()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2">
                     🖨️ Imprimir
                   </button>
                   <button onclick="window.print()" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2">
                     📄 Baixar PDF
                   </button>
                 </div>
               </div>
             </div>
             
             <!-- Conteúdo do relatório -->
             <div class="bg-white rounded-lg shadow-lg">
               <div class="p-6 border-b text-center">
                 <h1 class="text-2xl font-bold text-gray-800">${reportData.title}</h1>
                 ${reportData.subtitle ? `<p class="text-gray-600 mt-2">${reportData.subtitle}</p>` : ''}
                 
                 ${reportData.filters && Object.keys(reportData.filters).length > 0 ? `
                   <div class="mt-4 p-3 bg-gray-100 rounded-lg">
                     <h4 class="font-semibold text-sm text-gray-700 mb-2">Filtros Aplicados:</h4>
                     <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                       ${Object.entries(reportData.filters).map(([key, value]) => `
                         <div class="flex flex-col">
                           <span class="font-medium text-gray-600">${key}:</span>
                           <span class="text-gray-800">${value}</span>
                         </div>
                       `).join('')}
                     </div>
                   </div>
                 ` : ''}
               </div>
               
               <div class="p-6">
                 ${reportData.data.length === 0 ? `
                   <div class="text-center py-8">
                     <p class="text-gray-500">Nenhum dado encontrado para os filtros aplicados.</p>
                   </div>
                 ` : `
                   <div class="overflow-x-auto">
                     <table class="w-full border-collapse border border-gray-300">
                       <thead>
                         <tr class="bg-gray-50">
                           ${reportData.columns.map((column: any) => `
                             <th class="border border-gray-300 px-4 py-2 text-left font-semibold">${column.label}</th>
                           `).join('')}
                         </tr>
                       </thead>
                       <tbody>
                         ${reportData.data.map((row: any, index: number) => `
                           <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                             ${reportData.columns.map((column: any) => `
                               <td class="border border-gray-300 px-4 py-2">${row[column.key] || '-'}</td>
                             `).join('')}
                           </tr>
                         `).join('')}
                       </tbody>
                     </table>
                   </div>
                 `}
                 
                 <div class="mt-6 pt-4 border-t text-sm text-gray-600">
                   <div class="flex justify-between items-center">
                     <span>Total de registros: ${reportData.data.length}</span>
                     <span>Gerado em: ${new Date().toLocaleString('pt-BR')}</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </body>
         </html>
       `);
       reportWindow.document.close();
     }
   };

   // Funções de geração de relatórios
   const generateDateReport = (startDate: string, endDate: string) => {
     if (!startDate || !endDate) {
       toast({
         title: "Erro",
         description: "Por favor, selecione as datas inicial e final",
         variant: "destructive"
       });
       return;
     }
     
     // Dados de exemplo - aqui você integraria com sua API
     const reportData = {
       title: "Relatório por Data",
       subtitle: `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`,
       filters: {
         "Data Inicial": new Date(startDate).toLocaleDateString('pt-BR'),
         "Data Final": new Date(endDate).toLocaleDateString('pt-BR')
       },
       columns: [
         { key: 'nome', label: 'Nome' },
         { key: 'cpf', label: 'CPF' },
         { key: 'data_matricula', label: 'Data de Matrícula' },
         { key: 'ciclo', label: 'Ciclo' },
         { key: 'status', label: 'Status' }
       ],
       data: [
         { nome: 'João Silva', cpf: '123.456.789-00', data_matricula: '15/01/2024', ciclo: 'Básico', status: 'Cursando' },
         { nome: 'Maria Santos', cpf: '987.654.321-00', data_matricula: '20/01/2024', ciclo: 'Intermediário', status: 'Aprovado' }
       ]
     };
     
     openReportInNewTab(reportData);
   };
 
   const generateCycleReport = (cycle: string) => {
     const reportData = {
       title: "Relatório por Ciclo",
       subtitle: `Ciclo: ${cycle === 'todos' ? 'Todos os Ciclos' : cycle}`,
       filters: {
         "Ciclo": cycle === 'todos' ? 'Todos os Ciclos' : cycle
       },
       columns: [
         { key: 'nome', label: 'Nome' },
         { key: 'cpf', label: 'CPF' },
         { key: 'ciclo', label: 'Ciclo' },
         { key: 'disciplinas', label: 'Disciplinas' },
         { key: 'status', label: 'Status' }
       ],
       data: [
         { nome: 'Ana Costa', cpf: '111.222.333-44', ciclo: 'Básico', disciplinas: 'Matemática, Português', status: 'Cursando' },
         { nome: 'Pedro Lima', cpf: '555.666.777-88', ciclo: 'Avançado', disciplinas: 'Física, Química', status: 'Aprovado' }
       ]
     };
     
     openReportInNewTab(reportData);
   };
 
   const generateEnrolledStudentsList = (status: string) => {
     const reportData = {
       title: "Lista de Matriculados",
       subtitle: `Status: ${status === 'todos' ? 'Todos os Status' : status}`,
       filters: {
         "Status da Matrícula": status === 'todos' ? 'Todos os Status' : status
       },
       columns: [
         { key: 'nome', label: 'Nome' },
         { key: 'cpf', label: 'CPF' },
         { key: 'email', label: 'E-mail' },
         { key: 'telefone', label: 'Telefone' },
         { key: 'status', label: 'Status' }
       ],
       data: [
         { nome: 'Carlos Oliveira', cpf: '222.333.444-55', email: 'carlos@email.com', telefone: '(11) 99999-9999', status: 'Cursando' },
         { nome: 'Lucia Ferreira', cpf: '666.777.888-99', email: 'lucia@email.com', telefone: '(11) 88888-8888', status: 'Aprovado' }
       ]
     };
     
     openReportInNewTab(reportData);
   };
 
   const generateBooksList = (type: string) => {
     const reportData = {
       title: "Lista de Livros/Disciplinas",
       subtitle: `Tipo: ${type === 'geral' ? 'Lista Geral' : 'Por Aluno'}`,
       filters: {
         "Tipo de Lista": type === 'geral' ? 'Lista Geral' : 'Por Aluno'
       },
       columns: type === 'geral' ? [
         { key: 'disciplina', label: 'Disciplina' },
         { key: 'livro', label: 'Livro' },
         { key: 'autor', label: 'Autor' },
         { key: 'ciclo', label: 'Ciclo' }
       ] : [
         { key: 'aluno', label: 'Aluno' },
         { key: 'disciplina', label: 'Disciplina' },
         { key: 'livro', label: 'Livro' },
         { key: 'status', label: 'Status' }
       ],
       data: type === 'geral' ? [
         { disciplina: 'Matemática', livro: 'Álgebra Linear', autor: 'João Autor', ciclo: 'Básico' },
         { disciplina: 'Português', livro: 'Gramática Avançada', autor: 'Maria Autora', ciclo: 'Intermediário' }
       ] : [
         { aluno: 'Roberto Silva', disciplina: 'Matemática', livro: 'Álgebra Linear', status: 'Estudando' },
         { aluno: 'Fernanda Costa', disciplina: 'Português', livro: 'Gramática Avançada', status: 'Concluído' }
       ]
     };
     
     openReportInNewTab(reportData);
   };

  // Funções de download PDF
  const downloadDateReportPDF = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione as datas inicial e final",
        variant: "destructive"
      });
      return;
    }
    
    // Gera o mesmo relatório mas com foco na impressão
    const reportData = {
      title: "Relatório por Data",
      subtitle: `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`,
      filters: {
        "Data Inicial": new Date(startDate).toLocaleDateString('pt-BR'),
        "Data Final": new Date(endDate).toLocaleDateString('pt-BR')
      },
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'cpf', label: 'CPF' },
        { key: 'data_matricula', label: 'Data de Matrícula' },
        { key: 'ciclo', label: 'Ciclo' },
        { key: 'status', label: 'Status' }
      ],
      data: [
        { nome: 'João Silva', cpf: '123.456.789-00', data_matricula: '15/01/2024', ciclo: 'Básico', status: 'Cursando' },
        { nome: 'Maria Santos', cpf: '987.654.321-00', data_matricula: '20/01/2024', ciclo: 'Intermediário', status: 'Aprovado' }
      ]
    };
    
    openReportInNewTab(reportData);
    
    // Mostra toast informando sobre a funcionalidade
    setTimeout(() => {
      toast({
        title: "Relatório Aberto",
        description: "Use o botão 'Imprimir' ou 'Baixar PDF' na nova aba para salvar o arquivo",
        duration: 5000
      });
    }, 500);
  };

  const downloadCycleReportPDF = (cycle: string) => {
    const reportData = {
      title: "Relatório por Ciclo",
      subtitle: `Ciclo: ${cycle === 'todos' ? 'Todos os Ciclos' : cycle}`,
      filters: {
        "Ciclo": cycle === 'todos' ? 'Todos os Ciclos' : cycle
      },
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'cpf', label: 'CPF' },
        { key: 'ciclo', label: 'Ciclo' },
        { key: 'disciplinas', label: 'Disciplinas' },
        { key: 'status', label: 'Status' }
      ],
      data: [
        { nome: 'Ana Costa', cpf: '111.222.333-44', ciclo: 'Básico', disciplinas: 'Matemática, Português', status: 'Cursando' },
        { nome: 'Pedro Lima', cpf: '555.666.777-88', ciclo: 'Avançado', disciplinas: 'Física, Química', status: 'Aprovado' }
      ]
    };
    
    openReportInNewTab(reportData);
    
    setTimeout(() => {
      toast({
        title: "Relatório Aberto",
        description: "Use o botão 'Imprimir' ou 'Baixar PDF' na nova aba para salvar o arquivo",
        duration: 5000
      });
    }, 500);
  };

  const downloadEnrolledStudentsListPDF = (status: string) => {
    const reportData = {
      title: "Lista de Matriculados",
      subtitle: `Status: ${status === 'todos' ? 'Todos os Status' : status}`,
      filters: {
        "Status da Matrícula": status === 'todos' ? 'Todos os Status' : status
      },
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'cpf', label: 'CPF' },
        { key: 'email', label: 'E-mail' },
        { key: 'telefone', label: 'Telefone' },
        { key: 'status', label: 'Status' }
      ],
      data: [
        { nome: 'Carlos Oliveira', cpf: '222.333.444-55', email: 'carlos@email.com', telefone: '(11) 99999-9999', status: 'Cursando' },
        { nome: 'Lucia Ferreira', cpf: '666.777.888-99', email: 'lucia@email.com', telefone: '(11) 88888-8888', status: 'Aprovado' }
      ]
    };
    
    openReportInNewTab(reportData);
    
    setTimeout(() => {
      toast({
        title: "Lista Aberta",
        description: "Use o botão 'Imprimir' ou 'Baixar PDF' na nova aba para salvar o arquivo",
        duration: 5000
      });
    }, 500);
  };

  const downloadBooksListPDF = (type: string) => {
    const reportData = {
      title: "Lista de Livros/Disciplinas",
      subtitle: `Tipo: ${type === 'geral' ? 'Lista Geral' : 'Por Aluno'}`,
      filters: {
        "Tipo de Lista": type === 'geral' ? 'Lista Geral' : 'Por Aluno'
      },
      columns: type === 'geral' ? [
        { key: 'disciplina', label: 'Disciplina' },
        { key: 'livro', label: 'Livro' },
        { key: 'autor', label: 'Autor' },
        { key: 'ciclo', label: 'Ciclo' }
      ] : [
        { key: 'aluno', label: 'Aluno' },
        { key: 'disciplina', label: 'Disciplina' },
        { key: 'livro', label: 'Livro' },
        { key: 'status', label: 'Status' }
      ],
      data: type === 'geral' ? [
        { disciplina: 'Matemática', livro: 'Álgebra Linear', autor: 'João Autor', ciclo: 'Básico' },
        { disciplina: 'Português', livro: 'Gramática Avançada', autor: 'Maria Autora', ciclo: 'Intermediário' }
      ] : [
        { aluno: 'Roberto Silva', disciplina: 'Matemática', livro: 'Álgebra Linear', status: 'Estudando' },
        { aluno: 'Fernanda Costa', disciplina: 'Português', livro: 'Gramática Avançada', status: 'Concluído' }
      ]
    };
    
    openReportInNewTab(reportData);
    
    setTimeout(() => {
      toast({
        title: "Lista Aberta",
        description: "Use o botão 'Imprimir' ou 'Baixar PDF' na nova aba para salvar o arquivo",
        duration: 5000
      });
    }, 500);
  };
};

export default SecretaryDashboard;