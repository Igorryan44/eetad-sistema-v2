// Serviços de Alunos
export { default as useApprovedStudents, getApprovedStudents } from './approvedStudentsService';
export { default as usePendingStudents, getPendingStudents } from './pendingStudentsService';
export { default as useRejectedStudents, getRejectedStudents } from './rejectedStudentsService';
export { default as useEnrolledStudents, getEnrolledStudents } from './enrolledStudentsService';




// Serviços de Livros
export { 
  default as useStudentBooks, 
  getStudentBooks, 
  saveBookOrder, 
  getBookOrdersByCpfBookObservacao 
} from './studentBooksService';

// Serviços de Matrícula
export { 
  default as useEnrollment, 
  getEnrollments, 
  getPendingEnrollments, 
  finalizeEnrollment, 
  updateStudentData 
} from './enrollmentService';



// Serviços de Notificação
export { 
  default as useNotification, 
  sendEmailNotification, 
  sendWhatsAppNotification 
} from './notificationService';

// Serviços de Chatbot
export { 
  default as useChatbot, 
  sendChatbotMessage 
} from './chatbotService';

// Serviços de Usuários da Secretaria
export { 
  default as useSecretaryUsers, 
  getSecretaryUsers, 
  createSecretaryUser, 
  updateSecretaryUser, 
  deleteSecretaryUser, 
  resetUserPassword 
} from './secretaryUsersService';

// Serviços de Utilitários
export { 
  default as useUtils, 
  debugSheetData, 
  clearCache, 
  testEnrollments 
} from './utilsService';

// Serviços de Autenticação
export { default as useAuth } from './authService';

// Tipos e Interfaces
export type { 
  Student,
  StudentPersonalData,
  StudentEnrollmentData,
  StudentBook,
  BookOrder,
  Enrollment,
  PaymentData,
  PaymentResponse,
  PaymentStatus,
  EmailNotification,
  WhatsAppNotification,
  ChatMessage,
  ChatbotResponse,
  SecretaryUser,
  CreateUserData,
  UpdateUserData,
  DebugSheetData,
  CacheInfo
} from './types';