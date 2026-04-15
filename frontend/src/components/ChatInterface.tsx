import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSpeech } from '../utils/api';

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface ChatInterfaceProps {
  onSendMessage: (msg: string) => void;
  messages: Message[];
  isTyping: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, messages, isTyping }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenMessageRef = useRef<string>('');

  const SpeechRecognitionImpl = (
    window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
  ).SpeechRecognition || (
    window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
  ).webkitSpeechRecognition;
  const isSpeechRecognitionSupported = Boolean(SpeechRecognitionImpl);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const RecognitionCtor = SpeechRecognitionImpl;
    if (!RecognitionCtor || !isSpeechRecognitionSupported) return;

    const recognition = new RecognitionCtor();
    recognition.lang = 'zh-HK';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() || '';
      if (transcript) {
        setInput(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [SpeechRecognitionImpl, isSpeechRecognitionSupported]);

  useEffect(() => {
    const playLatestAiSpeech = async () => {
      if (isTyping || messages.length === 0) return;

      const latestMessage = messages[messages.length - 1];
      if (latestMessage.role !== 'ai') return;
      if (latestMessage.text === lastSpokenMessageRef.current) return;

      try {
        const audioBlob = await generateSpeech(latestMessage.text);
        const nextUrl = URL.createObjectURL(audioBlob);

        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        const audio = audioRef.current;
        if (audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src);
        }

        audio.pause();
        audio.src = nextUrl;
        await audio.play();
        lastSpokenMessageRef.current = latestMessage.text;
      } catch (error) {
        console.error('TTS playback failed:', error);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(latestMessage.text);
          utterance.lang = 'zh-HK';
          utterance.rate = 1;
          utterance.pitch = 1;
          utterance.volume = 1;
          window.speechSynthesis.speak(utterance);
          lastSpokenMessageRef.current = latestMessage.text;
        }
      }
    };

    playLatestAiSpeech();
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;

      audio.pause();
      if (audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      audioRef.current = null;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognitionRef.current.start();
  };

  const handleStopTts = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="flex flex-col h-full border border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="p-3 border-b border-white/10 flex items-center gap-2 bg-white/5">
        <Terminal size={14} className="text-white/60" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Terminal_Session_01</span>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 text-xs leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-white text-black font-bold' 
                  : 'bg-white/5 border border-white/10 text-white'
              }`}>
                {msg.role === 'ai' && (
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-[9px] uppercase tracking-widest text-white/40">BokBok Bot // Response</div>
                    <button
                      type="button"
                      onClick={handleStopTts}
                      className="inline-flex items-center gap-1 border border-white/20 px-2 py-1 text-[10px] uppercase tracking-widest text-white/60 hover:border-white/40 hover:text-white transition-colors"
                      title="Stop TTS"
                    >
                      Stop
                    </button>
                  </div>
                )}
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 border border-white/10 p-3 text-xs text-white/40 italic">
                Analyzing your mediocrity...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestions */}
      {!input.trim() && messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 bg-white/5 p-4"
        >
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3 font-bold">Try these:</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              '我只信自己的判斷',
              '對方都被洗腦了',
              '我講的才是真理',
              '別人都太天真',
            ].map((suggestion, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInput(suggestion)}
                className="text-xs text-white/60 hover:text-white text-left px-3 py-2 border border-white/20 hover:border-white/40 rounded transition-colors bg-white/5 hover:bg-white/10"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-white/5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Input your pathetic thoughts..."
            className="w-full bg-transparent border-b border-white/20 py-2 pr-20 text-xs focus:outline-none focus:border-white transition-colors placeholder:text-white/20"
          />
          <button
            type="button"
            onClick={handleToggleListening}
            disabled={!isSpeechRecognitionSupported}
            className="absolute right-8 p-2 text-white/40 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={
              isSpeechRecognitionSupported
                ? isListening
                  ? 'Stop voice input'
                  : 'Start voice input'
                : 'Voice input not supported in this browser'
            }
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button 
            type="submit"
            className="absolute right-0 p-2 text-white/40 hover:text-white transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        {!isSpeechRecognitionSupported && (
          <p className="mt-2 text-[10px] uppercase tracking-widest text-white/30">
            Voice input unavailable in this browser.
          </p>
        )}
      </form>
    </div>
  );
};
