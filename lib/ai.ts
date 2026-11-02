/**
 * Universal AI Service Integration for Link Test
 * Supports Google Gemini & OpenAI with zero external npm dependencies using native fetch.
 * Automatically falls back to deterministic high-quality responses when API keys are not yet configured.
 */

export interface AIQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface InterviewEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

function getApiKey(): { key: string; provider: 'gemini' | 'openai' | 'none' } {
  const geminiKey = process.env.GEMINI_API_KEY || (process.env.AI_PROVIDER_MODEL?.includes('gemini') ? process.env.AI_PROVIDER_API_KEY : '');
  if (geminiKey) return { key: geminiKey, provider: 'gemini' };

  const openaiKey = process.env.OPENAI_API_KEY || (process.env.AI_PROVIDER_MODEL?.includes('gpt') ? process.env.AI_PROVIDER_API_KEY : '');
  if (openaiKey) return { key: openaiKey, provider: 'openai' };

  const generalKey = process.env.AI_PROVIDER_API_KEY;
  if (generalKey) {
    if (generalKey.startsWith('AIza')) return { key: generalKey, provider: 'gemini' };
    return { key: generalKey, provider: 'openai' };
  }

  return { key: '', provider: 'none' };
}

/**
 * Generate MCQs dynamically using Gemini or OpenAI
 */
export async function generateAIQuestions(topic: string, count: number = 3, difficulty: string = 'medium'): Promise<AIQuestion[] | null> {
  const { key, provider } = getApiKey();
  if (!key || provider === 'none') return null;

  const prompt = `You are a strict technical assessment engine. Generate exactly ${count} multiple choice questions (MCQ) for topic "${topic}" with difficulty level "${difficulty}".
Respond ONLY with a valid JSON array of objects without markdown formatting, each with:
- "prompt": question text
- "options": array of exactly 4 choices
- "correctAnswer": exact matching string from options
- "explanation": concise explanation of why it is correct
- "difficulty": "${difficulty}"
- "topic": "${topic}"`;

  try {
    if (provider === 'gemini') {
      const model = process.env.AI_PROVIDER_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;
      const parsed = JSON.parse(rawText);
      return parsed.map((q: any, i: number) => ({
        ...q,
        id: `ai-gen-${Date.now()}-${i}`,
      }));
    } else if (provider === 'openai') {
      const model = process.env.AI_PROVIDER_MODEL || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;
      const parsed = JSON.parse(content);
      const list = Array.isArray(parsed) ? parsed : parsed.questions || [];
      return list.map((q: any, i: number) => ({
        ...q,
        id: `ai-gen-${Date.now()}-${i}`,
      }));
    }
  } catch (err) {
    console.warn('[AI Service] Failed to call external LLM API, using fallback:', err);
  }

  return null;
}

/**
 * Real AI evaluation for mock placement interview answers
 */
export async function evaluateAIInterviewAnswer(
  question: string,
  answer: string,
  track: string
): Promise<{ score: number; feedback: string } | null> {
  const { key, provider } = getApiKey();
  if (!key || provider === 'none') return null;

  const prompt = `You are an executive technical interviewer evaluating a student candidate in track "${track}".
Question: "${question}"
Candidate Answer: "${answer}"

Grade this answer on a scale of 1 to 10.
Provide:
1. "score": number between 1 and 10
2. "feedback": 2-3 sentences of constructive technical feedback

Respond strictly in JSON format: {"score": number, "feedback": string}`;

  try {
    if (provider === 'gemini') {
      const model = process.env.AI_PROVIDER_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) return JSON.parse(rawText);
    } else if (provider === 'openai') {
      const model = process.env.AI_PROVIDER_MODEL || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return JSON.parse(content);
    }
  } catch (err) {
    console.warn('[AI Service] Interview grading fallback triggered:', err);
  }

  return null;
}
