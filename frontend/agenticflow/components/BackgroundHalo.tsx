import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

export const BackgroundHalo: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [windowSize, setWindowSize] = useState({ width: 1000, height: 800 });

  // Smooth position tracking
  const springConfig = { damping: 40, stiffness: 120 };
  const haloX = useSpring(mouseX, springConfig);
  const haloY = useSpring(mouseY, springConfig);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  // Extended trigger zones using windowSize state to avoid SSR issues
  const leftOpacity = useTransform(mouseX, [0, 500], [0.6, 0]);
  const rightOpacity = useTransform(mouseX, [windowSize.width - 500, windowSize.width], [0, 0.6]);
  const topOpacity = useTransform(mouseY, [0, 500], [0.6, 0]);
  const bottomOpacity = useTransform(mouseY, [windowSize.height - 500, windowSize.height], [0, 0.6]);

  // Performance Optimization: CSS blur() is very heavy on GPU.
  // Using radial-gradients achieves the same visual effect with 100x better performance.
  const gradientColor = 'rgba(80, 220, 192, 0.15)';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background font-sans">
      
      {/* CENTRAL BREATHING HALO */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-[900px] h-[900px] rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, rgba(80,220,192,0) 70%)`,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* LEFT EDGE LIGHT */}
      <motion.div
        className="absolute left-0 top-0 w-[500px] h-[800px] rounded-full"
        style={{
          y: haloY,
          background: `radial-gradient(circle, rgba(80, 220, 192, 0.25) 0%, rgba(80,220,192,0) 70%)`,
          translateY: '-50%',
          translateX: '-60%',
          scaleX: 0.5,
          scaleY: 1.2,
          opacity: leftOpacity
        }}
      />

      {/* RIGHT EDGE LIGHT */}
      <motion.div
        className="absolute right-0 top-0 w-[500px] h-[800px] rounded-full"
        style={{
          y: haloY,
          background: `radial-gradient(circle, rgba(80, 220, 192, 0.25) 0%, rgba(80,220,192,0) 70%)`,
          translateY: '-50%',
          translateX: '60%',
          scaleX: 0.5,
          scaleY: 1.2,
          opacity: rightOpacity
        }}
      />

      {/* TOP EDGE LIGHT */}
      <motion.div
        className="absolute left-0 top-0 w-[800px] h-[500px] rounded-full"
        style={{
          x: haloX,
          background: `radial-gradient(circle, rgba(80, 220, 192, 0.25) 0%, rgba(80,220,192,0) 70%)`,
          translateX: '-50%',
          translateY: '-60%',
          scaleX: 1.2,
          scaleY: 0.5,
          opacity: topOpacity
        }}
      />

      {/* BOTTOM EDGE LIGHT */}
      <motion.div
        className="absolute left-0 bottom-0 w-[800px] h-[500px] rounded-full"
        style={{
          x: haloX,
          background: `radial-gradient(circle, rgba(80, 220, 192, 0.25) 0%, rgba(80,220,192,0) 70%)`,
          translateX: '-50%',
          translateY: '60%',
          scaleX: 1.2,
          scaleY: 0.5,
          opacity: bottomOpacity
        }}
      />

      {/* Static texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('/noise.svg')]" />
    </div>
  );
};
