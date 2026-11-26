import React, { useEffect, useRef } from 'react';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  rotationY: number;
  rotationYSpeed: number;
  size: number;
  color: string;
  shape: 'rect' | 'circle' | 'star' | 'ribbon';
  opacity: number;
  gravity: number;
  drag: number;
  wobble: number;
  wobbleSpeed: number;
}

interface CelebrationConfettiCanvasProps {
  active: boolean;
  durationMs?: number;
  onComplete?: () => void;
}

const PALETTE = [
  '#f59e0b', // Gold Amber
  '#fbbf24', // Bright Gold
  '#10b981', // Emerald
  '#34d399', // Light Emerald
  '#8b5cf6', // Royal Purple
  '#a855f7', // Vivid Purple
  '#ef4444', // Ruby Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#38bdf8', // Sky Blue
  '#ffffff', // Sparkle White
];

export const CelebrationConfettiCanvas: React.FC<CelebrationConfettiCanvasProps> = ({
  active,
  durationMs = 4500,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
        animFrameId.current = null;
      }
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Initialize particles: dual cannon bursts from bottom-left and bottom-right + top shower
    const w = canvas.width;
    const h = canvas.height;
    const newParticles: ConfettiParticle[] = [];
    const totalParticles = Math.min(180, Math.floor(w / 7));

    // Left cannon (blasts up-right)
    for (let i = 0; i < totalParticles * 0.4; i++) {
      const angle = -Math.PI * 0.25 - (Math.random() * 0.4 - 0.2); // ~45 deg upward right
      const speed = 14 + Math.random() * 16;
      newParticles.push(createParticle(w * 0.1, h * 0.95, Math.cos(angle) * speed, Math.sin(angle) * speed));
    }

    // Right cannon (blasts up-left)
    for (let i = 0; i < totalParticles * 0.4; i++) {
      const angle = -Math.PI * 0.75 - (Math.random() * 0.4 - 0.2); // ~135 deg upward left
      const speed = 14 + Math.random() * 16;
      newParticles.push(createParticle(w * 0.9, h * 0.95, Math.cos(angle) * speed, Math.sin(angle) * speed));
    }

    // Top gentle floating rain shower
    for (let i = 0; i < totalParticles * 0.2; i++) {
      newParticles.push(createParticle(Math.random() * w, -20 - Math.random() * 100, (Math.random() - 0.5) * 4, 3 + Math.random() * 5));
    }

    particlesRef.current = newParticles;
    startTimeRef.current = performance.now();

    function createParticle(x: number, y: number, vx: number, vy: number): ConfettiParticle {
      const shapes: ConfettiParticle['shape'][] = ['rect', 'star', 'circle', 'ribbon'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      return {
        x,
        y,
        vx,
        vy,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        rotationY: Math.random() * Math.PI * 2,
        rotationYSpeed: (Math.random() - 0.5) * 0.25,
        size: shape === 'ribbon' ? 12 + Math.random() * 14 : 7 + Math.random() * 9,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        shape,
        opacity: 1,
        gravity: 0.35 + Math.random() * 0.15,
        drag: 0.985,
        wobble: Math.random() * 10,
        wobbleSpeed: 0.05 + Math.random() * 0.08,
      };
    }

    function drawStar(c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    }

    const render = (time: number) => {
      const elapsed = time - startTimeRef.current;
      const progress = elapsed / durationMs;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (progress >= 1) {
        if (onComplete) onComplete();
        return;
      }

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Apply physics
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx + Math.sin(p.wobble) * 1.5;
        p.y += p.vy;

        p.rotation += p.rotationSpeed;
        p.rotationY += p.rotationYSpeed;
        p.wobble += p.wobbleSpeed;

        // Fade out near end of duration
        if (progress > 0.65) {
          p.opacity = Math.max(0, 1 - (progress - 0.65) / 0.35);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Simulate 3D flip around Y axis
        const scaleY = Math.cos(p.rotationY);
        ctx.scale(1, scaleY);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 5, p.size, p.size * 0.45);
        } else if (p.shape === 'ribbon') {
          ctx.fillRect(-p.size / 2, -3, p.size, 6);
        }

        ctx.restore();
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      window.removeEventListener('resize', updateSize);
    };
  }, [active, durationMs, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-70 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
};
