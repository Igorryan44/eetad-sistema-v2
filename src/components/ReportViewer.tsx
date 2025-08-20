import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Download, ArrowLeft } from 'lucide-react';

interface ReportData {
  title: string;
  subtitle?: string;
  data: any[];
  columns: { key: string; label: string; }[];
  filters?: { [key: string]: string };
}

interface ReportViewerProps {
  reportData: ReportData;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ reportData }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // Implementação futura para download em PDF
    // Por enquanto, abre a janela de impressão que permite salvar como PDF
    window.print();
  };

  const handleGoBack = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho com ações - não aparece na impressão */}
        <div className="mb-6 print:hidden">
          <div className="flex justify-between items-center">
            <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex gap-3">
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo do relatório */}
        <Card className="shadow-lg">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl font-bold text-gray-800">
              {reportData.title}
            </CardTitle>
            {reportData.subtitle && (
              <p className="text-gray-600 mt-2">{reportData.subtitle}</p>
            )}
            
            {/* Filtros aplicados */}
            {reportData.filters && Object.keys(reportData.filters).length > 0 && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Filtros Aplicados:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {Object.entries(reportData.filters).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-6">
            {reportData.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum dado encontrado para os filtros aplicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {reportData.columns.map((column) => (
                        <TableHead key={column.key} className="font-semibold">
                          {column.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.data.map((row, index) => (
                      <TableRow key={index}>
                        {reportData.columns.map((column) => (
                          <TableCell key={column.key}>
                            {row[column.key] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Rodapé com informações */}
            <div className="mt-6 pt-4 border-t text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span>Total de registros: {reportData.data.length}</span>
                <span>Gerado em: {new Date().toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Estilos para impressão */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\:hidden {
            display: none !important;
          }
          .shadow-lg {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportViewer;