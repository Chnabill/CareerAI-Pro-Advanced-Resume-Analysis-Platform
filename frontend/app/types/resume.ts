// Resume Analysis Types

export interface ResumeScore {
  atsScore: number;
  toneStyle: number;
  content: number;
  structure: number;
  skills: number;
  overall: number;
}

export interface CategoryFeedback {
  category: string;
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface ResumeAnalysis {
  id: string;
  filename: string;
  originalName: string;
  uploadedAt: string;
  scores: ResumeScore;
  categories: CategoryFeedback[];
  fullAnalysis: string;
  model: string;
  language: 'english' | 'french';
}

export interface UploadedResume {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  analysis?: ResumeAnalysis;
}
