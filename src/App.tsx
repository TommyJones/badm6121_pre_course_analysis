/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ParsedSurveyDataset, SurveyQuestion, AISynthesisResult } from './types/survey';
import { parseSurveyCSV } from './utils/csvParser';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { DistributionCard } from './components/DistributionCard';
import { AISynthesisPanel } from './components/AISynthesisPanel';
import { PresenterSlidesMode } from './components/PresenterSlidesMode';
import { StudentResponsesTable } from './components/StudentResponsesTable';
import { UploadModal } from './components/UploadModal';
import {
  Upload,
  BarChart3,
  Sparkles,
  Presentation,
  Filter,
  X,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [dataset, setDataset] = useState<ParsedSurveyDataset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<
    'overview' | 'questions' | 'synthesis' | 'slides' | 'responses'
  >('overview');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(true);

  // Cross-filtering: filter by specific question & option
  const [activeFilter, setActiveFilter] = useState<{
    questionId: string;
    option: string;
  } | null>(null);

  // Load sample dataset on mount
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sample-data');
      if (res.ok) {
        const csvText = await res.text();
        const parsed = parseSurveyCSV(
          csvText,
          'Pre-Course_Survey_Student_Analysis_Report.csv'
        );
        setDataset(parsed);
      } else {
        console.log('Sample file not found on server, showing empty state.');
      }
    } catch (err: any) {
      console.warn('Could not load sample data automatically:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileLoaded = (csvContent: string, filename: string) => {
    try {
      const parsed = parseSurveyCSV(csvContent, filename);
      setDataset(parsed);
      setActiveFilter(null);
      setCurrentTab('overview');
    } catch (err: any) {
      setError(`Failed to parse survey CSV: ${err?.message || 'Invalid format'}`);
    }
  };

  const handleUpdateAISummary = (questionId: string, summary: AISynthesisResult) => {
    if (!dataset) return;
    setDataset({
      ...dataset,
      questions: dataset.questions.map((q) =>
        q.id === questionId ? { ...q, aiSummary: summary } : q
      ),
    });
  };

  // Filter dataset rows if activeFilter is set
  const filteredDataset = React.useMemo(() => {
    if (!dataset || !activeFilter) return dataset;

    const targetQ = dataset.questions.find((q) => q.id === activeFilter.questionId);
    if (!targetQ) return dataset;

    const matchingRows = dataset.rawRows.filter((row) => {
      const val = row[targetQ.originalHeader] || '';
      return val.includes(activeFilter.option);
    });

    const recomputedQuestions = dataset.questions.map((q) => {
      const vals = matchingRows.map((r) => r[q.originalHeader] || '');
      const nonBlank = vals.filter((v) => v.trim().length > 0).length;

      const updatedDist = q.distribution.map((d) => {
        let count = 0;
        vals.forEach((v) => {
          if (v.includes(d.option)) count++;
        });
        const pct = matchingRows.length > 0 ? Math.round((count / matchingRows.length) * 100 * 10) / 10 : 0;
        return { ...d, count, percentage: pct };
      });

      return {
        ...q,
        totalAnswered: nonBlank,
        distribution: updatedDist,
      };
    });

    return {
      ...dataset,
      metadata: {
        ...dataset.metadata,
        totalStudents: matchingRows.length,
      },
      questions: recomputedQuestions,
      rawRows: matchingRows,
    };
  }, [dataset, activeFilter]);

  const nonFreeTextQuestions = (filteredDataset || dataset)?.questions.filter(
    (q) => q.isNonFreeText
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* 3-Zone Top Navigation */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        onOpenUpload={() => setUploadModalOpen(true)}
        datasetName={dataset?.metadata.filename}
        totalStudents={dataset?.metadata.totalStudents}
        onLoadSample={loadSampleData}
        hasData={!!dataset}
      />

      {/* Presentation Fullscreen Slides Overlay */}
      {currentTab === 'slides' && dataset && (
        <PresenterSlidesMode
          dataset={filteredDataset || dataset}
          privacyMode={privacyMode}
          onExit={() => setCurrentTab('overview')}
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">Processing survey dataset...</p>
            <p className="text-xs text-slate-500 mt-1">Parsing Canvas Quiz responses and response structures</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {!loading && !dataset && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Classroom Survey Intelligence
            </h2>
            <p className="text-sm text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
              Upload your Canvas Quiz Student Analysis Report or CSV survey to inspect answer distributions and generate Gemini AI syntheses of open-ended responses.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setUploadModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Survey CSV</span>
              </button>
              <button
                onClick={loadSampleData}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Try with Pre-Loaded MBA Survey</span>
              </button>
            </div>
          </div>
        )}

        {!loading && dataset && (
          <div className="space-y-8">
            {activeFilter && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-indigo-900 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span>
                    Filtered cohort by response: <strong>"{activeFilter.option}"</strong> (
                    {(filteredDataset || dataset).metadata.totalStudents} of {dataset.metadata.totalStudents} students)
                  </span>
                </div>
                <button
                  onClick={() => setActiveFilter(null)}
                  className="px-2 py-1 text-xs font-semibold bg-white border border-indigo-200 rounded-md hover:bg-indigo-100 text-indigo-800 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Filter
                </button>
              </div>
            )}

            {/* TAB 1: OVERVIEW */}
            {currentTab === 'overview' && (
              <div className="space-y-8">
                <MetricCards dataset={filteredDataset || dataset} />

                {/* Presentation Launch Strip */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <Presentation className="w-3.5 h-3.5" />
                      Classroom Walkthrough Mode
                    </span>
                    <h3 className="text-lg font-bold">
                      Ready to talk through the survey findings with the class?
                    </h3>
                    <p className="text-xs text-slate-300 max-w-xl">
                      Launch high-contrast presentation slides formatted for classroom projection, complete with speaker notes and discussion prompts.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('slides')}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0 shadow-sm"
                  >
                    <span>Launch Classroom Slides</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Non-Free-Text Question Distributions Grid */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-slate-700" />
                        Distribution of Answers (Non-Free-Text Questions)
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Interactive breakdown of single-choice and multi-select responses. Click any option to isolate that cohort.
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {nonFreeTextQuestions.length} categorical questions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {nonFreeTextQuestions.map((q) => (
                      <DistributionCard
                        key={q.id}
                        question={q}
                        totalStudents={(filteredDataset || dataset).metadata.totalStudents}
                        selectedOption={
                          activeFilter?.questionId === q.id ? activeFilter.option : null
                        }
                        onSelectOption={(qId, option) => {
                          if (
                            activeFilter?.questionId === qId &&
                            activeFilter.option === option
                          ) {
                            setActiveFilter(null);
                          } else {
                            setActiveFilter({ questionId: qId, option });
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* AI Qualitative Summary Action Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" />
                      AI Thematic Summary Ready
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Explore Open-Ended Student Voices & Key Themes
                    </h3>
                    <p className="text-xs text-slate-600 max-w-xl">
                      Students shared previous AI projects (wedding RSVP web apps, dual-currency personal finance dashboards, Rwandan tourism startup consulting) and course ambitions.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('synthesis')}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                  >
                    <span>View AI Synthesis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: QUESTIONS & DISTRIBUTIONS */}
            {currentTab === 'questions' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Question Analysis & Answer Distributions
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View response distributions across all survey questions
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {dataset.questions.map((q) => (
                    <DistributionCard
                      key={q.id}
                      question={q}
                      totalStudents={dataset.metadata.totalStudents}
                      selectedOption={
                        activeFilter?.questionId === q.id ? activeFilter.option : null
                      }
                      onSelectOption={(qId, option) => {
                        if (
                          activeFilter?.questionId === qId &&
                          activeFilter.option === option
                        ) {
                          setActiveFilter(null);
                        } else {
                          setActiveFilter({ questionId: qId, option });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: AI QUALITATIVE SYNTHESIS */}
            {currentTab === 'synthesis' && (
              <AISynthesisPanel
                dataset={filteredDataset || dataset}
                privacyMode={privacyMode}
                onUpdateQuestionAISummary={handleUpdateAISummary}
              />
            )}

            {/* TAB 4: RAW RESPONSES TABLE */}
            {currentTab === 'responses' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Individual Student Submissions
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search and filter individual student submissions (Privacy mode{' '}
                    {privacyMode ? 'masks names' : 'reveals names'})
                  </p>
                </div>
                <StudentResponsesTable
                  dataset={filteredDataset || dataset}
                  privacyMode={privacyMode}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* CSV Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onFileLoaded={handleFileLoaded}
        onLoadSample={loadSampleData}
        isSampleAvailable={true}
      />
    </div>
  );
}
