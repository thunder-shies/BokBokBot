import React, { useEffect, useRef } from 'react';

interface VisualBackgroundProps {
  intensity: number; // 0 to 1
}

export const VisualBackground: React.FC<VisualBackgroundProps> = ({ intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      time += 0.01 + intensity * 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines that distort with intensity
      const gridSize = 50;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + intensity * 0.1})`;
      ctx.lineWidth = 1;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y < canvas.height; y += 5) {
          const offset = Math.sin(y * 0.01 + time) * (intensity * 20);
          if (y === 0) ctx.moveTo(x + offset, y);
          else ctx.lineTo(x + offset, y);
        }
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x += 5) {
          const offset = Math.cos(x * 0.01 + time) * (intensity * 20);
          if (x === 0) ctx.moveTo(x, y + offset);
          else ctx.lineTo(x, y + offset);
        }
        ctx.stroke();
      }

      // Random "glitch" lines
      if (Math.random() < intensity * 0.2) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        const ry = Math.random() * canvas.height;
        ctx.moveTo(0, ry);
        ctx.lineTo(canvas.width, ry + (Math.random() - 0.5) * 100);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-50"
    />
  );
};
