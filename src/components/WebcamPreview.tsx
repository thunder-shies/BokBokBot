import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

interface PersonDetectionResponse {
  detected: boolean;
  count: number;
  confidence: number;
}

export const WebcamPreview: React.FC = () => {
  const webcamRef = useRef<Webcam | null>(null);
  const [detection, setDetection] = useState<PersonDetectionResponse>({
    detected: false,
    count: 0,
    confidence: 0,
  });
  const [visionError, setVisionError] = useState(false);
  const isRequestInFlightRef = useRef(false);

  useEffect(() => {
    let isUnmounted = false;

    const detectPeople = async () => {
      if (isRequestInFlightRef.current || !webcamRef.current) {
        return;
      }

      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) {
        return;
      }

      isRequestInFlightRef.current = true;
      try {
        const blob = await fetch(screenshot).then((res) => res.blob());
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');

        const response = await fetch('/api/vision/detect-person', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Vision API returned ${response.status}`);
        }

        const payload = (await response.json()) as PersonDetectionResponse;
        if (!isUnmounted) {
          setDetection(payload);
          setVisionError(false);
        }
      } catch (error) {
        console.error('Vision detection error:', error);
        if (!isUnmounted) {
          setVisionError(true);
        }
      } finally {
        isRequestInFlightRef.current = false;
      }
    };

    detectPeople();
    const timer = window.setInterval(detectPeople, 1200);

    return () => {
      isUnmounted = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="relative w-full aspect-video border border-white/20 bg-black overflow-hidden group">
      <Webcam
        ref={webcamRef}
        audio={false}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        videoConstraints={{
          facingMode: "user",
        }}
        mirrored={true}
        screenshotFormat="image/webp"
      />
      
      {/* HUD Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-white/60">Rec: Active</span>
        </div>
        
        <div className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-white/60">
          {visionError
            ? 'Vision_API: Offline'
            : detection.detected
              ? `People: ${detection.count}`
              : 'People: 0'}
        </div>

        <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-widest text-white/60">
          Confidence: {Math.round(detection.confidence * 100)}%
        </div>

        {/* Corner Brackets */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/40" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/40" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/40" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/40" />
        
        {/* Scanning Line */}
        <div className="absolute inset-x-0 h-[1px] bg-white/20 animate-[scan_4s_linear_infinite]" />
      </div>
    </div>
  );
};
