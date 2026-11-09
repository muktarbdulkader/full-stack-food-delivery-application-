import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VirtualPhoneOverview from './VirtualPhoneOverview';

export const FloatingPhoneWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            y: [0, -6, 0],
            boxShadow: [
              '0 10px 25px -5px rgba(249, 115, 22, 0.3)',
              '0 20px 35px -5px rgba(249, 115, 22, 0.5)',
              '0 10px 25px -5px rgba(249, 115, 22, 0.3)',
            ],
          }}
          transition={{
            y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 text-white rounded-full border-2 border-white/30 shadow-2xl backdrop-blur-md cursor-pointer group"
          title="Open Virtual Smartphone Companion"
        >
          {/* Pulsing Signal Dot */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-white" />
          </span>

          {/* Phone Icon */}
          <span className="text-xl group-hover:rotate-12 transition-transform duration-300">
            📱
          </span>

          {/* Label */}
          <div className="text-left hidden sm:block">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-200 leading-none">
              Live Phone App
            </p>
            <p className="text-xs font-black text-white leading-tight">
              Food &amp; Driver Chat
            </p>
          </div>
        </motion.button>
      </div>

      {/* Pop-up Interactive Modal when user clicks floating phone button */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
            
            {/* Modal Backdrop click to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-2 sm:p-4 scrollbar-none"
            >
              {/* Close Button Bar */}
              <div className="sticky top-0 z-50 flex items-center justify-between p-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 mb-2 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📱</span>
                  <span className="font-display font-black text-sm text-white">
                    FoodHub Smartphone Companion
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition"
                  title="Close Virtual Phone"
                >
                  ✕
                </button>
              </div>

              {/* Render Full Interactive Virtual Phone Component */}
              <VirtualPhoneOverview defaultScreen="chat" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingPhoneWidget;
