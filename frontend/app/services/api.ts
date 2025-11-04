const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
  uploadedAt: string;
  scannedText?: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  error?: string;
  data?: T;
}

export interface ScanResponse {
  scannedText: string;
  filename: string;
}

export interface AnalyzeResponse {
  response: string;
}

export interface ScanAndAnalyzeResponse {
  scannedText: string;
  analysis: string;
  filename: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'error',
        message: 'Failed to connect to server'
      };
    }
  }

  async uploadResume(file: File): Promise<ApiResponse<UploadedFile>> {
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch(`${this.baseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      return {
        status: 'error',
        message: 'Failed to upload file',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async scanPdf(filename: string): Promise<ApiResponse<ScanResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scan-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      return await response.json();
    } catch (error) {
      console.error('Scan error:', error);
      return {
        status: 'error',
        message: 'Failed to scan PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async analyzeResume(prompt: string, model?: string): Promise<ApiResponse<AnalyzeResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model }),
      });

      return await response.json();
    } catch (error) {
      console.error('Analyze error:', error);
      return {
        status: 'error',
        message: 'Failed to analyze resume',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async scanAndAnalyze(filename: string, model?: string, language?: string): Promise<ApiResponse<ScanAndAnalyzeResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scan-and-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename, model, language }),
      });

      return await response.json();
    } catch (error) {
      console.error('Scan and Analyze error:', error);
      return {
        status: 'error',
        message: 'Failed to scan and analyze PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const apiService = new ApiService(API_BASE_URL);