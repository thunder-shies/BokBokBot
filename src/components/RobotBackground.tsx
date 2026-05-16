import React, { useEffect, useRef, useState } from 'react';
import appearSrc from '../assets/video/bokbokBot_appear.mp4';
import replySrc from '../assets/video/bokbokBot_replyOthers.mp4';
import stareSrc from '../assets/video/bokbokBot_stare.mp4';
import talkSrc from '../assets/video/bokbokBot_talk.mp4';

type Mode = 'hidden' | 'appear' | 'replyLoop' | 'stareLoop' | 'talk';

export const RobotBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectedRef = useRef<boolean>(false);
  const pendingModeRef = useRef<Mode | null>(null);
  const [mode, setMode] = useState<Mode>('hidden');

  const play = async (src: string, loop = false) => {
    const v = videoRef.current;
    if (!v) return;
    v.onended = null;
    v.loop = loop;
    v.muted = true;
    v.src = src;
    try {
      await v.play();
    } catch (e) {
      // autoplay blocked or other error
    }
  };

  const lastPlayedRef = useRef<string | null>(null);
  const loopTypeRef = useRef<'reply' | 'stare' | null>(null);

  const playWithTag = async (src: string, loop = false, tag?: string) => {
    lastPlayedRef.current = tag ?? null;
    if (tag === 'stare') {
      loopTypeRef.current = 'stare';
    } else if (tag === 'reply') {
      loopTypeRef.current = 'reply';
    }
    await play(src, loop);
  };

  // switch to appropriate loop after appear ends
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleEnded = () => {
      // If we're alternating reply loop (appear <-> reply), toggle between them
      if (loopTypeRef.current === 'reply' && !pendingModeRef.current) {
        // If last played was appear, play reply; otherwise play appear.
        if (lastPlayedRef.current === 'appear') {
          setMode('replyLoop');
          // reply should not loop by itself; we'll alternate
          playWithTag(replySrc, false, 'reply');
        } else {
          setMode('replyLoop');
          playWithTag(appearSrc, false, 'appear');
        }
        return;
      }

      if (pendingModeRef.current === 'replyLoop') {
        // first transition after appear -> start reply-appear alternating
        pendingModeRef.current = 'replyLoop';
        setMode('replyLoop');
        loopTypeRef.current = 'reply';
        playWithTag(replySrc, false, 'reply');
      } else if (pendingModeRef.current === 'stareLoop') {
        setMode('stareLoop');
        loopTypeRef.current = 'stare';
        playWithTag(stareSrc, true, 'stare');
      }
      pendingModeRef.current = null;
    };

    v.addEventListener('ended', handleEnded);
    return () => {
      v.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Message handler
  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      const msg = ev.data;
      if (!msg || typeof msg.type !== 'string') return;

      if (msg.type === 'VISION') {
        const { detected } = msg.payload || {};
        const isDetected = !!detected;
        // update stored detection
        detectedRef.current = isDetected;
        // If currently talking, don't change mode until TTS finishes
        if (mode === 'talk') return;

        // If already in the correct loop, do nothing
        if ((isDetected && loopTypeRef.current === 'stare') || (!isDetected && loopTypeRef.current === 'reply')) {
          return;
        }

        // Play appear then chosen loop
        loopTypeRef.current = isDetected ? 'stare' : 'reply';
        pendingModeRef.current = isDetected ? 'stareLoop' : 'replyLoop';
        setMode('appear');
        playWithTag(appearSrc, false, 'appear');
      }

      if (msg.type === 'ROBOT_TTS_STARTED') {
        // Enter talk loop and keep looping until TTS_FINISHED
        pendingModeRef.current = null;
        setMode('talk');
        playWithTag(talkSrc, true, 'talk');
      }

      if (msg.type === 'ROBOT_TTS_FINISHED') {
        // return to appropriate loop based on last detection
        const next = detectedRef.current ? 'stareLoop' : 'replyLoop';
        if (next === 'stareLoop') {
          pendingModeRef.current = 'stareLoop';
          setMode('stareLoop');
          loopTypeRef.current = 'stare';
          playWithTag(stareSrc, true, 'stare');
        } else {
          // start the alternating appear+reply loop
          pendingModeRef.current = 'replyLoop';
          loopTypeRef.current = 'reply';
          setMode('appear');
          playWithTag(appearSrc, false, 'appear');
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [mode]);

  // initial hidden -> assume no people: show appear then reply loop
  useEffect(() => {
    // small delay to allow other listeners to initialize
    const t = window.setTimeout(() => {
      pendingModeRef.current = 'replyLoop';
      loopTypeRef.current = 'reply';
      setMode('appear');
      playWithTag(appearSrc, false, 'appear');
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
        muted
      />
      <div className="absolute inset-0 pointer-events-none z-20 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  );
};

export default RobotBackground;
