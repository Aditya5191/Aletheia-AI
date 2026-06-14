"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const InfiniteMarquee = ({ text }: { text: string }) => {
  const container = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!track.current) return;
    
    // Animate the track moving endlessly to the left
    gsap.to(track.current, {
      xPercent: -50, // Move it exactly half its width
      duration: 40, // Slower: 40 seconds per cycle
      ease: 'none',
      repeat: -1,
    });
  }, { scope: container });

  // Repeat the text 4 times to ensure seamless scrolling
  const repeatedText = Array(4).fill(text).join('\u00A0\u00A0\u00A0•\u00A0\u00A0\u00A0');

  return (
    <div ref={container} className="w-full overflow-hidden bg-primary/5 border-y border-primary/10 py-6 flex whitespace-nowrap">
      <div ref={track} className="flex shrink-0 w-max">
        {/* We output it twice side by side inside the track so when it shifts -50%, it loops seamlessly */}
        <h2 className="text-xl md:text-3xl font-sans font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary opacity-70 px-8 tracking-[0.2em]">
          {repeatedText}
        </h2>
        <h2 className="text-xl md:text-3xl font-sans font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary opacity-70 px-8 tracking-[0.2em]">
          {repeatedText}
        </h2>
      </div>
    </div>
  );
};
