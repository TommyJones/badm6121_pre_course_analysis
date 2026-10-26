import {
  ParsedSurveyDataset,
  SurveyQuestion,
  QuestionType,
  DistributionItem,
  StudentResponseItem,
} from '../types/survey';

/**
 * Robust RFC-4180 compliant CSV parser that handles:
 * - Multiline text fields within double quotes
 * - Escaped double quotes ("")
 * - Trailing empty lines
 */
export function parseCSVToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  // Normalize Windows/Mac line breaks
  const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentCell += '"';
        i++; // skip next quote
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Cell boundary
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !insideQuotes) {
      // Row boundary
      currentRow.push(currentCell.trim());
      // Only add non-empty rows
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Push final cell/row if remaining
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Split Canvas Quiz multi-select values.
 * Canvas escapes literal commas within options as `\,` (e.g. `ChatGPT (Plus\, Pro\, Team or Enterprise),Claude (Pro\, Max\, Team or Enterprise)`)
 */
export function splitCanvasMultiSelect(value: string): string[] {
  if (!value || !value.trim()) return [];

  // Protect escaped commas
  const PLACEHOLDER = '___ESCAPED_COMMA___';
  const protectedText = value.replace(/\\,/g, PLACEHOLDER);

  // Split by top-level delimiter comma
  return protectedText
    .split(',')
    .map((part) => part.replace(new RegExp(PLACEHOLDER, 'g'), ',').trim())
    .filter((part) => part.length > 0);
}

/**
 * Identify if a column is a quiz question vs metadata/points
 */
const METADATA_HEADERS = new Set([
  'name',
  'id',
  'sis_id',
  'root_account',
  'section',
  'section_id',
  'section_sis_id',
  'submitted',
  'attempt',
  'n correct',
  'n incorrect',
  'score',
]);

function isPointsOrScoreHeader(header: string): boolean {
  const h = header.toLowerCase().trim();
  if (METADATA_HEADERS.has(h)) return true;
  // Match decimal point scores like '0.0', '1.0', '10.0'
  if (/^\d+(\.\d+)?$/.test(h)) return true;
  return false;
}

/**
 * Clean up question titles from Canvas format:
 * '3082040: Which year of the MBA program are you in?' -> 'Which year of the MBA program are you in?'
 */
export function cleanQuestionPrompt(header: string): string {
  // Strip leading question ID if formatted like '3082040: '
  const match = header.match(/^\d+:\s*(.+)$/);
  if (match) {
    return match[1].trim();
  }
  return header.trim();
}

/**
 * Classify question type based on header prompt and values
 */
function classifyQuestion(
  header: string,
  values: string[]
): { type: QuestionType; isNonFreeText: boolean } {
  const lowerHeader = header.toLowerCase();
  const nonEmpties = values.filter((v) => v.trim().length > 0);

  if (nonEmpties.length === 0) {
    return { type: 'short_text', isNonFreeText: false };
  }

  // 1. Explicit multi-select hint in header
  if (
    lowerHeader.includes('(select all that apply)') ||
    lowerHeader.includes('(check all that apply)') ||
    lowerHeader.includes('select multiple')
  ) {
    return { type: 'multi_choice', isNonFreeText: true };
  }

  // 2. Check for multi-select pattern in data (comma-separated with recurring choices)
  const containsCanvasEscapedComma = values.some((v) => v.includes('\\,'));
  if (containsCanvasEscapedComma) {
    return { type: 'multi_choice', isNonFreeText: true };
  }

  // Calculate statistics on the answers
  const uniqueVals = new Set(nonEmpties);
  const avgLen = nonEmpties.reduce((acc, v) => acc + v.length, 0) / nonEmpties.length;
  const maxLen = Math.max(...nonEmpties.map((v) => v.length));
  const hasParagraphs = nonEmpties.some((v) => v.includes('\n') || v.length > 150);

  // 3. Numeric questions
  const allNumeric = nonEmpties.every((v) => !isNaN(Number(v)));
  if (allNumeric && nonEmpties.length > 3) {
    return { type: 'numeric', isNonFreeText: true };
  }

  // 4. Single-choice categorical: small set of unique options, short length
  if (uniqueVals.size <= 10 && avgLen < 90 && !hasParagraphs) {
    return { type: 'single_choice', isNonFreeText: true };
  }

  // 5. Short text (e.g. Industry interests, function interests)
  // Short phrases with some recurrence, but not strictly predefined choices
  if (
    (lowerHeader.includes('industry') ||
      lowerHeader.includes('function') ||
      lowerHeader.includes('role') ||
      avgLen < 65) &&
    !hasParagraphs
  ) {
    return { type: 'short_text', isNonFreeText: false };
  }

  // 6. Open-ended free text narrative
  return { type: 'open_ended', isNonFreeText: false };
}

/**
 * Compute answer distribution for categorical & multi-select questions
 */
function computeDistribution(
  type: QuestionType,
  values: string[],
  totalStudents: number
): DistributionItem[] {
  const counts: Record<string, number> = {};
  let totalSelections = 0;

  if (type === 'multi_choice') {
    for (const val of values) {
      const selections = splitCanvasMultiSelect(val);
      for (const sel of selections) {
        if (!sel) continue;
        counts[sel] = (counts[sel] || 0) + 1;
        totalSelections++;
      }
    }
  } else {
    for (const val of values) {
      const trimmed = val.trim();
      if (!trimmed) continue;
      counts[trimmed] = (counts[trimmed] || 0) + 1;
      totalSelections++;
    }
  }

  const denominator = totalStudents > 0 ? totalStudents : totalSelections || 1;

  const items: DistributionItem[] = Object.entries(counts).map(([option, count]) => ({
    option,
    count,
    percentage: Math.round((count / denominator) * 100 * 10) / 10,
  }));

  // Sort descending by count
  items.sort((a, b) => b.count - a.count);

  return items;
}

/**
 * Main Survey CSV Parser
 */
export function parseSurveyCSV(csvContent: string, filename: string): ParsedSurveyDataset {
  const rawMatrix = parseCSVToRows(csvContent);
  if (rawMatrix.length === 0) {
    throw new Error('The uploaded CSV file is empty.');
  }

  const headers = rawMatrix[0];
  const dataRows = rawMatrix.slice(1);

  // Locate metadata indices
  const nameIdx = headers.findIndex((h) => h.toLowerCase() === 'name');
  const idIdx = headers.findIndex((h) => h.toLowerCase() === 'id');
  const sectionIdx = headers.findIndex((h) => h.toLowerCase() === 'section');
  const submittedIdx = headers.findIndex((h) => h.toLowerCase() === 'submitted');
  const rootAccountIdx = headers.findIndex((h) => h.toLowerCase() === 'root_account');

  // Identify question columns
  const questionColumns: { index: number; header: string }[] = [];

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (!isPointsOrScoreHeader(h)) {
      questionColumns.push({ index: i, header: h });
    }
  }

  if (questionColumns.length === 0) {
    throw new Error('No question columns found in the CSV. Please check the header row.');
  }

  // Build raw row records
  const rawRows: Record<string, string>[] = dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || '';
    });
    return obj;
  });

  // Extract student count and metadata
  const totalStudents = dataRows.length;
  const sections = new Set(
    dataRows.map((r) => (sectionIdx >= 0 ? r[sectionIdx] : '')).filter(Boolean)
  );
  const rootAccount =
    rootAccountIdx >= 0 ? dataRows.find((r) => r[rootAccountIdx])?.[rootAccountIdx] : undefined;

  const dates = dataRows
    .map((r) => (submittedIdx >= 0 ? r[submittedIdx] : ''))
    .filter(Boolean)
    .sort();
  const latestSubmission = dates.length > 0 ? dates[dates.length - 1] : undefined;

  // Process questions
  const questions: SurveyQuestion[] = questionColumns.map((col, qIdx) => {
    const rawValues = dataRows.map((row) => row[col.index] || '');
    const { type, isNonFreeText } = classifyQuestion(col.header, rawValues);

    const responses: StudentResponseItem[] = dataRows.map((row, rIdx) => ({
      studentName: nameIdx >= 0 ? row[nameIdx] || `Student ${rIdx + 1}` : `Student ${rIdx + 1}`,
      studentId: idIdx >= 0 ? row[idIdx] || `${rIdx + 1}` : `${rIdx + 1}`,
      section: sectionIdx >= 0 ? row[sectionIdx] || '' : '',
      submittedAt: submittedIdx >= 0 ? row[submittedIdx] || '' : '',
      response: row[col.index] || '',
      rawRow: rawRows[rIdx],
    }));

    const nonBlankCount = rawValues.filter((v) => v.trim().length > 0).length;
    const distribution = isNonFreeText
      ? computeDistribution(type, rawValues, totalStudents)
      : type === 'short_text'
      ? computeDistribution('single_choice', rawValues, totalStudents).slice(0, 8)
      : [];

    return {
      id: `q_${qIdx + 1}`,
      originalHeader: col.header,
      prompt: cleanQuestionPrompt(col.header),
      questionNumber: qIdx + 1,
      type,
      isNonFreeText,
      totalAnswered: nonBlankCount,
      distribution,
      responses,
    };
  });

  return {
    metadata: {
      filename,
      totalStudents,
      courseSection: Array.from(sections).join(', '),
      institution: rootAccount,
      latestSubmission,
      rawHeaders: headers,
    },
    questions,
    rawRows,
  };
}
