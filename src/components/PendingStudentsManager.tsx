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
}

const PendingStudentsManager: React.FC<PendingStudentsManagerProps> = ({ 
  onStudentEnrolled 
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
  const [filterNucleo, setFilterNucleo] = useState<string>('');
  const [enrollmentForm, setEnrollmentForm] = useState({
    ciclo: '',
    subnucleo: '',
    status: 'Matriculado',
    observacao: ''
  });

  // Filtrar estudantes
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.cpf.includes(searchTerm);
    
    const matchesNucleo = !filterNucleo || student.nucleo === filterNucleo;
    
    return matchesSearch && matchesNucleo;
  });

  // Obter núcleos únicos para filtro
  const nucleos = [...new Set(students.map(s => s.nucleo).filter(Boolean))];

  // Lidar com efetivação de matrícula
  const handleEnrollStudent = async () => {
    if (!selectedStudent) return;

    try {
      const enrollmentData: EnrollmentData = {
        rowIndex: selectedStudent.rowIndex,
        cpf: selectedStudent.cpf,
        ciclo: enrollmentForm.ciclo,
        subnucleo: enrollmentForm.subnucleo,
        status: enrollmentForm.status,
        observacao: enrollmentForm.observacao
      };

      await finalizeEnrollment(enrollmentData);

      toast({
        title: "✅ Sucesso!",
        description: `Matrícula de ${selectedStudent.nome} efetivada com sucesso`,
      });

      // Callback opcional
      onStudentEnrolled?.(selectedStudent);

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
      ['Nome', 'CPF', 'Núcleo', 'Telefone', 'Email', 'Status'],
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
              <span>Alunos Pendentes</span>
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
              <Label htmlFor="nucleo-filter">Filtrar por Núcleo</Label>
              <Select value={filterNucleo} onValueChange={setFilterNucleo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os núcleos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os núcleos</SelectItem>
                  {nucleos.map(nucleo => (
                    <SelectItem key={nucleo} value={nucleo}>
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

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando alunos pendentes...</span>
            </div>
          )}

          {/* Tabela */}
          {!loading && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Núcleo</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Users className="h-8 w-8 text-gray-400" />
                          <p className="text-gray-500">
                            {students.length === 0 
                              ? "Nenhum aluno pendente encontrado" 
                              : "Nenhum aluno corresponde aos filtros"
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.nome}</TableCell>
                        <TableCell>{student.cpf}</TableCell>
                        <TableCell>{student.nucleo || '-'}</TableCell>
                        <TableCell>{student.telefone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{student.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEnrollmentDialog(student)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Efetivar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
                <p className="text-sm text-gray-600">Núcleo: {selectedStudent.nucleo || 'Não informado'}</p>
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
                      <SelectItem value="Ciclo 1">Ciclo 1</SelectItem>
                      <SelectItem value="Ciclo 2">Ciclo 2</SelectItem>
                      <SelectItem value="Ciclo 3">Ciclo 3</SelectItem>
                      <SelectItem value="Ciclo 4">Ciclo 4</SelectItem>
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
                      <SelectItem value="Subnúcleo A">Subnúcleo A</SelectItem>
                      <SelectItem value="Subnúcleo B">Subnúcleo B</SelectItem>
                      <SelectItem value="Subnúcleo C">Subnúcleo C</SelectItem>
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEnrollmentDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleEnrollStudent}
                  disabled={!enrollmentForm.ciclo || !enrollmentForm.subnucleo}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Efetivar Matrícula
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