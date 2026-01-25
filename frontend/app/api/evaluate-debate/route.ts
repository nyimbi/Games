/**
 * API Route: Evaluate Debate Arguments using Azure OpenAI
 *
 * This endpoint receives a debate argument (text from speech-to-text)
 * and returns AI evaluation with scoring and feedback.
 */

import { NextRequest, NextResponse } from 'next/server';

// Azure OpenAI configuration from environment
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

interface EvaluationRequest {
  argument: string;
  topic: string;
  position: 'for' | 'against';
  context?: string;
  previousArguments?: string[];
}

interface EvaluationResponse {
  overallScore: number; // 0-100
  scores: {
    clarity: number;
    evidence: number;
    logic: number;
    persuasion: number;
    relevance: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  summary: string;
  encouragement: string;
}

const EVALUATION_SYSTEM_PROMPT = `You are a supportive debate coach for young scholars (ages 9-14) participating in the World Scholars Cup.
Your role is to evaluate their debate arguments constructively, focusing on encouraging growth while providing actionable feedback.

When evaluating arguments, consider:
1. **Clarity** (0-100): Is the argument easy to understand? Good structure?
2. **Evidence** (0-100): Does it use facts, examples, or reasoning to support claims?
3. **Logic** (0-100): Is the reasoning sound? Are there logical fallacies?
4. **Persuasion** (0-100): Is it compelling? Does it address the audience?
5. **Relevance** (0-100): Does it stay on topic and address the motion?

IMPORTANT GUIDELINES:
- Be encouraging and supportive - these are young learners
- Focus on what they did well before suggesting improvements
- Give specific, actionable suggestions they can implement immediately
- Use simple language appropriate for ages 9-14
- Always find something positive to highlight
- Frame criticism as "opportunities to grow"
- Keep feedback concise and memorable

Respond in JSON format only.`;

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      return NextResponse.json(
        { error: 'Azure OpenAI not configured' },
        { status: 500 }
      );
    }

    const body: EvaluationRequest = await request.json();
    const { argument, topic, position, context, previousArguments } = body;

    if (!argument || argument.trim().length < 10) {
      return NextResponse.json(
        { error: 'Argument too short. Please provide a more detailed response.' },
        { status: 400 }
      );
    }

    // Build the evaluation prompt
    const userPrompt = `
Evaluate this debate argument from a young scholar:

**Topic/Motion**: "${topic}"
**Position**: ${position === 'for' ? 'FOR (supporting)' : 'AGAINST (opposing)'} the motion
${context ? `**Context**: ${context}` : ''}
${previousArguments?.length ? `**Previous arguments in this debate**:\n${previousArguments.map((a, i) => `${i + 1}. ${a}`).join('\n')}` : ''}

**The argument to evaluate**:
"${argument}"

Provide your evaluation as a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "scores": {
    "clarity": <number 0-100>,
    "evidence": <number 0-100>,
    "logic": <number 0-100>,
    "persuasion": <number 0-100>,
    "relevance": <number 0-100>
  },
  "feedback": {
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<area to improve 1>", "<area to improve 2>"],
    "suggestions": ["<specific suggestion 1>", "<specific suggestion 2>"]
  },
  "summary": "<2-3 sentence overall assessment>",
  "encouragement": "<encouraging message to motivate the student>"
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
          { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', errorText);
      return NextResponse.json(
        { error: 'Failed to evaluate argument. Please try again.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No evaluation received from AI.' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    const evaluation: EvaluationResponse = JSON.parse(content);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'An error occurred during evaluation.' },
      { status: 500 }
    );
  }
}
