/**
 * API Route: AI-powered answer explanations adapted to student level.
 * Follows the same Azure OpenAI pattern as evaluate-debate/route.ts.
 */

import { NextRequest, NextResponse } from 'next/server';

const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

interface ExplainRequest {
  questionText: string;
  options: string[];
  correctIndex: number;
  userAnswer: number | null;
  wasCorrect: boolean;
  subject: string;
  existingExplanation?: string;
  themeConnection?: string;
  studentLevel: {
    grade: number | null;
    level: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface ExplainResponse {
  explanation: string;
  funFact?: string;
  relatedConcepts?: string[];
  encouragement: string;
}

const LEVEL_PROMPTS: Record<string, string> = {
  beginner:
    'Explain to a 9-10 year old. Use simple words and a fun analogy. 2-3 sentences max. Be warm and encouraging.',
  intermediate:
    'Explain to a 12-13 year old. Use academic vocabulary and give one concrete example. 3-4 sentences.',
  advanced:
    'Explain to a high school student. Use proper terminology, connect to broader concepts. 4-6 sentences.',
};

export async function POST(request: NextRequest) {
  try {
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      return NextResponse.json({ error: 'Azure OpenAI not configured' }, { status: 500 });
    }

    const body: ExplainRequest = await request.json();
    const { questionText, options, correctIndex, userAnswer, wasCorrect, subject, existingExplanation, themeConnection, studentLevel } = body;

    if (!questionText || options.length === 0) {
      return NextResponse.json({ error: 'Question text and options are required.' }, { status: 400 });
    }

    const levelInstruction = LEVEL_PROMPTS[studentLevel.level] || LEVEL_PROMPTS.intermediate;
    const gradeContext = studentLevel.grade ? ` The student is in grade ${studentLevel.grade}.` : '';

    const systemPrompt = `You are a supportive, knowledgeable tutor for young scholars preparing for the World Scholars Cup.
${levelInstruction}${gradeContext}

Respond in JSON format only with this structure:
{
  "explanation": "<your explanation>",
  "funFact": "<optional interesting related fact>",
  "relatedConcepts": ["<concept1>", "<concept2>"],
  "encouragement": "<brief encouraging message>"
}`;

    const userPrompt = `
Subject: ${subject}
Question: "${questionText}"
Options: ${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ')}
Correct answer: ${String.fromCharCode(65 + correctIndex)}) ${options[correctIndex]}
${userAnswer !== null && userAnswer >= 0 ? `Student's answer: ${String.fromCharCode(65 + userAnswer)}) ${options[userAnswer]}` : 'Student did not answer (timed out)'}
Student got it: ${wasCorrect ? 'CORRECT' : 'WRONG'}
${existingExplanation ? `Basic explanation available: "${existingExplanation}"` : ''}
${themeConnection ? `WSC Theme connection: "${themeConnection}"` : ''}

${wasCorrect
  ? 'The student got this right and wants to understand WHY this is correct and learn something deeper.'
  : 'The student got this wrong. Explain why the correct answer is right, why their answer was wrong, and help them remember for next time.'}`;

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
        temperature: 0.6,
        max_tokens: studentLevel.level === 'beginner' ? 300 : studentLevel.level === 'advanced' ? 700 : 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Azure OpenAI error:', await response.text());
      return NextResponse.json({ error: 'Failed to generate explanation.' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No explanation received.' }, { status: 500 });
    }

    const result: ExplainResponse = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Explain error:', error);
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
  }
}
