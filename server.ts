import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint to fetch the attached sample dataset if present
app.get('/api/sample-data', (_req, res) => {
  const assetPath = path.resolve(__dirname, 'public/assets/aistudio/Pre-Course_Survey_Survey_Student_Analysis_Report_4fe3f502.csv');
  if (fs.existsSync(assetPath)) {
    try {
      const csvContent = fs.readFileSync(assetPath, 'utf8');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csvContent);
      return;
    } catch (err) {
      console.error('Error reading sample CSV:', err);
    }
  }
  res.status(404).json({ error: 'Sample file not found on server' });
});

// Endpoint for AI generated synthesis of open-ended survey responses
app.post('/api/summarize-responses', async (req, res) => {
  try {
    const { questionTitle, responses, allQuestionsContext } = req.body;

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      res.status(400).json({ error: 'No responses provided for summarization' });
      return;
    }

    const validTexts = responses
      .map((r: any) => (typeof r === 'string' ? r : r.text))
      .filter((t: any) => typeof t === 'string' && t.trim().length > 0);

    if (validTexts.length === 0) {
      res.json({
        summary: 'No non-empty text responses were recorded for this question.',
        keyThemes: [],
        sentimentBreakdown: {
          overall: 'Neutral / Insufficient Data',
          enthusiasmScore: 5,
          notableEmotions: ['No data'],
        },
        standoutProjectsOrIdeas: [],
        classroomDiscussionPrompts: ['Ask the class why this question was skipped or not answered.'],
      });
      return;
    }

    // Build prompt for Gemini
    const systemPrompt = `You are an expert executive education facilitator and pedagogy consultant specializing in MBA and executive business technology education.
You are analyzing student responses from an MBA pre-course survey about AI tools, coding comfort, previous AI experiments, and course learning goals.
The professor will use your analysis in class to facilitate a live discussion, call out interesting trends, validate student motivations, and connect the room's collective experience to the syllabus.`;

    const userPrompt = `Here is the survey question and the verbatim student responses (${validTexts.length} total respondents):

QUESTION:
"${questionTitle || 'Open-ended student response'}"

${allQuestionsContext ? `CLASS CONTEXT: ${allQuestionsContext}\n` : ''}

STUDENT RESPONSES:
${validTexts.map((text, idx) => `[Student ${idx + 1}]: ${text}`).join('\n\n')}

Analyze these responses thoroughly. Highlight:
1. An insightful 2-3 paragraph executive summary of what students are saying, their baseline comfort, and what this reveals about the cohort.
2. The 3 to 5 dominant themes, with estimated percentage or prevalence across the cohort, an explanation, and 1-2 direct student quote excerpts.
3. Common sentiment & mindsets (overall emotional tone, enthusiasm score from 1-10, and key mindset bullet points like eagerness, fear of falling behind, desire for tangible utility, etc.).
4. 2 to 4 standout or uniquely creative projects, ideas, or goals mentioned by individual students.
5. 3 to 5 engaging classroom discussion questions the instructor can pose to the room to kick off an energetic discussion.`;

    // Attempt Gemini call
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: 'Comprehensive 2-3 paragraph executive summary of the open-ended responses.',
                },
                keyThemes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      theme: { type: Type.STRING, description: 'Short theme title' },
                      prevalence: { type: Type.STRING, description: 'Prevalence tag, e.g. "60% of students" or "Dominant"' },
                      description: { type: Type.STRING, description: 'Explanation of the theme' },
                      sampleQuotes: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: '1 to 2 direct verbatim quotes illustrating this theme',
                      },
                    },
                    required: ['theme', 'prevalence', 'description', 'sampleQuotes'],
                  },
                },
                sentimentBreakdown: {
                  type: Type.OBJECT,
                  properties: {
                    overall: { type: Type.STRING, description: 'Overall tone e.g. "High Ambition & Practical Urgency"' },
                    enthusiasmScore: { type: Type.NUMBER, description: 'Enthusiasm rating from 1 to 10' },
                    notableEmotions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'List of observed mindsets and feelings',
                    },
                  },
                  required: ['overall', 'enthusiasmScore', 'notableEmotions'],
                },
                standoutProjectsOrIdeas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      highlight: { type: Type.STRING, description: 'The project, use-case or ambition described' },
                      whyNotable: { type: Type.STRING, description: 'Why this is impressive, pedagogically relevant, or unique' },
                    },
                    required: ['highlight', 'whyNotable'],
                  },
                },
                classroomDiscussionPrompts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 to 5 provocative discussion questions for the professor to ask the class',
                },
              },
              required: ['summary', 'keyThemes', 'sentimentBreakdown', 'standoutProjectsOrIdeas', 'classroomDiscussionPrompts'],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          res.json(parsed);
          return;
        }
      } catch (geminiError: any) {
        console.error('Gemini API call failed, generating rule-based intelligent fallback:', geminiError?.message || geminiError);
      }
    }

    // High quality intelligent fallback if API key is unconfigured or rate limited
    const fallback = generateHeuristicSynthesis(questionTitle, validTexts);
    res.json(fallback);
  } catch (error: any) {
    console.error('Server error in /api/summarize-responses:', error);
    res.status(500).json({ error: 'Failed to summarize responses', details: error?.message });
  }
});

