const { GoogleGenAI } = require('@google/genai');
const User = require('../models/User');

const DAILY_TOKEN_LIMIT = 300;

/**
 * Ensures a valid and available Gemini model is used.
 * Automatically replaces obsolete models (gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash) with gemini-3.8-flash.
 */
function getResolvedModelName() {
  const envModel = process.env.GEMINI_MODEL;
  if (
    !envModel ||
    envModel === 'gemini-2.5-flash' ||
    envModel === 'gemini-2.0-flash' ||
    envModel === 'gemini-1.5-flash' ||
    envModel.includes('2.5') ||
    envModel.includes('2.0') ||
    envModel.includes('1.5')
  ) {
    return 'gemini-3.8-flash';
  }
  return envModel;
}

const FLASH_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash'];

/**
 * Robust content generation wrapper that handles temporary 503 spikes,
 * rate limits, and model changes across Google's Gemini cluster.
 */
async function generateContentWithFallback(ai, { contents, config = {}, primaryModel }) {
  const resolvedPrimary = getResolvedModelName();
  const models = [
    primaryModel || resolvedPrimary,
    ...FLASH_MODELS,
  ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err) {
        lastError = err;
        const errMsg = err.message || '';
        const isSpike =
          err.status === 503 ||
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('RESOURCE_EXHAUSTED');

        console.warn(`[Gemini API] Model ${model} (attempt ${attempt}/2) failed: ${errMsg.slice(0, 100)}`);

        if (isSpike && attempt === 1) {
          // Wait 1.2s before retry on the same model
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        // Move to next candidate model in the chain
        break;
      }
    }
  }

  let cleanMsg = 'Kasalukuyang mataas ang demand sa Google AI servers. Pakisubukan muli makalipas ang ilang sandali.';
  if (lastError?.message) {
    try {
      const parsed = JSON.parse(lastError.message);
      if (parsed.error?.message) {
        cleanMsg = parsed.error.message;
      }
    } catch (_) {
      cleanMsg = lastError.message;
    }
  }
  const finalError = new Error(cleanMsg);
  finalError.status = lastError?.status || 503;
  throw finalError;
}

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
      percentageUsed: 0,
      nextResetTime: 'Resets at 12:00 AM',
    };
  }

  // Regular user rate limiting (300 daily tokens)
  if (user.aiUsage.count >= DAILY_TOKEN_LIMIT) {
    return {
      allowed: false,
      unlimited: false,
      remaining: 0,
      usedToday: user.aiUsage.count,
      dailyLimit: DAILY_TOKEN_LIMIT,
      percentageUsed: 100,
      nextResetTime: 'Resets at 12:00 AM',
      message: `Naabot mo na ang iyong daily limit na ${DAILY_TOKEN_LIMIT} AI tokens para sa araw na ito. Mag-rereset ito bukas ng 12:00 AM!`,
    };
  }

  user.aiUsage.count += 1;
  await user.save();

  const percentageUsed = Math.min(100, Math.round((user.aiUsage.count / DAILY_TOKEN_LIMIT) * 100));

  return {
    allowed: true,
    unlimited: false,
    remaining: Math.max(0, DAILY_TOKEN_LIMIT - user.aiUsage.count),
    usedToday: user.aiUsage.count,
    dailyLimit: DAILY_TOKEN_LIMIT,
    percentageUsed,
    nextResetTime: 'Resets at 12:00 AM',
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
      percentageUsed: 0,
      nextResetTime: 'Resets at 12:00 AM',
    };
  }

  const percentageUsed = Math.min(100, Math.round((count / DAILY_TOKEN_LIMIT) * 100));

  return {
    isSuperAdmin: false,
    unlimited: false,
    usedToday: count,
    remaining: Math.max(0, DAILY_TOKEN_LIMIT - count),
    dailyLimit: DAILY_TOKEN_LIMIT,
    percentageUsed,
    nextResetTime: 'Resets at 12:00 AM',
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
  const modelName = getResolvedModelName();

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

  const response = await generateContentWithFallback(ai, {
    primaryModel: modelName,
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
 * Handle AI Chatbot response with conversation context and STRICT SUBJECT GUARDRAILS.
 * Restricts questions exclusively to the student's enrolled subjects.
 */
async function generateChatbotReply({ messages = [], userContext = {}, enrolledSubjects = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = getResolvedModelName();

  const subjectListStr =
    enrolledSubjects.length > 0
      ? enrolledSubjects.map((s) => `- [${s.code}] ${s.name}`).join('\n')
      : '(No enrolled subjects registered)';
  const subjectCodesStr =
    enrolledSubjects.length > 0
      ? enrolledSubjects.map((s) => s.code).join(', ')
      : 'walang naka-enroll';

  const systemInstruction = `
You are an expert academic AI Study Assistant exclusively tailored for the Student Task & Exam Management System.
The student is named "${userContext.name || 'Student'}".

THE STUDENT IS STRICTLY ENROLLED IN THE FOLLOWING SUBJECTS ONLY:
${subjectListStr}

=== CRITICAL ACADEMIC GUARDRAILS ===
You MUST strictly evaluate if the student's question/topic is directly related to any of their enrolled subjects (${subjectCodesStr}) or academic study curriculum in those subjects.

1. SCOPE VERIFICATION:
   - ACCEPT: Questions, exercises, coding, math, theories, definitions, review problems, debugging, essay guidelines, or study questions that are directly related to the subjects listed above (${subjectCodesStr}).
   - REJECT (OUT-OF-TOPIC): Questions that are unrelated to their enrolled subjects (e.g. video games, anime, movies, pop culture, entertainment, dating/romance advice, relationships, cooking/recipes, sports, gossip, small talk, or random subjects they are not taking).

2. REQUIRED OUTPUT FORMAT:
   You MUST respond with a single, valid JSON object (NO markdown formatting, NO backticks \`\`\`json):
   
   If the question is OUT-OF-TOPIC:
   {
     "isOutOfTopic": true,
     "message": "⚠️ Out of Topic: Ang AI Study Assistant ay eksklusibo lamang para sa iyong mga enrolled subjects (${subjectCodesStr}). Ang iyong tanong ay walang kaugnayan sa alinman sa iyong mga aralin. Mangyaring magtanong lamang tungkol sa iyong mga registered subjects."
   }

   If the question IS WITHIN SCOPE:
   {
     "isOutOfTopic": false,
     "reply": "Your concise, direct, helpful, and educational answer here. Provide step-by-step solutions or clear explanations matching the user's language (Tagalog/English/Taglish). No fluff or filler."
   }
`;

  // Build contents history
  const contents = [
    { role: 'user', parts: [{ text: systemInstruction }] },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  ];

  const response = await generateContentWithFallback(ai, {
    primaryModel: modelName,
    contents: contents,
    config: {
      temperature: 0.2,
    },
  });

  const responseText = response.text || '';
  let parsed = null;

  try {
    const cleaned = responseText
      .replace(/^```json/m, '')
      .replace(/^```/m, '')
      .replace(/```$/m, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (_) {}
    }
  }

  if (parsed && typeof parsed.isOutOfTopic === 'boolean') {
    return parsed;
  }

  // Fallback: If model responded in plain text, check if it contains out-of-topic rejection keywords
  const lower = responseText.toLowerCase();
  if (lower.includes('out of topic') || lower.includes('walang kaugnayan')) {
    return {
      isOutOfTopic: true,
      message: responseText,
    };
  }

  return {
    isOutOfTopic: false,
    reply: responseText || 'Paumanhin, hindi ako nakabuo ng sagot sa pagkakataong ito.',
  };
}

/**
 * Parse an uploaded schedule (image or document) using Gemini 3.8 Flash.
 * Validates if the file is genuinely a school/class schedule.
 * Returns array of parsed subject/schedule items or throws validation error.
 */
async function parseScheduleWithGemini({ mimeType, fileBuffer, textContent }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = getResolvedModelName();

  const systemInstruction = `
You are an expert academic schedule analyzer and OCR system for students.
Your job is to examine the uploaded file (image, PDF, or text) and determine whether it represents a School/Class Schedule, Enrollment Form, Certificate of Registration (COR), Course Timetable, or Syllabus list of classes.

STRICT VALIDATION RULE:
- If the file is NOT a school schedule / class timetable (for example: random photos, selfie, food, memes, receipts, unrelated essays, arbitrary code), you MUST return:
{"isSchedule": false, "reason": "Hindi ito school schedule o class timetable. Mag-upload ng valid na Certificate of Registration (COR), timetable image, o study schedule."}

- If it IS a valid class schedule, extract ALL subjects and class meetings into this JSON format:
{
  "isSchedule": true,
  "subjects": [
    {
      "code": "IT 101",
      "name": "Introduction to Computing",
      "instructor": "Prof. Santos",
      "room": "Room 304 / Lab 1",
      "days": ["Monday", "Wednesday", "Friday"], // Must only be Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday
      "startTime": "08:00", // 24-hour format HH:MM (e.g. 08:00, 13:30)
      "endTime": "10:00",   // 24-hour format HH:MM
      "scheduleText": "MWF 8:00 AM - 10:00 AM"
    }
  ]
}

CRITICAL RULES:
1. Always normalize days to full English day names: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday". (Convert M->Monday, T->Tuesday, W->Wednesday, TH->Thursday, F->Friday, S->Saturday, Su->Sunday, MWF, TTH, etc.)
2. If time is 12-hour (e.g. 1:30 PM), convert to 24-hour format ("13:30"). If ambiguous, make a sensible educated guess.
3. Return ONLY a valid JSON object. Do not wrap in markdown or conversational notes.
`;

  let parts = [{ text: systemInstruction }];

  if (textContent && textContent.trim().length > 30) {
    // If text was already extracted (e.g. from PDF, COR doc), pass directly as text — takes only 1-2 seconds!
    parts.push({
      text: `Analyze this text extracted from a school schedule / Certificate of Registration (COR) document:\n\n${textContent.slice(0, 25000)}`,
    });
  } else if (fileBuffer && mimeType && mimeType.startsWith('image/')) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: Buffer.isBuffer(fileBuffer) ? fileBuffer.toString('base64') : fileBuffer,
      },
    });
    parts.push({ text: 'Analyze this schedule image and extract all subjects in the exact JSON schema.' });
  } else if (fileBuffer && mimeType === 'application/pdf') {
    // If text extraction was empty (scanned image inside PDF), fall back to PDF inlineData
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: Buffer.isBuffer(fileBuffer) ? fileBuffer.toString('base64') : fileBuffer,
      },
    });
    parts.push({ text: 'Analyze this PDF document and extract all class schedules in the exact JSON schema.' });
  } else {
    throw new Error('Walang naibigay na file data o text content para ma-scan.');
  }

  const response = await generateContentWithFallback(ai, {
    primaryModel: modelName,
    contents: parts,
    config: {
      temperature: 0.1,
    },
  });

  const responseText = response.text || '';
  const cleaned = responseText
    .replace(/^```json/m, '')
    .replace(/^```/m, '')
    .replace(/```$/m, '')
    .trim();

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Hindi ma-parse ang sagot ng AI. Pakisubukan muli.');
    }
  }

  return parsed;
}

module.exports = {
  DAILY_TOKEN_LIMIT,
  checkAndIncrementAiUsage,
  getAiUsageStatus,
  generateReviewQuestions,
  generateChatbotReply,
  parseScheduleWithGemini,
};
