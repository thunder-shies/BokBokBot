import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chibiTopics, useLanguage } from '../i18n';

interface Chibi {
  id: number;
  emoji: string;
  x: number;
  direction: number; // 1 for right, -1 for left
  message?: string;
  messageExpiry?: number; // Unix timestamp used to track individual message lifecycles safely
}

const EMOJIS = ['🏃', '🚶', '🏃‍♂️', '🚶‍♀️', '💃', '🕺', '🕴️'];

export const WalkingChibis: React.FC = () => {
  const { locale } = useLanguage();
  const [chibis, setChibis] = useState<Chibi[]>([]);
  const topics = useMemo(() => [...chibiTopics[locale]], [locale]);

  useEffect(() => {
    // 1. Instantiating the initial set of walking entities
    const initialChibis = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x: Math.random() * 100,
      direction: Math.random() > 0.5 ? 1 : -1,
    }));
    setChibis(initialChibis);

    // 2. High-frequency 100ms clock controlling step updates and evaluating speech expirations
    const moveInterval = setInterval(() => {
      const currentTime = Date.now();
      
      setChibis(prev => prev.map(chibi => {
        let newX = chibi.x + (chibi.direction * 0.4); // Reverted step velocity to original 0.4
        let newDirection = chibi.direction;

        // Wall collision constraints
        if (newX > 99) {
          newX = 99;
          newDirection = -1;
        } else if (newX < 1) {
          newX = 1;
          newDirection = 1;
        }

        // 3% probability to spontaneously flip directions mid-route (original logic)
        if (Math.random() < 0.03) {
          newDirection *= -1;
        }

        // Atomic check: Is the message lifespan exceeded?
        const isExpired = chibi.messageExpiry ? currentTime > chibi.messageExpiry : false;

        return { 
          ...chibi, 
          x: newX, 
          direction: newDirection,
          message: isExpired ? undefined : chibi.message,
          messageExpiry: isExpired ? undefined : chibi.messageExpiry
        };
      }));
    }, 100);

    // 3. Low-frequency 5000ms loop picking a random entity to deliver a speech event
    const speechInterval = setInterval(() => {
      setChibis(prev => {
        if (prev.length === 0) return prev;
        
        const randomIndex = Math.floor(Math.random() * prev.length);
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        
        return prev.map((chibi, idx) => {
          if (idx === randomIndex) {
            return { 
              ...chibi, 
              message: randomTopic,
              messageExpiry: Date.now() + 3000 // Configured to match the original 3-second display length
            };
          }
          return chibi;
        });
      });
    }, 5000);

    // 4. Thread termination on component disposal
    return () => {
      clearInterval(moveInterval);
      clearInterval(speechInterval);
    };
  }, [topics]);

  return (
    // Viewport canvas pinned strictly above your layout's chat system boundaries
    <div className="absolute bottom-full left-0 w-full pointer-events-none z-50 overflow-visible">
      {chibis.map(chibi => (
        <motion.div
          key={chibi.id}
          className="absolute bottom-0 flex flex-col items-center"
          animate={{ left: `${chibi.x}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        >
          <AnimatePresence>
            {chibi.message && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                // 💎 Reverted precisely to your original design specs:
                // Solid white backdrop, stark contrast black borders, micro-borders, and high-depth shadows
                className="mb-3 px-4 py-2 bg-white text-sm font-bold text-black rounded-md border-x border-black/20 shadow-xl whitespace-nowrap relative after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-white"
              >
                {chibi.message}
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            animate={{ scaleX: chibi.direction }}
            transition={{ duration: 0.1 }}
            className="text-4xl"
          >
            {chibi.emoji}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
};