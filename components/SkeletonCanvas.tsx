
import React, { useEffect, useRef } from 'react';

interface SkeletonCanvasProps {
  results: any;
}

const SkeletonCanvas: React.FC<SkeletonCanvasProps> = ({ results }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !results) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.poseLandmarks) {
      // @ts-ignore
      const { drawConnectors, drawLandmarks, POSE_CONNECTIONS } = window;
      
      // Draw skeleton lines
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FFCC',
        lineWidth: 4
      });

      // Draw glowing joints
      drawLandmarks(ctx, results.poseLandmarks, {
        color: '#FF0077',
        lineWidth: 2,
        radius: 4
      });
    }
  }, [results]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      width={1280}
      height={720}
    />
  );
};

export default SkeletonCanvas;
