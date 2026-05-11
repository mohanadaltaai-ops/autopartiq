const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function extractJsonObject(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  const cleaned = String(value)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .replace(/^\uFEFF/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue to balanced-object extraction below.
  }

  const firstBrace = cleaned.indexOf('{');
  if (firstBrace < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = firstBrace; i < cleaned.length; i += 1) {
    const char = cleaned[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;

    if (depth === 0) {
      const candidate = cleaned.slice(firstBrace, i + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        return null;
      }
    }
  }

  return null;
}


function normalizeConfidence(value) {
  const text = String(value || '').toUpperCase();
  if (['HIGH', 'MEDIUM', 'LOW'].includes(text)) return text;
  return 'LOW';
}

function normalizeAiResult(result) {
  return {
    partName: String(result?.partName || '').slice(0, 120),
    category: String(result?.category || '').slice(0, 120),
    description: String(result?.description || '').slice(0, 500),
    possibleVehicleClues: Array.isArray(result?.possibleVehicleClues)
      ? result.possibleVehicleClues.map(item => String(item).slice(0, 120)).slice(0, 5)
      : [],
    confidence: normalizeConfidence(result?.confidence),
    followUpQuestions: Array.isArray(result?.followUpQuestions)
      ? result.followUpQuestions.map(item => String(item).slice(0, 160)).slice(0, 3)
      : [],
    partNumberFormat: String(result?.partNumberFormat || '').slice(0, 120),
    source: 'gemini'
  };
}

function googleAiErrorMessage(payload, status) {
  const rawMessage = payload?.error?.message || '';
  const statusText = payload?.error?.status || '';

  if (status === 429 || statusText === 'RESOURCE_EXHAUSTED' || /quota|rate limit|exceeded/i.test(rawMessage)) {
    return {
      status: 429,
      message: 'AI photo analysis limit reached. Please try again later or enter the part details manually.'
    };
  }

  if (status === 401 || status === 403 || statusText === 'PERMISSION_DENIED') {
    return {
      status: 502,
      message: 'AI photo analysis is not available right now. Please contact support or enter the part details manually.'
    };
  }

  if (/image|file|mime|unsupported/i.test(rawMessage)) {
    return {
      status: 400,
      message: 'This image could not be analyzed. Please upload a clearer JPG, PNG, or WEBP image.'
    };
  }

  return {
    status: 502,
    message: 'AI photo analysis failed. Please try again or enter the part details manually.'
  };
}


async function fetchImageAsInlineData(photoUrl) {
  const response = await fetch(photoUrl);

  if (!response.ok) {
    throw new Error(`Could not read uploaded image. Status ${response.status}`);
  }

  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  if (!mimeType.startsWith('image/')) {
    throw new Error('The provided file is not an image.');
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > 7 * 1024 * 1024) {
    throw new Error('Image is too large for AI analysis. Please upload a smaller image.');
  }

  return {
    mimeType,
    data: buffer.toString('base64')
  };
}

function buildPrompt({ language, origin, make, model, year, problem }) {
  const responseLanguage = language === 'ar' ? 'Arabic' : 'English';

  return `
You are an automotive spare parts identification assistant for Auto Parts IQ / Auto Parts AE.

Analyze the uploaded photo and identify the most likely car spare part.

Important:
- If the image clearly shows a recognizable automotive part, give the best likely part name even if not 100% certain.
- Use LOW confidence only when the image is too blurry, too dark, does not show a car part, or the part is heavily obstructed.
- Do not return an empty partName if a likely part is visible.
- Do not invent an exact OEM part number unless it is visible in the image.
- Keep the description under 80 words.
- Write all customer-facing text fields in ${responseLanguage}.

Return only this JSON structure:
{
  "partName": "short part name, or empty only if not recognizable",
  "category": "part category",
  "description": "brief customer-friendly description",
  "possibleVehicleClues": ["visible make/model/year clues if any"],
  "confidence": "HIGH | MEDIUM | LOW",
  "followUpQuestions": ["question 1", "question 2"],
  "partNumberFormat": ""
}

Known vehicle info from the user:
Origin: ${origin || 'unknown'}
Make: ${make || 'unknown'}
Model: ${model || 'unknown'}
Year: ${year || 'unknown'}
Extra problem text: ${problem || 'none'}
`;
}

const geminiResponseSchema = {
  type: 'OBJECT',
  properties: {
    partName: { type: 'STRING' },
    category: { type: 'STRING' },
    description: { type: 'STRING' },
    possibleVehicleClues: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    confidence: {
      type: 'STRING',
      enum: ['HIGH', 'MEDIUM', 'LOW']
    },
    followUpQuestions: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    partNumberFormat: { type: 'STRING' }
  },
  required: ['partName', 'category', 'description', 'confidence', 'followUpQuestions', 'partNumberFormat']
};


export async function identifyPart(req, res) {
  const { photoUrl, problem, language, origin, make, model, year } = req.body;

  if (!photoUrl && !problem) {
    return res.status(400).json({ message: 'Photo or problem description is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.json({
      partName: 'Brake Pads',
      category: 'Brake system',
      description: 'Demo fallback: upload a part photo and configure GEMINI_API_KEY for live Google AI image analysis.',
      possibleVehicleClues: [],
      confidence: 'LOW',
      followUpQuestions: ['Please confirm the exact vehicle model and part side if applicable.'],
      partNumberFormat: 'See supplier/OEM catalog',
      source: 'demo',
      demo: true
    });
  }

  try {
    const parts = [{ text: buildPrompt({ language, origin, make, model, year, problem }) }];

    if (photoUrl) {
      const inlineData = await fetchImageAsInlineData(photoUrl);
      parts.push({ inlineData });
    }

    const geminiModel = DEFAULT_GEMINI_MODEL;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 800,
            responseMimeType: 'application/json',
            responseSchema: geminiResponseSchema
          },
          contents: [
            {
              role: 'user',
              parts
            }
          ]
        })
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      const mappedError = googleAiErrorMessage(payload, response.status);
      return res.status(mappedError.status).json({
        message: mappedError.message,
        aiError: true,
        googleStatus: payload?.error?.status || null
      });
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('\n')
      .trim();

    const parsed = extractJsonObject(text);
    if (!parsed) {
      return res.json({
        partName: '',
        category: '',
        description: 'AI could not confidently identify this part. Please enter the part manually or try a clearer photo.',
        possibleVehicleClues: [],
        confidence: 'LOW',
        followUpQuestions: ['Please upload a clearer photo from another angle.'],
        partNumberFormat: '',
        source: 'gemini',
        unclear: true
      });
    }

    res.json(normalizeAiResult(parsed));
  } catch (error) {
    res.status(500).json({ message: error.message || 'AI analysis failed' });
  }
}
