// Tipos de Alunos
export interface Student {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  status: string;
  curso: string;
  turma: string;
  periodo: string;
}

// Tipos de Dados Pessoais
export interface StudentPersonalData {
  origemAcademica: string;
  escolaAnterior: string;
  modalidadeAnterior: string;
  congregacao: string;
  nome: string;
  rg: string;
  cpf: string;
  telefone: string;
  email: string;
  sexo: string;
  estadoCivil: string;
  dataNascimento: string;
  ufNascimento: string;
  escolaridade: string;
  profissao: string;
  nacionalidade: string;
  cargoIgreja: string;
  enderecoRua: string;
  cep: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  dataCadastro: string;
  status: string;
}

// Tipos de Dados de Matrícula
export interface StudentEnrollmentData {
  nome: string;
  cpf: string;
  nucleo: string;
  subnucleo: string;
  ciclo: string;
  data: string;
  status: string;
  observacao: string;
  dataMatricula: string;
}

// Tipos de Livros
export interface StudentBook {
  id: string;
  titulo: string;
  autor: string;
  editora: string;
  isbn: string;
  preco: number;
  disponivel: boolean;
  curso: string;
  periodo: string;
  disciplina: string;
}

export interface BookOrder {
  cpf: string;
  livros: string[];
  observacao?: string;
  dataEntrega?: string;
  status: 'pendente' | 'processando' | 'entregue' | 'cancelado';
}

// Tipos de Matrícula
export interface Enrollment {
  id: string;
  cpf: string;
  nome: string;
  email: string;
  telefone: string;
  curso: string;
  turma: string;
  periodo: string;
  status: 'pendente' | 'aprovado' | 'reprovado' | 'matriculado';
  dataInscricao: string;
  dataMatricula?: string;
  observacoes?: string;
  valorCurso?: number;
  formaPagamento?: string;
}

// Tipos de Pagamento
export interface PaymentData {
  amount: number;
  description: string;
  payer: {
    email: string;
    name: string;
    cpf: string;
  };
  metadata?: {
    student_cpf?: string;
    course?: string;
    enrollment_id?: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  payment_url?: string;
  payment_id?: string;
  error?: string;
}

export interface PaymentStatus {
  id: string;
  status: string;
  status_detail: string;
  amount: number;
  date_created: string;
  date_approved?: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

// Tipos de Notificação
export interface EmailNotification {
  to: string;
  subject: string;
  message: string;
  studentName?: string;
  course?: string;
  template?: 'enrollment' | 'approval' | 'rejection' | 'payment' | 'custom';
}

export interface WhatsAppNotification {
  phone: string;
  message: string;
  studentName?: string;
  course?: string;
  template?: 'enrollment' | 'approval' | 'rejection' | 'payment' | 'custom';
}

// Tipos de Chatbot
export interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
}

export interface ChatbotResponse {
  success: boolean;
  response?: string;
  error?: string;
  suggestions?: string[];
}

// Tipos de Usuários da Secretaria
export interface SecretaryUser {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  dataContratacao: string;
  ultimoLogin?: string;
  permissoes: string[];
}

export interface CreateUserData {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  senha: string;
  permissoes: string[];
}

export interface UpdateUserData {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  status?: 'ativo' | 'inativo' | 'suspenso';
  permissoes?: string[];
}

// Tipos de Utilitários
export interface DebugSheetData {
  sheet: string;
  range?: string;
  data: any[];
  metadata: {
    totalRows: number;
    totalColumns: number;
    lastUpdated: string;
  };
}

export interface CacheInfo {
  keys: string[];
  totalSize: number;
  lastCleared: string;
}

// Tipos de Hooks de Retorno
export interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseStudentPersonalDataReturn {
  studentData: StudentPersonalData | null;
  loading: boolean;
  error: string | null;
  saveData: (data: StudentPersonalData) => Promise<boolean>;
  fetchData: (cpf: string) => Promise<void>;
}

export interface UseStudentEnrollmentDataReturn {
  enrollmentData: StudentEnrollmentData | null;
  loading: boolean;
  error: string | null;
  saveData: (data: StudentEnrollmentData) => Promise<boolean>;
  fetchData: (cpf: string) => Promise<void>;
}

export interface UseStudentBooksReturn {
  books: StudentBook[];
  loading: boolean;
  error: string | null;
  fetchBooks: (cpf: string) => Promise<void>;
  saveBookOrder: (order: BookOrder) => Promise<boolean>;
  getBookOrdersByCpf: (cpf: string, book: string, observacao: string) => Promise<any[]>;
}

export interface UseEnrollmentReturn {
  enrollments: Enrollment[];
  pendingEnrollments: Enrollment[];
  loading: boolean;
  error: string | null;
  fetchEnrollments: () => Promise<void>;
  fetchPendingEnrollments: () => Promise<void>;
  finalizeEnrollment: (cpf: string, additionalData?: any) => Promise<boolean>;
  updateStudentData: (cpf: string, data: any) => Promise<boolean>;
}

export interface UsePaymentReturn {
  loading: boolean;
  error: string | null;
  createPayment: (data: PaymentData) => Promise<PaymentResponse>;
  checkPaymentStatus: (paymentId: string) => Promise<PaymentStatus | null>;
  cancelOrder: (orderId: string) => Promise<boolean>;
}

export interface UseNotificationReturn {
  loading: boolean;
  error: string | null;
  sendEmail: (data: EmailNotification) => Promise<boolean>;
  sendWhatsApp: (data: WhatsAppNotification) => Promise<boolean>;
}

export interface UseChatbotReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (message: string, context?: any) => Promise<void>;
  clearChat: () => void;
}

export interface UseSecretaryUsersReturn {
  users: SecretaryUser[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserData) => Promise<boolean>;
  updateUser: (data: UpdateUserData) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  resetPassword: (id: string) => Promise<boolean>;
}

export interface UseUtilsReturn {
  loading: boolean;
  error: string | null;
  debugSheetData: (sheet: string, range?: string) => Promise<DebugSheetData | null>;
  clearCache: () => Promise<boolean>;
  testEnrollments: () => Promise<any>;
}