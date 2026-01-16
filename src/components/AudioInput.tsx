import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Square, Upload, Loader } from 'lucide-react';
import type { AudioInputStatus } from '../types';
import {
  transcribeAudio,
  TranscriptionError,
  getPreferredMimeType,
  validateAudioFile,
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Reset input so same file can be selected again
      event.target.value = '';

      setError(null);

      try {
        validateAudioFile(file);
        await processAudio(file, file.type);
      } catch (err) {
        setStatus('error');
        if (err instanceof TranscriptionError) {
          switch (err.code) {
            case 'FILE_TOO_LARGE':
              setError(t('audio.error_size'));
              break;
            case 'UNSUPPORTED_FORMAT':
              setError(t('audio.error_format'));
              break;
            default:
              setError(t('audio.error_failed'));
          }
        } else {
          setError(t('audio.error_failed'));
        }
      }
    },
    [processAudio, t]
  );

  const handleRetry = () => {
    setStatus('idle');
    setError(null);
  };

  const isDisabled = disabled || status === 'processing';

  return (
    <div className="audio-input">
      <div className="audio-input-buttons">
        {status === 'recording' ? (
          <button
            type="button"
            className="audio-btn audio-btn-stop"
            onClick={stopRecording}
            aria-label={t('audio.stop')}
          >
            <Square size={18} />
            <span>{t('audio.stop')}</span>
          </button>
        ) : (
          <button
            type="button"
            className="audio-btn audio-btn-record"
            onClick={startRecording}
            disabled={isDisabled}
            aria-label={t('audio.record')}
          >
            <Mic size={18} />
            <span>{t('audio.record')}</span>
          </button>
        )}

        <button
          type="button"
          className="audio-btn audio-btn-upload"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
          aria-label={t('audio.upload')}
        >
          <Upload size={18} />
          <span>{t('audio.upload')}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/wav,audio/mp3,audio/mpeg,audio/webm,audio/mp4,audio/ogg,audio/flac"
          onChange={handleFileUpload}
          className="audio-file-input"
          aria-hidden="true"
        />
      </div>

      {status === 'recording' && (
        <div className="audio-recording-indicator">
          <span className="audio-recording-dot" />
          <span className="audio-recording-time">{formatTime(recordingTime)}</span>
        </div>
      )}

      {status === 'processing' && (
        <div className="audio-processing">
          <Loader className="animate-spin" size={16} />
          <span>{t('audio.processing')}</span>
        </div>
      )}

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
