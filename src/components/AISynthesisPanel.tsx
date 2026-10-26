import React, { useState, useEffect } from 'react';
import { SurveyQuestion, AISynthesisResult, ParsedSurveyDataset } from '../types/survey';
import {
  Sparkles,
  RefreshCw,
  Quote,
  MessageSquare,
  Flame,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Award,
  HelpCircle,
} from 'lucide-react';

interface AISynthesisPanelProps {
  dataset: ParsedSurveyDataset;
  privacyMode: boolean;
  onUpdateQuestionAISummary: (questionId: string, summary: AISynthesisResult) => void;
}

export const AISynthesisPanel: React.FC<AISynthesisPanelProps> = ({
  dataset,
  privacyMode,
  onUpdateQuestionAISummary,
}) => {
  // Find open-ended or narrative questions
  const openQuestions = dataset.questions.filter((q) => !q.isNonFreeText);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    openQuestions[0]?.id || dataset.questions[0]?.id || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = dataset.questions.find((q) => q.id === selectedQuestionId);

  // Trigger Gemini AI synthesis
  const fetchAISummary = async (question: SurveyQuestion, forceRefresh = false) => {
    if (!question) return;
    if (question.aiSummary && !forceRefresh) return;

    setLoading(true);
    setError(null);

    try {
      const validResponses = question.responses
        .filter((r) => r.response && r.response.trim().length > 0)
        .map((r) => ({
          studentId: r.studentId,
          text: r.response,
        }));

      // Gather brief context of cohort
      const context = `Survey file "${dataset.metadata.filename}", ${dataset.metadata.totalStudents} MBA students in ${dataset.metadata.courseSection || 'Fall semester'}.`;

      const res = await fetch('/api/summarize-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle: question.prompt,
          responses: validResponses,
          allQuestionsContext: context,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result: AISynthesisResult = await res.json();
      onUpdateQuestionAISummary(question.id, result);
    } catch (err: any) {
      console.error('Failed to summarize with AI:', err);
      setError(err?.message || 'Error communicating with AI service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentQuestion && !currentQuestion.aiSummary && !loading) {
      fetchAISummary(currentQuestion);
    }
  }, [selectedQuestionId]);

  const summary = currentQuestion?.aiSummary;

  return (
    <div className="space-y-6">
      {/* Top Controls & Question Selection Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">
                AI Qualitative Synthesis & Thematic Analysis
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Powered by Gemini 3.8 Flash to extract consensus themes, sentiment, and classroom talking points
            </p>
          </div>

          <button
            onClick={() => currentQuestion && fetchAISummary(currentQuestion, true)}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing with Gemini...' : 'Re-analyze with Gemini'}</span>
          </button>
        </div>

        {/* Tab Buttons for each open-ended question */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {openQuestions.map((q) => (
            <button
              key={q.id}
              onClick={() => setSelectedQuestionId(q.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left flex items-center gap-2 ${
                selectedQuestionId === q.id
                  ? 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="font-mono font-semibold text-indigo-600">Q{q.questionNumber}</span>
              <span className="truncate max-w-[240px] sm:max-w-[320px]">{q.prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && !summary && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            Synthesizing Student Voices...
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Reading all {currentQuestion?.responses.length || 0} student narratives to cluster core themes, emotional sentiment, and instructor discussion questions.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          <strong>Analysis Notice:</strong> {error}. Using heuristic synthesis fallback.
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          {/* Executive Overview Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4" />
              Executive Cohort Summary
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              "{currentQuestion?.prompt}"
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {summary.summary}
            </p>

            {/* Sentiment & Mindset Sub-card */}
            <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block mb-1">Overall Tone</span>
                <span className="text-sm font-semibold text-slate-900 block">
                  {summary.sentimentBreakdown.overall}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block mb-1">Enthusiasm Level</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-indigo-600 font-mono tabular-nums">
                    {summary.sentimentBreakdown.enthusiasmScore}/10
                  </span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${summary.sentimentBreakdown.enthusiasmScore * 10}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-xs text-slate-500 block mb-1">Observed Mindsets</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {summary.sentimentBreakdown.notableEmotions.map((emotion, idx) => (
                    <span
                      key={idx}
                      className="text-xs text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-sm"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key Themes Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Dominant Themes ({summary.keyThemes.length})
              </h3>
              <span className="text-xs text-slate-500">Grouped by frequency & impact</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.keyThemes.map((themeItem, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-semibold text-indigo-700">
                        Theme 0{idx + 1}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {themeItem.prevalence}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 mb-2">
                      {themeItem.theme}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {themeItem.description}
                    </p>
                  </div>

                  {/* Sample Quotes */}
                  {themeItem.sampleQuotes && themeItem.sampleQuotes.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Student Quote
                      </span>
                      {themeItem.sampleQuotes.map((quote, qIdx) => (
                        <div
                          key={qIdx}
                          className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-700 italic border-l-2 border-indigo-400"
                        >
                          "{quote}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Standout Student Projects & Classroom Discussion Prompts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Standout Projects / Ambitions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Standout Student Projects & Experiments
              </h3>
              <div className="space-y-3">
                {summary.standoutProjectsOrIdeas.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-xs font-medium text-slate-900 mb-1 leading-relaxed">
                      "{item.highlight}"
                    </p>
                    <p className="text-xs text-indigo-700 font-medium">
                      ↳ {item.whyNotable}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Classroom Discussion Prompts for the Professor */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Classroom Discussion Prompts
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Targeted questions ready to pose to the room to spark debate and engagement
                </p>

                <div className="space-y-2.5">
                  {summary.classroomDiscussionPrompts.map((prompt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        {prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Facilitation tip: Call on students who built early artifacts</span>
                <span className="font-mono text-indigo-600">Lecture Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
