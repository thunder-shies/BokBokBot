import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Settings, Maximize, Volume2, VolumeX, Pause, Captions, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface ChatInterfaceProps {
  onSendMessage: (msg: string) => void;
  messages: Message[];
  isTyping: boolean;
  broadcastCaption?: (text: string, role: 'user' | 'ai') => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtorLike = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtorLike;
    webkitSpeechRecognition?: SpeechRecognitionCtorLike;
  }
}

const MAX_INPUT_LENGTH = 100;

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, messages, isTyping, broadcastCaption }) => {
  const [input, setInput] = useState('');
  const [currentCC, setCurrentCC] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [showVolumeMuted, setShowVolumeMuted] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenAiCountRef = useRef<number>(0);
  const volumeResetTimerRef = useRef<number | null>(null);
  const ccClearTimerRef = useRef<number | null>(null);
  const isOverLimit = input.length > MAX_INPUT_LENGTH;

  const scheduleCcClear = (delayMs: number) => {
    if (ccClearTimerRef.current !== null) {
      window.clearTimeout(ccClearTimerRef.current);
    }

    ccClearTimerRef.current = window.setTimeout(() => {
      setCurrentCC(null);
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

    const recognition = new SpeechRecognitionApi();
    recognition.lang = 'zh-HK';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript ?? '';
      }
      setInput(transcript.trimStart());
    };

    recognitionRef.current = recognition;
    setIsSpeechSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isTyping || !isListening || !recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);
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
    }
  }, [messages, broadcastCaption]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverLimit) return;
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current || !isSpeechSupported || isTyping) return;

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    recognitionRef.current.start();
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
      const utterance = new SpeechSynthesisUtterance(nextText);
      utterance.lang = 'zh-HK';
      utterance.rate = 2;
      utterance.onend = () => {
        // Keep subtitles briefly after speech ends for readability.
        scheduleCcClear(2500);
      };
      utterance.onerror = () => {
        scheduleCcClear(2500);
      };
      window.speechSynthesis.speak(utterance);
      lastSpokenAiCountRef.current = aiMessageCount;
      return;
    }

    // If TTS is unavailable, still auto-hide the CC after a short delay.
    scheduleCcClear(3500);
    lastSpokenAiCountRef.current = aiMessageCount;
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (volumeResetTimerRef.current !== null) {
        window.clearTimeout(volumeResetTimerRef.current);
      }
      if (ccClearTimerRef.current !== null) {
        window.clearTimeout(ccClearTimerRef.current);
      }
      handleStopTts();
    };
  }, []);

  return (
    <div className="flex flex-col h-full border border-white/10 bg-black relative group overflow-hidden">
      {/* Robot Video Background (Simulated) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
        <img 
          src="src/assets/images/ChatGPT Image 2026-5-8 01_58_57__edited.png" 
          alt="Robot Staring"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover brightness-75 contrast-110"
        />
        {/* CRT Scanline Overlay specifically for video area */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      </div>

      {/* Video Overlay UI */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <Terminal size={14} className="text-white/60" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Live_Feed // BokBok_Bot</span>
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
                  <span className="text-[8px] uppercase tracking-[0.4em] block mb-1 text-white/30">User_Input //</span>
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
                  <span className="text-xs uppercase tracking-[0.2em] font-bold text-white/80">BokBok 正在處理 //</span>
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
                title="Stop TTS"
              >
                {showVolumeMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="bg-black/40 px-3 py-1 rounded-full flex items-center gap-2 border border-white/5 whitespace-nowrap">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                <span className="text-sm font-bold tracking-wider">直播中</span>
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
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Start yapping..."}
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
                    <span>發佈</span>
                    <Send size={16} />
                  </button>
                </form>
              </div>

              {isSpeechSupported && (
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`cursor-pointer p-2 transition-all disabled:cursor-not-allowed ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                      : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                  }`}
                  title={isListening ? '停止錄音' : '語音輸入'}
                  disabled={isTyping}
                >
                  {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
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
