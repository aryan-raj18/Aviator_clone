import React, { useEffect, useRef } from 'react';
import { GameStatus } from '../hooks/useGameLoop';

interface FlightCanvasProps {
  status: GameStatus;
  multiplier: number;
  countdown: number;
  elapsedMs: number;
  crashPoint?: number;
}

export function FlightCanvas(props: FlightCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[] = [];
    let smokeTrail: { x: number; y: number; life: number; maxLife: number }[] = [];
    let stars: { x: number; y: number; size: number; speed: number; opacity: number; twinkleSpeed: number }[] = [];
    
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random(),
        twinkleSpeed: Math.random() * 0.05 + 0.01
      });
    }

    let shakeEndTime = 0;
    let crashFlashOpacity = 0;
    let lastStatus = propsRef.current.status;

    const draw = () => {
      const { status, multiplier, countdown, elapsedMs, crashPoint } = propsRef.current;
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#0a0e27');
      bgGradient.addColorStop(1, '#060914');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const now = Date.now();

      if (status === 'CRASHED' && lastStatus !== 'CRASHED') {
        shakeEndTime = now + 600;
        crashFlashOpacity = 0.4;
        lastStatus = status;
      } else if (status !== 'CRASHED') {
        lastStatus = status;
      }

      ctx.save();

      if (status === 'CRASHED' && now < shakeEndTime) {
        const dx = (Math.random() - 0.5) * 20;
        const dy = (Math.random() - 0.5) * 20;
        ctx.translate(dx, dy);
      }

      const paddingLeft = 60;
      const paddingBottom = 40;
      const graphWidth = width - paddingLeft - 50;
      const graphHeight = height - paddingBottom - 50;

      if (status === 'WAITING' || (status === 'CRASHED' && now > shakeEndTime + 600)) {
        stars.forEach(star => {
          star.x -= star.speed;
          if (star.x < 0) star.x = width;
          if (star.x > width) star.x = width;
          if (star.y > height) star.y = height;
          
          star.opacity += star.twinkleSpeed;
          if (star.opacity > 1 || star.opacity < 0.2) star.twinkleSpeed *= -1;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(star.opacity)})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        });

        if (status === 'WAITING') {
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.font = 'bold 36px "Space Mono", monospace';
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(255,255,255,0.5)';
          ctx.fillText('Waiting for next round', width / 2, height / 2 - 40);
          
          ctx.font = 'bold 64px "Space Mono", monospace';
          const countdownText = countdown.toFixed(1);
          const scale = 1 + Math.sin(now * 0.01) * 0.02;
          ctx.save();
          ctx.translate(width / 2, height / 2 + 40);
          ctx.scale(scale, scale);
          
          ctx.fillStyle = '#ff3b5c';
          ctx.shadowColor = 'rgba(255, 59, 92, 0.8)';
          ctx.shadowBlur = 20;
          ctx.fillText(countdownText, 0, 0);
          ctx.restore();

          ctx.save();
          ctx.translate(paddingLeft, height - paddingBottom);
          drawPlane(ctx);
          ctx.restore();
          
          particles = [];
          smokeTrail = [];
        }
      }

      if (status === 'FLYING' || status === 'CRASHED') {
        const isCrashed = status === 'CRASHED';
        
        const maxTime = Math.max(10, elapsedMs / 1000 * 1.2);
        const maxMult = Math.max(2, multiplier * 1.2);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px "Space Mono", monospace';
        ctx.textAlign = 'right';
        ctx.shadowBlur = 0;
        const ySteps = [1, 2, 5, 10, 50, 100, 500, 1000];
        ySteps.forEach(step => {
          if (step <= maxMult * 1.5) {
            const y = (height - paddingBottom) - ((step - 1) / (maxMult - 1)) * graphHeight;
            if (y > 20 && y < height - paddingBottom) {
              ctx.fillText(`${step}x`, paddingLeft - 10, y + 5);
              ctx.strokeStyle = 'rgba(255,255,255,0.05)';
              ctx.beginPath();
              ctx.moveTo(paddingLeft, y);
              ctx.lineTo(width, y);
              ctx.stroke();
            }
          }
        });

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, height - paddingBottom);
        ctx.lineTo(width, height - paddingBottom);
        ctx.moveTo(paddingLeft, height - paddingBottom);
        ctx.lineTo(paddingLeft, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(paddingLeft, height - paddingBottom);
        
        const numPoints = 150;
        let lastX = paddingLeft;
        let lastY = height - paddingBottom;
        
        const currentTotalSeconds = elapsedMs / 1000;
        
        for (let i = 0; i <= numPoints; i++) {
          const t = (currentTotalSeconds * i) / numPoints;
          const m = Math.exp(0.00006 * t * 1000);
          
          const x = paddingLeft + (t / maxTime) * graphWidth;
          const y = (height - paddingBottom) - ((m - 1) / (maxMult - 1)) * graphHeight;
          
          ctx.lineTo(x, y);
          lastX = x;
          lastY = y;
        }

        ctx.strokeStyle = isCrashed ? '#ef4444' : '#ff3b5c';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 20;
        ctx.shadowColor = isCrashed ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 50, 80, 0.6)';
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.lineTo(lastX, height - paddingBottom);
        ctx.lineTo(paddingLeft, height - paddingBottom);
        const gradient = ctx.createLinearGradient(0, height - graphHeight, 0, height - paddingBottom);
        if (isCrashed) {
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else {
          gradient.addColorStop(0, 'rgba(255, 59, 92, 0.15)');
          gradient.addColorStop(1, 'rgba(255, 59, 92, 0)');
        }
        ctx.fillStyle = gradient;
        ctx.fill();

        if (!isCrashed && Math.random() > 0.5) {
          smokeTrail.push({
            x: lastX - 10,
            y: lastY + 5,
            life: 0,
            maxLife: 60
          });
          if (smokeTrail.length > 200) smokeTrail.shift();
        }

        smokeTrail.forEach((smoke) => {
          smoke.life++;
          const alpha = 1 - (smoke.life / smoke.maxLife);
          ctx.fillStyle = `rgba(200, 200, 200, ${alpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(smoke.x, smoke.y, 2 + (smoke.life * 0.05), 0, Math.PI * 2);
          ctx.fill();
        });

        if (!isCrashed) {
          const prevT = (currentTotalSeconds * (numPoints - 2)) / numPoints;
          const prevM = Math.exp(0.00006 * prevT * 1000);
          const prevX = paddingLeft + (prevT / maxTime) * graphWidth;
          const prevY = (height - paddingBottom) - ((prevM - 1) / (maxMult - 1)) * graphHeight;
          const angle = Math.atan2(lastY - prevY, lastX - prevX);

          ctx.save();
          ctx.translate(lastX, lastY);
          ctx.rotate(angle);
          
          const flameScale = 0.8 + Math.random() * 0.4;
          ctx.fillStyle = 'rgba(255, 150, 0, 0.8)';
          ctx.beginPath();
          ctx.ellipse(-25, 0, 15 * flameScale, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
          ctx.beginPath();
          ctx.ellipse(-20, 0, 8 * flameScale, 2, 0, 0, Math.PI * 2);
          ctx.fill();

          drawPlane(ctx);
          ctx.restore();

        } else {
          if (particles.length === 0) {
            for (let i = 0; i < 70; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 15;
              const colors = ['#ff3b5c', '#f97316', '#eab308', '#ef4444', '#ffffff'];
              particles.push({
                x: lastX,
                y: lastY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: 30 + Math.random() * 40,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 4 + 1
              });
            }
          }

          particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life++;
            const alpha = 1 - (p.life / p.maxLife);
            if (alpha > 0) {
              ctx.fillStyle = p.color;
              ctx.globalAlpha = alpha;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1.0;
            }
          });
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isCrashed) {
          ctx.font = 'bold 72px "Space Mono", monospace';
          ctx.fillStyle = '#ef4444';
          ctx.shadowBlur = 40;
          ctx.shadowColor = 'rgba(255, 50, 80, 0.9)';
          ctx.fillText(`FLEW AWAY! ${crashPoint?.toFixed(2) || multiplier.toFixed(2)}x`, width / 2, height / 2);
        } else {
          const scale = 1 + Math.sin(now * 0.012) * 0.03;
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.scale(scale, scale);
          
          ctx.font = 'bold 96px "Space Mono", monospace';
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 30;
          ctx.shadowColor = 'rgba(0, 255, 100, 0.8)';
          ctx.fillText(`${multiplier.toFixed(2)}x`, 0, 0);
          ctx.restore();
        }
      }

      ctx.restore();

      if (crashFlashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${crashFlashOpacity})`;
        ctx.fillRect(0, 0, width, height);
        crashFlashOpacity -= 0.015;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
        canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

function drawPlane(ctx: CanvasRenderingContext2D) {
  ctx.shadowBlur = 25;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.quadraticCurveTo(10, -5, -15, -4);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-15, 4);
  ctx.quadraticCurveTo(10, 5, 20, 0);
  ctx.fill();

  ctx.fillStyle = '#ff3b5c';
  ctx.beginPath();
  ctx.moveTo(5, -3);
  ctx.lineTo(-10, -15);
  ctx.lineTo(-15, -15);
  ctx.lineTo(-5, -3);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(5, 3);
  ctx.lineTo(-10, 15);
  ctx.lineTo(-15, 15);
  ctx.lineTo(-5, 3);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-15, -2);
  ctx.lineTo(-22, -8);
  ctx.lineTo(-25, -8);
  ctx.lineTo(-20, -2);
  ctx.fill();

  ctx.fillStyle = '#0a0e27';
  ctx.beginPath();
  ctx.ellipse(10, -1, 3, 1.5, Math.PI / 8, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.shadowBlur = 0;
}