import React from 'react';
import { ParsedSurveyDataset } from '../types/survey';
import { Users, Zap, CreditCard, Code, Sparkles } from 'lucide-react';

interface MetricCardsProps {
  dataset: ParsedSurveyDataset;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ dataset }) => {
  const total = dataset.metadata.totalStudents;

  // 1. Daily frequency
  const frequencyQ = dataset.questions.find((q) =>
    q.prompt.toLowerCase().includes('how often do you use ai')
  );
  const dailyCount =
    frequencyQ?.distribution.find((d) => d.option.toLowerCase().includes('daily'))?.count || 0;
  const dailyPct = total > 0 ? Math.round((dailyCount / total) * 100) : 0;

  // 2. Paid tools
  const paidQ = dataset.questions.find((q) =>
    q.prompt.toLowerCase().includes('pay for')
  );
  const freeOnlyCount =
    paidQ?.distribution.find((d) => d.option.toLowerCase().includes('free versions only') || d.option.toLowerCase().includes('none'))?.count || 0;
  const paidUsersCount = Math.max(0, total - freeOnlyCount);
  const paidPct = total > 0 ? Math.round((paidUsersCount / total) * 100) : 0;

  // 3. Coding comfort
  const codeQ = dataset.questions.find((q) =>
    q.prompt.toLowerCase().includes('comfortable are you with code')
  );
  const nonCodersCount =
    codeQ?.distribution.find((d) => d.option.toLowerCase().includes('never written'))?.count || 0;
  const nonCodersPct = total > 0 ? Math.round((nonCodersCount / total) * 100) : 0;

  // 4. Building experience
  const buildQ = dataset.questions.find((q) =>
    q.prompt.toLowerCase().includes('experience with building')
  );
  const builtThingsCount =
    buildQ?.distribution
      .filter((d) => !d.option.toLowerCase().includes('only chatted'))
      .reduce((acc, d) => acc + d.count, 0) || 0;
  const builtPct = total > 0 ? Math.round((builtThingsCount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Cohort Size</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {total}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {dataset.metadata.courseSection ? (
            <span className="truncate block font-mono">{dataset.metadata.courseSection}</span>
          ) : (
            'Survey respondents'
          )}
        </div>
      </div>

      {/* Metric 2 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Daily AI Usage</span>
          <Zap className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {dailyPct}%
        </div>
        <div className="text-xs text-slate-500 mt-1">
          <span className="font-mono tabular-nums">{dailyCount} of {total}</span> students use AI daily
        </div>
      </div>

      {/* Metric 3 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Paid Subscriptions</span>
          <CreditCard className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {paidPct}%
        </div>
        <div className="text-xs text-slate-500 mt-1">
          <span className="font-mono tabular-nums">{paidUsersCount} of {total}</span> invest in paid tiers
        </div>
      </div>

      {/* Metric 4 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span>Non-Coder Cohort</span>
          <Code className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
          {nonCodersPct}%
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Never written code; prime for vibe coding
        </div>
      </div>
    </div>
  );
};
