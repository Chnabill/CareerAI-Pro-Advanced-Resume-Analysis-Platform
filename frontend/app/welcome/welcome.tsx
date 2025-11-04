import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { apiService } from '../services/api';
import type { UploadedFile } from '../services/api';
import { AI_MODELS, DEFAULT_MODEL } from '../config/models';
import type { AIModel } from '../config/models';
import { ScoreGauge } from '../components/ScoreGauge';
import { CategoryScore } from '../components/CategoryScore';
import { parseAnalysisText } from '../utils/parseAnalysis';
import type { ResumeAnalysis, UploadedResume, CategoryFeedback } from '../types/resume';

export function Welcome() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<UploadedFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [parsedAnalysis, setParsedAnalysis] = useState<{ scores: any; categories: CategoryFeedback[] } | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'full'>('categories');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'french'>('english');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check server health on mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  // Load selected resume from dashboard if available
  useEffect(() => {
    const selectedResumeStr = localStorage.getItem('careerAI_selectedResume');
    if (selectedResumeStr) {
      try {
        const selectedResume: UploadedResume = JSON.parse(selectedResumeStr);
        if (selectedResume.analysis) {
          // Set the analysis data
          setAnalysisResult(selectedResume.analysis.fullAnalysis);
          setParsedAnalysis({
            scores: selectedResume.analysis.scores,
            categories: selectedResume.analysis.categories
          });
          // Set the file data
          setUploadedFileData({
            filename: selectedResume.filename,
            originalName: selectedResume.originalName,
            size: selectedResume.size,
            mimetype: selectedResume.mimetype,
            path: '', // Path not needed for display
            uploadedAt: selectedResume.uploadedAt
          });
          // Set the model and language
          const model = AI_MODELS.find(m => m.name === selectedResume.analysis?.model);
          if (model) setSelectedModel(model);
          if (selectedResume.analysis.language) {
            setSelectedLanguage(selectedResume.analysis.language);
          }
          console.log('Loaded resume from dashboard:', selectedResume);
        }
        // Clear the selected resume from localStorage
        localStorage.removeItem('careerAI_selectedResume');
      } catch (error) {
        console.error('Error loading selected resume:', error);
        localStorage.removeItem('careerAI_selectedResume');
      }
    }
  }, []);

  // Debug: Log when analysisResult changes
  useEffect(() => {
    console.log('analysisResult changed:', analysisResult ? `${analysisResult.substring(0, 100)}...` : 'null');
  }, [analysisResult]);

  const checkServerHealth = async () => {
    const response = await apiService.healthCheck();
    setServerStatus(response.status === 'success' ? 'online' : 'offline');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF, DOC, or DOCX file');
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
      setUploadSuccess(false);
      setAnalysisResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadSuccess(false);

    const response = await apiService.uploadResume(file);

    if (response.status === 'success' && response.data) {
      setUploadSuccess(true);
      setUploadedFileData(response.data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setError(response.message || response.error || 'Upload failed');
    }

    setUploading(false);
  };

  const handleScan = async () => {
    if (!uploadedFileData) {
      setError('No file uploaded');
      return;
    }

    if (uploadedFileData.mimetype !== 'application/pdf') {
      setError('Only PDF files can be scanned');
      return;
    }

    setScanning(true);
    setError(null);
    setAnalysisResult(null);

    console.log('Starting scan with:', {
      filename: uploadedFileData.filename,
      model: selectedModel.id,
      language: selectedLanguage
    });

    const response = await apiService.scanAndAnalyze(uploadedFileData.filename, selectedModel.id, selectedLanguage);

    console.log('Scan response:', response);

    if (response.status === 'success' && response.data) {
      console.log('Setting analysis result:', response.data.analysis);
      const analysisText = response.data.analysis;
      setAnalysisResult(analysisText);
      
      // Parse the analysis into structured data
      const parsed = parseAnalysisText(analysisText);
      setParsedAnalysis(parsed);
      console.log('Parsed analysis:', parsed);
      
      // Save to localStorage
      if (uploadedFileData) {
        const resumeData: UploadedResume = {
          id: uploadedFileData.filename,
          filename: uploadedFileData.filename,
          originalName: uploadedFileData.originalName,
          size: uploadedFileData.size,
          mimetype: uploadedFileData.mimetype,
          uploadedAt: uploadedFileData.uploadedAt,
          analysis: {
            id: uploadedFileData.filename,
            filename: uploadedFileData.filename,
            originalName: uploadedFileData.originalName,
            uploadedAt: uploadedFileData.uploadedAt,
            scores: parsed.scores,
            categories: parsed.categories,
            fullAnalysis: analysisText,
            model: selectedModel.name,
            language: selectedLanguage
          }
        };
        
        // Get existing resumes
        const stored = localStorage.getItem('careerAI_resumes');
        const resumes: UploadedResume[] = stored ? JSON.parse(stored) : [];
        
        // Update or add resume
        const existingIndex = resumes.findIndex(r => r.id === resumeData.id);
        if (existingIndex >= 0) {
          resumes[existingIndex] = resumeData;
        } else {
          resumes.unshift(resumeData);
        }
        
        localStorage.setItem('careerAI_resumes', JSON.stringify(resumes));
        console.log('Saved to localStorage:', resumeData);
      }
    } else {
      console.error('Scan failed:', response);
      setError(response.message || response.error || 'Scan and analysis failed');
    }

    setScanning(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(droppedFile.type)) {
        setError('Please upload a PDF, DOC, or DOCX file');
        setFile(null);
        return;
      }
      
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }

      setFile(droppedFile);
      setError(null);
      setUploadSuccess(false);
      setAnalysisResult(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-blue-600">
                  CareerAI Pro
                </h1>
                <p className="text-xs text-gray-500">AI-Powered Resume Analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
              >
                <span>Dashboard</span>
              </Link>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${
                serverStatus === 'online' ? 'bg-green-50 border-green-300' : 
                serverStatus === 'offline' ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'
              }`}>
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  serverStatus === 'online' ? 'bg-green-500' : 
                  serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className={`text-sm font-semibold ${
                  serverStatus === 'online' ? 'text-green-700' : 
                  serverStatus === 'offline' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {serverStatus === 'online' ? 'Online' : 
                   serverStatus === 'offline' ? 'Offline' : 'Checking...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content - Split Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT SIDE - Upload & Controls */}
          <div className="space-y-6">

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Upload Your Resume</h3>
            <p className="text-gray-600">Supported formats: PDF, DOC, DOCX (Max 10MB)</p>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-lg text-gray-700 mb-2">
              <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500">PDF, DOC, or DOCX up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Selected File Display */}
          {file && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-md">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-900 font-semibold mb-1">Error</p>
                  <p className="text-red-800 text-sm">{error}</p>
                  {error.toLowerCase().includes('rate limit') && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 font-medium mb-2">💡 Tips to resolve rate limit:</p>
                      <ul className="text-xs text-yellow-700 space-y-1 ml-4 list-disc">
                        <li>Wait 30-60 seconds before trying again</li>
                        <li>Try selecting a different AI model from the list above</li>
                        <li>Free tier models have usage limits - they reset periodically</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && uploadedFileData && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-800 font-semibold">Upload Successful!</p>
              </div>
              <div className="ml-7 text-sm text-green-700">
                <p>File: {uploadedFileData.originalName}</p>
                <p>Size: {formatFileSize(uploadedFileData.size)}</p>
                <p>Uploaded: {new Date(uploadedFileData.uploadedAt).toLocaleString()}</p>
                <p className="mt-2 text-green-600 font-medium">
                  {uploadedFileData.mimetype === 'application/pdf' 
                    ? '✓ Ready to scan PDF' 
                    : '⚠️ Only PDF files can be scanned'}
                </p>
              </div>
            </div>
          )}

          {/* Language Selector */}
          {uploadedFileData && uploadedFileData.mimetype === 'application/pdf' && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <label className="text-sm font-semibold text-purple-900">Resume Language:</label>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedLanguage('english')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedLanguage === 'english'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-purple-600 border border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('french')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedLanguage === 'french'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-purple-600 border border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    🇫🇷 Français
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-purple-700">
                💡 Select the language of your resume. The AI will analyze and provide recommendations in the same language.
              </p>
            </div>
          )}

          {/* AI Model Selector */}
          <div className="mt-6">
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-gray-900">AI Model Selection</h4>
                </div>
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center"
                >
                  {showModelSelector ? 'Hide Models' : 'View All Models'}
                  <svg className={`w-4 h-4 ml-1 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Selected Model Display */}
              <div className="bg-white rounded-lg p-4 border-2 border-indigo-300 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">
                        {selectedModel.provider}
                      </span>
                      <h5 className="text-lg font-bold text-gray-900">{selectedModel.name}</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{selectedModel.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-gray-700">Context: <strong>{selectedModel.contextWindow}</strong></span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-gray-700">Params: <strong>{selectedModel.parameters}</strong></span>
                      </div>
                    </div>
                    {selectedModel.specialFeatures && selectedModel.specialFeatures.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {selectedModel.specialFeatures.map((feature, idx) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Model List (Collapsible) */}
              {showModelSelector && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">Available AI Models ({AI_MODELS.length}):</p>
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setShowModelSelector(false);
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedModel.id === model.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                              {model.provider}
                            </span>
                            <h6 className="font-bold text-gray-900">{model.name}</h6>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{model.description}</p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>📊 {model.contextWindow}</span>
                            <span>⚡ {model.parameters}</span>
                            <span className="text-green-600 font-semibold">FREE</span>
                          </div>
                        </div>
                        {selectedModel.id === model.id && (
                          <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Resume
                </span>
              )}
            </button>

            {/* Scan Button */}
            <button
              onClick={handleScan}
              disabled={!uploadedFileData || uploadedFileData.mimetype !== 'application/pdf' || scanning}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {scanning ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing with AI...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Scan & Analyze with ATS
                </span>
              )}
            </button>
          </div>

          {/* Helper Text */}
          {uploadedFileData && uploadedFileData.mimetype !== 'application/pdf' && (
            <p className="mt-3 text-sm text-gray-500 text-center">
              ℹ️ ATS Scan & Analysis feature is only available for PDF files
            </p>
          )}
          {/* Error Message Display */}
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-red-800 font-semibold mb-1">Analysis Error</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                  {error.includes('rate limit') && (
                    <div className="mt-3 text-sm text-red-600">
                      <p className="font-semibold mb-2">💡 Quick Solutions:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Wait 1-2 minutes and try again</li>
                        <li>Try a different AI model from the selector above</li>
                        <li>Each model has separate rate limits</li>
                      </ul>
                    </div>
                  )}
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {uploadedFileData && uploadedFileData.mimetype === 'application/pdf' && !analysisResult && (
            <p className="mt-3 text-sm text-blue-600 text-center font-medium">
              💡 Click "Scan & Analyze with ATS" to get AI-powered resume insights and improvement suggestions
            </p>
          )}
        </div>
          </div>
          {/* End of LEFT SIDE */}

          {/* RIGHT SIDE - Analysis Results */}
          <div className="space-y-6">
            {!analysisResult ? (
              /* Placeholder when no results */
              <div className="bg-white rounded-2xl shadow-xl border-2 border-dashed border-gray-300 p-12 text-center h-full flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Analysis Results Will Appear Here</h3>
                <p className="text-gray-600 max-w-md">
                  Upload your resume and click "Scan & Analyze with ATS" to see detailed AI-powered insights and recommendations
                </p>
                <div className="mt-8 flex items-center space-x-2 text-sm text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Fast • Accurate • AI-Powered</span>
                </div>
              </div>
            ) : (
              /* Analysis Results Display */
              <div className="space-y-6">
                {/* Score Overview Card */}
                {parsedAnalysis && (
                  <div className="bg-blue-600 rounded-2xl p-8 shadow-2xl text-white">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-3xl font-bold mb-2">Analysis Complete!</h3>
                        <p className="text-blue-100">AI-Powered Resume Optimization Report</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(analysisResult!);
                          alert('Full analysis copied to clipboard!');
                        }}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-center py-6">
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8">
                        <ScoreGauge score={parsedAnalysis.scores.overall} size="lg" showLabel={true} />
                      </div>
                    </div>
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-md">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="font-semibold">View Mode:</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewMode('categories')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        viewMode === 'categories'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📊 Categories
                    </button>
                    <button
                      onClick={() => setViewMode('full')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        viewMode === 'full'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📄 Full Report
                    </button>
                  </div>
                </div>

                {/* Category View */}
                {viewMode === 'categories' && parsedAnalysis && (
                  <div className="space-y-4">
                    {parsedAnalysis.categories.map((category, index) => (
                      <CategoryScore key={index} category={category} />
                    ))}
                  </div>
                )}

                {/* Full Report View */}
                {viewMode === 'full' && (
                  <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-800">Detailed Analysis Report</h4>
                    </div>
                  </div>

                  {/* Analysis Content */}
                  <div className="p-6 max-h-[700px] overflow-y-auto">
                    <div className="prose prose-lg max-w-none">
                      {/* Info Banner */}
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                        <div className="flex items-start">
                          <svg className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-blue-800">Analysis Powered by {selectedModel.name}</p>
                            <p className="text-xs text-blue-600 mt-1">This report includes ATS compatibility scoring, keyword analysis, and optimization recommendations.</p>
                          </div>
                        </div>
                      </div>

                      {/* Main Analysis Content with Enhanced Formatting */}
                      <div className="space-y-6">
                        {analysisResult.split('\n').map((line, index) => {
                          // Check if line is a numbered section (1., 2., etc.)
                          if (/^\d+\./.test(line.trim())) {
                            return (
                              <div key={index} className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                                <h5 className="font-bold text-indigo-900 text-lg mb-2">{line}</h5>
                              </div>
                            );
                          }
                          // Check if line contains "ATS" or "Score" for highlighting
                          else if (line.toLowerCase().includes('ats') || line.toLowerCase().includes('score')) {
                            return (
                              <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                                <p className="text-gray-800 font-semibold">{line}</p>
                              </div>
                            );
                          }
                          // Check for bullet points or dashes
                          else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                            return (
                              <div key={index} className="flex items-start space-x-2 ml-4">
                                <svg className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-gray-700 leading-relaxed">{line.replace(/^[-•]\s*/, '')}</p>
                              </div>
                            );
                          }
                          // Check for headers (ALL CAPS or contains ":")
                          else if (line.trim() === line.trim().toUpperCase() && line.trim().length > 0 && line.trim().length < 50) {
                            return (
                              <h6 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b-2 border-indigo-200">
                                {line}
                              </h6>
                            );
                          }
                          // Regular paragraphs
                          else if (line.trim().length > 0) {
                            return (
                              <p key={index} className="text-gray-700 leading-relaxed">
                                {line}
                              </p>
                            );
                          }
                          // Empty lines for spacing
                          else {
                            return <div key={index} className="h-2"></div>;
                          }
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Analysis completed successfully</span>
                      </div>
                      <button
                        onClick={() => {
                          setAnalysisResult(null);
                        }}
                        className="text-gray-600 hover:text-gray-800 font-medium text-sm flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Clear Results</span>
                      </button>
                    </div>
                  </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* End of RIGHT SIDE */}
        </div>
        {/* End of Grid */}

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Analysis</h4>
            <p className="text-gray-600">Get intelligent insights and recommendations for your resume</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Fast Processing</h4>
            <p className="text-gray-600">Quick analysis and instant feedback on your resume</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h4>
            <p className="text-gray-600">Your data is encrypted and handled with utmost security</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2025 CareerAI Pro. Advanced Resume Analysis Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}