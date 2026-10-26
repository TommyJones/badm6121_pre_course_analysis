import React from 'react';
import { SurveyQuestion, DistributionItem } from '../types/survey';
import { CheckSquare, ListOrdered, Users } from 'lucide-react';

interface DistributionCardProps {
  question: SurveyQuestion;
  totalStudents: number;
  onSelectOption?: (questionId: string, option: string) => void;
  selectedOption?: string | null;
}

export const DistributionCard: React.FC<DistributionCardProps> = ({
  question,
  totalStudents,
  onSelectOption,
  selectedOption,
}) => {
  const isMulti = question.type === 'multi_choice';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5">
              Q{question.questionNumber}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                {question.prompt}
              </h3>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>{isMulti ? 'Multi-select (select all that apply)' : 'Single choice'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{question.totalAnswered} respondents</span>
              </div>
            </div>
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="space-y-2.5 mt-4">
          {question.distribution.map((item, idx) => {
            const isSelected = selectedOption === item.option;
            return (
              <div
                key={idx}
                onClick={() => onSelectOption?.(question.id, item.option)}
                className={`group p-2 rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/80 ring-1 ring-indigo-400'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs gap-3 mb-1.5">
                  <span className="font-medium text-slate-800 line-clamp-1 group-hover:text-slate-900">
                    {item.option}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-slate-500 tabular-nums">
                      {item.count} {item.count === 1 ? 'student' : 'students'}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSelected
                        ? 'bg-indigo-600'
                        : idx === 0
                        ? 'bg-slate-800'
                        : idx === 1
                        ? 'bg-slate-600'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}

          {question.distribution.length === 0 && (
            <p className="text-xs text-slate-400 italic py-2">No categorical data available.</p>
          )}
        </div>
      </div>

      {isMulti && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          * Percentages calculated over total cohort respondents ({totalStudents}); total exceeds 100% due to multi-select.
        </div>
      )}
    </div>
  );
};
