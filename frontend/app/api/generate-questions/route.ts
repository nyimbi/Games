/**
 * API Route: Generate quiz questions on-demand using Azure OpenAI.
 * Produces WSC-quality multiple choice questions with theme integration.
 */

import { NextRequest, NextResponse } from 'next/server';

const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

const VALID_SUBJECTS = ['science', 'social_studies', 'arts', 'literature', 'special_area', 'mixed'];

interface GenerateQuestionsRequest {
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  topic?: string;
  excludeIds?: string[];
  studentLevel?: {
    grade: number | null;
    level: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface GeneratedQuestion {
  text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  theme_connection?: string;
  deep_explanation?: string;
  tags?: string[];
}

interface GenerateQuestionsResponse {
  questions: GeneratedQuestion[];
}

const DIFFICULTY_PROMPTS: Record<string, string> = {
  easy: 'Suitable for younger scholars (grades 4-6). Clear, factual questions with obviously wrong distractors.',
  medium: 'Suitable for middle school scholars (grades 7-9). Requires reasoning and some prior knowledge. Distractors should be plausible.',
  hard: 'Suitable for advanced scholars (grades 10-12). Requires deep understanding, cross-disciplinary thinking, and nuanced distinctions between options.',
};

const LEVEL_CONTEXT: Record<string, string> = {
  beginner: 'The student is a beginner. Keep language accessible and provide clear, supportive explanations.',
  intermediate: 'The student is at an intermediate level. Use academic vocabulary and expect some background knowledge.',
  advanced: 'The student is advanced. Use precise terminology, expect sophisticated reasoning, and include subtle distinctions.',
};

function validateQuestion(q: unknown): q is GeneratedQuestion {
  if (!q || typeof q !== 'object') return false;
  const obj = q as Record<string, unknown>;

  if (typeof obj.text !== 'string' || obj.text.length <= 20) return false;
  if (!Array.isArray(obj.options) || obj.options.length !== 4) return false;
  if (typeof obj.correct_index !== 'number' || obj.correct_index < 0 || obj.correct_index > 3) return false;
  if (typeof obj.explanation !== 'string' || obj.explanation.length <= 10) return false;

  // Check all options are non-empty strings
  if (!obj.options.every((o: unknown) => typeof o === 'string' && o.length > 0)) return false;

  // Check for duplicate options (case-insensitive)
  const normalized = (obj.options as string[]).map(o => o.toLowerCase().trim());
  if (new Set(normalized).size !== normalized.length) return false;

  return true;
}

export async function POST(request: NextRequest) {
  try {
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      return NextResponse.json({ error: 'Azure OpenAI not configured' }, { status: 500 });
    }

    const body: GenerateQuestionsRequest = await request.json();
    const { subject, difficulty, count, topic, excludeIds, studentLevel } = body;

    // Validate request
    if (!subject || !VALID_SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: `Invalid subject. Must be one of: ${VALID_SUBJECTS.join(', ')}` }, { status: 400 });
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty. Must be easy, medium, or hard.' }, { status: 400 });
    }
    if (!count || count < 1 || count > 10) {
      return NextResponse.json({ error: 'Count must be between 1 and 10.' }, { status: 400 });
    }

    const difficultyInstruction = DIFFICULTY_PROMPTS[difficulty];
    const levelInstruction = studentLevel ? (LEVEL_CONTEXT[studentLevel.level] || '') : '';
    const gradeContext = studentLevel?.grade ? ` The student is in grade ${studentLevel.grade}.` : '';
    const topicInstruction = topic ? `\nFocus on this topic: "${topic}".` : '';
    const excludeInstruction = excludeIds && excludeIds.length > 0
      ? `\nAvoid repeating these question IDs or their content: ${excludeIds.slice(0, 20).join(', ')}`
      : '';

    const subjectName = subject === 'mixed' ? 'a mix of science, social studies, arts, literature, and WSC special area'
      : subject === 'special_area' ? 'the WSC Special Area (2026 theme: "Are We There Yet?")'
      : subject.replace('_', ' ');

    const systemPrompt = `You are an expert question writer for the World Scholar's Cup (WSC) 2026.
The 2026 WSC theme is "Are We There Yet?" — exploring journeys (literal and metaphorical), progress, destinations, milestones, exploration, discovery, movement, and the question of whether humanity has arrived or still has far to go. This theme spans science, history, literature, arts, and special area.

Generate exactly ${count} multiple-choice questions on ${subjectName}.
${difficultyInstruction}
${levelInstruction}${gradeContext}${topicInstruction}${excludeInstruction}

Each question MUST have:
- "text": The question (must be >20 characters)
- "options": Exactly 4 answer choices (no duplicates)
- "correct_index": Index (0-3) of the correct answer
- "explanation": Why the correct answer is right (>10 characters)
- "theme_connection": How this relates to "Are We There Yet?" theme (optional but encouraged)
- "deep_explanation": A deeper exploration of the concept for curious students (optional)
- "tags": Array of 1-3 topic tags (optional)

Make questions engaging, accurate, and varied. Avoid trick questions. Ensure distractors are plausible but clearly wrong upon reflection.

Respond ONLY with valid JSON in this exact format:
{
  "questions": [ ... ]
}`;

    const userPrompt = `Generate ${count} ${difficulty} ${subjectName} questions for WSC 2026 preparation.`;

    const apiUrl = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 200 * count,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Azure OpenAI error:', await response.text());
      return NextResponse.json({ error: 'Failed to generate questions.' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No content received from AI.' }, { status: 500 });
    }

    let parsed: GenerateQuestionsResponse;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json({ error: 'Invalid response format from AI.' }, { status: 500 });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return NextResponse.json({ error: 'AI response missing questions array.' }, { status: 500 });
    }

    // Validate and filter questions, adding IDs
    const validQuestions = parsed.questions
      .filter(validateQuestion)
      .map((q, index) => ({
        ...q,
        id: `gen-${Date.now()}-${index}`,
      }));

    if (validQuestions.length === 0) {
      return NextResponse.json({ error: 'AI generated no valid questions. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ questions: validQuestions });
  } catch (error) {
    console.error('Generate questions error:', error);
    return NextResponse.json({ error: 'An error occurred generating questions.' }, { status: 500 });
  }
}
