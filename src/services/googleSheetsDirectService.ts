/**
 * Direct Google Sheets API Service for Production
 * Allows frontend to access Google Sheets directly without backend
 */

interface GoogleSheetsConfig {
  apiKey: string;
  spreadsheetId: string;
  serviceAccountEmail?: string;
  privateKey?: string;
}

interface StudentData {
  cpf: string;
  nome: string;
  email: string;
  telefone?: string;
  registered: boolean;
}

class GoogleSheetsDirectService {
  private config: GoogleSheetsConfig | null = null;
  private initialized = false;
  private isProduction: boolean;

  constructor() {
    this.isProduction = window.location.hostname !== 'localhost' && 
                        window.location.hostname !== '127.0.0.1' &&
                        !window.location.hostname.includes('local');
    this.init();
  }

  private init() {
    // Get configuration from environment variables (prioritize .env file)
    // First try VITE_ prefixed variables (for frontend)
    let apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
    let spreadsheetId = import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID;
    
    // If not found, try non-prefixed variables
    if (!apiKey) {
      apiKey = import.meta.env.GOOGLE_SHEETS_API_KEY;
    }
    
    if (!spreadsheetId) {
      spreadsheetId = import.meta.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    }
    
    // Service Account credentials
    const serviceAccountEmail = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL || 
                               import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = import.meta.env.VITE_GOOGLE_PRIVATE_KEY || 
                      import.meta.env.GOOGLE_PRIVATE_KEY;

    // Fallback to default values
    if (!spreadsheetId) {
      spreadsheetId = '1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA';
    }

    if (apiKey && spreadsheetId) {
      this.config = { apiKey, spreadsheetId, serviceAccountEmail, privateKey };
      this.initialized = true;
      console.log('✅ Google Sheets Direct Service initialized with environment variables');
    } else {
      // Fallback to localStorage if env vars not available
      const localApiKey = localStorage.getItem('google_sheets_api_key');
      const localSpreadsheetId = localStorage.getItem('google_sheets_spreadsheet_id');
      
      if (localApiKey && localSpreadsheetId) {
        this.config = { apiKey: localApiKey, spreadsheetId: localSpreadsheetId };
        this.initialized = true;
        console.log('✅ Google Sheets Direct Service initialized with localStorage');
      } else {
        console.warn('⚠️ Google Sheets API credentials not found. Using fallback mode.');
      }
    }
  }

  /**
   * Search for student by CPF in Google Sheets using API Key approach
   */
  private async searchStudentByAPIKey(cpf: string): Promise<StudentData> {
    if (!this.config) {
      throw new Error('Google Sheets not configured');
    }

    const cleanCPF = cpf.replace(/\D/g, '');
    console.log('🔍 Searching for CPF in Google Sheets (API Key):', cleanCPF);

    // Fetch data from 'dados pessoais' sheet
    const range = 'dados pessoais!A:Y';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${range}?key=${this.config.apiKey}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length <= 1) {
      console.log('📋 No data found in Google Sheets');
      return { cpf, nome: '', email: '', registered: false };
    }

    // Search for CPF in column G (index 6)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowCPF = row[6] ? row[6].toString().replace(/\D/g, '') : '';
      
      if (rowCPF === cleanCPF) {
        console.log('✅ Student found in Google Sheets (API Key)');
        return {
          cpf: row[6] || cpf,
          nome: row[4] || '',
          email: row[8] || '',
          telefone: row[7] || '',
          registered: true
        };
      }
    }

    console.log('📋 CPF not found in Google Sheets (API Key)');
    return { cpf, nome: '', email: '', registered: false };
  }

  /**
   * Search for student by CPF using Service Account credentials through backend
   */
  private async searchStudentByServiceAccount(cpf: string): Promise<StudentData> {
    // In production, we can't use Service Account credentials directly in browser
    // We need to use the local server backend which has access to the credentials
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';
    
    try {
      console.log('🔍 Searching for CPF using Service Account via backend:', cpf);
      
      const response = await fetch(`${API_BASE_URL}/functions/get-student-personal-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.found) {
        console.log('✅ Student found via Service Account (backend)');
        return {
          cpf: data.data.cpf,
          nome: data.data.nome,
          email: data.data.email,
          telefone: data.data.telefone,
          registered: true
        };
      } else {
        console.log('📋 CPF not found via Service Account (backend)');
        return { cpf, nome: '', email: '', registered: false };
      }
    } catch (error) {
      console.error('❌ Error accessing Google Sheets via Service Account:', error);
      throw error;
    }
  }

  /**
   * Search for student by CPF in Google Sheets
   */
  async searchStudentByCPF(cpf: string): Promise<StudentData> {
    if (!this.initialized || !this.config) {
      console.log('📱 Google Sheets not configured, using fallback mode');
      return this.getFallbackResponse(cpf);
    }

    try {
      // In development, try Service Account approach first (more secure)
      if (!this.isProduction && this.config.serviceAccountEmail && this.config.privateKey) {
        try {
          return await this.searchStudentByServiceAccount(cpf);
        } catch (serviceAccountError) {
          console.log('⚠️ Service Account approach failed, falling back to API Key');
          // Fall through to API Key approach
        }
      }
      
      // In production or if Service Account fails, use API Key approach
      return await this.searchStudentByAPIKey(cpf);
    } catch (error) {
      console.error('❌ Error accessing Google Sheets:', error);
      return this.getFallbackResponse(cpf);
    }
  }

  /**
   * Fallback response when Google Sheets is not accessible
   */
  private getFallbackResponse(cpf: string): StudentData {
    console.log('🔄 Using fallback response for CPF verification');
    
    // Known test CPFs for demonstration
    const knownCPFs = ['12345678901', '11111111111', '22222222222'];
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (knownCPFs.includes(cleanCPF)) {
      return {
        cpf: cpf,
        nome: "Aluno Demonstração",
        email: "aluno@exemplo.com",
        registered: true
      };
    }

    return { cpf, nome: '', email: '', registered: false };
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return this.initialized && this.config !== null;
  }

  /**
   * Update configuration manually
   */
  updateConfig(apiKey: string, spreadsheetId: string, serviceAccountEmail?: string, privateKey?: string) {
    this.config = { apiKey, spreadsheetId, serviceAccountEmail, privateKey };
    this.initialized = true;
    
    // Store in localStorage for persistence
    localStorage.setItem('google_sheets_api_key', apiKey);
    localStorage.setItem('google_sheets_spreadsheet_id', spreadsheetId);
    
    console.log('✅ Google Sheets configuration updated');
  }
}

// Export singleton instance
export const googleSheetsDirectService = new GoogleSheetsDirectService();
export default googleSheetsDirectService;