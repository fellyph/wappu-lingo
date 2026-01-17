import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Loader } from 'lucide-react';
import type { AudioInputStatus } from '../types';
import type { ModelLoadingProgress } from '../services/transcription';
import {
  transcribeAudio,
  TranscriptionError,
  getPreferredMimeType,
  preloadWhisperModel,
  setTranscriptionStatusCallback,
  isModelReady,
} from '../services/transcription';

interface AudioInputProps {
  onTranscription: (text: string) => void;
  targetLocale?: string;
  disabled?: boolean;
}

const AudioInput: React.FC<AudioInputProps> = ({
  onTranscription,
  targetLocale,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AudioInputStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [modelProgress, setModelProgress] = useState<ModelLoadingProgress | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Preload the Whisper model on mount
  useEffect(() => {
    // Set up status callback to track loading progress
    setTranscriptionStatusCallback((progress) => {
      setModelProgress(progress);
    });

    // Start preloading the model in background
    preloadWhisperModel().catch((err) => {
      console.warn('Model preload failed:', err);
    });

    // Cleanup
    return () => {
      setTranscriptionStatusCallback(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const processAudio = useCallback(
    async (blob: Blob, mimeType: string) => {
      setStatus('processing');
      setError(null);

      try {
        const transcription = await transcribeAudio(blob, mimeType, targetLocale);
        if (transcription) {
          onTranscription(transcription);
        }
        setStatus('idle');
      } catch (err) {
        setStatus('error');
        if (err instanceof TranscriptionError) {
          switch (err.code) {
            case 'PERMISSION_DENIED':
              setError(t('audio.error_permission'));
              break;
            case 'FILE_TOO_LARGE':
              setError(t('audio.error_size'));
              break;
            case 'UNSUPPORTED_FORMAT':
              setError(t('audio.error_format'));
              break;
            case 'NETWORK_ERROR':
            case 'TRANSCRIPTION_FAILED':
            default:
              setError(t('audio.error_failed'));
          }
        } else {
          setError(t('audio.error_failed'));
        }
      }
    },
    [onTranscription, targetLocale, t]
  );

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMimeType = getPreferredMimeType();

      // Try to create MediaRecorder with preferred mime type, fallback to default
      let recorder: MediaRecorder;
      let actualMimeType: string;

      try {
        recorder = new MediaRecorder(stream, { mimeType: preferredMimeType });
        actualMimeType = preferredMimeType;
      } catch {
        // Fallback: let browser choose the mime type
        recorder = new MediaRecorder(stream);
        actualMimeType = recorder.mimeType || 'audio/webm';
      }

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        // Use the actual mime type from the recorder
        const finalMimeType = mediaRecorderRef.current?.mimeType || actualMimeType;
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        // Extract base mime type without codecs
        const baseMimeType = finalMimeType.split(';')[0] || 'audio/webm';
        processAudio(audioBlob, baseMimeType);
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setStatus('recording');
      setRecordingTime(0);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setStatus('error');
      setError(t('audio.error_permission'));
    }
  }, [processAudio, t]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (status === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  }, [status, startRecording, stopRecording]);

  const handleRetry = () => {
    setStatus('idle');
    setError(null);
  };

  // Determine button state
  const isRecording = status === 'recording';
  const isProcessing = status === 'processing';
  const isModelLoading = modelProgress?.status === 'loading';
  const isDisabled = disabled || isProcessing || (isModelLoading && !isModelReady());

  // Get button label
  const getButtonLabel = () => {
    if (isRecording) return t('audio.stop');
    if (isProcessing) return t('audio.processing');
    if (isModelLoading && !isModelReady()) return modelProgress?.message || t('audio.loading_model');
    return t('audio.record');
  };

  return (
    <div className="audio-input">
      <button
        type="button"
        className={`audio-btn-single ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={toggleRecording}
        disabled={isDisabled}
        aria-label={getButtonLabel()}
      >
        {isProcessing || (isModelLoading && !isModelReady()) ? (
          <Loader className="animate-spin" size={20} />
        ) : (
          <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
        )}
        {isRecording && (
          <span className="recording-time">{formatTime(recordingTime)}</span>
        )}
        {isRecording && <span className="recording-dot" />}
      </button>

      {/* Model loading progress */}
      {isModelLoading && !isModelReady() && modelProgress && (
        <div className="audio-model-loading">
          <div className="audio-model-progress">
            <div
              className="audio-model-progress-fill"
              style={{ width: `${modelProgress.progress}%` }}
            />
          </div>
          <span className="audio-model-message">{modelProgress.message}</span>
        </div>
      )}

      {/* Processing state */}
      {isProcessing && (
        <div className="audio-processing">
          <span>{t('audio.processing')}</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="audio-error">
          <span>{error}</span>
          <button type="button" onClick={handleRetry} className="audio-retry-btn">
            {t('audio.retry')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioInput;
