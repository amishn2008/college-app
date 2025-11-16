import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
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
}

export async function critiqueEssay(
  essay: string,
  prompt: string,
  wordLimit: number
): Promise<EssayCritique> {
  if (!openai) {
    return buildFallbackCritique(essay, prompt);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful essay coach helping a student improve their college application essay. 
        Be constructive, specific, and encouraging. Focus on helping them think and improve, not writing the essay for them.
        
        Rubric:
        - Idea/Theme clarity
        - Structure & flow
        - Voice & authenticity
        - Specificity & evidence
        - Language clarity & mechanics
        
        Provide:
        1. Exactly 3 strengths (what's working well)
        2. Exactly 3 priority fixes (what needs improvement, in order of importance)
        3. Up to 3 concrete line-edits with the original line, suggested improvement, and reason
        4. A brief overall feedback (2-3 sentences)
        
        Format your response as JSON with this structure:
        {
          "strengths": ["strength1", "strength2", "strength3"],
          "issues": ["issue1", "issue2", "issue3"],
          "lineEdits": [
            {"line": "original line", "suggestion": "improved line", "reason": "why"}
          ],
          "overallFeedback": "brief feedback"
        }`,
      },
        {
          role: 'user',
          content: `Prompt: ${prompt}\n\nWord Limit: ${wordLimit}\n\nEssay:\n\n${essay}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as EssayCritique;
  } catch (error) {
    console.error('OpenAI critique request failed, using fallback:', error);
    return buildFallbackCritique(essay, prompt);
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
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful essay coach. The student wants you to help them rewrite or improve their essay based on their instruction.
        Provide a rewritten version that follows their instruction. Do not write the entire essay from scratch - work with what they have.
        Maintain their voice and authenticity. The essay should be around ${wordLimit} words.`,
        },
        {
          role: 'user',
          content: `Prompt: ${prompt}\n\nCurrent Essay:\n\n${essay}\n\nInstruction: ${instruction}\n\nPlease provide the improved version:`,
        },
      ],
      temperature: 0.7,
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
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful essay coach. Provide suggestions on structure, story, and approach.
        Be encouraging and specific. Focus on helping them think about their essay, not writing it for them.
        Provide actionable suggestions in bullet points.`,
        },
        {
          role: 'user',
          content: `Prompt: ${prompt}\n\nWord Limit: ${wordLimit}\n\nEssay:\n\n${essay}\n\nWhat suggestions do you have for improving the structure and story?`,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI coaching request failed, using fallback:', error);
    return buildFallbackCoaching(essay, prompt);
  }
}

function buildFallbackCritique(essay: string, prompt: string): EssayCritique {
  const sentences = essay
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const words = essay.split(/\s+/).filter(Boolean);
  const avgSentenceLength = sentences.length ? Math.round(words.length / sentences.length) : words.length;
  const hasReflection = /learned|realized|because|therefore|so/i.test(essay);
  const hasSpecifics = /(\d{4}|\b\d+\b|because|specifically|for example)/i.test(essay);

  const strengths = [
    hasSpecifics
      ? 'Includes concrete details that help the reader imagine the story.'
      : 'Voice feels personal and conversational.',
    hasReflection
      ? 'Takes time to reflect on why the experience mattered.'
      : 'Shows honest emotion that feels authentic.',
    sentences.length > 3
      ? 'Has a clear beginning, middle, and end.'
      : 'Keeps things concise and easy to follow.',
  ];

  const issues = [
    avgSentenceLength > 28
      ? 'Several sentences run long; consider breaking them up for clarity.'
      : 'Could add a few shorter sentences to vary the pacing.',
    hasSpecifics
      ? 'Clarify how the details connect back to the prompt.'
      : 'Add specific examples so admissions can picture the moment.',
    hasReflection
      ? 'End with a stronger final sentence that ties back to the prompt.'
      : 'Include 1-2 sentences reflecting on what the experience taught you.',
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
    overallFeedback: `Ground the essay in vivid, specific detail from your experience with "${prompt}". Then close by naming what changed in you because of it.`,
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

function splitSentence(sentence: string): string {
  const midpoint = Math.round(sentence.length / 2);
  const splitIndex = sentence.indexOf(' ', midpoint);
  if (splitIndex === -1) return sentence;
  return `${sentence.slice(0, splitIndex)}. ${sentence.slice(splitIndex + 1)}`;
}

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}
