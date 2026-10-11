const { GoogleGenAI } = require('@google/genai');
const User = require('../models/User');

const DAILY_TOKEN_LIMIT = 50;

/**
 * Check and increment daily AI usage for a user.
 * Admin (kentfloyd02@gmail.com or role==='admin') has unlimited tokens.
 */
async function checkAndIncrementAiUsage(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const isSuperAdmin =
    (user.email && user.email.toLowerCase() === 'kentfloyd02@gmail.com') ||
    user.role === 'admin';

  const todayStr = new Date().toISOString().slice(0, 10);

  // Initialize or reset if date changed
  if (!user.aiUsage || user.aiUsage.lastResetDate !== todayStr) {
    user.aiUsage = {
      count: 0,
      lastResetDate: todayStr,
    };
  }

  if (isSuperAdmin) {
    // Admin has unli tokens, still record count for analytics
    user.aiUsage.count += 1;
    await user.save();
    return {
      allowed: true,
      unlimited: true,
      remaining: 'Unlimited',
      usedToday: user.aiUsage.count,
      dailyLimit: 'Unlimited',
    };
  }

  // Regular user rate limiting
  if (user.aiUsage.count >= DAILY_TOKEN_LIMIT) {
    return {
      allowed: false,
      unlimited: false,
      remaining: 0,
      usedToday: user.aiUsage.count,
      dailyLimit: DAILY_TOKEN_LIMIT,
      message: `Naabot mo na ang iyong daily limit na ${DAILY_TOKEN_LIMIT} AI requests para sa araw na ito. Mag-rereset ito bukas!`,
    };
  }

  user.aiUsage.count += 1;
  await user.save();

  return {
    allowed: true,
    unlimited: false,
    remaining: DAILY_TOKEN_LIMIT - user.aiUsage.count,
    usedToday: user.aiUsage.count,
    dailyLimit: DAILY_TOKEN_LIMIT,
  };
}

/**
 * Get current AI token usage info without incrementing.
 */
async function getAiUsageStatus(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const isSuperAdmin =
    (user.email && user.email.toLowerCase() === 'kentfloyd02@gmail.com') ||
    user.role === 'admin';

  const todayStr = new Date().toISOString().slice(0, 10);
  let count = user.aiUsage?.count || 0;
  if (user.aiUsage?.lastResetDate !== todayStr) {
    count = 0;
  }

  if (isSuperAdmin) {
    return {
      isSuperAdmin: true,
      unlimited: true,
      usedToday: count,
      remaining: 'Unlimited',
      dailyLimit: 'Unlimited',
    };
  }

  return {
    isSuperAdmin: false,
    unlimited: false,
    usedToday: count,
    remaining: Math.max(0, DAILY_TOKEN_LIMIT - count),
    dailyLimit: DAILY_TOKEN_LIMIT,
  };
}

/**
 * Generate Questions from text using Gemini 3.8 Flash.
 */
async function generateReviewQuestions({
  subject,
  category,
  questionCount = 10,
  questionType = 'multiple_choice',
  textContext,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  // Truncate overly long text (keep max ~35,000 characters to stay well within limits)
  const trimmedContext = (textContext || '').slice(0, 35000);

  const prompt = `
You are an expert academic professor creating a high quality ${category.toUpperCase()} reviewer for the subject "${subject}".
Analyze the study material provided below and generate exactly ${questionCount} questions.

Question Type Requested: ${questionType} (Options: multiple_choice, identification, enumeration, mixed)
- If multiple_choice: provide 4 sensible choices in "a" array, and "c" as the 0-based integer index of the correct choice.
- If identification: provide the question, set "expectedAnswer" as the concise exact term/name/definition, and set "a" to an empty array.
- If enumeration: ask to enumerate key items, set "expectedItems" as an array of items (e.g. ["Item 1", "Item 2"]), and set "a" to an empty array.
- If mixed: create a balanced mix of multiple_choice, identification, and enumeration.

CRITICAL INSTRUCTIONS:
1. Make the questions challenging, educational, and strictly based on the provided material.
2. Return ONLY a valid JSON array of objects. Do not include markdown codeblocks (\`\`\`json) or extra conversational words.
3. Each question object MUST have this exact schema:
[
  {
    "q": "Question text here?",
    "type": "multiple_choice" | "identification" | "enumeration",
    "a": ["Option A", "Option B", "Option C", "Option D"], // only for multiple_choice
    "c": 0, // 0-based index of correct option, only for multiple_choice
    "expectedAnswer": "Correct Term", // for identification
    "expectedItems": ["Item 1", "Item 2"], // for enumeration
    "explanation": "Brief explanation of why this answer is correct"
  }
]

STUDY MATERIAL:
${trimmedContext}
`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      temperature: 0.3,
    },
  });

  const responseText = response.text || '';
  
  // Clean potential markdown wrap
  const cleanedJsonStr = responseText
    .replace(/^```json/m, '')
    .replace(/^```/m, '')
    .replace(/```$/m, '')
    .trim();

  let parsedQuestions = [];
  try {
    parsedQuestions = JSON.parse(cleanedJsonStr);
  } catch (err) {
    // Attempt extracting between [ and ]
    const match = cleanedJsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      parsedQuestions = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse questions generated by Gemini AI. Please try again.');
    }
  }

  if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
    throw new Error('No questions could be extracted from the material.');
  }

  return parsedQuestions;
}

/**
 * Handle AI Chatbot response with conversation context
 */
async function generateChatbotReply({ messages = [], userContext = {} }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  const systemInstruction = `
You are a brilliant, friendly, and helpful AI Study Assistant and General AI Companion for the Student Task & Exam Management System.
The user is currently a student named "${userContext.name || 'Student'}".
Guidelines:
1. You can help with academics, homework, essay outlines, coding, reviewer questions, review summaries, exam strategies, and general life/study advice.
2. You can respond fluently in Tagalog, English, or Taglish depending on how the user speaks to you.
3. Be encouraging, clear, concise, and structured (use bullet points and bold text where helpful).
`;

  // Build contents history
  const contents = [
    { role: 'user', parts: [{ text: systemInstruction }] },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  ];

  const response = await ai.models.generateContent({
    model: modelName,
    contents: contents,
  });

  return response.text || 'Paumanhin, hindi ako nakabuo ng sagot sa pagkakataong ito.';
}

module.exports = {
  DAILY_TOKEN_LIMIT,
  checkAndIncrementAiUsage,
  getAiUsageStatus,
  generateReviewQuestions,
  generateChatbotReply,
};
