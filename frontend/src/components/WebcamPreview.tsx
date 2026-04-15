import { useEffect, useRef, useState, type FC } from 'react';
import { detectPersonInFrame } from '../utils/api';

const WebcamPreview: FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [status, setStatus] = useState<'idle' | 'detecting' | 'detected' | 'not-detected' | 'error'>('idle');
  const [confidence, setConfidence] = useState(0);
  const [personCount, setPersonCount] = useState(0);

  useEffect(() => {
    let detectionTimer: number | null = null;
    let inFlight = false;

    // 請求訪問攝像頭
    const startWebcam = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraAvailable(false);
          setStatus('error');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStatus('detecting');

        const detectNow = async () => {
          const video = videoRef.current;
          if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || inFlight) {
            return;
          }

          inFlight = true;
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 180;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              inFlight = false;
              return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameBlob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.72);
            });

            if (!frameBlob) {
              inFlight = false;
              return;
            }

            const result = await detectPersonInFrame(frameBlob);
            setConfidence(result.confidence || 0);
            setPersonCount(result.count || 0);
            setStatus(result.detected ? 'detected' : 'not-detected');
          } catch (error) {
            console.error('Person detection failed:', error);
            setStatus('error');
          } finally {
            inFlight = false;
          }
        };

        detectionTimer = window.setInterval(detectNow, 1500);
        void detectNow();
      } catch (error) {
        console.error('無法訪問攝像頭:', error);
        setStatus('error');
      }
    };

    void startWebcam();

    return () => {
      if (detectionTimer !== null) {
        window.clearInterval(detectionTimer);
      }

      // 清理：停止所有視頻軌道
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const statusLabel = {
    idle: 'Initializing',
    detecting: 'Scanning',
    detected: 'Person detected',
    'not-detected': 'No person',
    error: 'Detection unavailable',
  }[status];

  const statusColor = {
    idle: 'text-white/60',
    detecting: 'text-cyan-300',
    detected: 'text-lime-300',
    'not-detected': 'text-amber-300',
    error: 'text-red-300',
  }[status];

  return (
    <div className="relative w-full aspect-video border border-white/20 bg-black overflow-hidden group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-80 transition-opacity"
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-white/60">Rec: Active</span>
        </div>

        <div className={`absolute top-4 right-4 text-[10px] uppercase tracking-widest ${statusColor}`}>
          Presence: {statusLabel}
        </div>

        <div className="absolute bottom-4 left-4 text-[10px] uppercase tracking-widest text-white/65">
          Confidence: {(confidence * 100).toFixed(0)}%
        </div>

        <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-widest text-white/65">
          Count: {personCount}
        </div>

        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/40" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/40" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/40" />

        <div className="absolute inset-x-0 h-px bg-white/20 animate-[scanLineMove_4s_linear_infinite]" />
      </div>

      {!cameraAvailable && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-white/60 bg-black/70">
          Camera API unavailable
        </div>
      )}
    </div>
  );
};

export default WebcamPreview;
