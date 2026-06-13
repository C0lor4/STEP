import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const FinalSection: React.FC = () => {
  const emojis = ['ヾ(≧▽≦*)o', 'ヾ(⌒▽⌒*)o', 'ヾ(^▽^*)o', 'ヾ(≧◡≦*)o'];
  const [emojiIndex, setEmojiIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % emojis.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  
  return (
    <section id="final-section" className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1D]/90 via-[#1A1A1D]/82 to-[#1A1A1D]/92"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
        >
          <div className="mb-12">
            <div className="px-2 sm:px-0 text-[clamp(1.2rem,7.8vw,4.8rem)] md:text-8xl font-bold tracking-[0.01em] sm:tracking-[0.08em] md:tracking-[0.3em] text-white mb-8 opacity-80 flex flex-nowrap items-baseline justify-center gap-x-2 sm:gap-x-3 text-center whitespace-nowrap">
              <span className="leading-[1.08]">Supporters</span>
              <span className="text-[0.95rem] sm:text-2xl md:text-3xl tracking-[0.02em] sm:tracking-[0.08em] md:tracking-[0.1em] transition-opacity duration-300 inline-block w-auto text-center whitespace-nowrap">
                {emojis[emojiIndex]}
              </span>
            </div>
            <div className="w-1000 h-px bg-zinc-600 mx-auto"></div>
          </div>
          
          <div className="space-y-8 text-lg md:text-xl leading-relaxed text-zinc-300 font-light tracking-wide max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-white font-normal text-2xl md:text-3xl">
              <span>Chris</span>
              <span>&</span>
              <span>Roy</span>
              <span>&</span>
              <span>Sam</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalSection;
