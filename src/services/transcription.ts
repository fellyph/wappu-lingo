import type { TranscribeResponse } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class TranscriptionError extends Error {
  constructor(
    message: string,
    public code: 'PERMISSION_DENIED' | 'FILE_TOO_LARGE' | 'UNSUPPORTED_FORMAT' | 'NETWORK_ERROR' | 'TRANSCRIPTION_FAILED'
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

/**
 * Convert a Blob to a base64 string (data portion only, without the prefix)
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read audio data'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Check if a mime type is supported (handles codec suffixes)
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
  // The server will do final validation
  if (blob.type && !isSupportedAudioType(blob.type)) {
    throw new TranscriptionError(
      `Unsupported audio format: ${blob.type}. Supported formats: WAV, MP3, WebM, MP4, OGG, FLAC.`,
      'UNSUPPORTED_FORMAT'
    );
  }
}

/**
 * Transcribe audio using the backend API
 */
export async function transcribeAudio(
  audioBlob: Blob,
  mimeType: string,
  targetLocale?: string
): Promise<string> {
  // Validate before processing
  validateAudioFile(audioBlob);

  // Convert to base64
  const base64Audio = await blobToBase64(audioBlob);

  try {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio: base64Audio,
        mimeType,
        targetLocale,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: string };
      const errorMessage = errorData.error || 'Transcription failed';
      throw new TranscriptionError(errorMessage, 'TRANSCRIPTION_FAILED');
    }

    const data = (await response.json()) as TranscribeResponse;
    return data.transcription;
  } catch (error) {
    if (error instanceof TranscriptionError) {
      throw error;
    }

    // Network or other errors
    throw new TranscriptionError(
      'Connection error. Please check your internet and try again.',
      'NETWORK_ERROR'
    );
  }
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
