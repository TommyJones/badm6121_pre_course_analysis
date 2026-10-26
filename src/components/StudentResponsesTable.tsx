import React, { useState } from 'react';
import { ParsedSurveyDataset, SurveyQuestion } from '../types/survey';
import { Search, Filter, Copy, Check, EyeOff, Eye } from 'lucide-react';

interface StudentResponsesTableProps {
  dataset: ParsedSurveyDataset;
  privacyMode: boolean;
}

export const StudentResponsesTable: React.FC<StudentResponsesTableProps> = ({
  dataset,
  privacyMode,
}) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const questions = dataset.questions;

  // Filter rows
  const filteredStudents = dataset.rawRows.filter((row, idx) => {
    const studentName = privacyMode ? `Student ${idx + 1}` : row['name'] || `Student ${idx + 1}`;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (studentName.toLowerCase().includes(q)) return true;
    // search in any field
    return Object.values(row).some((val) => val.toLowerCase().includes(q));
  });

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search responses or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 w-56 sm:w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-900 max-w-[200px] truncate"
            >
              <option value="all">All Survey Columns</option>
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  Q{q.questionNumber}: {q.prompt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <span className="font-semibold text-slate-900 tabular-nums">{filteredStudents.length}</span> of {dataset.metadata.totalStudents} respondents
        </div>
      </div>

      {/* Responses Grid / Table */}
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {filteredStudents.map((row, rIdx) => {
          const studentDisplayName = privacyMode
            ? `Student ${rIdx + 1}`
            : row['name'] || `Student ${rIdx + 1}`;

          return (
            <div key={rIdx} className="p-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center font-mono">
                    {rIdx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {studentDisplayName}
                  </span>
                  {row['section'] && (
                    <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                      ({row['section']})
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {row['submitted'] || ''}
                </div>
              </div>

              {/* Display fields based on selection */}
              <div className="space-y-3 mt-3 pl-8">
                {questions
                  .filter((q) => selectedQuestionId === 'all' || q.id === selectedQuestionId)
                  .map((q, qIdx) => {
                    const ans = row[q.originalHeader] || '';
                    if (!ans.trim()) return null;

                    return (
                      <div key={q.id} className="text-xs">
                        <span className="font-semibold text-slate-700 block mb-0.5">
                          Q{q.questionNumber}: {q.prompt}
                        </span>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-800 leading-relaxed relative group">
                          <p className="whitespace-pre-line">{ans}</p>
                          <button
                            onClick={() => handleCopy(ans, rIdx * 100 + qIdx)}
                            className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1 rounded bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-opacity"
                            title="Copy response"
                          >
                            {copiedIdx === rIdx * 100 + qIdx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            No responses match your filter or search query.
          </div>
        )}
      </div>
    </div>
  );
};
