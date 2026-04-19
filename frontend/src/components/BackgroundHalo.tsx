import React, { useEffect } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';

export const BackgroundHalo: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth position tracking
  const springConfig = { damping: 40, stiffness: 120 };
  const haloX = useSpring(mouseX, springConfig);
  const haloY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Extended trigger zones
  const leftOpacity = useTransform(mouseX, [0, 500], [0.6, 0]);
  const rightOpacity = useTransform(mouseX, [window.innerWidth - 500, window.innerWidth], [0, 0.6]);
  const topOpacity = useTransform(mouseY, [0, 500], [0.6, 0]);
  const bottomOpacity = useTransform(mouseY, [window.innerHeight - 500, window.innerHeight], [0, 0.6]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background font-sans">
      
      {/* CENTRAL BREATHING HALO */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-[900px] h-[900px] bg-primary/5 blur-[140px] rounded-full"
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
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* LEFT EDGE LIGHT */}
      <motion.div
        className="absolute left-0 top-0 w-[350px] h-[600px] bg-primary/40 blur-[110px] rounded-full"
        style={{
          y: haloY,
          translateY: '-50%',
          translateX: '-60%',
          scaleX: 0.5,
          scaleY: 1.2,
          opacity: leftOpacity
        }}
      />

      {/* RIGHT EDGE LIGHT */}
      <motion.div
        className="absolute right-0 top-0 w-[350px] h-[600px] bg-primary/40 blur-[110px] rounded-full"
        style={{
          y: haloY,
          translateY: '-50%',
          translateX: '60%',
          scaleX: 0.5,
          scaleY: 1.2,
          opacity: rightOpacity
        }}
      />

      {/* TOP EDGE LIGHT */}
      <motion.div
        className="absolute left-0 top-0 w-[600px] h-[350px] bg-primary/40 blur-[110px] rounded-full"
        style={{
          x: haloX,
          translateX: '-50%',
          translateY: '-60%',
          scaleX: 1.2,
          scaleY: 0.5,
          opacity: topOpacity
        }}
      />

      {/* BOTTOM EDGE LIGHT */}
      <motion.div
        className="absolute left-0 bottom-0 w-[600px] h-[350px] bg-primary/40 blur-[110px] rounded-full"
        style={{
          x: haloX,
          translateX: '-50%',
          translateY: '60%',
          scaleX: 1.2,
          scaleY: 0.5,
          opacity: bottomOpacity
        }}
      />

      {/* Static texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
