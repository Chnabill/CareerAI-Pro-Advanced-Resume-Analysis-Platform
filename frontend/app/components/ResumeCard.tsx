import type { UploadedResume } from '../types/resume';
import { ScoreGauge } from './ScoreGauge';

interface ResumeCardProps {
  resume: UploadedResume;
  onView: (resume: UploadedResume) => void;
  onDelete?: (resumeId: string) => void;
}

export function ResumeCard({ resume, onView, onDelete }: ResumeCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      {/* Header with thumbnail */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 truncate">{resume.originalName}</h3>
            <div className="flex items-center space-x-4 text-sm text-blue-100">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(resume.uploadedAt)}
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {formatFileSize(resume.size)}
              </span>
            </div>
          </div>
          {resume.analysis && (
            <div className="ml-4">
              <ScoreGauge score={resume.analysis.scores.overall} size="sm" showLabel={false} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {resume.analysis ? (
          <div className="space-y-4">
            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">ATS Score</div>
                <div className="text-2xl font-bold text-blue-600">{resume.analysis.scores.atsScore}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Content</div>
                <div className="text-2xl font-bold text-purple-600">{resume.analysis.scores.content}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Structure</div>
                <div className="text-2xl font-bold text-green-600">{resume.analysis.scores.structure}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">Skills</div>
                <div className="text-2xl font-bold text-orange-600">{resume.analysis.scores.skills}</div>
              </div>
            </div>

            {/* Model & Language Info */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {resume.analysis.model}
              </span>
              <span className="uppercase">{resume.analysis.language}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm">No analysis yet</p>
            <p className="text-gray-400 text-xs mt-1">Click "View Details" to analyze</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
        <button
          onClick={() => onView(resume)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>View Details</span>
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(resume.id)}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
