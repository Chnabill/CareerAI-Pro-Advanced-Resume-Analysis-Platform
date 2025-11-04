import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import type { UploadedResume } from '../types/resume';
import { ResumeCard } from '../components/ResumeCard';

export default function Dashboard() {
  const [resumes, setResumes] = useState<UploadedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load resumes from localStorage
    loadResumes();
  }, []);

  const loadResumes = () => {
    try {
      const stored = localStorage.getItem('careerAI_resumes');
      if (stored) {
        const parsedResumes = JSON.parse(stored);
        setResumes(parsedResumes);
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = (resume: UploadedResume) => {
    // Store selected resume and navigate to analysis view
    localStorage.setItem('careerAI_selectedResume', JSON.stringify(resume));
    navigate('/');
  };

  const handleDeleteResume = (resumeId: string) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      const updated = resumes.filter(r => r.id !== resumeId);
      setResumes(updated);
      localStorage.setItem('careerAI_resumes', JSON.stringify(updated));
    }
  };

  const getStats = () => {
    const analyzed = resumes.filter(r => r.analysis).length;
    const avgScore = resumes
      .filter(r => r.analysis)
      .reduce((sum, r) => sum + (r.analysis?.scores.overall || 0), 0) / (analyzed || 1);
    
    return {
      total: resumes.length,
      analyzed,
      avgScore: Math.round(avgScore)
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your resumes...</p>
        </div>
      </div>
    );
  }

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
                <p className="text-xs text-gray-500">Resume Dashboard</p>
              </div>
            </div>
            <Link
              to="/"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              New Analysis
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Resumes</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Analyzed</p>
                <p className="text-3xl font-bold text-green-600">{stats.analyzed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>


          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Score</p>
                <p className="text-3xl font-bold text-purple-600">{stats.avgScore}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Resumes Grid */}
        {resumes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Resumes Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start by uploading your first resume to get AI-powered insights and recommendations
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Upload Your First Resume</span>
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Resumes</h2>
              <p className="text-sm text-gray-600">{resumes.length} {resumes.length === 1 ? 'resume' : 'resumes'} found</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onView={handleViewResume}
                  onDelete={handleDeleteResume}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
