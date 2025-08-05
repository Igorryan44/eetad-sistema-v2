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
import { Calendar, FileText, Download, Eye, Users, BookOpen, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';

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

  useEffect(() => {
    fetchPendingStudents();
    fetchEnrollments();
    fetchAllStudents();
    fetchStats();
  }, []);

  const fetchPendingStudents = async () => {
    try {
      const response = await fetch('https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/get-pending-enrollments', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVta2l6eGZ0d3J3cWlpYWhqYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzEyNzIsImV4cCI6MjA2NDY0NzI3Mn0.6rGPdMiRcQ_plkkkHiwy73rOrSoGcLwAqZogNyQplTs'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar alunos pendentes');
      }

      const data = await response.json();
      
      if (data.success) {
        const pendingData = data.pendingEnrollments.map((enrollment: any) => ({
          id: enrollment.rowIndex.toString(),
          nome: enrollment.nome,
          cpf: enrollment.cpf,
          email: enrollment.email,
          telefone: enrollment.telefone
        }));
        setPendingStudents(pendingData);
        
        // Atualizar estatísticas
        setStats(prev => ({ ...prev, totalPendentes: pendingData.length }));
      } else {
        setPendingStudents([]);
        setStats(prev => ({ ...prev, totalPendentes: 0 }));
      }
    } catch (error) {
      console.error('Erro ao buscar alunos pendentes:', error);
      setPendingStudents([]);
      setStats(prev => ({ ...prev, totalPendentes: 0 }));
      
      toast({
        title: "Erro",
        description: "Não foi possível carregar os alunos pendentes",
        variant: "destructive"
      });
    }
  };

  const fetchEnrollments = async () => {
    try {
      // TODO: Implementar busca real de matrículas efetivadas via Supabase
      setEnrollments([]);
    } catch (error) {
      console.error('Erro ao buscar matrículas:', error);
      setEnrollments([]);
    }
  };

  const fetchAllStudents = async () => {
    try {
      // TODO: Implementar busca real de todos os alunos via Supabase
      // Combinar alunos pendentes e matriculados
      const allStudents: Student[] = [
        ...pendingStudents,
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
    } catch (error) {
      console.error('Erro ao buscar todos os alunos:', error);
      setAllStudents([]);
    }
  };

  const fetchStats = async () => {
    try {
      // Calcular estatísticas reais baseadas nos dados
      const totalMatriculados = enrollments.filter(e => e.status === 'matriculado').length;
      const totalCursando = enrollments.filter(e => e.status === 'cursando').length;
      const totalNaoCursando = enrollments.filter(e => e.status === 'nao-cursando').length;
      const totalRecuperacao = enrollments.filter(e => e.status === 'recuperacao').length;
      const totalAprovados = enrollments.filter(e => e.status === 'aprovado').length;
      const totalReprovados = enrollments.filter(e => e.status === 'reprovado').length;
      
      setStats(prev => ({
        ...prev,
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

  const openEnrollmentForm = (student: Student) => {
    setSelectedStudentForEnrollment(student);
    setEnrollmentForm({
      ciclo: '',
      subnucleo: '',
      status: '',
      observacoes: ''
    });
    setIsEnrollmentDialogOpen(true);
  };

  const finalizeEnrollment = () => {
    if (!selectedStudentForEnrollment || !enrollmentForm.ciclo || !enrollmentForm.subnucleo || !enrollmentForm.status) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios (Ciclo, Subnúcleo e Status)",
        variant: "destructive"
      });
      return;
    }

    // Criar nova matrícula
    const newEnrollment: Enrollment = {
      id: Date.now().toString(),
      studentId: selectedStudentForEnrollment.id,
      nome: selectedStudentForEnrollment.nome,
      ciclo: enrollmentForm.ciclo,
      subnucleo: enrollmentForm.subnucleo,
      status: enrollmentForm.status,
      dataEvento: new Date().toLocaleDateString('pt-BR'),
      observacao: enrollmentForm.observacoes
    };

    // Adicionar à lista de matrículas
    setEnrollments(prev => [...prev, newEnrollment]);

    // Remover da lista de pendentes
    setPendingStudents(prev => prev.filter(s => s.id !== selectedStudentForEnrollment.id));

    // Fechar diálogo
    setIsEnrollmentDialogOpen(false);
    setSelectedStudentForEnrollment(null);

    toast({
      title: "Sucesso",
      description: "Matrícula efetivada com sucesso!"
    });
  };

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
        case 'por-data':
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
          
        case 'por-ciclo':
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
          
        case 'cursando-nao-cursando':
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
          
        case 'aprovados-reprovados':
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
          
        case 'livros-por-aluno':
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
              <td style="padding: 10px;">${pendingStudents.find(s => s.id === enrollment.studentId)?.cpf || 'N/A'}</td>
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard Secretaria</h1>
      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="pending">Matrículas Pendentes</TabsTrigger>
          <TabsTrigger value="enrollments">Matrículas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle>Matrículas Pendentes</CardTitle></CardHeader>
              <CardContent><p className="text-4xl">{stats.totalPendentes}</p></CardContent>
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
            <Card>
              <CardHeader><CardTitle>Alunos Pendentes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingStudents.slice(0, 5).map(student => (
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
                  ))}
                  {pendingStudents.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Nenhum aluno pendente</p>
                  )}
                </div>
              </CardContent>
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
              {pendingStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.nome}</TableCell>
                  <TableCell>{student.cpf}</TableCell>
                  <TableCell>
                    <Button onClick={() => openEnrollmentForm(student)}>Efetivar Matrícula</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                const student = pendingStudents.find(s => s.id === enrollment.studentId) || { nome: '' };
                return (
                  <TableRow key={enrollment.id}>
                    <TableCell>{student.nome}</TableCell>
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
                      <Button variant="outline" className="ml-2" onClick={() => {/* TODO: Abrir formulário de edição de dados */}}>Editar Dados</Button>
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
      </Tabs>
    </div>
  );
};

export default SecretaryDashboard;