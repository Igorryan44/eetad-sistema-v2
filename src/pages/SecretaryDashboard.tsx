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
import { Calendar, FileText, Download, Eye, Users, BookOpen, GraduationCap, AlertCircle, Loader2, LogOut, Shield } from 'lucide-react';
import AuthenticationSystem from '../components/AuthenticationSystem';
import UserManagement from '../components/UserManagement';
import { authService } from '../services/authService';
import { supabase } from '@/integrations/supabase/client';

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

  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState({ 
    totalPendentes: 0, 
    matriculados: 0, 
    cursando: 0, 
    naoCursando: 0, 
    recuperacao: 0,
    aprovados: 0,
    reprovados: 0
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ ciclo: '', dataEvento: '', status: '', observacao: '' });
  
  // Estados para relatórios
  const [reportType, setReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedStudentForEnrollment, setSelectedStudentForEnrollment] = useState<Student | null>(null);
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
  const [enrollmentForm, setEnrollmentForm] = useState({
    ciclo: '',
    subnucleo: '',
    status: '',
    observacoes: ''
  });
  
  // Estados para edição de dados do aluno
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEnrollmentForEdit, setSelectedEnrollmentForEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    // Dados pessoais
    nome: '',
    cpf: '',
    rg: '',
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
    congregacao: '',
    // Dados de matrícula
    ciclo: '',
    subnucleo: '',
    status: '',
    observacao: ''
  });

  useEffect(() => {
    // Verificar autenticação
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    setCurrentUser(authService.getCurrentUser());

    if (authenticated) {
      fetchPendingStudents();
      fetchEnrollments();
      fetchAllStudents();
    }
  }, []);

  // useEffect para atualizar estatísticas quando os dados mudarem
  useEffect(() => {
    fetchStats();
  }, [pendingStudents, enrollments]);

  const fetchPendingStudents = async () => {
    try {
      console.log('🔍 Buscando alunos pendentes...');
      const response = await supabase.functions.invoke('get-pending-enrollments');
      console.log('📊 Resposta da função get-pending-enrollments:', response);
      
      if (response.error) {
        console.error('❌ Erro ao buscar alunos pendentes:', response.error);
        throw response.error;
      }
      
      // A função retorna um objeto com a propriedade pendingEnrollments
       const students = response.data?.pendingEnrollments || [];
       console.log('👥 Alunos pendentes recebidos:', students);
       console.log('📈 Quantidade de alunos pendentes:', students.length);
       
       setPendingStudents(students);
       console.log('✅ Estado de pendingStudents atualizado');
    } catch (error) {
      console.error('❌ Erro ao buscar alunos pendentes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar alunos pendentes",
        variant: "destructive",
      });
      setPendingStudents([]);
    }
  };

  const fetchEnrollments = async () => {
    try {
      console.log('🔍 Buscando matrículas...');
      const response = await supabase.functions.invoke('get-enrollments');
      console.log('📊 Resposta da função get-enrollments:', response);
      
      if (response.error) {
        console.error('❌ Erro ao buscar matrículas:', response.error);
        throw response.error;
      }
      
      // A função pode retornar um objeto com a propriedade enrollments ou diretamente um array
      const enrollments = response.data?.enrollments || response.data || [];
      console.log('📋 Matrículas recebidas:', enrollments);
      console.log('📈 Quantidade de matrículas:', Array.isArray(enrollments) ? enrollments.length : 'Não é array');
      
      setEnrollments(Array.isArray(enrollments) ? enrollments : []);
      console.log('✅ Estado de enrollments atualizado');
    } catch (error) {
      console.error('❌ Erro ao buscar matrículas:', error);
      setEnrollments([]);
      
      toast({
        title: "Erro",
        description: "Erro ao carregar matrículas",
        variant: "destructive"
      });
    }
  };

  const fetchAllStudents = async () => {
    try {
      // Aguardar que os dados sejam carregados primeiro
      setTimeout(() => {
        // Combinar alunos pendentes e matriculados
        const allStudents: Student[] = [
          ...(Array.isArray(pendingStudents) ? pendingStudents : []),
          ...enrollments.map(e => ({
            id: e.studentId,
            nome: e.nome || 'Nome não informado',
            cpf: '',
            email: '',
            telefone: '',
            ciclo: e.ciclo
          }))
        ];
        
        setAllStudents(allStudents);
      }, 100);
    } catch (error) {
      console.error('Erro ao buscar todos os alunos:', error);
      setAllStudents([]);
    }
  };

  const fetchStats = () => {
    try {
      // Calcular estatísticas reais baseadas nos dados
      const totalMatriculados = enrollments.filter(e => e.status === 'matriculado').length;
      const totalCursando = enrollments.filter(e => e.status === 'cursando').length;
      const totalNaoCursando = enrollments.filter(e => e.status === 'nao-cursando').length;
      const totalRecuperacao = enrollments.filter(e => e.status === 'recuperacao').length;
      const totalAprovados = enrollments.filter(e => e.status === 'aprovado').length;
      const totalReprovados = enrollments.filter(e => e.status === 'reprovado').length;
      
      // CORREÇÃO: Calcular total de pendentes baseado no array pendingStudents
      const totalPendentesAtual = Array.isArray(pendingStudents) ? pendingStudents.length : 0;
      console.log('📊 Atualizando stats - Total pendentes:', totalPendentesAtual);
      console.log('📊 Dados pendingStudents:', pendingStudents);
      
      setStats(prev => ({
        ...prev,
        totalPendentes: totalPendentesAtual, // ADICIONADO: Atualizar contador de pendentes
        matriculados: totalMatriculados,
        cursando: totalCursando,
        naoCursando: totalNaoCursando,
        recuperacao: totalRecuperacao,
        aprovados: totalAprovados,
        reprovados: totalReprovados
      }));
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  };

  // Funções de autenticação
  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setCurrentUser(authService.getCurrentUser());
    
    // Carregar dados após autenticação
    fetchPendingStudents();
    fetchEnrollments();
    fetchAllStudents();
    fetchStats();
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    
    // Limpar dados sensíveis
    setPendingStudents([]);
    setEnrollments([]);
    setAllStudents([]);
    setStats({ 
      totalPendentes: 0, 
      matriculados: 0, 
      cursando: 0, 
      naoCursando: 0, 
      recuperacao: 0,
      aprovados: 0,
      reprovados: 0
    });
  };

  // Função para cancelar e voltar à página inicial
  const handleCancel = () => {
    window.location.href = '/';
  };

  // CORREÇÃO: Definir função openEnrollmentForm ANTES do return condicional
  const openEnrollmentForm = (student: Student) => {
    console.log('🎯 Abrindo formulário de efetivação para:', student);
    setSelectedStudentForEnrollment(student);
    setEnrollmentForm({
      ciclo: '',
      subnucleo: '',
      status: '',
      observacoes: ''
    });
    setIsEnrollmentDialogOpen(true);
    console.log('✅ Diálogo de efetivação aberto');
  };

  // CORREÇÃO: Definir função finalizeEnrollment ANTES do return condicional
  const finalizeEnrollment = async () => {
    if (!selectedStudentForEnrollment || !enrollmentForm.ciclo || !enrollmentForm.subnucleo || !enrollmentForm.status) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios (Ciclo, Subnúcleo e Status)",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🎯 Efetivando matrícula para:', selectedStudentForEnrollment);
      
      // Chamar função do Supabase para efetivar matrícula
      const response = await supabase.functions.invoke('finalize-enrollment', {
        body: {
          cpf: selectedStudentForEnrollment.cpf,
          ciclo: enrollmentForm.ciclo,
          subnucleo: enrollmentForm.subnucleo,
          dataEvento: new Date().toLocaleDateString('pt-BR'),
          status: enrollmentForm.status,
          observacao: enrollmentForm.observacoes,
          rowIndex: selectedStudentForEnrollment.rowIndex
        }
      });

      if (response.error) {
        console.error('❌ Erro na função finalize-enrollment:', response.error);
        throw response.error;
      }

      console.log('✅ Matrícula efetivada com sucesso:', response.data);

      // Atualizar listas locais
      await fetchEnrollments();
      await fetchPendingStudents();

      // Fechar diálogo
      setIsEnrollmentDialogOpen(false);
      setSelectedStudentForEnrollment(null);

      toast({
        title: "Sucesso",
        description: "Matrícula efetivada e salva na planilha com sucesso!"
      });
    } catch (error) {
      console.error('❌ Erro ao efetivar matrícula:', error);
      toast({
        title: "Erro",
        description: "Erro ao efetivar matrícula. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para buscar dados pessoais do aluno
  const fetchPersonalData = async (cpf: string) => {
    try {
      console.log('🔍 Buscando dados pessoais para CPF:', cpf);
      
      // TODO: Implementar chamada para função que busca dados pessoais
      // Por enquanto, retornar dados básicos do enrollment
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar dados pessoais:', error);
      return null;
    }
  };

  // Função para abrir formulário de edição de cadastro do aluno
  const openEditStudentForm = async (enrollment: any) => {
    console.log('✏️ Abrindo formulário de edição para:', enrollment);
    setSelectedEnrollmentForEdit(enrollment);
    
    // Buscar dados pessoais completos do aluno
    const personalData = await fetchPersonalData(enrollment.cpf);
    
    // Se encontrou dados pessoais, usar eles; senão usar dados do enrollment
    const formData = personalData || enrollment;
    
    setEditForm({
      nome: formData.nome || '',
      cpf: formData.cpf || '',
      rg: formData.rg || '',
      telefone: formData.telefone || '',
      email: formData.email || '',
      sexo: formData.sexo || '',
      estadoCivil: formData.estadoCivil || '',
      dataNascimento: formData.dataNascimento || '',
      ufNascimento: formData.ufNascimento || '',
      escolaridade: formData.escolaridade || '',
      profissao: formData.profissao || '',
      nacionalidade: formData.nacionalidade || '',
      cargoIgreja: formData.cargoIgreja || '',
      enderecoRua: formData.enderecoRua || '',
      cep: formData.cep || '',
      numero: formData.numero || '',
      bairro: formData.bairro || '',
      cidade: formData.cidade || '',
      uf: formData.uf || '',
      congregacao: formData.congregacao || '',
      // Manter campos de matrícula
      ciclo: enrollment.ciclo || '',
      subnucleo: enrollment.subnucleo || '',
      status: enrollment.status || '',
      observacao: enrollment.observacao || ''
    });
    
    setIsEditDialogOpen(true);
    console.log('✅ Diálogo de edição aberto com dados pessoais');
  };

  // Função para salvar edição de dados do aluno
  const saveEditedData = async () => {
    if (!selectedEnrollmentForEdit || !editForm.nome || !editForm.ciclo) {
      toast({
        title: "Erro",
        description: "Por favor, preencha os campos obrigatórios (Nome e Ciclo)",
        variant: "destructive"
      });
      return;
    }

    try {
      // TODO: Implementar chamada para função Supabase para atualizar dados
      console.log('💾 Salvando dados editados:', editForm);
      
      // Atualizar localmente por enquanto
      setEnrollments(prev => prev.map(enrollment => 
        enrollment.id === selectedEnrollmentForEdit.id 
          ? { ...enrollment, ...editForm }
          : enrollment
      ));

      // Fechar diálogo
      setIsEditDialogOpen(false);
      setSelectedEnrollmentForEdit(null);

      toast({
        title: "Sucesso",
        description: "Dados atualizados com sucesso!"
      });
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados do aluno",
        variant: "destructive"
      });
    }
  };

  // Renderização condicional baseada na autenticação
  if (!isAuthenticated) {
    return <AuthenticationSystem onAuthenticated={handleAuthenticated} onCancel={handleCancel} />;
  }

  const handleUpdateStatus = async (enrollmentId: string, newStatus: string) => {
    // TODO: Chamar função Supabase para atualizar status
    toast({ title: 'Status atualizado' });
    fetchEnrollments();
    fetchStats();
  };

  const handleUpdateData = async (studentId: string, field: string, value: string) => {
    // TODO: Chamar função Supabase para atualizar dados pessoais
    toast({ title: 'Dados atualizados' });
    fetchPendingStudents();
    fetchEnrollments();
  };

  const generateReport = async (type: string) => {
    setIsGeneratingReport(true);
    setReportType(type);
    
    try {
      let reportContent = '';
      let reportTitle = '';
      
      switch (type) {
        case 'date':
          if (!dateRange.startDate || !dateRange.endDate) {
            toast({
              title: "Erro",
              description: "Por favor, selecione o período para o relatório",
              variant: "destructive"
            });
            return;
          }
          reportTitle = `Relatório de Alunos por Data - ${dateRange.startDate} a ${dateRange.endDate}`;
          reportContent = await generateDateReport();
          if (!reportContent) {
            toast({
              title: "Aviso",
              description: "Não há dados suficientes para gerar este relatório",
              variant: "destructive"
            });
            return;
          }
          break;
          
        case 'cycle':
          if (!selectedCycle) {
            toast({
              title: "Erro", 
              description: "Por favor, selecione um ciclo",
              variant: "destructive"
            });
            return;
          }
          reportTitle = `Relatório por Ciclo - ${selectedCycle}`;
          reportContent = await generateCycleReport();
          if (!reportContent) {
            toast({
              title: "Aviso",
              description: "Não há dados suficientes para gerar este relatório",
              variant: "destructive"
            });
            return;
          }
          break;
          
        case 'status':
          reportTitle = 'Relatório de Alunos Cursando/Não Cursando';
          reportContent = await generateStatusReport();
          if (!reportContent) {
            toast({
              title: "Aviso",
              description: "Não há dados suficientes para gerar este relatório",
              variant: "destructive"
            });
            return;
          }
          break;
          
        case 'grade':
          reportTitle = 'Relatório de Alunos Aprovados/Reprovados/Recuperação';
          reportContent = await generateGradeReport();
          if (!reportContent) {
            toast({
              title: "Aviso",
              description: "Não há dados suficientes para gerar este relatório",
              variant: "destructive"
            });
            return;
          }
          break;
          
        case 'books':
          if (!selectedStudentForReport) {
            toast({
              title: "Erro",
              description: "Por favor, selecione um aluno",
              variant: "destructive"
            });
            return;
          }
          reportTitle = `Relatório de Livros - ${allStudents.find(s => s.id === selectedStudentForReport)?.nome}`;
          reportContent = await generateBooksReport();
          if (!reportContent) {
            toast({
              title: "Aviso",
              description: "Não há dados suficientes para gerar este relatório",
              variant: "destructive"
            });
            return;
          }
          break;
      }
      
      // Abrir relatório em nova aba
      openReportInNewTab(reportTitle, reportContent);
      
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso!"
      });
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generateDateReport = async (): Promise<string | null> => {
    const filteredEnrollments = enrollments.filter(enrollment => {
      const enrollmentDate = new Date(enrollment.dataEvento);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return enrollmentDate >= start && enrollmentDate <= end;
    });
    
    if (filteredEnrollments.length === 0) {
      return null;
    }
    
    return `
      <div class="report-content">
        <h2>Relatório de Alunos por Data</h2>
        <p><strong>Período:</strong> ${dateRange.startDate} a ${dateRange.endDate}</p>
        <br>
        <table border="1" style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="padding: 10px; background-color: #f0f0f0;">Nome</th>
            <th style="padding: 10px; background-color: #f0f0f0;">Ciclo</th>
            <th style="padding: 10px; background-color: #f0f0f0;">Subnúcleo</th>
            <th style="padding: 10px; background-color: #f0f0f0;">Status</th>
            <th style="padding: 10px; background-color: #f0f0f0;">Data</th>
          </tr>
          ${filteredEnrollments.map(enrollment => `
            <tr>
              <td style="padding: 10px;">${enrollment.nome}</td>
              <td style="padding: 10px;">${enrollment.ciclo}</td>
              <td style="padding: 10px;">${enrollment.subnucleo || 'Não informado'}</td>
              <td style="padding: 10px;">${enrollment.status}</td>
              <td style="padding: 10px;">${enrollment.dataEvento}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  };

  const generateCycleReport = async (): Promise<string | null> => {
    const cycleNames = {
      'basico': '1º Ciclo - Formação Básica',
      'medio': '2º Ciclo - Formação Intermediária', 
      'avancado': '3º Ciclo - Formação Avançada'
    };
    
    const filteredEnrollments = enrollments.filter(e => e.ciclo === selectedCycle);
    
    if (filteredEnrollments.length === 0) {
      return null;
    }
    
    return `
      <div class="report-content">
        <h2>Relatório por Ciclo</h2>
        <p><strong>Ciclo:</strong> ${cycleNames[selectedCycle as keyof typeof cycleNames]}</p>
        <br>
        <table border="1" style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="padding: 10px; background-color: #f5f5f5;">Nome</th>
            <th style="padding: 10px; background-color: #f5f5f5;">CPF</th>
            <th style="padding: 10px; background-color: #f5f5f5;">Subnúcleo</th>
            <th style="padding: 10px; background-color: #f5f5f5;">Status</th>
            <th style="padding: 10px; background-color: #f5f5f5;">Data Matrícula</th>
          </tr>
          ${filteredEnrollments.map(enrollment => `
            <tr>
              <td style="padding: 10px;">${enrollment.nome || 'N/A'}</td>
              <td style="padding: 10px;">${(Array.isArray(pendingStudents) ? pendingStudents : []).find(s => s.id === enrollment.studentId)?.cpf || 'N/A'}</td>
              <td style="padding: 10px;">${enrollment.subnucleo || 'Não informado'}</td>
              <td style="padding: 10px;">${enrollment.status}</td>
              <td style="padding: 10px;">${enrollment.dataEvento}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  };

  const generateStatusReport = async (): Promise<string | null> => {
    const cursando = enrollments.filter(e => e.status === 'cursando');
    const naoCursando = enrollments.filter(e => e.status === 'nao-cursando');
    
    // Verificar se há dados para exibir
    if (cursando.length === 0 && naoCursando.length === 0) {
      return null;
    }
    
    return `
      <div class="report-content">
        <h2>Relatório de Status dos Alunos</h2>
        <br>
        <h3>Alunos Cursando (${cursando.length})</h3>
        ${cursando.length > 0 ? `
        <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <th style="padding: 10px; background-color: #e8f5e8;">Nome</th>
            <th style="padding: 10px; background-color: #e8f5e8;">Ciclo</th>
            <th style="padding: 10px; background-color: #e8f5e8;">Subnúcleo</th>
            <th style="padding: 10px; background-color: #e8f5e8;">Data Matrícula</th>
          </tr>
          ${cursando.map(enrollment => `
            <tr>
              <td style="padding: 10px;">${enrollment.nome || 'N/A'}</td>
              <td style="padding: 10px;">${enrollment.ciclo}</td>
              <td style="padding: 10px;">${enrollment.subnucleo || 'Não informado'}</td>
              <td style="padding: 10px;">${enrollment.dataEvento}</td>
            </tr>
          `).join('')}
        </table>
        ` : '<p style="color: #666; font-style: italic;">Nenhum aluno cursando encontrado.</p>'}
        
        <h3>Alunos Não Cursando (${naoCursando.length})</h3>
        ${naoCursando.length > 0 ? `
        <table border="1" style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="padding: 10px; background-color: #ffe8e8;">Nome</th>
            <th style="padding: 10px; background-color: #ffe8e8;">Ciclo</th>
            <th style="padding: 10px; background-color: #ffe8e8;">Subnúcleo</th>
            <th style="padding: 10px; background-color: #ffe8e8;">Observação</th>
          </tr>
          ${naoCursando.map(enrollment => `
            <tr>
              <td style="padding: 10px;">${enrollment.nome || 'N/A'}</td>
              <td style="padding: 10px;">${enrollment.ciclo}</td>
              <td style="padding: 10px;">${enrollment.subnucleo || 'Não informado'}</td>
              <td style="padding: 10px;">${enrollment.observacao || 'N/A'}</td>
            </tr>
          `).join('')}
        </table>
        ` : '<p style="color: #666; font-style: italic;">Nenhum aluno não cursando encontrado.</p>'}
      </div>
    `;
  };

  const generateGradeReport = async (): Promise<string | null> => {
    const aprovados = enrollments.filter(e => e.status === 'aprovado');
    const reprovados = enrollments.filter(e => e.status === 'reprovado');
    const recuperacao = enrollments.filter(e => e.status === 'recuperacao');
    
    // Verificar se há dados para exibir
    if (aprovados.length === 0 && reprovados.length === 0 && recuperacao.length === 0) {
      return null;
    }
    
    return `
      <div class="report-content">
        <h2>Relatório de Aproveitamento</h2>
        <br>
        <div style="margin-bottom: 20px;">
          <h3 style="color: green;">Aprovados (${aprovados.length})</h3>
          ${aprovados.length > 0 ? `
          <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <th style="padding: 10px; background-color: #e8f5e8;">Nome</th>
              <th style="padding: 10px; background-color: #e8f5e8;">Ciclo</th>
              <th style="padding: 10px; background-color: #e8f5e8;">Subnúcleo</th>
              <th style="padding: 10px; background-color: #e8f5e8;">Data</th>
            </tr>
            ${aprovados.map(enrollment => `
              <tr>
                <td style="padding: 10px;">${enrollment.nome || 'N/A'}</td>
                <td style="padding: 10px;">${enrollment.ciclo}</td>
                <td style="padding: 10px;">${enrollment.subnucleo || 'Não informado'}</td>
                <td style="padding: 10px;">${enrollment.dataEvento}</td>
              </tr>
            `).join('')}
          </table>
          ` : '<p style="color: #666; font-style: italic;">Nenhum aluno aprovado encontrado.</p>'}
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: red;">Reprovados (${reprovados.length})</h3>
          ${reprovados.length > 0 ? `
          <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <th style="padding: 10px; background-color: #ffe8e8;">Nome</th>
              <th style="padding: 10px; background-color: #ffe8e8;">Ciclo</th>
              <th style="padding: 10px; background-color: #ffe8e8;">Subnúcleo</th>
              <th style="padding: 10px; background-color: #ffe8e8;">Observação</th>
            </tr>
            ${reprovados.map(enrollment => `
              <tr>
                <td style="padding: 10px;">${enrollment.nome || 'N/A'}</td>
                <td style="padding: 10px;">${enrollment.ciclo}</td>
                <td style="padding: 10px;">${enrollment.subnucleo || 'Não informado'}</td>
                <td style="padding: 10px;">${enrollment.observacao || 'N/A'}</td>
              </tr>
            `).join('')}
          </table>
          ` : '<p style="color: #666; font-style: italic;">Nenhum aluno reprovado encontrado.</p>'}
        </div>
        
        <div>
          <h3 style="color: orange;">Em Recuperação (${recuperacao.length})</h3>
          ${recuperacao.length > 0 ? `
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="padding: 10px; background-color: #fff3cd;">Nome</th>
              <th style="padding: 10px; background-color: #fff3cd;">Ciclo</th>
              <th style="padding: 10px; background-color: #fff3cd;">Subnúcleo</th>
              <th style="padding: 10px; background-color: #fff3cd;">Observação</th>
            </tr>
            ${recuperacao.map(enrollment => `
              <tr>
                <td style="padding: 10px;">${enrollment.nome || 'N/A'}</td>
                <td style="padding: 10px;">${enrollment.ciclo}</td>
                <td style="padding: 10px;">${enrollment.subnucleo || 'Não informado'}</td>
                <td style="padding: 10px;">${enrollment.observacao || 'N/A'}</td>
              </tr>
            `).join('')}
          </table>
          ` : '<p style="color: #666; font-style: italic;">Nenhum aluno em recuperação encontrado.</p>'}
        </div>
      </div>
    `;
  };

  const generateBooksReport = async (): Promise<string | null> => {
    const student = allStudents.find(s => s.id === selectedStudentForReport);
    if (!student) return null;
    
    // TODO: Implementar busca real de livros por aluno via Supabase
    const books: any[] = [];
    
    if (books.length === 0) {
      return `
        <div class="report-content">
          <h2>Relatório de Livros por Aluno</h2>
          <p><strong>Aluno:</strong> ${student.nome}</p>
          <p><strong>CPF:</strong> ${student.cpf}</p>
          <br>
          <p>Nenhum livro encontrado para este aluno.</p>
        </div>
      `;
    }
    
    return `
      <div class="report-content">
        <h2>Relatório de Livros por Aluno</h2>
        <p><strong>Aluno:</strong> ${student.nome}</p>
        <p><strong>CPF:</strong> ${student.cpf}</p>
        <br>
        <table border="1" style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="padding: 10px; background-color: #f5f5f5;">Título do Livro</th>
            <th style="padding: 10px; background-color: #f5f5f5;">Ciclo</th>
            <th style="padding: 10px; background-color: #f5f5f5;">Status</th>
            <th style="padding: 10px; background-color: #f5f5f5;">Data Entrega</th>
          </tr>
          ${books.map(book => `
            <tr>
              <td style="padding: 10px;">${book.titulo}</td>
              <td style="padding: 10px;">${book.ciclo}</td>
              <td style="padding: 10px; color: ${book.status === 'Entregue' ? 'green' : 'orange'};">${book.status}</td>
              <td style="padding: 10px;">${book.data}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  };

  const openReportInNewTab = (title: string, content: string) => {
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .report-content { max-width: 800px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .print-btn { margin: 20px 0; text-align: center; }
            .download-btn { margin: 20px 0; text-align: center; }
            @media print { .print-btn, .download-btn { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>EETAD - Núcleo Palmas - TO</h1>
            <h2>${title}</h2>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
          
          <div class="print-btn">
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
              🖨️ Imprimir Relatório
            </button>
          </div>
          
          ${content}
          
          <div class="download-btn">
            <button onclick="downloadPDF()" style="padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
              📄 Baixar PDF
            </button>
          </div>
          
          <script>
            function downloadPDF() {
              alert('Funcionalidade de download PDF será implementada em breve!');
            }
          </script>
        </body>
        </html>
      `);
      reportWindow.document.close();
    }
  };

  // Interface principal da secretaria (protegida)
  const dashboardContent = (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard Secretaria</h1>
      <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="pending">Matrículas Pendentes</TabsTrigger>
            <TabsTrigger value="enrollments">Matriculados</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Matrículas Pendentes</span>
                  <span className="text-3xl font-bold text-blue-600">{stats.totalPendentes}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    const pendingArray = Array.isArray(pendingStudents) ? pendingStudents : [];
                    console.log('🎨 Renderizando alunos pendentes:', pendingArray);
                    console.log('📊 Quantidade para renderizar:', pendingArray.length);
                    
                    if (pendingArray.length === 0) {
                      return <p className="text-gray-500 text-center py-4">Nenhum aluno pendente</p>;
                    }
                    
                    return pendingArray.slice(0, 5).map(student => {
                      console.log('👤 Renderizando aluno:', student);
                      return (
                        <div 
                          key={student.id} 
                          className="flex justify-between items-center p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => openEnrollmentForm(student)}
                        >
                          <div>
                            <span className="font-medium">{student.nome}</span>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-600">{student.cpf}</span>
                            <p className="text-xs text-blue-600">Clique para efetivar</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  {(() => {
                    const pendingArray = Array.isArray(pendingStudents) ? pendingStudents : [];
                    if (pendingArray.length > 5) {
                      return (
                        <p className="text-sm text-gray-500 text-center py-2">
                          E mais {pendingArray.length - 5} aluno(s)... 
                          <span className="text-blue-600 cursor-pointer hover:underline ml-1">
                            Ver todos na aba "Matrículas Pendentes"
                          </span>
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Alunos Matriculados</CardTitle></CardHeader>
              <CardContent><p className="text-4xl">{stats.matriculados}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Alunos Cursando</CardTitle></CardHeader>
              <CardContent><p className="text-4xl">{stats.cursando}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Alunos Não Cursando</CardTitle></CardHeader>
              <CardContent><p className="text-4xl">{stats.naoCursando}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Alunos em Recuperação</CardTitle></CardHeader>
              <CardContent><p className="text-4xl">{stats.recuperacao}</p></CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="pending">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const pendingArray = Array.isArray(pendingStudents) ? pendingStudents : [];
                console.log('📋 Renderizando tabela de alunos pendentes:', pendingArray);
                console.log('📊 Quantidade na tabela:', pendingArray.length);
                
                return pendingArray.map((student) => {
                  console.log('👤 Renderizando linha da tabela para:', student);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>{student.nome}</TableCell>
                      <TableCell>{student.cpf}</TableCell>
                      <TableCell>
                        <Button onClick={() => openEnrollmentForm(student)}>Efetivar Matrícula</Button>
                      </TableCell>
                    </TableRow>
                  );
                });
              })()}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="enrollments">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Subnúcleo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => {
                return (
                  <TableRow key={enrollment.id}>
                    <TableCell>{enrollment.nome}</TableCell>
                    <TableCell>{enrollment.ciclo}</TableCell>
                    <TableCell>{enrollment.subnucleo || 'Não informado'}</TableCell>
                    <TableCell>{enrollment.status}</TableCell>
                    <TableCell>
                      <Select onValueChange={(value) => handleUpdateStatus(enrollment.id, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Alterar Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="matriculado">Matriculado</SelectItem>
                          <SelectItem value="cursando">Cursando</SelectItem>
                          <SelectItem value="nao-cursando">Não Cursando</SelectItem>
                          <SelectItem value="transferido">Transferido</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="reprovado">Reprovado</SelectItem>
                          <SelectItem value="recuperacao">Recuperação</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" className="ml-2" onClick={() => openEditStudentForm(enrollment)}>Editar Cadastro</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="reports">
          <div className="space-y-6">
            {/* Relatório por Data */}
            <Card>
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Calendar className="h-5 w-5" />
                   Relatório de Alunos por Data
                 </CardTitle>
               </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-2">Data Inicial</label>
                    <Input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Data Final</label>
                    <Input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <Button 
                    onClick={() => generateReport('date')}
                    disabled={isGeneratingReport}
                    className="w-full"
                  >
                    {isGeneratingReport && reportType === 'date' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      'Gerar Relatório'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Relatório por Ciclo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Relatório por Ciclo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-2">Selecionar Ciclo</label>
                    <select
                      value={selectedCycle}
                      onChange={(e) => setSelectedCycle(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione um ciclo</option>
                      <option value="basico">1º Ciclo - Formação Básica</option>
                      <option value="medio">2º Ciclo - Formação Intermediária</option>
                      <option value="avancado">3º Ciclo - Formação Avançada</option>
                    </select>
                  </div>
                  <Button 
                    onClick={() => generateReport('cycle')}
                    disabled={isGeneratingReport}
                    className="w-full"
                  >
                    {isGeneratingReport && reportType === 'cycle' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      'Gerar Relatório'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Relatório de Status dos Alunos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Alunos Cursando/Não Cursando
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => generateReport('status')}
                  disabled={isGeneratingReport}
                  className="w-full"
                >
                  {isGeneratingReport && reportType === 'status' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    'Gerar Relatório'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Relatório de Aproveitamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Aprovados/Reprovados/Recuperação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => generateReport('grade')}
                  disabled={isGeneratingReport}
                  className="w-full"
                >
                  {isGeneratingReport && reportType === 'grade' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    'Gerar Relatório'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Relatório de Livros por Aluno */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Livros por Aluno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-2">Selecionar Aluno</label>
                    <select
                      value={selectedStudentForReport}
                      onChange={(e) => setSelectedStudentForReport(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione um aluno</option>
                      {allStudents.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.nome} - {student.ciclo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    onClick={() => generateReport('books')}
                    disabled={isGeneratingReport}
                    className="w-full"
                  >
                    {isGeneratingReport && reportType === 'books' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      'Gerar Relatório'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>

      {/* Dialog de Efetivação de Matrícula */}
      <Dialog open={isEnrollmentDialogOpen} onOpenChange={setIsEnrollmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Efetivar Matrícula</DialogTitle>
          </DialogHeader>
          {selectedStudentForEnrollment && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={selectedStudentForEnrollment.nome} disabled />
              </div>
              <div>
                <Label>CPF</Label>
                <Input value={selectedStudentForEnrollment.cpf} disabled />
              </div>
              <div>
                <Label>Ciclo *</Label>
                <Select value={enrollmentForm.ciclo} onValueChange={(value) => setEnrollmentForm(prev => ({ ...prev, ciclo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">1º Ciclo - Formação Básica</SelectItem>
                    <SelectItem value="medio">2º Ciclo - Formação Intermediária</SelectItem>
                    <SelectItem value="avancado">3º Ciclo - Formação Avançada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subnúcleo *</Label>
                <Select value={enrollmentForm.subnucleo} onValueChange={(value) => setEnrollmentForm(prev => ({ ...prev, subnucleo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o subnúcleo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arno44">ARNO 44</SelectItem>
                    <SelectItem value="sede">Sede</SelectItem>
                    <SelectItem value="aureny3">Aureny III</SelectItem>
                    <SelectItem value="taquari">Taquarí</SelectItem>
                    <SelectItem value="morada-sol2">Morada do Sol II</SelectItem>
                    <SelectItem value="luzimanges">Luzimanges</SelectItem>
                    <SelectItem value="colinas-to">Colinas - TO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status *</Label>
                <Select value={enrollmentForm.status} onValueChange={(value) => setEnrollmentForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matriculado">Matriculado</SelectItem>
                    <SelectItem value="cursando">Cursando</SelectItem>
                    <SelectItem value="nao-cursando">Não Cursando</SelectItem>
                    <SelectItem value="transferido">Transferido para outro subnúcleo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações</Label>
                <Input 
                  value={enrollmentForm.observacoes}
                  onChange={(e) => setEnrollmentForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEnrollmentDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={finalizeEnrollment} className="flex-1">
                  Efetivar Matrícula
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Cadastro do Aluno */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cadastro do Aluno</DialogTitle>
          </DialogHeader>
          {selectedEnrollmentForEdit && (
            <div className="space-y-6">
              {/* Dados Pessoais */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input 
                      value={editForm.nome}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Nome completo do aluno"
                    />
                  </div>
                  <div>
                    <Label>CPF</Label>
                    <Input 
                      value={editForm.cpf}
                      onChange={(e) => setEditForm(prev => ({ ...prev, cpf: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label>RG</Label>
                    <Input 
                      value={editForm.rg}
                      onChange={(e) => setEditForm(prev => ({ ...prev, rg: e.target.value }))}
                      placeholder="RG do aluno"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input 
                      value={editForm.telefone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      type="email"
                    />
                  </div>
                  <div>
                    <Label>Sexo</Label>
                    <Select value={editForm.sexo} onValueChange={(value) => setEditForm(prev => ({ ...prev, sexo: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado Civil</Label>
                    <Select value={editForm.estadoCivil} onValueChange={(value) => setEditForm(prev => ({ ...prev, estadoCivil: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado civil" />
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
                    <Label>Data de Nascimento</Label>
                    <Input 
                      value={editForm.dataNascimento}
                      onChange={(e) => setEditForm(prev => ({ ...prev, dataNascimento: e.target.value }))}
                      placeholder="DD/MM/AAAA"
                      type="date"
                    />
                  </div>
                  <div>
                    <Label>UF de Nascimento</Label>
                    <Input 
                      value={editForm.ufNascimento}
                      onChange={(e) => setEditForm(prev => ({ ...prev, ufNascimento: e.target.value }))}
                      placeholder="TO"
                    />
                  </div>
                  <div>
                    <Label>Escolaridade</Label>
                    <Select value={editForm.escolaridade} onValueChange={(value) => setEditForm(prev => ({ ...prev, escolaridade: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a escolaridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fundamental-incompleto">Ensino Fundamental Incompleto</SelectItem>
                        <SelectItem value="fundamental-completo">Ensino Fundamental Completo</SelectItem>
                        <SelectItem value="medio-incompleto">Ensino Médio Incompleto</SelectItem>
                        <SelectItem value="medio-completo">Ensino Médio Completo</SelectItem>
                        <SelectItem value="superior-incompleto">Ensino Superior Incompleto</SelectItem>
                        <SelectItem value="superior-completo">Ensino Superior Completo</SelectItem>
                        <SelectItem value="pos-graduacao">Pós-graduação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Profissão</Label>
                    <Input 
                      value={editForm.profissao}
                      onChange={(e) => setEditForm(prev => ({ ...prev, profissao: e.target.value }))}
                      placeholder="Profissão atual"
                    />
                  </div>
                  <div>
                    <Label>Nacionalidade</Label>
                    <Input 
                      value={editForm.nacionalidade}
                      onChange={(e) => setEditForm(prev => ({ ...prev, nacionalidade: e.target.value }))}
                      placeholder="Brasileira"
                    />
                  </div>
                  <div>
                    <Label>Cargo na Igreja</Label>
                    <Input 
                      value={editForm.cargoIgreja}
                      onChange={(e) => setEditForm(prev => ({ ...prev, cargoIgreja: e.target.value }))}
                      placeholder="Cargo ou função na igreja"
                    />
                  </div>
                  <div>
                    <Label>Congregação</Label>
                    <Input 
                      value={editForm.congregacao}
                      onChange={(e) => setEditForm(prev => ({ ...prev, congregacao: e.target.value }))}
                      placeholder="Nome da congregação"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Rua/Avenida</Label>
                    <Input 
                      value={editForm.enderecoRua}
                      onChange={(e) => setEditForm(prev => ({ ...prev, enderecoRua: e.target.value }))}
                      placeholder="Nome da rua ou avenida"
                    />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input 
                      value={editForm.numero}
                      onChange={(e) => setEditForm(prev => ({ ...prev, numero: e.target.value }))}
                      placeholder="Número da residência"
                    />
                  </div>
                  <div>
                    <Label>Bairro</Label>
                    <Input 
                      value={editForm.bairro}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bairro: e.target.value }))}
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input 
                      value={editForm.cep}
                      onChange={(e) => setEditForm(prev => ({ ...prev, cep: e.target.value }))}
                      placeholder="00000-000"
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input 
                      value={editForm.cidade}
                      onChange={(e) => setEditForm(prev => ({ ...prev, cidade: e.target.value }))}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input 
                      value={editForm.uf}
                      onChange={(e) => setEditForm(prev => ({ ...prev, uf: e.target.value }))}
                      placeholder="TO"
                    />
                  </div>
                </div>
              </div>

              {/* Dados de Matrícula */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Dados de Matrícula</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ciclo *</Label>
                    <Select value={editForm.ciclo} onValueChange={(value) => setEditForm(prev => ({ ...prev, ciclo: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ciclo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basico">1º Ciclo - Formação Básica</SelectItem>
                        <SelectItem value="medio">2º Ciclo - Formação Intermediária</SelectItem>
                        <SelectItem value="avancado">3º Ciclo - Formação Avançada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subnúcleo</Label>
                    <Select value={editForm.subnucleo} onValueChange={(value) => setEditForm(prev => ({ ...prev, subnucleo: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o subnúcleo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arno44">ARNO 44</SelectItem>
                        <SelectItem value="sede">Sede</SelectItem>
                        <SelectItem value="aureny3">Aureny III</SelectItem>
                        <SelectItem value="taquari">Taquarí</SelectItem>
                        <SelectItem value="morada-sol2">Morada do Sol II</SelectItem>
                        <SelectItem value="luzimanges">Luzimanges</SelectItem>
                        <SelectItem value="colinas-to">Colinas - TO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matriculado">Matriculado</SelectItem>
                        <SelectItem value="cursando">Cursando</SelectItem>
                        <SelectItem value="nao-cursando">Não Cursando</SelectItem>
                        <SelectItem value="transferido">Transferido</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="reprovado">Reprovado</SelectItem>
                        <SelectItem value="recuperacao">Recuperação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Input 
                      value={editForm.observacao}
                      onChange={(e) => setEditForm(prev => ({ ...prev, observacao: e.target.value }))}
                      placeholder="Observações adicionais"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={saveEditedData} className="flex-1">
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header com informações do usuário e logout */}
      <div className="bg-white rounded-lg shadow-sm p-4 border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Painel da Secretaria - EETAD v2
              </h1>
              <p className="text-sm text-gray-600">
                Bem-vindo(a), {currentUser?.fullName || 'Usuário'}
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>

      {dashboardContent}
    </div>
  );
};

export default SecretaryDashboard;