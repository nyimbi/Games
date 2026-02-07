/**
 * API Route: Generate Debate Hints using Azure OpenAI
 *
 * This endpoint receives a debate topic, position, phase, and student level,
 * then returns AI-generated talking points, counterarguments, and vocabulary tips
 * adapted to the student's skill level.
 */

import { NextRequest, NextResponse } from 'next/server';

// Azure OpenAI configuration from environment
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

interface DebateHintsRequest {
  topic: string;
  position: 'pro' | 'con';
  phase: string;
  studentLevel: {
    grade: number | null;
    level: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface DebateHintsResponse {
  talkingPoints: Array<{
    point: string;
    evidence?: string;
    tip?: string;
  }>;
  counterarguments: string[];
  vocabularyTips: string[];
}

function getSystemPrompt(level: 'beginner' | 'intermediate' | 'advanced'): string {
  const base = `You are a supportive debate coach for young scholars (ages 9-14) participating in the World Scholars Cup.
Your role is to provide helpful hints and talking points to guide students in building their debate arguments.

IMPORTANT GUIDELINES:
- Tailor your language and complexity to the student's level
- Provide concrete, actionable points they can use immediately
- Keep suggestions relevant to the debate topic and position
- Be encouraging and educational

Respond in JSON format only.`;

  switch (level) {
    case 'beginner':
      return `${base}

LEVEL: Beginner
- Provide exactly 3 simple, easy-to-understand talking points
- Use basic vocabulary appropriate for younger or less experienced debaters
- Each talking point should have a clear "tip" for how to present it
- Include 2 simple counterarguments the opponent might make
- Include 3 basic vocabulary words or phrases useful for debating`;

    case 'intermediate':
      return `${base}

LEVEL: Intermediate
- Provide exactly 4 talking points with evidence suggestions
- Each talking point should include an "evidence" field suggesting a type of evidence or example to support it
- Include 3 counterarguments the opponent might raise
- Include 4 vocabulary tips with debate-specific terminology`;

    case 'advanced':
      return `${base}

LEVEL: Advanced
- Provide exactly 5 sophisticated talking points with both evidence and counter-anticipation tips
- Each talking point should include an "evidence" field and a "tip" for anticipating and preempting counterarguments
- Include 4 counterarguments with nuanced reasoning
- Include 5 advanced vocabulary tips including rhetorical devices and logical frameworks`;
  }
}

function getMaxTokens(level: 'beginner' | 'intermediate' | 'advanced'): number {
  switch (level) {
    case 'beginner':
      return 500;
    case 'intermediate':
      return 700;
    case 'advanced':
      return 900;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      return NextResponse.json(
        { error: 'Azure OpenAI not configured' },
        { status: 500 }
      );
    }

    const body: DebateHintsRequest = await request.json();
    const { topic, position, phase, studentLevel } = body;

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic is required.' },
        { status: 400 }
      );
    }

    const level = studentLevel?.level || 'beginner';
    const grade = studentLevel?.grade;

    // Build the user prompt
    const userPrompt = `
Generate debate hints for a young scholar:

**Topic/Motion**: "${topic}"
**Position**: ${position === 'pro' ? 'PRO (supporting)' : 'CON (opposing)'} the motion
**Current Phase**: ${phase}
${grade ? `**Grade Level**: ${grade}` : ''}

Provide your hints as a JSON object with this exact structure:
{
  "talkingPoints": [
    {
      "point": "<clear talking point>",
      "evidence": "<suggested evidence or example to support this point>",
      "tip": "<practical tip for delivering or strengthening this point>"
    }
  ],
  "counterarguments": ["<counterargument the opponent might make>"],
  "vocabularyTips": ["<useful debate word or phrase with brief explanation>"]
}`;

    // Call Azure OpenAI
    const apiUrl = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: getSystemPrompt(level) },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: getMaxTokens(level),
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate debate hints. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No hints received from AI.' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const hints: DebateHintsResponse = JSON.parse(content);

    return NextResponse.json(hints);
  } catch (error) {
    console.error('Debate hints error:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating debate hints.' },
      { status: 500 }
    );
  }
}
