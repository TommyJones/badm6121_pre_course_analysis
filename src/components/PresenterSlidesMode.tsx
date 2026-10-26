import React, { useState, useEffect } from 'react';
import { ParsedSurveyDataset, SurveyQuestion } from '../types/survey';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  MessageSquare,
  Sparkles,
  Users,
  Code,
  Zap,
  Briefcase,
  HelpCircle,
  X,
} from 'lucide-react';

interface PresenterSlidesModeProps {
  dataset: ParsedSurveyDataset;
  privacyMode: boolean;
  onExit: () => void;
}

export const PresenterSlidesMode: React.FC<PresenterSlidesModeProps> = ({
  dataset,
  privacyMode,
  onExit,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          onExit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onExit]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const total = dataset.metadata.totalStudents;

  // Extract key questions
  const qYear = dataset.questions.find((q) => q.prompt.toLowerCase().includes('which year'));
  const qFreq = dataset.questions.find((q) => q.prompt.toLowerCase().includes('how often'));
  const qPaid = dataset.questions.find((q) => q.prompt.toLowerCase().includes('pay for'));
  const qUsed = dataset.questions.find((q) => q.prompt.toLowerCase().includes('used ai for'));
  const qBuild = dataset.questions.find((q) => q.prompt.toLowerCase().includes('building things'));
  const qCode = dataset.questions.find((q) => q.prompt.toLowerCase().includes('comfortable are you with code'));
  const qInteresting = dataset.questions.find((q) => q.prompt.toLowerCase().includes('interesting or useful'));
  const qWant = dataset.questions.find((q) => q.prompt.toLowerCase().includes('want to be able to do'));
  const qIndustry = dataset.questions.find((q) => q.prompt.toLowerCase().includes('industry or function'));

  // Define 8 cohesive presentation slides
  const slides = [
    {
      title: 'Pre-Course Survey & Cohort Profile',
      subtitle: `${dataset.metadata.courseSection || 'MBA Program'} · ${total} Student Responses`,
      speakerNotes:
        'Welcome students! Point out that 100% of the class completed the survey. Set the stage: this course is about moving from consumers to creators of AI tools.',
      renderContent: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto">
          <div className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-slate-400">Class Size</span>
              <div className="text-6xl font-bold font-mono my-4 tabular-nums">{total}</div>
              <p className="text-sm text-slate-300">
                100% submission rate. Every student in the section contributed their goals and AI baseline.
              </p>
            </div>
            <div className="mt-8 text-xs font-mono text-slate-400">
              {dataset.metadata.institution || 'Georgetown McDonough'}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs col-span-2 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Cohort Composition</h4>
              <div className="space-y-4">
                {qYear?.distribution.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-base font-medium mb-1">
                      <span>{item.option}</span>
                      <span className="font-mono">{item.percentage}% ({item.count})</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900 rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 text-sm text-slate-600">
              💡 <strong>Key Takeaway:</strong> A focused cohort at the exact pivot point where mastering AI workflow automation provides immediate competitive advantage in internships and job search.
            </div>
          </div>
        </div>
      ),
    },

    {
      title: 'AI Adoption: Frequency & Subscriptions',
      subtitle: 'How deeply embedded is AI in your daily MBA routine?',
      speakerNotes:
        'Ask the room: How many are paying for their own Claude or ChatGPT Plus? Notice how many have both. Probe why people choose Claude vs ChatGPT.',
      renderContent: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
          {/* Daily Usage */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Usage Frequency
            </h4>
            <p className="text-xs text-slate-500 mb-6">How often do you use AI tools (ChatGPT, Claude, Gemini)?</p>
            <div className="space-y-4">
              {qFreq?.distribution.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span>{item.option}</span>
                    <span className="font-mono">{item.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${idx === 0 ? 'bg-amber-500' : 'bg-slate-400'}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Paid Tools */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Paid Subscriptions
            </h4>
            <p className="text-xs text-slate-500 mb-6">Tools students currently pay for personally or through work</p>
            <div className="space-y-3">
              {qPaid?.distribution.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{item.option}</span>
                  <span className="text-sm font-mono font-bold text-indigo-700">{item.count} students ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    {
      title: 'Current Applications of AI',
      subtitle: 'What tasks are MBA students using AI for today? (Select all that apply)',
      speakerNotes:
        'Highlight the shift: writing and research are table stakes. But look at "Building an app/tool/automation" and "Writing or fixing code". That is where the highest leverage lies.',
      renderContent: () => (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs my-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {qUsed?.distribution.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-800">{item.option}</span>
                  <span className="font-mono font-semibold text-slate-900">{item.percentage}% ({item.count})</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.option.toLowerCase().includes('building')
                        ? 'bg-indigo-600'
                        : item.option.toLowerCase().includes('code')
                        ? 'bg-purple-600'
                        : 'bg-slate-700'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 block">Baseline Literacy</span>
              <span className="text-sm font-bold text-slate-900">Writing, Brainstorming & Research</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <span className="text-xs text-indigo-600 block">Emerging Frontier</span>
              <span className="text-sm font-bold text-indigo-900">Automations & Custom Apps</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs text-slate-500 block">Workplace Impact</span>
              <span className="text-sm font-bold text-slate-900">Live Client & Job Tasks</span>
            </div>
          </div>
        </div>
      ),
    },

    {
      title: 'The "Vibe Coding" Opportunity',
      subtitle: 'Coding Comfort vs Experience Building with AI',
      speakerNotes:
        'This is the most critical pedagogical slide. 60%+ have never written code, yet over 70% have already built custom GPTs or artifacts. Emphasize that natural language is now the primary programming syntax.',
      renderContent: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto">
          {/* Coding Comfort */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-600" />
              How comfortable are you with code?
            </h4>
            <p className="text-xs text-slate-500 mb-6">Traditional programming experience</p>
            <div className="space-y-4">
              {qCode?.distribution.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span>{item.option}</span>
                    <span className="font-mono">{item.percentage}% ({item.count})</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.option.toLowerCase().includes('never')
                          ? 'bg-amber-500'
                          : item.option.toLowerCase().includes('scripts')
                          ? 'bg-emerald-600'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Building Experience */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Experience Building Things with AI
            </h4>
            <p className="text-xs text-slate-500 mb-6">Moving from chat prompts to artifacts</p>
            <div className="space-y-4">
              {qBuild?.distribution.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="truncate max-w-[280px]">{item.option}</span>
                    <span className="font-mono">{item.percentage}% ({item.count})</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },

    {
      title: 'Student Innovation Showcase: What You Built',
      subtitle: 'Real examples of student AI experiments from this cohort',
      speakerNotes:
        'Read out these concrete examples! Call on the students who built them (or keep anonymous if requested). Ask: What was the hardest part of making the AI produce what you actually needed?',
      renderContent: () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
              💍 Wedding Website & RSVP Engine
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "I built my own wedding website with AI, from design to a working RSVP system. Guests confirm attendance through an embedded Google Form with Google Drive link separation so nobody adds plus-ones. Something I would have paid a developer for became a project I iterated on myself in a few days."
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
              🇵🇪 Dual-Currency MBA Finance Dashboard
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "I built an artifact using Claude to manage my personal savings, expenses, and financial goals across Peruvian Soles and US dollars side by side. A marker in the savings table shows exactly when my MBA started to track financial trajectory. I built it because no commercial tool fit my situation."
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
              🇷🇼 AI Consulting Analyst for Rwandan Startup
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "Claude played the role of my senior analyst for a pre-revenue Rwandan tourism startup. Claude drafted formal client deliverables, meeting notes, survey frameworks, and the final deck. Because of my consulting background, I coached it effectively."
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-2">
              🤖 Telegram Expense Tracking Chatbot with n8n
            </div>
            <p className="text-xs text-slate-700 leading-relaxed italic">
              "Built an AI-powered Telegram chatbot using n8n workflows to track personal expenses. Instead of manual spreadsheets, sending a message automatically categorizes and saves the transaction. Want to move from experimenting to building practical solutions."
            </p>
          </div>
        </div>
      ),
    },

    {
      title: 'Course Aspirations: What You Want to Achieve',
      subtitle: 'Key themes synthesized from open-ended responses',
      speakerNotes:
        'Walk through these themes. Show how each module of the course directly addresses one of these goals.',
      renderContent: () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-600">Goal 01</span>
              <h4 className="text-base font-bold text-slate-900 mt-1 mb-2">
                Autonomous Agents & Task Automation
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Move past single-prompt chat windows. Students want agents that string multiple steps together—reading data, executing workflows, drafting client decks, and managing calendars.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
              🎯 Addressed in: Agentic Tool Use & Multi-Modal Workflows
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-600">Goal 02</span>
              <h4 className="text-base font-bold text-slate-900 mt-1 mb-2">
                "Vibe Coding" & Rapid Prototyping
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gain enough architectural vocabulary to steer AI to build functional web apps, dashboards, and internal tools without writing every line of JavaScript or Python by hand.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
              🎯 Addressed in: Full-Stack AI Prototyping Lab
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-600">Goal 03</span>
              <h4 className="text-base font-bold text-slate-900 mt-1 mb-2">
                Communicating Value to Senior Leadership
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Translate technical AI capabilities into strategic executive terms. Being able to explain how solutions work in both technical rigor and plain business ROI.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
              🎯 Addressed in: Enterprise AI Strategy & Final Pitch
            </div>
          </div>
        </div>
      ),
    },

    {
      title: 'Target Industries & Functional Focus',
      subtitle: 'Where students plan to deploy their AI skills post-MBA',
      speakerNotes:
        'Ask students from Finance, Consulting, and Operations to pair up for course projects. Diverse functional perspectives create the best AI prototypes.',
      renderContent: () => (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs my-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-2xl font-bold font-mono text-slate-900 block mb-1">💼</span>
              <span className="text-sm font-bold text-slate-900 block">Consulting</span>
              <span className="text-xs text-slate-500">Deliverables, synthesis, client decks</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-2xl font-bold font-mono text-slate-900 block mb-1">📈</span>
              <span className="text-sm font-bold text-slate-900 block">Finance & Banking</span>
              <span className="text-xs text-slate-500">Valuation, risk models, research</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-2xl font-bold font-mono text-slate-900 block mb-1">⚙️</span>
              <span className="text-sm font-bold text-slate-900 block">Operations & Supply</span>
              <span className="text-xs text-slate-500">Process automation, logistics</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-2xl font-bold font-mono text-slate-900 block mb-1">🚀</span>
              <span className="text-sm font-bold text-slate-900 block">Tech & Startups</span>
              <span className="text-xs text-slate-500">Product management, MVPs</span>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-3">
            <span className="text-base">🤝</span>
            <div>
              <strong>Project Team Formation Insight:</strong> Many students paired Consulting with Tech or Operations with Finance. When creating final group projects, cross-pollinating a non-coder consultant with a script-literate finance student yields the highest quality applications.
            </div>
          </div>
        </div>
      ),
    },

    {
      title: 'Classroom Discussion Questions',
      subtitle: 'Pose these questions to kick off the term',
      speakerNotes:
        'Spend the next 15-20 minutes facilitating an open discussion on these 3 prompts. Have students raise hands or speak up.',
      renderContent: () => (
        <div className="space-y-4 my-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-start gap-4">
            <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                "Where is the current 'ceiling' when you use ChatGPT or Claude for your work?"
              </h4>
              <p className="text-xs text-slate-600">
                When does it fail, hallucinate, or become more work to fix than to do manually? What prevents you from trusting it with end-to-end tasks?
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-start gap-4">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                "How does being able to 'vibe code' change the dynamic between business managers and engineering teams?"
              </h4>
              <p className="text-xs text-slate-600">
                If you can build an MVP yourself in 3 days, how does that alter how you pitch ideas, write product specs, or lead cross-functional initiatives?
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-start gap-4">
            <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                "What is one repetitive task in your previous job or internship that you never want to do manually again?"
              </h4>
              <p className="text-xs text-slate-600">
                Let us treat that problem as a candidate for your term project.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden">
      {/* Top Slide Control Bar */}
      <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit Slides</span>
          </button>
          <div className="text-xs font-mono text-slate-400">
            Slide <span className="text-white font-bold">{currentSlide + 1}</span> of {slides.length}
          </div>
        </div>

        {/* Slide Title Center */}
        <div className="hidden md:block text-xs font-semibold text-slate-300 truncate max-w-md">
          {current.title}
        </div>

        {/* Slide Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              showNotes
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{showNotes ? 'Hide Speaker Notes' : 'Speaker Notes'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Slide Canvas */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col justify-between max-w-6xl mx-auto w-full">
        {/* Slide Header */}
        <div className="mb-6">
          <span className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold block mb-1">
            Section Walkthrough · 0{currentSlide + 1}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {current.title}
          </h2>
          <p className="text-sm md:text-base text-slate-600 mt-1">{current.subtitle}</p>
        </div>

        {/* Slide Body */}
        <div className="flex-1 flex flex-col justify-center py-4">
          {current.renderContent()}
        </div>

        {/* Optional Speaker Notes Drawer */}
        {showNotes && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 shadow-sm animate-in fade-in">
            <div className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 text-amber-800">
              <MessageSquare className="w-3.5 h-3.5" />
              Instructor Discussion Guide & Talking Points:
            </div>
            <p className="leading-relaxed">{current.speakerNotes}</p>
          </div>
        )}

        {/* Slide Footer Navigation */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide
                    ? 'w-8 bg-slate-900'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
              disabled={currentSlide === 0}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
              disabled={currentSlide === slides.length - 1}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 shadow-xs"
            >
              Next Slide
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
