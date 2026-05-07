import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export const ProjectionWindow: React.FC = () => {
  const [currentCC, setCurrentCC] = useState<{ text: string; role: 'user' | 'ai' } | null>(null);

  useEffect(() => {
    console.log('[ProjectionWindow] Initialized and listening for messages');
    
    const handleMessage = (event: MessageEvent) => {
      console.log('[ProjectionWindow] Received message:', event.data);
      
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) {
        console.warn('[ProjectionWindow] Message rejected - wrong origin:', event.origin);
        return;
      }

      if (event.data.type === 'UPDATE_CAPTION') {
        console.log('[ProjectionWindow] Updating caption:', event.data.text);
        setCurrentCC({
          text: event.data.text,
          role: event.data.role,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="w-full h-screen bg-black text-white font-mono overflow-hidden flex flex-col">
      {/* Robot Video Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
        <img
          src="src/assets/images/ChatGPT Image 2026-5-8 01_58_57__edited.png"
          alt="Robot Staring"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover brightness-75 contrast-110"
        />
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      </div>

      {/* Header Label */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold">Projection_Display // BokBok_Bot</span>
      </div>

      {/* CC Subtitles Area - Bottom Aligned */}
      <div className="relative z-30 flex h-full items-end justify-center px-8 pb-8">
        <AnimatePresence mode="wait">
          {currentCC ? (
            <motion.div
              key={currentCC.text}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center gap-4"
            >
              <div
                className={`bg-black/80 backdrop-blur-md px-6 py-4 text-center text-xl md:text-2xl font-bold tracking-tight rounded-sm max-w-2xl border-x shadow-2xl ${
                  currentCC.role === 'user'
                    ? 'border-white/40 text-white/90'
                    : 'border-white/5 text-white'
                }`}
                style={{
                  textShadow: '0 0 20px rgba(255,255,255,0.1)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {currentCC.role === 'user' && (
                  <span className="text-[8px] uppercase tracking-[0.4em] block mb-1 text-white/30">User_Input //</span>
                )}
                {currentCC.text}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
