import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PastPapersSection: React.FC = () => {

  return (
    <section
      id="past-papers"
      className="relative min-h-screen bg-[#39393B] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#39393B]/70 via-[#39393B]/78 to-[#39393B]"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-[clamp(1.65rem,8.8vw,3.75rem)] md:text-6xl font-bold tracking-[0.04em] sm:tracking-[0.1em] md:tracking-[0.2em] text-white mb-8 text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Link
                to="/pastpapers"
                className="inline-flex items-center gap-0 hover:text-zinc-300 transition-colors"
              >
                <span>Past Papers</span>
              </Link>
            </motion.div>
          </h2>
          <div className="w-full max-w-[14rem] md:max-w-[18rem] lg:max-w-[22rem] h-px bg-zinc-400 mx-auto mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="text-center">
              <Link
                to="/pastpapers"
                className="text-3xl md:text-4xl font-bold text-white mb-2 inline-block hover:text-zinc-300 transition-colors"
              >
                20+
              </Link>
              <div className="text-zinc-400 tracking-wide">YEARS</div>
            </div>
            <div className="text-center">
              <Link
                to="/pastpapers"
                className="text-3xl md:text-4xl font-bold text-white mb-2 inline-block hover:text-zinc-300 transition-colors"
              >
                50+
              </Link>
              <div className="text-zinc-400 tracking-wide">PAPERS</div>
            </div>
          </div>

          <div className="space-y-6 text-lg md:text-xl leading-relaxed text-zinc-300 font-light tracking-wide max-w-3xl mx-auto">
            <p>An archive of Sixth Term Examination Papers (STEP) from the past two decades.</p>
            <p>
              <Link
                to="/pastpapers"
                className="themed-click-here inline-block text-amber-300 font-semibold underline underline-offset-4 transition-colors hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300/70 rounded-sm"
              >
                Click here
              </Link>{' '}
              to explore full question papers and combination of mine and public solutions.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PastPapersSection;
