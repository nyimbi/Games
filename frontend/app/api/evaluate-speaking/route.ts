/**
 * API Route: Evaluate Impromptu Speaking using Azure OpenAI
 *
 * This endpoint receives a speech transcript and topic, then returns
 * AI evaluation with scoring and feedback for speaking skills.
 */

import { NextRequest, NextResponse } from 'next/server';

// Azure OpenAI configuration from environment
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

interface EvaluationRequest {
  speech: string;
  topic: string;
  category: string;
  hints?: string[];
  speakingTimeUsed?: number;
}

interface EvaluationResponse {
  overallScore: number; // 0-100
  scores: {
    structure: number;
    clarity: number;
    relevance: number;
    engagement: number;
    confidence: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    tips: string[];
  };
  summary: string;
  encouragement: string;
}

const EVALUATION_SYSTEM_PROMPT = `You are an encouraging speaking coach for young scholars (ages 9-14) practicing impromptu speaking.
Your role is to evaluate their speaking constructively, focusing on building confidence while providing actionable feedback.

When evaluating speeches, consider:
1. **Structure** (0-100): Did they have a clear beginning, middle, and end? Did they organize their thoughts?
2. **Clarity** (0-100): Was the speech easy to follow? Did they express ideas clearly?
3. **Relevance** (0-100): Did they stay on topic? Did they address the prompt?
4. **Engagement** (0-100): Was it interesting? Did they use examples or stories?
5. **Confidence** (0-100): Did they speak with conviction? (Assess based on word choice and flow)

IMPORTANT GUIDELINES:
- Be encouraging and supportive - these are young learners building confidence
- Impromptu speaking is challenging - celebrate any effort to speak!
- Focus on 2-3 specific things they did well
- Give 1-2 actionable suggestions for next time
- Use simple, friendly language appropriate for ages 9-14
- If the speech is short or incomplete, still find positives
- Frame any criticism as "next time try..." rather than "you didn't..."

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
    const { speech, topic, category, hints, speakingTimeUsed } = body;

    if (!speech || speech.trim().length < 5) {
      return NextResponse.json(
        { error: 'Speech too short. Please try speaking for longer.' },
        { status: 400 }
      );
    }

    // Build the evaluation prompt
    const userPrompt = `
Evaluate this impromptu speech from a young scholar:

**Topic/Prompt**: "${topic}"
**Category**: ${category}
${hints?.length ? `**Suggested talking points**: ${hints.join(', ')}` : ''}
${speakingTimeUsed ? `**Time spoken**: ${speakingTimeUsed} seconds` : ''}

**The speech to evaluate**:
"${speech}"

Provide your evaluation as a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "scores": {
    "structure": <number 0-100>,
    "clarity": <number 0-100>,
    "relevance": <number 0-100>,
    "engagement": <number 0-100>,
    "confidence": <number 0-100>
  },
  "feedback": {
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<area to improve 1>"],
    "tips": ["<specific tip for next time>"]
  },
  "summary": "<2-3 sentence overall assessment>",
  "encouragement": "<motivating message to build their confidence>"
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
        { error: 'Failed to evaluate speech. Please try again.' },
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
