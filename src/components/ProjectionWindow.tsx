import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RobotBackground } from './RobotBackground';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

export const ProjectionWindow: React.FC = () => {
  const [currentCC, setCurrentCC] = useState<{ text: string; role: 'user' | 'ai' } | null>(null);
  const [projectionClosable, setProjectionClosable] = useState<boolean>(true);
  const suppressUntilRef = useRef<number | null>(null);

  useEffect(() => {
    console.log('[ProjectionWindow] Initialized and listening for messages');
    
    const handleMessage = (event: MessageEvent) => {
        console.log('[ProjectionWindow] Received message:', event.data);
        const data = event.data || {};
        if (data.type === 'UPDATE_CAPTION') {
          // Ignore caption updates if we've just received a TTS_FINISHED (short suppression window)
          const now = Date.now();
          if (suppressUntilRef.current && now < suppressUntilRef.current) {
            console.log('[ProjectionWindow] Suppressing caption update due to recent TTS finish');
          } else {
            console.log('[ProjectionWindow] Updating caption:', data.text);
            if (data.text === null || data.text === undefined) {
              setCurrentCC(null);
            } else {
              setCurrentCC({ text: data.text, role: data.role });
            }
          }
        }

        // Clear CC when TTS finishes and suppress immediate caption updates
        if (data.type === 'ROBOT_TTS_FINISHED') {
          console.log('[ProjectionWindow] TTS finished, clearing CC and suppressing new captions');
          setCurrentCC(null);
          // Suppress captions for the next 1s to avoid immediate re-posting
          suppressUntilRef.current = Date.now() + 1000;
          // Clear suppression after timeout
          window.setTimeout(() => {
            suppressUntilRef.current = null;
          }, 1000);
        }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch backend config to determine whether projection can be closed
  useEffect(() => {
    let isCancelled = false;
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        if (!isCancelled && data && typeof data.projection_closable === 'boolean') {
          setProjectionClosable(Boolean(data.projection_closable));
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black text-white font-mono overflow-hidden flex flex-col">
      {/* Robot Video Background */}
      <RobotBackground />

      {/* Close button (if allowed by server config) */}
      {projectionClosable && (
        <button
          onClick={() => window.close()}
          className="absolute top-4 right-4 z-40 bg-black/60 text-white px-3 py-1 rounded-md"
        >
          Close Projection
        </button>
      )}

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
                className={`bg-black/80 backdrop-blur-md px-6 py-4 text-center text-xl md:text-2xl font-bold tracking-tight rounded-sm max-w-5xl border-x shadow-2xl ${
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
