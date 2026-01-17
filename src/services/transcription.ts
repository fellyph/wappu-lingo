/**
 * Audio transcription service using local Whisper (on-device)
 * Uses @huggingface/transformers via Web Worker for background processing
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class TranscriptionError extends Error {
  constructor(
    message: string,
    public code: 'PERMISSION_DENIED' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_FORMAT' | 'NETWORK_ERROR' | 'TRANSCRIPTION_FAILED' | 'MODEL_LOADING'
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

export type ModelStatus = 'not_loaded' | 'loading' | 'ready' | 'error';

export interface ModelLoadingProgress {
  status: ModelStatus;
  message: string;
  progress: number;
}

// Whisper worker singleton
let whisperWorker: Worker | null = null;
let modelStatus: ModelStatus = 'not_loaded';
let loadingProgress = 0;
let loadingMessage = '';

// Callbacks for pending transcription requests
let pendingResolve: ((text: string) => void) | null = null;
let pendingReject: ((error: Error) => void) | null = null;

// Status callback for UI updates
type StatusCallback = (progress: ModelLoadingProgress) => void;
let statusCallback: StatusCallback | null = null;

/**
 * Set a callback to receive status updates during model loading/transcription
 */
export function setTranscriptionStatusCallback(callback: StatusCallback | null): void {
  statusCallback = callback;
  // Immediately notify of current status
  if (callback) {
    callback({ status: modelStatus, message: loadingMessage, progress: loadingProgress });
  }
}

/**
 * Get current model status
 */
export function getModelStatus(): ModelLoadingProgress {
  return { status: modelStatus, message: loadingMessage, progress: loadingProgress };
}

/**
 * Check if model is ready for transcription
 */
export function isModelReady(): boolean {
  return modelStatus === 'ready';
}

/**
 * Initialize the Whisper worker
 */
function initWorker(): Worker {
  if (whisperWorker) return whisperWorker;

  whisperWorker = new Worker(
    new URL('../workers/whisper.worker.ts', import.meta.url),
    { type: 'module' }
  );

  whisperWorker.onmessage = (e: MessageEvent) => {
    const { status, text, error, message, progress } = e.data;

    switch (status) {
      case 'initialized':
        // Worker script loaded
        break;

      case 'loading':
        modelStatus = 'loading';
        loadingMessage = message || 'Loading model...';
        loadingProgress = progress ?? 0;
        statusCallback?.({ status: modelStatus, message: loadingMessage, progress: loadingProgress });
        break;

      case 'ready':
        modelStatus = 'ready';
        loadingMessage = message || 'Model ready';
        loadingProgress = 100;
        statusCallback?.({ status: modelStatus, message: loadingMessage, progress: loadingProgress });
        break;

      case 'transcribing':
        statusCallback?.({ status: 'ready', message: message || 'Transcribing...', progress: 100 });
        break;

      case 'complete':
        if (pendingResolve) {
          pendingResolve(text);
          pendingResolve = null;
          pendingReject = null;
        }
        break;

      case 'error':
        if (pendingReject) {
          pendingReject(new TranscriptionError(error || 'Transcription failed', 'TRANSCRIPTION_FAILED'));
          pendingResolve = null;
          pendingReject = null;
        }
        modelStatus = 'error';
        loadingMessage = error || 'Error loading model';
        statusCallback?.({ status: modelStatus, message: loadingMessage, progress: 0 });
        break;
    }
  };

  whisperWorker.onerror = (error) => {
    console.error('Whisper worker error:', error);
    modelStatus = 'error';
    loadingMessage = 'Worker error occurred';
    statusCallback?.({ status: modelStatus, message: loadingMessage, progress: 0 });
    if (pendingReject) {
      pendingReject(new TranscriptionError('Worker error occurred', 'TRANSCRIPTION_FAILED'));
      pendingResolve = null;
      pendingReject = null;
    }
  };

  return whisperWorker;
}

/**
 * Preload the Whisper model (call this early to reduce latency on first transcription)
 * Returns a promise that resolves when model is ready
 */
export function preloadWhisperModel(): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = initWorker();

    if (modelStatus === 'ready') {
      resolve();
      return;
    }

    if (modelStatus === 'loading') {
      // Already loading, wait for it
      const checkReady = setInterval(() => {
        if (modelStatus === 'ready') {
          clearInterval(checkReady);
          resolve();
        } else if (modelStatus === 'error') {
          clearInterval(checkReady);
          reject(new Error(loadingMessage));
        }
      }, 100);
      return;
    }

    // Start loading
    const originalCallback = statusCallback;
    setTranscriptionStatusCallback((progress) => {
      originalCallback?.(progress);
      if (progress.status === 'ready') {
        setTranscriptionStatusCallback(originalCallback);
        resolve();
      } else if (progress.status === 'error') {
        setTranscriptionStatusCallback(originalCallback);
        reject(new Error(progress.message));
      }
    });

    worker.postMessage({ type: 'init' });
  });
}

