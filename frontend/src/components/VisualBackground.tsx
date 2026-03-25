import { useEffect, useRef, type FC } from 'react';

interface VisualBackgroundProps {
  intensity: number;
}

const VisualBackground: FC<VisualBackgroundProps> = ({ intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId = 0;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      time += 0.01 + intensity * 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gridSize = 50;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 + intensity * 0.12})`;
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

      if (Math.random() < intensity * 0.25) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        const randomY = Math.random() * canvas.height;
        ctx.moveTo(0, randomY);
        ctx.lineTo(canvas.width, randomY + (Math.random() - 0.5) * 80);
        ctx.stroke();
      }

      frameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-50" />;
};

export default VisualBackground;
