/**
 * Whisper Web Worker for on-device audio transcription
 * Uses @huggingface/transformers with WebGPU acceleration
 */

import { pipeline } from '@huggingface/transformers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transcriber: any = null;
let isInitializing = false;

// Map common locale codes to Whisper language codes
const localeToWhisperLang: Record<string, string> = {
  'pt-br': 'portuguese',
  'pt_BR': 'portuguese',
  'pt': 'portuguese',
  'es': 'spanish',
  'es_ES': 'spanish',
  'es-mx': 'spanish',
  'fr': 'french',
  'fr_FR': 'french',
  'de': 'german',
  'de_DE': 'german',
  'it': 'italian',
  'it_IT': 'italian',
  'nl': 'dutch',
  'nl_NL': 'dutch',
  'ja': 'japanese',
  'ja_JP': 'japanese',
  'zh-cn': 'chinese',
  'zh_CN': 'chinese',
  'zh-tw': 'chinese',
  'ko': 'korean',
  'ko_KR': 'korean',
  'ru': 'russian',
  'ru_RU': 'russian',
  'ar': 'arabic',
  'he': 'hebrew',
  'he_IL': 'hebrew',
  'tr': 'turkish',
  'tr_TR': 'turkish',
  'pl': 'polish',
  'pl_PL': 'polish',
  'sv': 'swedish',
  'sv_SE': 'swedish',
  'da': 'danish',
  'da_DK': 'danish',
  'fi': 'finnish',
  'fi_FI': 'finnish',
  'no': 'norwegian',
  'nb_NO': 'norwegian',
  'uk': 'ukrainian',
  'uk_UA': 'ukrainian',
  'cs': 'czech',
  'cs_CZ': 'czech',
  'el': 'greek',
  'el_GR': 'greek',
  'hu': 'hungarian',
  'hu_HU': 'hungarian',
  'ro': 'romanian',
  'ro_RO': 'romanian',
  'th': 'thai',
  'th_TH': 'thai',
  'vi': 'vietnamese',
  'vi_VN': 'vietnamese',
  'id': 'indonesian',
  'id_ID': 'indonesian',
  'en': 'english',
  'en_US': 'english',
  'en_GB': 'english',
};

function getWhisperLanguage(targetLocale?: string): string | undefined {
  if (!targetLocale) return undefined;

  // Try exact match first
  if (localeToWhisperLang[targetLocale]) {
    return localeToWhisperLang[targetLocale];
  }

  // Try lowercase
  const lower = targetLocale.toLowerCase();
  if (localeToWhisperLang[lower]) {
    return localeToWhisperLang[lower];
  }

  // Try just the language code (first 2 chars)
  const langCode = targetLocale.substring(0, 2).toLowerCase();
  if (localeToWhisperLang[langCode]) {
    return localeToWhisperLang[langCode];
  }

  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function initTranscriber(): Promise<any> {
  if (transcriber) return transcriber;
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (transcriber) return transcriber;
  }

  isInitializing = true;
  self.postMessage({ status: 'loading', message: 'Loading speech recognition model...' });

  try {
    // Use whisper-base for multilingual support (~150MB)
    // Falls back to WASM if WebGPU is not available
    transcriber = await pipeline(
      'automatic-speech-recognition',
      'onnx-community/whisper-base',
      {
        device: 'webgpu',
        dtype: 'fp32',
      }
    );

    self.postMessage({ status: 'ready', message: 'Model loaded successfully' });
    return transcriber;
  } catch (webgpuError) {
    console.warn('WebGPU not available, falling back to WASM:', webgpuError);

    // Fallback to WASM (CPU) if WebGPU is not supported
    transcriber = await pipeline(
      'automatic-speech-recognition',
      'onnx-community/whisper-base',
      {
        device: 'wasm',
      }
    );

    self.postMessage({ status: 'ready', message: 'Model loaded (WASM fallback)' });
    return transcriber;
  } finally {
    isInitializing = false;
  }
}

// Handle messages from main thread
self.onmessage = async (e: MessageEvent) => {
  const { type, audio, targetLocale } = e.data;

  if (type === 'init') {
    try {
      await initTranscriber();
    } catch (error) {
      self.postMessage({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to initialize model'
      });
    }
    return;
  }

  if (type === 'transcribe') {
    try {
      const pipe = await initTranscriber();

      self.postMessage({ status: 'transcribing', message: 'Transcribing audio...' });

      const language = getWhisperLanguage(targetLocale);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output: any = await pipe(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: language,
        task: 'transcribe',
        return_timestamps: false,
      });

      // Handle both single result and array result
      const text = Array.isArray(output)
        ? output.map((o: { text: string }) => o.text).join(' ')
        : output.text;

      self.postMessage({
        status: 'complete',
        text: text.trim()
      });
    } catch (error) {
      console.error('Transcription error:', error);
      self.postMessage({
        status: 'error',
        error: error instanceof Error ? error.message : 'Transcription failed'
      });
    }
  }
};

// Signal that worker is ready to receive messages
self.postMessage({ status: 'initialized' });
