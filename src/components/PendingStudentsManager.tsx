/**
 * 🎯 Componente Otimizado para Gerenciar Alunos Pendentes
 * 
 * Características:
 * - Interface responsiva e moderna
 * - Atualizações em tempo real
 * - Tratamento robusto de erros
 * - Performance otimizada
 * - UX aprimorada
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { usePendingStudents, PendingStudent, EnrollmentData } from '@/services/pendingStudentsService';

interface PendingStudentsManagerProps {
  onStudentEnrolled?: (student: PendingStudent) => void;
  openEnrollmentForStudent?: PendingStudent | null;
}

const PendingStudentsManager: React.FC<PendingStudentsManagerProps> = ({ 
  onStudentEnrolled,
  openEnrollmentForStudent 
}) => {
  const { 
    students, 
    loading, 
    error, 
    refresh, 
    finalizeEnrollment, 
    stats 
  } = usePendingStudents();

  // Estados locais
  const [selectedStudent, setSelectedStudent] = useState<PendingStudent | null>(null);
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNucleo, setFilterNucleo] = useState<string>('todos');
  const [enrollmentForm, setEnrollmentForm] = useState({
    ciclo: '',
    subnucleo: '',
    status: 'Matriculado',
    observacao: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  // Abrir modal automaticamente quando um estudante for passado via prop
  useEffect(() => {
    if (openEnrollmentForStudent && students.length > 0) {
      const student = students.find(s => s.cpf === openEnrollmentForStudent.cpf);
      if (student) {
        openEnrollmentDialog(student);
      }
    }
  }, [openEnrollmentForStudent, students]);

  // Limpar o estudante selecionado quando o modal for fechado
  useEffect(() => {
    if (!isEnrollmentDialogOpen && selectedStudent) {
      setSelectedStudent(null);
    }
  }, [isEnrollmentDialogOpen, selectedStudent]);

  // Filtrar estudantes
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.cpf.includes(searchTerm);
    
    const matchesNucleo = filterNucleo === 'todos' || !filterNucleo || student.nucleo === filterNucleo;
    
    return matchesSearch && matchesNucleo;
  });

  // Obter congregações únicas para filtro
  const nucleos = [...new Set(students.map(s => s.nucleo).filter(Boolean))];

  // Lidar com efetivação de matrícula
  const handleEnrollStudent = async () => {
    if (!selectedStudent) return;

    setIsProcessing(true);
    
    try {
      // Etapa 1: Efetivando matrícula
      setProcessingStep('Efetivando a matrícula...');
      
      const enrollmentData: EnrollmentData = {
        rowIndex: selectedStudent.rowIndex,
        cpf: selectedStudent.cpf,
        ciclo: enrollmentForm.ciclo,
        subnucleo: enrollmentForm.subnucleo,
        status: enrollmentForm.status,
        observacao: enrollmentForm.observacao
      };

      await finalizeEnrollment(enrollmentData);

      // Etapa 2: Atualizando status
      setProcessingStep('Atualizando status do aluno...');
      
      // Forçar atualização dos dados primeiro

      await refresh();

      // Aguardar um pouco para garantir que os dados foram atualizados
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Callback opcional - executar após a atualização
      onStudentEnrolled?.(selectedStudent);

      toast({
        title: "✅ Sucesso!",
        description: `Matrícula de ${selectedStudent.nome} efetivada com sucesso`,
      });

      // Fechar dialog e limpar formulário
      setIsEnrollmentDialogOpen(false);
      setSelectedStudent(null);
      setEnrollmentForm({
        ciclo: '',
        subnucleo: '',
        status: 'Matriculado',
        observacao: ''
      });

    } catch (error) {
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao efetivar matrícula",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Abrir dialog de matrícula
  const openEnrollmentDialog = (student: PendingStudent) => {
    setSelectedStudent(student);
    setIsEnrollmentDialogOpen(true);
  };

  // Exportar dados
  const exportData = () => {
    const csvContent = [
      ['Nome', 'CPF', 'Congregação', 'Telefone', 'Email', 'Status'],
      ...filteredStudents.map(student => [
        student.nome,
        student.cpf,
        student.nucleo || '',
        student.telefone || '',
        student.email || '',
        student.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alunos-pendentes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Pendentes</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Filtrados</p>
                <p className="text-2xl font-bold">{filteredStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Última Atualização</p>
                <p className="text-sm font-medium">{stats.lastUpdate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {stats.isStale ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <div>
                <p className="text-sm text-gray-600">Status Cache</p>
                <Badge variant={stats.isStale ? "destructive" : "default"}>
                  {stats.isStale ? "Desatualizado" : "Atualizado"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Matrículas Pendentes</span>
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={refresh} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Button 
                onClick={exportData}
                variant="outline"
                size="sm"
                disabled={filteredStudents.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nome ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nucleo-filter">Filtrar por Congregação</Label>
              <Select value={filterNucleo} onValueChange={setFilterNucleo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as congregações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as congregações</SelectItem>
                  {nucleos.map((nucleo, index) => (
                    <SelectItem key={`nucleo-${nucleo}-${index}`} value={nucleo}>
                      {nucleo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterNucleo('');
                }}
                variant="outline"
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Lista Simples de Alunos */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando alunos...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Users className="h-8 w-8 text-gray-400" />
                    <p className="text-gray-500">
                      {students.length === 0 
                        ? "Nenhum aluno pendente encontrado" 
                        : "Nenhum aluno corresponde aos filtros"
                      }
                    </p>
                  </div>
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{student.nome}</h3>
                      <p className="text-sm text-gray-600">CPF: {student.cpf}</p>
                      {student.nucleo && (
                        <p className="text-sm text-gray-600">Congregação: {student.nucleo}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => openEnrollmentDialog(student)}
                      className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Efetivar
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Efetivação */}
      <Dialog open={isEnrollmentDialogOpen} onOpenChange={setIsEnrollmentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Efetivar Matrícula</DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{selectedStudent.nome}</h4>
                <p className="text-sm text-gray-600">CPF: {selectedStudent.cpf}</p>
                <p className="text-sm text-gray-600">Congregação: {selectedStudent.nucleo || 'Não informado'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ciclo">Ciclo *</Label>
                  <Select 
                    value={enrollmentForm.ciclo} 
                    onValueChange={(value) => setEnrollmentForm(prev => ({ ...prev, ciclo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1º Ciclo - Formação Básica">1º Ciclo - Formação Básica</SelectItem>
                      <SelectItem value="2º Ciclo - Médio">2º Ciclo - Médio</SelectItem>
                      <SelectItem value="3º Ciclo - Avançado">3º Ciclo - Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subnucleo">Subnúcleo *</Label>
                  <Select 
                    value={enrollmentForm.subnucleo} 
                    onValueChange={(value) => setEnrollmentForm(prev => ({ ...prev, subnucleo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o subnúcleo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARNO 44">ARNO 44</SelectItem>
                      <SelectItem value="Sede">Sede</SelectItem>
                      <SelectItem value="Aureny III">Aureny III</SelectItem>
                      <SelectItem value="Taquarí">Taquarí</SelectItem>
                      <SelectItem value="Morada do Sol II">Morada do Sol II</SelectItem>
                      <SelectItem value="Luzimanges">Luzimanges</SelectItem>
                      <SelectItem value="Colinas - TO">Colinas - TO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={enrollmentForm.status} 
                  onValueChange={(value) => setEnrollmentForm(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Matriculado">Matriculado</SelectItem>
                    <SelectItem value="Cursando">Cursando</SelectItem>
                    <SelectItem value="Aguardando">Aguardando</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="observacao">Observações</Label>
                <Input
                  id="observacao"
                  placeholder="Observações adicionais..."
                  value={enrollmentForm.observacao}
                  onChange={(e) => setEnrollmentForm(prev => ({ ...prev, observacao: e.target.value }))}
                />
              </div>

              {/* Barra de Progresso */}
              {isProcessing && (
                <div className="space-y-3 py-4 border-t">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">{processingStep}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-in-out" 
                         style={{ width: processingStep.includes('Efetivando') ? '50%' : '100%' }}>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEnrollmentDialogOpen(false)}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleEnrollStudent}
                  disabled={!enrollmentForm.ciclo || !enrollmentForm.subnucleo || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Efetivar Matrícula
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingStudentsManager;