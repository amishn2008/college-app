import OpenAI from 'openai';
import { randomUUID } from 'crypto';

const apiKey = process.env.OPENAI_API_KEY;
// Allow overriding the deployed model; default to gpt-4o-mini which is widely available.
const defaultModel = 'gpt-4o-mini';
const modelName = process.env.OPENAI_MODEL || defaultModel;

function maskKey(key?: string | null): string {
  if (!key) return 'missing';
  if (key.length <= 10) return '[loaded: short key]';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

if (!apiKey) {
  console.warn('[openai] OPENAI_API_KEY is missing — falling back to heuristic critiques.');
} else {
  // Light-touch log to confirm the key is being read without leaking it.
  console.info(`[openai] Key loaded (${maskKey(apiKey)}) using model "${modelName}".`);
}

const openai = apiKey
  ? new OpenAI({
      apiKey,
    })
  : null;

export interface EssayCritique {
  strengths: string[];
  issues: string[];
  lineEdits: Array<{
    line: string;
    suggestion: string;
    reason: string;
  }>;
  overallFeedback: string;
  source?: 'openai' | 'fallback';
  runId?: string;
  focus?: string;
  counselor?: string;
  model?: string;
}

export async function critiqueEssay(
  essay: string,
  prompt: string,
  wordLimit: number,
  title?: string
): Promise<EssayCritique> {
  if (!openai) {
    console.warn('OPENAI_API_KEY not found or OpenAI client not initialized; using fallback critique.');
    return buildFallbackCritique(essay, prompt, title);
  }

  // Rotate a focus lens and voice so repeat requests surface fresh angles instead of identical advice.
  const focusLenses = [
    'structure and pacing toward the turning point',
    'voice, authenticity, and admissions-read clarity',
    'specificity of examples and vivid imagery',
    'reflection, meaning-making, and growth',
    'language economy and polish',
  ];
  const counselorVoices = ['admissions dean', 'UCLA reader', 'Ivy Dean', 'UC PIQ specialist', 'liberal arts dean'];
  const lensIndex = Math.floor(Math.random() * focusLenses.length);
  const voiceIndex = Math.floor(Math.random() * counselorVoices.length);
  const focus = focusLenses[lensIndex];
  const counselor = counselorVoices[voiceIndex];
  const critiqueId = `critique-${randomUUID()}`;

  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `You are a seasoned university admissions reader and essay coach (today channel the tone of a ${counselor}). Provide precise, prioritized feedback that sounds like an experienced counselor, grounded in the student's own words—never generic. 
- Treat this critique as a fresh read (id: ${critiqueId}); do not reuse phrasing from earlier critiques and avoid templated wording.
- Admissions lens: fit, intellectual curiosity, reflective maturity, and clear storytelling.
- In this pass, lean extra into ${focus} while still evaluating the full essay.
- Use short quotes from the essay (<=12 words in parentheses) to prove points and keep them varied.
- Prioritize the biggest reader-impact changes first and ensure each issue is distinct.

Rubric to balance:
- Idea/theme clarity and insight
- Structure & flow toward a turning point
- Voice & authenticity
- Specificity & evidence
- Language clarity & mechanics

Provide in JSON only:
1) Exactly 3 strengths (why they work for an admissions reader)
2) Exactly 3 priority fixes in order of impact (make each distinct, non-duplicative)
3) Up to 3 concrete line edits with original line, suggested improvement, and reason
4) A brief overallFeedback (2–3 sentences) tied to the prompt and next steps

If the draft is a note dump or under 80 words, say that and give the next 2 most helpful actions instead of line edits.`,
        },
        {
          role: 'user',
          content: `Prompt: ${prompt}\nTitle: ${title || 'Untitled essay'}\nWord Limit: ${wordLimit}\nCritique run id: ${critiqueId}\nFocus dimension: ${focus}\n\nEssay:\n\n${essay}`,
        },
      ],
      temperature: 0.7,
      presence_penalty: 0.55,
      frequency_penalty: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content) as EssayCritique;
    return { ...parsed, source: 'openai', runId: critiqueId, focus, counselor, model: modelName };
  } catch (error) {
    console.error('OpenAI critique request failed, using fallback:', error);
    return buildFallbackCritique(essay, prompt, title);
  }
}

export async function rewriteEssay(
  essay: string,
  instruction: string,
  prompt: string,
  wordLimit: number
): Promise<string> {
  if (!openai) {
    return buildFallbackRewrite(essay, instruction, wordLimit);
  }

  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `You are a helpful essay coach. Rewrite only as much as needed to follow the student's instruction while keeping their voice, tone, and perspective.
- Keep it around ${wordLimit} words.
- Preserve any specific details, sensory images, and authentic moments.
- Prefer tightening, clarifying, and reorganizing over inventing new content.
- If the instruction is unclear, interpret it conservatively and explain your choice briefly at the end.`,
        },
        {
          role: 'user',
          content: `Prompt: ${prompt}\n\nCurrent Essay:\n\n${essay}\n\nInstruction: ${instruction}\n\nPlease provide the improved version:`,
        },
      ],
      temperature: 0.6,
      presence_penalty: 0.3,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI rewrite request failed, using fallback:', error);
    return buildFallbackRewrite(essay, instruction, wordLimit);
  }
}

export async function coachEssay(
  essay: string,
  prompt: string,
  wordLimit: number
): Promise<string> {
  if (!openai) {
    return buildFallbackCoaching(essay, prompt);
  }

  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `You are an encouraging essay coach. Give focused, actionable guidance the student can execute themselves.
Organize your response under these headers:
• Structure (how to order the story toward a turning point)
• Story & evidence (where to add or trim detail/imagery)
• Clarity & polish (language/voice tweaks)
• Quick wins (3 fast changes to make right now)
Keep bullets short and anchored to the actual draft.`,
        },
        {
          role: 'user',
          content: `Prompt: ${prompt}\n\nWord Limit: ${wordLimit}\n\nEssay:\n\n${essay}\n\nWhat suggestions do you have for improving the structure and story?`,
        },
      ],
      temperature: 0.55,
      presence_penalty: 0.3,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI coaching request failed, using fallback:', error);
    return buildFallbackCoaching(essay, prompt);
  }
}

export type EssayChatMessage = { role: 'user' | 'assistant'; content: string };

export async function chatEssay(
  essay: string,
  prompt: string,
  wordLimit: number,
  messages: EssayChatMessage[]
): Promise<string> {
  if (!openai) {
    return buildFallbackChat(essay, prompt);
  }

  const safeMessages = messages
    .filter((m) => m?.content && (m.role === 'user' || m.role === 'assistant'))
    .slice(-10)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 2000),
    })) as Array<{ role: 'user' | 'assistant'; content: string }>;

  try {
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `You are a collaborative college essay coach. Keep replies concise (4-8 sentences) and anchored to the student's draft.
Ask one clarifying question only when needed. Cite short quotes (<=10 words) from the essay when referring to specific moments.
Do not fabricate events—work only with what's on the page.`,
        },
        {
          role: 'system',
          content: `Prompt: ${prompt}\nWord limit: ${wordLimit}\nEssay draft (keep private):\n${essay}`,
        },
        ...safeMessages,
      ],
      temperature: 0.6,
      presence_penalty: 0.5,
      frequency_penalty: 0.2,
    });

    return response.choices[0]?.message?.content?.trim() || buildFallbackChat(essay, prompt);
  } catch (error) {
    console.error('OpenAI chat request failed, using fallback:', error);
    return buildFallbackChat(essay, prompt);
  }
}

function buildFallbackCritique(essay: string, prompt: string, title?: string): EssayCritique {
  const essayLabel = title || prompt || 'your prompt';
  const sentences = essay
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = essay.split(/\s+/).filter(Boolean);
  const avgSentenceLength = sentences.length ? Math.round(words.length / sentences.length) : words.length;
  const hasReflection = /learned|realized|because|therefore|so/i.test(essay);
  const hasSpecifics = /(\d{4}|\b\d+\b|because|specifically|for example)/i.test(essay);
  const hasSensory = /saw|heard|felt|smelled|tasted|sound|texture|color|touch|looked/i.test(essay);
  const opening = sentences[0] || '';
  const closing = sentences[sentences.length - 1] || '';
  const reflectiveSentence =
    sentences.find((s) => /learned|realized|because|therefore|so|taught/i.test(s)) || closing || opening;

  const strengths = [
    opening
      ? `Opens with a clear moment (“${snippet(opening)}”) that pulls the reader in.`
      : 'Voice feels personal and conversational from the start.',
    hasReflection
      ? `You pause to make meaning (“${snippet(reflectiveSentence)}”), which shows insight.`
      : 'Honest tone makes the experience feel authentic.',
    hasSpecifics || hasSensory
      ? 'Concrete details help the scene feel tangible—keep leaning on vivid description.'
      : 'Structure is easy to follow; adding small visuals will make it pop.',
  ];

  const issues = [
    avgSentenceLength > 28
      ? 'Several sentences run long—split them so key beats land cleanly.'
      : 'Add a few shorter sentences to vary pacing and emphasize the turning point.',
    hasSpecifics || hasSensory
      ? 'Connect each vivid detail back to why it matters for this prompt.'
      : 'Add 2–3 specific images or examples so admissions can picture the moment.',
    hasReflection
      ? `Strengthen the ending so it answers “so what?”—tie it back to "${snippet(essayLabel)}".`
      : 'Close with 1–2 sentences on what changed in you because of this experience.',
  ];

  const longSentence = sentences.find((s) => s.split(/\s+/).length > 35);
  const lineEdits =
    longSentence
      ? [
          {
            line: longSentence,
            suggestion: splitSentence(longSentence),
            reason: 'Shorter sentences help the reader follow the turning point in your story.',
          },
        ]
      : [];

  return {
    strengths,
    issues,
    lineEdits,
    overallFeedback: `Lean on your strongest moment (“${snippet(
      opening || sentences[1] || essay
    )}”) and add one vivid sensory detail to let us feel it. Then close with a crisp sentence about how it changed what you value in relation to "${snippet(essayLabel)}".`,
    source: 'fallback',
  };
}

