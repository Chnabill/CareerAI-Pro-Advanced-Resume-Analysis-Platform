import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Force PDF.js into fake worker mode (Node-safe)
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = undefined;

const app: Application = express();
const PORT = process.env['PORT'] || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) cb(null, true);
    else cb(new Error('Only PDF, DOC, and DOCX files are allowed!') as any);
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'CareerAI Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Upload resume endpoint (without auto-scanning)
app.post('/api/upload', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ status: 'error', message: 'No file uploaded' });
      return;
    }

    res.json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Scan PDF endpoint
app.post('/api/scan-pdf', async (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      res.status(400).json({ status: 'error', message: 'Filename is required' });
      return;
    }

    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ status: 'error', message: 'File not found' });
      return;
    }

    const scannedText = await scanPdf(filePath);

    res.json({
      status: 'success',
      message: 'PDF scanned successfully',
      data: {
        scannedText,
        filename
      }
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to scan PDF',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Scan and Analyze endpoint (ATS Analysis)
app.post('/api/scan-and-analyze', async (req: Request, res: Response) => {
  try {
    const { filename, model = "nvidia/nemotron-nano-12b-v2-vl:free", language = "english" } = req.body;
    
    if (!filename) {
      res.status(400).json({ status: 'error', message: 'Filename is required' });
      return;
    }

    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ status: 'error', message: 'File not found' });
      return;
    }

    // Scan the PDF first
    const scannedText = await scanPdf(filePath);

    // Send to AI for ATS analysis
    const englishPrompt = `
      You are an expert resume reviewer and ATS optimization specialist.
      Analyze the following resume text and evaluate it as if it were being screened by an Applicant Tracking System (ATS).

      IMPORTANT: Start your response with these exact scores on separate lines:
      ATS Score: [0-100]
      Tone & Style: [0-100]
      Content: [0-100]
      Structure: [0-100]
      Skills: [0-100]
      Overall Score: [0-100]

      Then provide detailed analysis:
      1. ATS Score - Identify missing or weak sections (summary, experience, skills, education, etc.).
      2. Tone & Style - Evaluate professional language, readability, and tone.
      3. Content - Assess relevance and quality of information provided.
      4. Structure - Analyze formatting, organization, and visual hierarchy.
      5. Skills - Review technical and soft skills presentation.
      6. Suggest concrete improvements for structure, content, and keyword optimization.
      7. Rewrite weak parts of the resume in a professional tone when necessary.

      Resume text:
      ${scannedText}`;

    const frenchPrompt = `
      Vous êtes un expert en révision de CV et spécialiste de l'optimisation ATS (Applicant Tracking System).
      Analysez le texte du CV suivant et évaluez-le comme s'il était examiné par un système de suivi des candidatures (ATS).

      IMPORTANT : Commencez votre réponse avec ces scores exacts sur des lignes séparées :
      ATS Score: [0-100]
      Tone & Style: [0-100]
      Content: [0-100]
      Structure: [0-100]
      Skills: [0-100]
      Overall Score: [0-100]

      Ensuite, fournissez une analyse détaillée :
      1. ATS Score - Identifier les sections manquantes ou faibles (résumé, expérience, compétences, formation, etc.).
      2. Tone & Style - Évaluer le langage professionnel, la lisibilité et le ton.
      3. Content - Évaluer la pertinence et la qualité des informations fournies.
      4. Structure - Analyser le formatage, l'organisation et la hiérarchie visuelle.
      5. Skills - Examiner la présentation des compétences techniques et relationnelles.
      6. Suggérer des améliorations concrètes pour la structure, le contenu et l'optimisation des mots-clés.
      7. Réécrire les parties faibles du CV dans un ton professionnel si nécessaire.

      Texte du CV :
      ${scannedText}`;

    const prompt = language === 'french' ? frenchPrompt : englishPrompt;
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env['OPENROUTER_API_KEY']}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const analysisResult = response.data.choices?.[0]?.message?.content || '';
    
    res.json({ 
      status: 'success',
      data: {
        scannedText,
        analysis: analysisResult,
        filename
      }
    });

  } catch (error: any) {
    console.error('Scan and Analyze error:', error);
    
    // Handle specific API errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 429) {
        res.status(429).json({
          status: 'error',
          message: 'Rate limit exceeded. Please wait a moment and try again, or select a different AI model.',
          error: 'OpenRouter API rate limit reached',
          details: errorData
        });
        return;
      } else if (status === 404) {
        res.status(404).json({
          status: 'error',
          message: 'The selected AI model is not available. Please try a different model.',
          error: 'Model not found',
          details: errorData
        });
        return;
      } else if (status === 400) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid request to AI service. Please try again.',
          error: 'Bad request',
          details: errorData
        });
        return;
      }
    }
    
    // Generic error
    res.status(500).json({
      status: 'error',
      message: 'Failed to scan and analyze PDF. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI Analysis endpoint
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { prompt, model = "minimax/minimax-m2:free" } = req.body;
    
    if (!prompt) {
      res.status(400).json({ status: 'error', message: 'Prompt is required' });
      return;
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env['OPENROUTER_API_KEY']}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.choices?.[0]?.message?.content || '';
    res.json({ 
      status: 'success',
      response: text 
    });

  } catch (error) {
    console.error('OpenRouter Error:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to get AI response' 
    });
  }
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🌐 CORS enabled for: http://localhost:3000, http://localhost:5173`);
});

// PDF scanner function
async function scanPdf(pdfPath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(dataBuffer) });
    const pdf = await loadingTask.promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');

      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error scanning PDF:', error);
    throw new Error(`Failed to scan PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}