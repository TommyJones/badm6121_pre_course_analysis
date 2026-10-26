export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'open_ended'
  | 'short_text'
  | 'numeric';

export interface DistributionItem {
  option: string;
  count: number;
  percentage: number; // 0 - 100
}

export interface StudentResponseItem {
  studentName: string;
  studentId: string;
  section: string;
  submittedAt: string;
  response: string;
  rawRow: Record<string, string>;
}

export interface AISynthesisResult {
  summary: string;
  keyThemes: {
    theme: string;
    prevalence: string;
    description: string;
    sampleQuotes: string[];
  }[];
  sentimentBreakdown: {
    overall: string;
    enthusiasmScore: number;
    notableEmotions: string[];
  };
  standoutProjectsOrIdeas: {
    highlight: string;
    whyNotable: string;
  }[];
  classroomDiscussionPrompts: string[];
}

export interface SurveyQuestion {
  id: string; // unique key or column index
  originalHeader: string;
  prompt: string;
  questionNumber: number;
  type: QuestionType;
  isNonFreeText: boolean;
  totalAnswered: number;
  distribution: DistributionItem[];
  responses: StudentResponseItem[];
  aiSummary?: AISynthesisResult | null;
  aiLoading?: boolean;
}

export interface SurveyMetadata {
  filename: string;
  totalStudents: number;
  courseSection?: string;
  institution?: string;
  latestSubmission?: string;
  rawHeaders: string[];
}

export interface ParsedSurveyDataset {
  metadata: SurveyMetadata;
  questions: SurveyQuestion[];
  rawRows: Record<string, string>[];
}
