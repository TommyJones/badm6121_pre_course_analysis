import React from 'react';
import {
  Upload,
  Eye,
  EyeOff,
  BarChart3,
  Sparkles,
  Presentation,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'overview' | 'questions' | 'synthesis' | 'slides' | 'responses';
  setCurrentTab: (tab: 'overview' | 'questions' | 'synthesis' | 'slides' | 'responses') => void;
  privacyMode: boolean;
  setPrivacyMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenUpload: () => void;
  datasetName?: string;
  totalStudents?: number;
  onLoadSample: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  privacyMode,
  setPrivacyMode,
  onOpenUpload,
  datasetName,
  totalStudents,
  onLoadSample,
  hasData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Zone 1: Single text element wordmark / brand title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-semibold text-base shadow-xs">
              CS
            </div>
            <div>
              <a
                href="#overview"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab('overview');
                }}
                className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block"
              >
                Classroom Survey Intelligence
              </a>
              {datasetName && (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="truncate max-w-[180px] font-mono">{datasetName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{totalStudents} Students</span>
                </div>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
            <button
              onClick={() => setCurrentTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'overview'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Overview
            </button>
            <button
              onClick={() => setCurrentTab('questions')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'questions'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              Distributions
            </button>
            <button
              onClick={() => setCurrentTab('synthesis')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'synthesis'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Synthesis
            </button>
            <button
              onClick={() => setCurrentTab('slides')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'slides'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Presentation className="w-4 h-4" />
              Classroom Slides
            </button>
          </nav>

          {/* Zone 3: Primary Action & Privacy Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Student Privacy Toggle for Classroom Projection */}
            <button
              onClick={() => setPrivacyMode((prev) => !prev)}
              title={privacyMode ? 'Privacy Mode is ON (Student names are masked)' : 'Privacy Mode is OFF (Student names are visible)'}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                privacyMode
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {privacyMode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Names Masked</span>
                  <span className="sm:hidden">Masked</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Show Names</span>
                  <span className="sm:hidden">Names</span>
                </>
              )}
            </button>

            {!hasData && (
              <button
                onClick={onLoadSample}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap hidden sm:inline-flex"
              >
                Load Sample
              </button>
            )}

            <button
              onClick={onOpenUpload}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
