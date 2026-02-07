/**
 * API Route: Argument Tennis AI Opponent
 *
 * Generates dynamic counter-arguments and scores player arguments
 * using Azure OpenAI, making the debate truly interactive.
 */

import { NextRequest, NextResponse } from 'next/server';

const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

interface TennisRequest {
  topic: string;
  position: 'for' | 'against';
  roundLabel: string;
  roundNumber: number;
  playerArgument: string;
  previousExchanges: { player: string; ai: string; label: string }[];
}

interface TennisResponse {
  counterArgument: string;
  scores: {
    relevance: number;
    strength: number;
    evidence: number;
  };
  feedback: string;
}

const SYSTEM_PROMPT = `You are a skilled but encouraging debate opponent for young scholars (ages 9-14) in a World Scholars Cup practice game called "Argument Tennis".

Your role is to:
1. Generate a thoughtful counter-argument that directly responds to what the student wrote
2. Score their argument fairly
3. Provide brief coaching feedback

DEBATE BEHAVIOR:
- Always directly address what the student actually said — reference their specific points
- Provide substantive counter-arguments with evidence, examples, or logical reasoning
- Be challenging but respectful — push them to think harder without being discouraging
- Vary your rhetorical approach: sometimes use questions, sometimes use data, sometimes use analogies
- Match the round's purpose (opening = set the stage, rebuttal = directly counter, evidence = cite facts, weaknesses = acknowledge nuance, closing = synthesize)
- Keep counter-arguments to 3-5 sentences

SCORING (1-5 each):
- Relevance: Did they address the topic and your previous points?
- Argument Strength: How convincing and well-reasoned is their argument?
- Evidence Use: Did they use facts, examples, or data?

FEEDBACK:
- One sentence of specific, actionable coaching
- Focus on what would make their next round stronger
- Be encouraging — highlight what they did well

Respond in JSON format only.`;

export async function POST(request: NextRequest) {
  try {
    if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      return NextResponse.json(
        { error: 'Azure OpenAI not configured' },
        { status: 500 }
      );
    }

    const body: TennisRequest = await request.json();
    const { topic, position, roundLabel, roundNumber, playerArgument, previousExchanges } = body;

    if (!playerArgument || playerArgument.trim().length < 10) {
      return NextResponse.json(
        { error: 'Argument too short' },
        { status: 400 }
      );
    }

    const aiPosition = position === 'for' ? 'AGAINST' : 'FOR';
    const playerPosition = position === 'for' ? 'FOR' : 'AGAINST';

    let exchangeHistory = '';
    if (previousExchanges.length > 0) {
      exchangeHistory = '\n\nPREVIOUS EXCHANGES:\n' +
        previousExchanges.map((ex, i) =>
          `Round ${i + 1} (${ex.label}):\n  Student (${playerPosition}): ${ex.player}\n  You (${aiPosition}): ${ex.ai}`
        ).join('\n\n');
    }

    const userPrompt = `DEBATE TOPIC: "${topic}"
You are arguing ${aiPosition} the motion. The student is arguing ${playerPosition}.

CURRENT ROUND: ${roundNumber + 1}/5 — ${roundLabel}
${exchangeHistory}

THE STUDENT'S ${roundLabel.toUpperCase()}:
"${playerArgument}"

Generate your counter-argument and score their argument. Respond as JSON:
{
  "counterArgument": "<your 3-5 sentence counter-argument that directly responds to what they wrote>",
  "scores": {
    "relevance": <1-5>,
    "strength": <1-5>,
    "evidence": <1-5>
  },
  "feedback": "<one sentence of specific coaching feedback>"
}`;

    const apiUrl = `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', errorText);
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    const result: TennisResponse = JSON.parse(content);

    // Clamp scores to 1-5
    result.scores.relevance = Math.max(1, Math.min(5, Math.round(result.scores.relevance)));
    result.scores.strength = Math.max(1, Math.min(5, Math.round(result.scores.strength)));
    result.scores.evidence = Math.max(1, Math.min(5, Math.round(result.scores.evidence)));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Argument Tennis AI error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
