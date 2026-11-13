import React, { useRef, useEffect } from 'react';
import { getScoreLabel } from '../utils/scoreUtils';

const WellnessGauge = ({ score = 0, size = 200, showLabel = true }) => {
  const canvasRef = useRef(null);
  const animatedScore = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.38;
    const lineWidth = size * 0.08;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;

    let frameId;
    const targetScore = Math.min(100, Math.max(0, score));

    const animate = () => {
      const diff = targetScore - animatedScore.current;
      animatedScore.current += diff * 0.08;

      if (Math.abs(diff) < 0.1) {
        animatedScore.current = targetScore;
      }

      ctx.clearRect(0, 0, size, size);

      // background arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = '#000000'; // surface-800
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Determine colors based on score
      const scoreAngle = startAngle + (endAngle - startAngle) * (animatedScore.current / 100);
      const gradient = ctx.createLinearGradient(0, size, size, 0);

      let color1, color2;
      if (animatedScore.current >= 70) {
        color1 = '#39FF14'; // Emerald 500
        color2 = '#34d399'; // Emerald 400
      } else if (animatedScore.current >= 40) {
        color1 = '#f59e0b'; // Amber 500
        color2 = '#fbbf24'; // Amber 400
      } else {
        color1 = '#FF2626'; // Neon Red
        color2 = '#ff4d71'; // Lighter Neon Red
      }

      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, scoreAngle);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // soft glow behind the gauge arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, scoreAngle);
      ctx.strokeStyle = color1 + '40';
      ctx.lineWidth = lineWidth + 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      // score text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${size * 0.18}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(animatedScore.current), centerX, centerY - 5);

      // label text
      if (showLabel) {
        ctx.fillStyle = '#A3A3A3';
        ctx.font = `500 ${size * 0.07}px Inter, sans-serif`;
        ctx.fillText(getScoreLabel(animatedScore.current), centerX, centerY + size * 0.12);
      }

      if (Math.abs(diff) > 0.1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [score, size, showLabel]);

  return (
    <div className="flex items-center justify-center">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default WellnessGauge;
