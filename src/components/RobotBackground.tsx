import React, { useEffect, useRef, useState } from 'react';

import appearSrc from '../assets/video/bokbokBot_appear.mp4';
import replySrc from '../assets/video/bokbokBot_replyOthers.mp4';
import stareSrc from '../assets/video/bokbokBot_stare.mp4';
import talkSrc from '../assets/video/bokbokBot_talk.mp4';

type Mode = 'reply' | 'stare' | 'talk';

export const RobotBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [mode, setMode] = useState<Mode>('reply');

  const modeRef = useRef<Mode>('reply');
  const detectedRef = useRef<boolean>(false);

  const lastPlayedRef = useRef<
    'appear' | 'reply' | 'stare' | 'talk' | null
  >(null);

  const updateMode = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
  };

  const play = async (
    src: string,
    tag: 'appear' | 'reply' | 'stare' | 'talk'
  ) => {
    const v = videoRef.current;
    if (!v) return;

    try {
      v.pause();

      v.loop = false;

      if (!v.src.includes(src.split('/').pop() || '')) {
        v.src = src;
        v.load();
      }

      lastPlayedRef.current = tag;

      await v.play();

      console.debug('[RobotBackground] playing:', {
        tag,
        mode: modeRef.current,
      });
    } catch (err) {
      console.error('[RobotBackground] play failed:', err);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => {
      console.debug('[RobotBackground] ended:', {
        mode: modeRef.current,
        lastPlayed: lastPlayedRef.current,
      });

      switch (modeRef.current) {
        case 'reply':
          if (lastPlayedRef.current === 'appear') {
            play(replySrc, 'reply');
          } else {
            play(appearSrc, 'appear');
          }
          break;

        case 'stare':
          play(stareSrc, 'stare');
          break;

        case 'talk':
          play(talkSrc, 'talk');
          break;
      }
    };

    v.addEventListener('ended', handleEnded);

    return () => {
      v.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data;

      if (!msg || typeof msg.type !== 'string') return;

      console.debug('[RobotBackground] message:', msg.type);

      // =========================
      // VISION
      // =========================

      if (msg.type === 'VISION') {
        const { detected } = msg.payload || {};

        detectedRef.current = !!detected;

        console.debug('[RobotBackground] detected:', detectedRef.current);

        // talking has highest priority
        if (modeRef.current === 'talk') {
          return;
        }

        if (detectedRef.current) {
          if (modeRef.current !== 'stare') {
            updateMode('stare');
            play(stareSrc, 'stare');
          }
        } else {
          if (modeRef.current !== 'reply') {
            updateMode('reply');
            play(appearSrc, 'appear');
          }
        }

        return;
      }

      // =========================
      // TTS STARTED
      // =========================

      if (msg.type === 'ROBOT_TTS_STARTED') {
        updateMode('talk');

        play(talkSrc, 'talk');

        return;
      }

      // =========================
      // TTS FINISHED
      // =========================

      if (msg.type === 'ROBOT_TTS_FINISHED') {
        if (detectedRef.current) {
          updateMode('stare');
          play(stareSrc, 'stare');
        } else {
          updateMode('reply');
          play(appearSrc, 'appear');
        }

        return;
      }
    };

    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, []);

  // =========================
  // INITIAL STATE
  // =========================

  useEffect(() => {
    const t = window.setTimeout(() => {
      updateMode('reply');
      play(appearSrc, 'appear');
    }, 200);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />

      <video
        ref={videoRef}
        className="w-full h-full object-cover brightness-75 contrast-110"
        playsInline
      />

      <div className="absolute inset-0 pointer-events-none z-20 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  );
};

export default RobotBackground;