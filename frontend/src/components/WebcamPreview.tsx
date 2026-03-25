import { useEffect, useRef, type FC } from 'react';

const WebcamPreview: FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // 請求訪問攝像頭
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('無法訪問攝像頭:', error);
      }
    };

    startWebcam();

    return () => {
      // 清理：停止所有視頻軌道
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

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

        <div className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-white/60">
          Face_ID: Detected
        </div>

        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/40" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/40" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/40" />

        <div className="absolute inset-x-0 h-px bg-white/20 animate-[scanLineMove_4s_linear_infinite]" />
      </div>

      {!navigator.mediaDevices && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-white/60 bg-black/70">
          Camera API unavailable
        </div>
      )}
    </div>
  );
};

export default WebcamPreview;