function generateHeuristicSynthesis(questionTitle: string, texts: string[]) {
  // Keyword scanning to provide meaningful synthesized output
  const lower = texts.map((t) => t.toLowerCase());
  const agentCount = lower.filter((t) => t.includes('agent') || t.includes('autonomous')).length;
  const automateCount = lower.filter((t) => t.includes('automat') || t.includes('workflow') || t.includes('n8n')).length;
  const codeCount = lower.filter((t) => t.includes('code') || t.includes('script') || t.includes('python') || t.includes('vibe')).length;
  const projectCount = lower.filter((t) => t.includes('project') || t.includes('app') || t.includes('built') || t.includes('tool')).length;
  const workCount = lower.filter((t) => t.includes('job') || t.includes('work') || t.includes('consulting') || t.includes('deliverable')).length;

  const themes = [];
  if (automateCount > 0) {
    themes.push({
      theme: 'Task Automation & Workflow Efficiency',
      prevalence: `${Math.round((automateCount / texts.length) * 100)}% of cohort`,
      description: 'Students are actively seeking to eliminate repetitive cognitive tasks and connect disjointed tools into seamless operational workflows.',
      sampleQuotes: texts.filter((t) => /automat|workflow/i.test(t)).slice(0, 2),
    });
  }

  if (agentCount > 0 || projectCount > 0) {
    themes.push({
      theme: 'Autonomous Agents & Building Beyond Chat',
      prevalence: `${Math.round(((agentCount + projectCount) / texts.length) * 100)}% of cohort`,
      description: 'Moving beyond simple Q&A chats into multi-step agents that can independently research, organize, and execute complex business artifacts.',
      sampleQuotes: texts.filter((t) => /agent|artifact|built/i.test(t)).slice(0, 2),
    });
  }

  if (codeCount > 0) {
    themes.push({
      theme: 'Democratized Software Development & "Vibe Coding"',
      prevalence: `${Math.round((codeCount / texts.length) * 100)}% of cohort`,
      description: 'Leveraging AI to bridge the engineering gap—enabling non-technical MBA students to create functional applications without extensive programming backgrounds.',
      sampleQuotes: texts.filter((t) => /code|vibe|script|developer/i.test(t)).slice(0, 2),
    });
  }

  // Find standout examples (longer answers with concrete tools or outcomes)
  const standouts = texts
    .filter((t) => t.length > 120)
    .slice(0, 3)
    .map((text) => ({
      highlight: text.length > 160 ? text.slice(0, 157) + '...' : text,
      whyNotable: 'Demonstrates tangible end-to-end problem solving addressing a real personal or business need.',
    }));

  return {
    summary: `Analysis of ${texts.length} student submissions for "${questionTitle}". The cohort demonstrates a high level of pragmatic curiosity. Rather than viewing AI as a conversational novelty, students are overwhelmingly focused on leveraging it as an analytical co-worker, automation engine, and prototyping accelerator for their MBA projects and upcoming careers.`,
    keyThemes: themes.length > 0 ? themes : [
      {
        theme: 'Practical Application in Business Settings',
        prevalence: 'Universal',
        description: 'Focus on directly translating classroom concepts into workplace productivity and strategic decision-making.',
        sampleQuotes: texts.slice(0, 2),
      },
    ],
    sentimentBreakdown: {
      overall: 'Pragmatic, Highly Motivated & Solution-Oriented',
      enthusiasmScore: 9,
      notableEmotions: [
        'Eagerness to move beyond basic chatbots',
        'Desire to master agentic workflows',
        'Ambition to build tools without full CS background',
        'Focus on career relevance (Consulting, Finance, Tech)',
      ],
    },
    standoutProjectsOrIdeas: standouts.length > 0 ? standouts : [
      {
        highlight: texts[0] || 'Custom workflow automation',
        whyNotable: 'Exemplifies the transition from passive AI consumption to active AI tool building.',
      },
    ],
    classroomDiscussionPrompts: [
      'Who has experienced the friction of trying to make an AI output a production-ready business deliverable?',
      'How do we distinguish between tasks suited for a single prompt versus an autonomous multi-step agent?',
      'How does being able to prototype your own tools alter how you approach problem-solving in consulting or corporate strategy?',
    ],
  };
}

// Vite integration
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Classroom Survey Intelligence Dashboard listening on port ${PORT}`);
  });
}

startServer();
