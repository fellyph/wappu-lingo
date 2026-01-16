interface SecretsStoreSecret {
  get(): Promise<string>;
}

interface Env {
  GEMINI_API_KEY: SecretsStoreSecret | string;
}

interface TranscribeRequestBody {
  audio: string;
  mimeType: string;
  targetLocale?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SUPPORTED_MIME_TYPES = [
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
  'audio/flac',
];

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB in bytes (base64 is ~33% larger than binary)

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = (await context.request.json()) as TranscribeRequestBody;
    const { audio, mimeType, targetLocale } = body;

    // Validate request
    if (!audio || !mimeType) {
      return Response.json(
        { error: 'Missing audio or mimeType' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate mime type
    if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
      return Response.json(
        { error: `Unsupported audio format. Supported: ${SUPPORTED_MIME_TYPES.join(', ')}` },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate audio size (base64 string)
    const estimatedBinarySize = (audio.length * 3) / 4;
    if (estimatedBinarySize > MAX_AUDIO_SIZE) {
      return Response.json(
        { error: 'Audio file too large. Maximum size is 10MB.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Get API key from Secrets Store or environment
    const binding = context.env.GEMINI_API_KEY;
    const apiKey =
      typeof binding === 'object' && 'get' in binding
        ? await binding.get()
        : binding;

    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return Response.json(
        { error: 'Transcription service not configured' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Build the prompt
    const promptText = targetLocale
      ? `Transcribe this audio. The speaker is speaking in ${targetLocale}. Return only the transcription text, nothing else.`
      : `Transcribe this audio. Return only the transcription text, nothing else.`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: audio,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return Response.json(
        { error: 'Transcription failed. Please try again.' },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const result = (await geminiResponse.json()) as GeminiResponse;

    if (result.error) {
      console.error('Gemini API returned error:', result.error);
      return Response.json(
        { error: result.error.message || 'Transcription failed' },
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const transcription = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return Response.json(
      { transcription: transcription.trim() },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('Transcription endpoint error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
};