function buildFallbackRewrite(essay: string, instruction: string, wordLimit: number): string {
  const cleanedInstruction = instruction.trim();
  let updatedEssay = essay.trim();

  if (/tighten|short|condense|trim/i.test(cleanedInstruction)) {
    const targetWords = Math.max(100, Math.round(wordLimit * 0.8));
    updatedEssay = words(updatedEssay).slice(0, targetWords).join(' ');
  }

  if (/stronger intro|hook|opening/i.test(cleanedInstruction)) {
    const sentences = updatedEssay.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length > 1) {
      const hook = sentences.slice(0, 2).join(' ');
      updatedEssay = `I start here because this was the moment everything shifted: ${hook
        .replace(/^[A-Z]/, (c) => c.toUpperCase())
        .trim()}. ${sentences.slice(2).join(' ')}`;
    }
  }

  if (/active voice|stronger verbs/i.test(cleanedInstruction)) {
    updatedEssay = updatedEssay.replace(/\bwas\b|\bwere\b/gi, 'became');
  }

  return `${updatedEssay}\n\n(Instruction applied: ${cleanedInstruction})`;
}

function buildFallbackCoaching(essay: string, prompt: string): string {
  const wordsCount = words(essay).length;
  const details = /because|for example|specifically|after|before/i.test(essay)
    ? 'You already include some vivid detail—push that further by zooming into sensory moments.'
    : 'Add 1-2 concrete visuals (sounds, textures, tiny objects) so the reader can picture the scene.';

  const structureTip =
    wordsCount > 500
      ? 'Consider trimming the middle third—focus on the turning point and the reflection.'
      : 'Make sure the middle section builds toward a clear change or realization.';

  return [
    `• Clarify why this story answers the prompt: explicitly tie the experience back to "${prompt}".`,
    `• ${details}`,
    `• ${structureTip}`,
    '• Close with a sentence that states what you now believe, value, or will do differently.',
  ].join('\n');
}

function buildFallbackChat(essay: string, prompt: string): string {
  const promptSnippet = snippet(prompt || 'your prompt', 120);
  const firstSentence =
    essay
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)[0] ?? '';
  const hasScene = /saw|heard|felt|smelled|tasted|looked|sound|grabbed|held|hands|eyes/i.test(essay);

  return [
    `I’m seeing the core message trying to answer “${promptSnippet}”.`,
    firstSentence
      ? `The opening line (“${snippet(firstSentence, 90)}”) sets the scene—lean into that moment with one sensory detail.`
      : 'Start with a concrete moment that shows the turning point before you explain it.',
    hasScene
      ? 'Layer in one more vivid detail around the turning point so the reader feels it happen.'
      : 'Add a quick sensory beat (sound, texture, color) so the reader can picture the scene.',
    'Close by naming exactly how you changed or what you value now—one crisp sentence is enough.',
  ].join(' ');
}

function splitSentence(sentence: string): string {
  const midpoint = Math.round(sentence.length / 2);
  const splitIndex = sentence.indexOf(' ', midpoint);
  if (splitIndex === -1) return sentence;
  return `${sentence.slice(0, splitIndex)}. ${sentence.slice(splitIndex + 1)}`;
}

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function snippet(text: string, max = 80): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}...`;
}
