import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Settings, Maximize, Volume2, VolumeX, Pause, Captions, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RobotBackground } from './RobotBackground';
import { WalkingChibis } from './WalkingChibis';
import { useLanguage, speechRecognitionLang, speechSynthesisLang, type TranslationKey } from '../i18n';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface ChatInterfaceProps {
  onSendMessage: (msg: string) => void;
  messages: Message[];
  isTyping: boolean;
  broadcastCaption?: (text: string | null, role?: 'user' | 'ai') => void;
  broadcastEvent?: (payload: any) => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

const STT_ERROR_KEYS: Record<string, TranslationKey> = {
  'not-allowed': 'sttErrorNotAllowed',
  'no-speech': 'sttErrorNoSpeech',
  'audio-capture': 'sttErrorAudioCapture',
  network: 'sttErrorNetwork',
};

type SpeechRecognitionCtorLike = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtorLike;
    webkitSpeechRecognition?: SpeechRecognitionCtorLike;
  }
}

const MAX_INPUT_LENGTH = 100;

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, messages, isTyping, broadcastCaption, broadcastEvent }) => {
  const { locale, t } = useLanguage();
  const [input, setInput] = useState('');
  const [currentCC, setCurrentCC] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [sttErrorKey, setSttErrorKey] = useState<TranslationKey | null>(null);
  const [showVolumeMuted, setShowVolumeMuted] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const historicalTranscriptRef = useRef('');
  const wantsListeningRef = useRef(false);
  const hasReceivedSpeechRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sttErrorTimerRef = useRef<number | null>(null);
  const recognitionRestartTimerRef = useRef<number | null>(null);
  const noSpeechWarningTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenAiCountRef = useRef<number>(0);
  const volumeResetTimerRef = useRef<number | null>(null);
  const ccClearTimerRef = useRef<number | null>(null);
  const ttsFinishTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const isOverLimit = input.length > MAX_INPUT_LENGTH;

  const clearTranscriptBuffer = () => {
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    historicalTranscriptRef.current = '';
  };

  const syncInputFromTranscripts = () => {
    const fullText = (
      historicalTranscriptRef.current + 
      finalTranscriptRef.current + 
      interimTranscriptRef.current
    ).trimStart();
    setInput(fullText);
  };

  const commitInterimTranscript = () => {
    if (interimTranscriptRef.current) {
      finalTranscriptRef.current += interimTranscriptRef.current;
      interimTranscriptRef.current = '';
    }
  };

  const clearRecognitionRestartTimer = () => {
    if (recognitionRestartTimerRef.current !== null) {
      window.clearTimeout(recognitionRestartTimerRef.current);
      recognitionRestartTimerRef.current = null;
    }
  };

  const clearNoSpeechWarningTimer = () => {
    if (noSpeechWarningTimerRef.current !== null) {
      window.clearTimeout(noSpeechWarningTimerRef.current);
      noSpeechWarningTimerRef.current = null;
    }
  };

  const scheduleNoSpeechWarning = () => {
    clearNoSpeechWarningTimer();
    noSpeechWarningTimerRef.current = window.setTimeout(() => {
      noSpeechWarningTimerRef.current = null;
      if (wantsListeningRef.current && !hasReceivedSpeechRef.current) {
        showSttError('sttWaitingSpeech');
      }
    }, 6000);
  };

  const releaseMicrophone = () => {
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
  };

  const ensureMicrophoneReady = async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      showSttError('sttErrorAudioCapture');
      return false;
    }

    if (micStreamRef.current?.active) {
      return true;
    }

    releaseMicrophone();

    try {
      micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      showSttError('sttErrorNotAllowed');
      return false;
    }
  };

  const scheduleRecognitionRestart = () => {
    clearRecognitionRestartTimer();
    recognitionRestartTimerRef.current = window.setTimeout(() => {
      recognitionRestartTimerRef.current = null;
      if (!wantsListeningRef.current || !recognitionRef.current) {
        return;
      }

      try {
        recognitionRef.current.start();
      } catch {
        wantsListeningRef.current = false;
        setIsListening(false);
      }
    }, 300);
  };

  const showSttError = (key: TranslationKey | null) => {
    if (sttErrorTimerRef.current !== null) {
      window.clearTimeout(sttErrorTimerRef.current);
      sttErrorTimerRef.current = null;
    }

    setSttErrorKey(key);

    if (key) {
      sttErrorTimerRef.current = window.setTimeout(() => {
        setSttErrorKey(null);
        sttErrorTimerRef.current = null;
      }, 3000);
    }
  };

  const stopListening = (options?: { showNoSpeechError?: boolean }) => {
    const hadSpeech = hasReceivedSpeechRef.current;
    const hasText = Boolean((finalTranscriptRef.current + interimTranscriptRef.current).trim());

    wantsListeningRef.current = false;
    clearRecognitionRestartTimer();
    clearNoSpeechWarningTimer();
    commitInterimTranscript();
    syncInputFromTranscripts();

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsListening(false);
    releaseMicrophone();

    if (options?.showNoSpeechError && !hadSpeech && !hasText) {
      showSttError('sttErrorNoSpeech');
    }
  };

  const scheduleCcClear = (delayMs: number) => {
    if (ccClearTimerRef.current !== null) {
      window.clearTimeout(ccClearTimerRef.current);
    }

    ccClearTimerRef.current = window.setTimeout(() => {
      setCurrentCC(null);
      if (broadcastCaption) {
        broadcastCaption(null);
      }
      ccClearTimerRef.current = null;
    }, delayMs);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      setIsSpeechSupported(false);
      return;
    }

    clearTranscriptBuffer();

    const recognition = new SpeechRecognitionApi();
    recognition.lang = speechRecognitionLang(locale);
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      hasReceivedSpeechRef.current = false;
      setIsListening(true);
      showSttError(null);
      scheduleNoSpeechWarning();
    };

    recognition.onend = () => {
      setIsListening(false);

      if (!wantsListeningRef.current) {
        return;
      }

      commitInterimTranscript();
      historicalTranscriptRef.current += finalTranscriptRef.current;
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
      syncInputFromTranscripts();
      scheduleRecognitionRestart();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === 'aborted') {
        return;
      }

      clearRecognitionRestartTimer();

      // Silence between phrases triggers no-speech often; restart quietly.
      if (event.error === 'no-speech') {
        if (wantsListeningRef.current) {
          scheduleRecognitionRestart();
        }
        return;
      }

      const errorKey = STT_ERROR_KEYS[event.error];
      if (errorKey) {
        showSttError(errorKey);
      }

      wantsListeningRef.current = false;
      setIsListening(false);
      releaseMicrophone();
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const piece = result[0]?.transcript ?? '';

        if (result.isFinal) {
          finalTranscriptRef.current += piece;
        }
      }

      let interim = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result.isFinal) {
          interim += result[0]?.transcript ?? '';
        }
      }
      interimTranscriptRef.current = interim;

      if ((finalTranscriptRef.current + interimTranscriptRef.current).trim()) {
        hasReceivedSpeechRef.current = true;
        clearNoSpeechWarningTimer();
        showSttError(null);
      }

      syncInputFromTranscripts();
    };

    recognitionRef.current = recognition;
    setIsSpeechSupported(true);

    return () => {
      wantsListeningRef.current = false;
      clearRecognitionRestartTimer();
      clearNoSpeechWarningTimer();
      recognition.stop();
      recognitionRef.current = null;
      releaseMicrophone();
    };
  }, [locale]);

  useEffect(() => {
    if (isTyping && isListening) {
      stopListening();
    }
  }, [isTyping, isListening]);
  
  // Show latest message (user or ai) as CC
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      setCurrentCC(lastMessage.text);
      // Broadcast caption to projection window
      if (broadcastCaption) {
        broadcastCaption(lastMessage.text, lastMessage.role);
      }
      if (ccClearTimerRef.current !== null) {
        window.clearTimeout(ccClearTimerRef.current);
        ccClearTimerRef.current = null;
      }
    } else {
      setCurrentCC(null);
      if (broadcastCaption) {
        broadcastCaption(null);
      }
    }
  }, [messages, broadcastCaption]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit) return;
    if (!input.trim()) return;

    if (isListening) {
      stopListening();
    }

    onSendMessage(input.trim());
    clearTranscriptBuffer();
    setInput('');
  };

  const handleToggleListening = async () => {
    if (!recognitionRef.current || !isSpeechSupported || isTyping) return;

    if (isListening) {
      stopListening({ showNoSpeechError: true });
      return;
    }

    const micReady = await ensureMicrophoneReady();
    if (!micReady) {
      return;
    }

    clearTranscriptBuffer();
    setInput('');
    hasReceivedSpeechRef.current = false;
    wantsListeningRef.current = true;
    showSttError(null);

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('already started')) {
        setIsListening(true);
        return;
      }

      wantsListeningRef.current = false;
      releaseMicrophone();
      showSttError('sttErrorAudioCapture');
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (!isListening) {
      historicalTranscriptRef.current = value;
      finalTranscriptRef.current = '';
      interimTranscriptRef.current = '';
    }
  };

  const handleStopTts = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleVolumeClick = () => {
    handleStopTts();
    setShowVolumeMuted(true);

    if (volumeResetTimerRef.current !== null) {
      window.clearTimeout(volumeResetTimerRef.current);
    }

    volumeResetTimerRef.current = window.setTimeout(() => {
      setShowVolumeMuted(false);
      volumeResetTimerRef.current = null;
    }, 2500);
  };

  useEffect(() => {
    if (isTyping || messages.length === 0) {
      return;
    }

    const latestMessage = messages[messages.length - 1];
    if (latestMessage.role !== 'ai') {
      return;
    }

    const aiMessageCount = messages.reduce((count, message) => {
      return message.role === 'ai' ? count + 1 : count;
    }, 0);

    // Speak once for each new AI message, even if the text is identical.
    if (aiMessageCount <= lastSpokenAiCountRef.current) {
      return;
    }

    const nextText = latestMessage.text.trim();
    if (!nextText) {
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(nextText);

      utterance.lang =
        speechSynthesisLang(locale);

      utterance.rate = 2;

      window.postMessage({
        type: 'ROBOT_TTS_STARTED'
      });

      utterance.onend = () => {
        scheduleCcClear(2500);

        window.postMessage({
          type: 'ROBOT_TTS_FINISHED'
        });
      };

      utterance.onerror = () => {
        scheduleCcClear(2500);

        window.postMessage({
          type: 'ROBOT_TTS_FINISHED'
        });
      };

      window.speechSynthesis.speak(utterance);

      lastSpokenAiCountRef.current =
        aiMessageCount;

      return;
    }

    // If TTS is unavailable, still auto-hide the CC after a short delay and notify finish.
    scheduleCcClear(3500);
    lastSpokenAiCountRef.current = aiMessageCount;
  }, [messages, isTyping, locale]);

  

  useEffect(() => {
    return () => {
      if (volumeResetTimerRef.current !== null) {
        window.clearTimeout(volumeResetTimerRef.current);
      }
      if (ccClearTimerRef.current !== null) {
        window.clearTimeout(ccClearTimerRef.current);
      }
      if (ttsFinishTimerRef.current !== null) {
        window.clearTimeout(ttsFinishTimerRef.current);
      }
      if (sttErrorTimerRef.current !== null) {
        window.clearTimeout(sttErrorTimerRef.current);
      }
      clearRecognitionRestartTimer();
      clearNoSpeechWarningTimer();
      wantsListeningRef.current = false;
      releaseMicrophone();
      handleStopTts();
    };
  }, []);

  return (
    <div className="flex flex-col h-full border border-white/10 bg-black relative group overflow-hidden">
      {/* Robot Video Background */}
      <RobotBackground />

      {/* Video Overlay UI */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <Terminal size={14} className="text-white/60" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">{t('liveFeed')}</span>
      </div>


      {/* CC Subtitles Area */}
      <div className="flex-1 relative z-30 flex flex-col justify-end pb-0 px-8">
        <AnimatePresence mode="wait">
          {currentCC ? (
            <motion.div
              key={currentCC}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center gap-4"
            >
              <div 
                className={`bg-black/80 backdrop-blur-md px-6 py-4 text-center text-xl md:text-2xl font-bold tracking-tight rounded-sm max-w-2xl border-x shadow-2xl ${
                  messages[messages.length - 1]?.role === 'user' 
                    ? 'border-white/40 text-white/90' 
                    : 'border-white/5 text-white'
                }`}
                style={{ 
                  textShadow: '0 0 20px rgba(255,255,255,0.1)',
                  fontFamily: 'var(--font-mono)' 
                }}
              >
                {messages[messages.length - 1]?.role === 'user' && (
                  <span className="text-[8px] uppercase tracking-[0.4em] block mb-1 text-white/30">{t('userInput')}</span>
                )}
                {currentCC}
              </div>

              {/* Typing indicator moved below the user's message so it doesn't replace it */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-black/95 px-6 py-3 border border-white/20 flex items-center gap-3 rounded-sm backdrop-blur-xl shadow-2xl"
                >
                  <span className="text-xs uppercase tracking-[0.2em] font-bold text-white/80">{t('processing')}</span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : isTyping ? (
             <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex justify-center"
            >
              <div className="bg-black/90 px-4 py-2 border border-white/10 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Video Player Controls & Bottom Bar */}
      <div className="relative z-40 bg-gradient-to-t from-black via-black/80 to-transparent pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-3">
          
          {/* Progress Bar (Purely Visual) */}
          <div className="h-[2px] bg-white/10 w-full relative mb-1">
            <WalkingChibis />
            <div className="absolute top-0 left-0 h-full bg-red-600 w-full" />
          </div>

          <div className="flex items-center gap-4">
            {/* Left Controls */}
            <div className="flex items-center gap-4 text-white">
              <button className="hover:text-white transition-colors cursor-pointer p-1">
                <Pause size={18} fill="currentColor" />
              </button>
              <button
                className="hover:text-white transition-colors cursor-pointer p-1"
                onClick={handleVolumeClick}
                title={t('stopTts')}
              >
                {showVolumeMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="bg-black/40 px-3 py-1 rounded-full flex items-center gap-2 border border-white/5 whitespace-nowrap">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                <span className="text-sm font-bold tracking-wider">{t('liveBadge')}</span>
              </div>
            </div>

            {/* Input Field Row - Now in the middle */}
            <div className="flex-1 relative flex items-center justify-center gap-2">
              <div className="relative w-2/3 min-w-[280px]">
                <form onSubmit={handleSubmit} className="relative flex items-center group/input">
                  <div className="absolute left-4 text-white/20">
                    <Terminal size={10} />
                  </div>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={isListening ? t('inputListening') : t('inputPlaceholder')}
                    className={`w-full bg-white/5 border py-1.5 pl-4 pr-40 text-sm focus:outline-none transition-all placeholder:text-white/20 backdrop-blur-sm ${
                      isListening ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)] bg-red-500/5' : 'border-white/10 focus:border-white/40 focus:bg-white/10'
                    }`}
                  />
                  <div className={`pointer-events-none absolute right-[5.4rem] top-1/2 -translate-y-1/2 whitespace-nowrap text-right text-xs font-semibold ${isOverLimit ? 'text-red-400' : 'text-white/45'}`}>
                    {input.length} / {MAX_INPUT_LENGTH}
                  </div>
                  <button
                    type="submit"
                    disabled={isTyping || !input.trim() || isOverLimit}
                    className="absolute right-0 top-0 flex h-full items-center gap-1 border-l border-white/20 bg-white/10 px-3 text-sm font-bold text-white whitespace-nowrap transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  >
                    <span>{t('publish')}</span>
                    <Send size={16} />
                  </button>
                </form>
                {sttErrorKey && (
                  <p
                    className={`mt-1 text-center text-[10px] leading-snug ${
                      sttErrorKey === 'sttWaitingSpeech' ? 'text-amber-300' : 'text-red-400'
                    }`}
                  >
                    {t(sttErrorKey)}
                  </p>
                )}
              </div>

              {isSpeechSupported ? (
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`cursor-pointer p-2 transition-all disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                  title={isListening ? t('stopRecording') : t('voiceInput')}
                  disabled={isTyping}
                >
                  {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
              ) : (
                <span className="max-w-[7rem] text-[10px] uppercase leading-tight tracking-wider text-white/40">
                  {t('sttUnsupported')}
                </span>
              )}
            </div>

            {/* Right Controls */}
            <div className="ml-auto flex items-center gap-4 text-white">
              <button className="relative hover:text-white transition-colors cursor-pointer p-1">
                <Captions size={20} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-red-600" />
              </button>
              <button className="relative hover:text-white transition-colors cursor-pointer p-1">
                <Settings size={20} />
                <div className="absolute top-0 -right-1 bg-red-600 text-[8px] font-bold px-0.5 rounded-[1px] leading-tight">HD</div>
              </button>
              <button className="hover:text-white transition-colors cursor-pointer p-1">
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