/**
 * Convert audio blob to Float32Array at 16kHz sample rate (required by Whisper)
 */
async function audioToFloat32(audioBlob: Blob): Promise<Float32Array> {
  // Create AudioContext with 16kHz sample rate
  const audioContext = new AudioContext({ sampleRate: 16000 });

  try {
    // Decode audio data
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get mono audio data (use first channel or mix if stereo)
    let audioData: Float32Array;
    if (audioBuffer.numberOfChannels === 1) {
      audioData = audioBuffer.getChannelData(0);
    } else {
      // Mix stereo to mono
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      audioData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        audioData[i] = (left[i] + right[i]) / 2;
      }
    }

    return audioData;
  } finally {
    await audioContext.close();
  }
}

/**
 * Check if a mime type is supported
 */
function isSupportedAudioType(mimeType: string): boolean {
  if (!mimeType) return false;

  const supportedPrefixes = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/webm',
    'audio/mp4',
    'audio/m4a',
    'audio/ogg',
    'audio/flac',
    'audio/x-flac',
  ];

  const baseMimeType = mimeType.split(';')[0].toLowerCase();
  return supportedPrefixes.some(prefix => baseMimeType === prefix || baseMimeType.startsWith(prefix));
}

/**
 * Validate audio file before transcription
 */
export function validateAudioFile(blob: Blob): void {
  if (blob.size > MAX_FILE_SIZE) {
    throw new TranscriptionError(
      'File too large. Maximum size is 10MB.',
      'FILE_TOO_LARGE'
    );
  }

  // Skip mime type validation for recorded blobs (they might have empty or unusual types)
  if (blob.type && !isSupportedAudioType(blob.type)) {
    throw new TranscriptionError(
      `Unsupported audio format: ${blob.type}. Supported formats: WAV, MP3, WebM, MP4, OGG, FLAC.`,
      'UNSUPPORTED_FORMAT'
    );
  }
}

/**
 * Transcribe audio using local Whisper model (on-device)
 */
export async function transcribeAudio(
  audioBlob: Blob,
  _mimeType: string,
  targetLocale?: string
): Promise<string> {
  // Validate before processing
  validateAudioFile(audioBlob);

  // Initialize worker
  const worker = initWorker();

  // Convert audio blob to Float32Array (16kHz mono)
  const audioData = await audioToFloat32(audioBlob);

  // Create promise for transcription result
  return new Promise((resolve, reject) => {
    // Store callbacks for worker response
    pendingResolve = resolve;
    pendingReject = reject;

    // Set a timeout for the entire operation (2 minutes max for model loading + transcription)
    const timeout = setTimeout(() => {
      if (pendingReject) {
        pendingReject(new TranscriptionError('Transcription timed out', 'TRANSCRIPTION_FAILED'));
        pendingResolve = null;
        pendingReject = null;
      }
    }, 120000);

    // Clear timeout when done
    const originalResolve = pendingResolve;
    const originalReject = pendingReject;

    pendingResolve = (text: string) => {
      clearTimeout(timeout);
      originalResolve(text);
    };

    pendingReject = (error: Error) => {
      clearTimeout(timeout);
      originalReject(error);
    };

    // Send audio to worker for transcription
    worker.postMessage({
      type: 'transcribe',
      audio: audioData,
      targetLocale,
    });
  });
}

/**
 * Get the preferred mime type for recording based on browser support
 */
export function getPreferredMimeType(): string {
  if (typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }

  // Prefer webm for Chrome/Firefox, mp4 for Safari
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  // Fallback
  return 'audio/webm';
}

/**
 * Check if WebGPU is available (for optimal performance)
 */
export async function isWebGPUAvailable(): Promise<boolean> {
  if (!('gpu' in navigator)) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gpu = (navigator as any).gpu;
    const adapter = await gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Get transcription capability info
 */
export async function getTranscriptionInfo(): Promise<{
  isLocal: boolean;
  hasWebGPU: boolean;
  message: string;
}> {
  const hasWebGPU = await isWebGPUAvailable();
  return {
    isLocal: true,
    hasWebGPU,
    message: hasWebGPU
      ? 'Using local Whisper with WebGPU acceleration'
      : 'Using local Whisper (CPU fallback)',
  };
}
