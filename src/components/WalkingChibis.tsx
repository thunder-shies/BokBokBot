import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Chibi {
  id: number;
  emoji: string;
  x: number;
  direction: number; // 1 for right, -1 for left
  message?: string;
}

const EMOJIS = ['🏃', '🚶', '🏃‍♂️', '🚶‍♀️', '💃', '🕺', '🕴️'];

const MOCK_TOPICS = [
  "BokBok 咁串得唔得架？",
  "隻驚幾時先玩完？",
  "個 Algorithm 係咪針對我？",
  "今日又係咁 loop...",
  "勁L好聽，日日係咁聽",
  "真係唔好玩，走啦大家",
  "AI 係咪想統治世界？",
  "其實 choom 都幾好聽",
  "想放工...",
  "做緊咩呀？",
  "Lunch 食乜好？",
  "又要返工，好悶呀",
];

export const WalkingChibis: React.FC = () => {
  const [chibis, setChibis] = useState<Chibi[]>([]);

  useEffect(() => {
    // Initial chibis
    const initialChibis = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      x: Math.random() * 100,
      direction: Math.random() > 0.5 ? 1 : -1,
    }));
    setChibis(initialChibis);

    // Walking interval
    const moveInterval = setInterval(() => {
      setChibis(prev => prev.map(chibi => {
        let newX = chibi.x + (chibi.direction * 0.4);
        let newDirection = chibi.direction;

        if (newX > 99) {
          newX = 99;
          newDirection = -1;
        } else if (newX < 1) {
          newX = 1;
          newDirection = 1;
        }

        if (Math.random() < 0.03) {
          newDirection *= -1;
        }

        return { ...chibi, x: newX, direction: newDirection };
      }));
    }, 100);

    // Speech interval
    const speechInterval = setInterval(() => {
      setChibis(prev => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        const randomTopic = MOCK_TOPICS[Math.floor(Math.random() * MOCK_TOPICS.length)];
        
        return prev.map((chibi, idx) => {
          if (idx === randomIndex) {
            return { ...chibi, message: randomTopic };
          }
          return chibi;
        });
      });

      // Clear the message after 3 seconds
      setTimeout(() => {
        setChibis(prev => prev.map(chibi => ({ ...chibi, message: undefined })));
      }, 3000);
    }, 5000);

    return () => {
      clearInterval(moveInterval);
      clearInterval(speechInterval);
    };
  }, []);

  return (
    <div className="absolute bottom-full left-0 w-full pointer-events-none z-50 overflow-visible">
      {chibis.map(chibi => (
        <motion.div
          key={chibi.id}
          className="absolute bottom-0 flex flex-col items-center"
          animate={{ 
            left: `${chibi.x}%`,
          }}
          transition={{ duration: 0.1, ease: "linear" }}
        >
          <AnimatePresence>
            {chibi.message && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
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
