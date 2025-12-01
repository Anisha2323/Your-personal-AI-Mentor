const STORAGE_KEY = 'ypm_api_key';
const MODEL_KEY = 'ypm_model';
const DEFAULT_MODEL = 'gemini-1.5-flash-latest';

export async function getStoredApiKey() {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    return new Promise((resolve) => {
      chrome.storage.sync.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || null);
      });
    });
  }
  return window.localStorage.getItem(STORAGE_KEY);
}

export async function getPreferredModel() {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    return new Promise((resolve) => {
      chrome.storage.sync.get([MODEL_KEY], (result) => {
        resolve(result[MODEL_KEY] || DEFAULT_MODEL);
      });
    });
  }
  return window.localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL;
}

export async function requestMentorResponse(input) {
  const apiKey = await getStoredApiKey();
  const model = await getPreferredModel();
  if (!apiKey) {
    throw new Error('Missing API key');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const prompt = buildMentorPrompt(input);
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.65,
      topK: 32,
      topP: 0.95
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const details = await safeRead(response);
    throw new Error(details?.error?.message || 'Gemini request failed');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('No content returned by Gemini');
  }

  return text;
}

export function buildMentorPrompt({ stage, progress, constraints, hintDepth }) {
  return `You are a DSA mentor helping a learner on a LeetCode-style problem.
Constraints or key facts: ${constraints || 'not provided'}
Current thinking: ${progress}
Stage: ${stageLabel(stage)}
Hint depth: ${hintDepth}

Rules:
1. Never provide the full solution or final code. Stay at the hint level.
2. Provide 3-5 incremental nudges that build on the learner's current thinking.
3. Ask a reflective question at the end to encourage further reasoning.
4. Highlight the most relevant data-structure or algorithm concepts to explore next.
5. If the learner is off-track, gently guide them back without giving the answer away.`;
}

export function generateFallbackHint({ stage, progress, constraints }, error) {
  const stageAdvice = {
    understand: 'Restate the prompt in your own words and identify exact inputs/outputs. Look for implicit constraints such as time or ordering guarantees.',
    approach: 'Map the problem onto a known pattern (sliding window, graph traversal, binary search, etc.). Compare brute force vs. target complexity.',
    validate: 'Run your idea through the smallest counterexample you can invent. Track state changes step-by-step to catch mismatches.',
    optimize: 'Identify the bottleneck (time or space). Ask whether preprocessing, memoization, or data structure swaps can shave complexity.'
  };

  return `⚠️ Offline mentor mode (${error?.message || 'no API key'}).

Key reminders based on your notes:
- Constraints noticed: ${constraints || 'none yet — capture limits like n, memory, sortedness.'}
- Current progress: ${progress.slice(0, 200)}
- Next nudge: ${stageAdvice[stage] || stageAdvice.approach}

Try to write down the invariant you want to maintain and test it on a tricky edge case.`;
}

function stageLabel(stage) {
  switch (stage) {
    case 'understand':
      return 'Clarifying the prompt';
    case 'approach':
      return 'Designing an approach';
    case 'validate':
      return 'Validating an approach';
    case 'optimize':
      return 'Optimizing / analyzing complexity';
    default:
      return 'General reasoning';
  }
}

async function safeRead(response) {
  try {
    return await response.json();
  } catch (err) {
    return null;
  }
}
