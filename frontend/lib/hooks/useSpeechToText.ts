/**
 * Speech-to-Text Hook using Web Speech API
 *
 * Provides real-time speech recognition for debate games.
 * Uses the browser's built-in Web Speech API for zero-dependency STT.
 *
 * Browser Support:
 * - Chrome: Full support
 * - Edge: Full support
 * - Safari: Partial support (iOS 14.5+)
 * - Firefox: Not supported (falls back to manual input)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

type PermissionState = 'prompt' | 'granted' | 'denied' | 'unknown';

interface SpeechToTextState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  confidence: number;
  permissionState: PermissionState;
}

interface SpeechToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  maxAlternatives?: number;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

// Web Speech API types (not available in all browsers)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInterface;
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechToText(options: SpeechToTextOptions = {}) {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    maxAlternatives = 1,
    onResult,
    onError,
    onEnd,
  } = options;

  const [state, setState] = useState<SpeechToTextState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: false,
    confidence: 0,
    permissionState: 'unknown',
  });

  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const finalTranscriptRef = useRef<string>('');

  // Check microphone permission status
  const checkPermission = useCallback(async () => {
    try {
      // Check if permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setState((prev) => ({ ...prev, permissionState: result.state as PermissionState }));

        // Listen for permission changes
        result.onchange = () => {
          setState((prev) => ({ ...prev, permissionState: result.state as PermissionState }));
        };

        return result.state;
      }
      return 'unknown';
    } catch {
      // Permissions API not supported or microphone not queryable
      return 'unknown';
    }
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      // Request microphone access through getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());

      setState((prev) => ({ ...prev, permissionState: 'granted', error: null }));
      return true;
    } catch (error) {
      const err = error as Error;
      let errorMessage = 'Could not access microphone.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone access was denied.';
        setState((prev) => ({ ...prev, permissionState: 'denied' }));
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No microphone found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Microphone is being used by another application.';
      }

      setState((prev) => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  // Check browser support and permission
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setState((prev) => ({ ...prev, isSupported: true }));

      // Check initial permission state
      checkPermission();

      // Initialize recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;
      recognition.maxAlternatives = maxAlternatives;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcript + ' ';
            finalTranscriptRef.current = finalTranscript;
            onResult?.(transcript, true);
          } else {
            interimTranscript += transcript;
            onResult?.(transcript, false);
          }
        }

        const confidence = event.results[event.results.length - 1]?.[0]?.confidence || 0;

        setState((prev) => ({
          ...prev,
          transcript: finalTranscript.trim(),
          interimTranscript: interimTranscript,
          confidence: Math.round(confidence * 100),
        }));
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let errorMessage = 'Speech recognition error';

        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'No microphone found. Please check your device.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'aborted':
            // User stopped - not an error
            return;
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isListening: false,
        }));
        onError?.(errorMessage);
      };

      recognition.onend = () => {
        setState((prev) => ({ ...prev, isListening: false }));
        onEnd?.();
      };

      recognition.onstart = () => {
        setState((prev) => ({
          ...prev,
          isListening: true,
          error: null,
        }));
      };

      recognitionRef.current = recognition;
    } else {
      setState((prev) => ({
        ...prev,
        isSupported: false,
        error: 'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
      }));
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuous, interimResults, language, maxAlternatives, onResult, onError, onEnd]);

  // Start listening
  const startListening = useCallback(() => {
    if (recognitionRef.current && !state.isListening) {
      // Reset transcript
      finalTranscriptRef.current = '';
      setState((prev) => ({
        ...prev,
        transcript: '',
        interimTranscript: '',
        error: null,
      }));

      try {
        recognitionRef.current.start();
      } catch (error) {
        // Already started - ignore
      }
    }
  }, [state.isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setState((prev) => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
    }));
  }, []);

  // Append to transcript (for manual editing)
  const appendToTranscript = useCallback((text: string) => {
    finalTranscriptRef.current += text;
    setState((prev) => ({
      ...prev,
      transcript: finalTranscriptRef.current.trim(),
    }));
  }, []);

  // Set transcript directly (for manual editing)
  const setTranscript = useCallback((text: string) => {
    finalTranscriptRef.current = text;
    setState((prev) => ({
      ...prev,
      transcript: text,
    }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    appendToTranscript,
    setTranscript,
    requestPermission,
    checkPermission,
  };
}

export default useSpeechToText;
