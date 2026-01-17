/**
 * Whisper Web Worker for on-device audio transcription
 * Uses @huggingface/transformers with WebGPU acceleration
 * Based on official Hugging Face patterns: https://huggingface.co/docs/transformers.js
 */

import { pipeline, env } from '@huggingface/transformers';

// Disable local model loading (always fetch from HuggingFace Hub)
env.allowLocalModels = false;

/**
 * Singleton class for Whisper ASR pipeline
 * Follows the official Hugging Face pattern for lazy loading
 */
class WhisperPipeline {
  static task = 'automatic-speech-recognition' as const;
  static model = 'onnx-community/whisper-tiny';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static instance: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getInstance(progress_callback?: (progress: any) => void) {
    if (!this.instance) {
      // Try WebGPU first, fallback to WASM
      try {
        this.instance = await pipeline(this.task, this.model, {
          device: 'webgpu',
          dtype: 'fp32',
          progress_callback,
        });
        self.postMessage({ status: 'ready', message: 'Model loaded (WebGPU)', progress: 100 });
      } catch (webgpuError) {
        console.warn('WebGPU not available, falling back to WASM:', webgpuError);
        self.postMessage({ status: 'loading', message: 'WebGPU unavailable, using CPU...', progress: 50 });

        this.instance = await pipeline(this.task, this.model, {
          device: 'wasm',
          progress_callback,
        });
        self.postMessage({ status: 'ready', message: 'Model loaded (CPU)', progress: 100 });
      }
    }
    return this.instance;
  }
}

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

/**
 * Progress callback for model loading
 * Sends download progress updates to main thread
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleProgress(progress: any) {
  if (progress.status === 'progress' && progress.progress !== undefined) {
    const percent = Math.round(progress.progress);
    self.postMessage({
      status: 'loading',
      message: `Downloading model: ${percent}%`,
      progress: percent,
      file: progress.file,
    });
  } else if (progress.status === 'done') {
    self.postMessage({
      status: 'loading',
      message: 'Initializing model...',
      progress: 100,
    });
  } else if (progress.status === 'initiate') {
    self.postMessage({
      status: 'loading',
      message: `Loading ${progress.file}...`,
      progress: 0,
      file: progress.file,
    });
  }
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent) => {
  const { type, audio, targetLocale } = event.data;

  if (type === 'init') {
    // Pre-load the model
    try {
      self.postMessage({ status: 'loading', message: 'Loading speech recognition model...', progress: 0 });
      await WhisperPipeline.getInstance(handleProgress);
    } catch (error) {
      self.postMessage({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to initialize model',
      });
    }
    return;
  }

  if (type === 'transcribe') {
    try {
      // Get pipeline instance (loads model if not already loaded)
      const transcriber = await WhisperPipeline.getInstance(handleProgress);

      self.postMessage({ status: 'transcribing', message: 'Transcribing audio...' });

      const language = getWhisperLanguage(targetLocale);

      // Run transcription with chunked processing for longer audio
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const output: any = await transcriber(audio, {
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
        text: text.trim(),
      });
    } catch (error) {
      console.error('Transcription error:', error);
      self.postMessage({
        status: 'error',
        error: error instanceof Error ? error.message : 'Transcription failed',
      });
    }
  }
};

// Signal that worker is ready to receive messages
self.postMessage({ status: 'initialized' });
