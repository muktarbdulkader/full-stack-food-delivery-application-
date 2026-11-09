import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

type PhoneScreen = 'ar' | 'dinein' | 'tracking' | 'payment';

export const VirtualPhoneOverview: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<PhoneScreen>('ar');
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [cartCount, setCartCount] = useState<number>(2);
  const [waiterCalled, setWaiterCalled] = useState<boolean>(false);
  const [arRotated, setArRotated] = useState<boolean>(false);

  // Auto rotate screens every 6 seconds unless user manually interacts
  useEffect(() => {
    if (!isAutoPlaying) return;
    const screens: PhoneScreen[] = ['ar', 'dinein', 'tracking', 'payment'];
    const timer = setInterval(() => {
      setActiveScreen((curr) => {
        const nextIdx = (screens.indexOf(curr) + 1) % screens.length;
        return screens[nextIdx];
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const screensInfo: Record<
    PhoneScreen,
    {
      title: string;
      tag: string;
      color: string;
      desc: string;
      icon: string;
    }
  > = {
    ar: {
      title: 'Augmented Reality 3D Food',
      tag: 'World-First Dining AR',
      color: 'from-amber-500 to-orange-500',
      desc: 'Point your phone at the dining table and inspect full 3D photorealistic portions before ordering.',
      icon: '🥽',
    },
    dinein: {
      title: 'QR Code Table Dining & Tabs',
      tag: 'Contactless Table Service',
      color: 'from-violet-500 to-purple-600',
      desc: 'Scan your physical table standee to browse the real-time menu, fire orders to the kitchen, and call waiters.',
      icon: '🪑',
    },
    tracking: {
      title: 'Real-Time Courier GPS Tracking',
      tag: 'Sub-30 Minute Express',
      color: 'from-emerald-500 to-teal-600',
      desc: 'Track your dispatched courier across Addis Ababa with turn-by-turn live bike simulation and accurate ETA.',
      icon: '🛵',
    },
    payment: {
      title: 'Multi-Rail Ethiopian Payments',
      tag: 'Instant Cashless Clearing',
      color: 'from-blue-500 to-cyan-600',
      desc: 'Seamlessly clear dining tabs and delivery orders using Telebirr, CBE Birr, M-Pesa, or POS cash registers.',
      icon: '💳',
    },
  };

  const handleSelectTab = (screen: PhoneScreen) => {
    setIsAutoPlaying(false);
    setActiveScreen(screen);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-[#FFFDF9] pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-orange-100/60">
      {/* Background Decorative Ambient Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-orange-500/15 via-amber-500/10 to-purple-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Top Feature Pill */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-rose-500/20 border border-orange-500/30 backdrop-blur-md shadow-lg shadow-orange-500/10"
          >
            <span className="flex h-2 w-2 rounded-full bg-orange-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider text-orange-300">
              Interactive Digital Dining Experience
            </span>
            <span className="text-xs text-white/50">•</span>
            <span className="text-xs font-semibold text-white/90">Smart Virtual Phone Simulator</span>
          </motion.div>
        </div>

        {/* Section Heading & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.15]"
          >
            Restaurant Dining &amp; Delivery,{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
              Reinvented on Your Phone
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4 text-slate-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Experience Ethiopia&apos;s most advanced food ecosystem. From table QR code scanning and 3D Augmented Reality dish viewing to live courier GPS dispatch.
          </motion.p>
        </div>

        {/* Interactive Mode Navigation Pills */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto pb-4 mb-10 max-w-4xl mx-auto">
          {(['ar', 'dinein', 'tracking', 'payment'] as PhoneScreen[]).map((screen) => {
            const info = screensInfo[screen];
            const isActive = activeScreen === screen;
            return (
              <button
                key={screen}
                onClick={() => handleSelectTab(screen)}
                className={`relative px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-display font-bold transition-all duration-300 whitespace-nowrap flex items-center gap-2 border ${
                  isActive
                    ? 'text-white border-orange-500/60 shadow-lg shadow-orange-500/25 scale-105'
                    : 'text-slate-400 border-slate-800 bg-slate-900/60 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePhoneScreenPill"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-rose-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 text-base">{info.icon}</span>
                <span className="relative z-10">{info.title.split(' ')[0]} {info.title.split(' ')[1]}</span>
              </button>
            );
          })}
        </div>

        {/* Centerpiece: Virtual Phone Stage & Side Explanations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Feature Deep Dive (4 cols) */}
          <div className="lg:col-span-4 order-2 lg:order-1 space-y-6">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{screensInfo[activeScreen].icon}</span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-orange-400">
                  {screensInfo[activeScreen].tag}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-black text-white mb-3">
                {screensInfo[activeScreen].title}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {screensInfo[activeScreen].desc}
              </p>

              {/* Dynamic Feature Checklist based on screen */}
              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs sm:text-sm text-slate-300">
                {activeScreen === 'ar' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Real 3D GLB/USDZ photorealistic models</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Works instantly on iOS Safari &amp; Android Chrome</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>True-to-scale portion size verification</span>
                    </div>
                  </>
                )}
                {activeScreen === 'dinein' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Cryptographically signed table QR standees</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>1-Tap Waiter Call &amp; Bill Request Buzzers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Multiple food rounds attached to one tab</span>
                    </div>
                  </>
                )}
                {activeScreen === 'tracking' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Live GPS bike routing across Addis Ababa</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Automated stage updates (Kitchen → Out for Delivery)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Direct driver phone contact with zero middleman</span>
                    </div>
                  </>
                )}
                {activeScreen === 'payment' && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Native Telebirr, CBE Birr &amp; M-Pesa QR code pay</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Instant digital VAT fiscal receipts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Cashier register split payments supported</span>
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center gap-3">
                <a
                  href="#menu-dishes"
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-display font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5"
                >
                  <span>🍽️ Browse Dishes Below</span>
                </a>
                <Link
                  to="/delivery"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors border border-slate-700"
                >
                  Dispatch Portal ↗
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Center Column: The Virtual Smartphone Chassis (5 cols) */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center relative">
            
            {/* Ambient Device Halo Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 via-amber-500/10 to-transparent blur-3xl rounded-[60px] transform scale-95 pointer-events-none" />

            {/* Floating Satellite Badge 1 (Top Right) */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-5 -right-4 sm:-right-8 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl z-30 hidden sm:flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl shadow-md shadow-emerald-500/20">
                ⚡
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fast Turnaround</p>
                <p className="text-xs font-black text-white">24 Min Express Delivery</p>
              </div>
            </motion.div>

            {/* Floating Satellite Badge 2 (Bottom Left) */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-5 -left-4 sm:-left-8 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-3 shadow-2xl z-30 hidden sm:flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
                🪑
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Table</p>
                <p className="text-xs font-black text-white">Table #04 • Session Live</p>
              </div>
            </motion.div>

            {/* SMARTPHONE HARDWARE CHASSIS */}
            <div className="relative w-[300px] sm:w-[330px] h-[610px] sm:h-[650px] bg-slate-950 rounded-[50px] p-3 shadow-2xl border-[4px] border-slate-700/80 ring-1 ring-white/10 select-none">
              
              {/* Outer Metallic Bevel Details */}
              <div className="absolute top-28 -left-[7px] w-[3px] h-9 bg-slate-600 rounded-l-sm" />
              <div className="absolute top-44 -left-[7px] w-[3px] h-12 bg-slate-600 rounded-l-sm" />
              <div className="absolute top-60 -left-[7px] w-[3px] h-12 bg-slate-600 rounded-l-sm" />
              <div className="absolute top-40 -right-[7px] w-[3px] h-16 bg-slate-600 rounded-r-sm" />

              {/* Glass Screen Frame */}
              <div className="w-full h-full bg-slate-950 rounded-[42px] overflow-hidden relative flex flex-col justify-between border border-slate-800 shadow-inner">
                
                {/* Dynamic Island & Status Bar */}
                <div className="pt-2 px-6 pb-2 bg-slate-950 z-30 flex items-center justify-between text-white text-[11px] font-bold">
                  <span>9:41</span>
                  
                  {/* Dynamic Island Pill */}
                  <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 border border-slate-800 shadow-md">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    </span>
                    <span className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700" />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span>5G</span>
                    <div className="w-4 h-2.5 border border-white rounded-sm p-0.5 flex items-center">
                      <div className="w-full h-full bg-white rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* VIRTUAL SCREEN CONTENT - INTERACTIVE MODES */}
                <div className="flex-1 overflow-hidden relative bg-slate-900 flex flex-col">
                  <AnimatePresence mode="wait">
                    
                    {/* SCREEN 1: 3D AR FOOD VIEWER */}
                    {activeScreen === 'ar' && (
                      <motion.div
                        key="screen-ar"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col justify-between p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white"
                      >
                        <div>
                          {/* Mini Header */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              AR Table Camera
                            </span>
                            <span className="text-xs text-slate-400">Addis Dining Hall</span>
                          </div>

                          {/* 3D AR Stage Mockup */}
                          <div className="relative h-44 sm:h-52 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-950 border border-slate-700/60 overflow-hidden flex flex-col items-center justify-center shadow-inner group">
                            
                            {/* Augmented Reality Grid Plane */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:14px_14px]" />
                            
                            {/* Realistic Dish Photo with 3D float */}
                            <motion.img
                              src="https://images.unsplash.com/photo-1544025162-d76694265947?w=600"
                              alt="Sizzling Tibs AR"
                              animate={{
                                rotateY: arRotated ? 180 : 0,
                                y: [0, -6, 0],
                              }}
                              transition={{
                                rotateY: { duration: 0.8 },
                                y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                              }}
                              className="w-36 h-36 object-cover rounded-full shadow-2xl border-4 border-amber-500/40 cursor-pointer"
                              onClick={() => setArRotated(!arRotated)}
                              title="Click to spin in 3D"
                            />

                            {/* 3D Rotate Hint */}
                            <button
                              onClick={() => setArRotated(!arRotated)}
                              className="absolute bottom-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-md"
                            >
                              <span>🔄</span>
                              <span>{arRotated ? 'Angle: 180° Rear' : 'Tap to Spin 3D View'}</span>
                            </button>
                          </div>

                          <div className="mt-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-display font-black text-base text-white">Sizzling Beef Tibs</h4>
                                <p className="text-[11px] text-slate-400">Authentic spiced rosemary &amp; awaze</p>
                              </div>
                              <span className="font-display font-black text-amber-400 text-sm">350 ETB</span>
                            </div>
                          </div>
                        </div>

                        {/* AR Bottom Action */}
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => setCartCount((c) => c + 1)}
                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
                          >
                            <span>🛒 Add to Table Tab ({cartCount} in Cart)</span>
                          </button>
                          <p className="text-[10px] text-center text-slate-500">
                            ✨ True-scale Augmented Reality 3D Food Preview
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* SCREEN 2: QR TABLE DINE-IN TAB */}
                    {activeScreen === 'dinein' && (
                      <motion.div
                        key="screen-dinein"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col justify-between p-4 bg-slate-950 text-white"
                      >
                        <div>
                          {/* Table Banner */}
                          <div className="p-3 bg-gradient-to-r from-violet-900/60 to-purple-900/40 border border-violet-500/30 rounded-2xl mb-3 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-violet-300 font-bold uppercase">Table QR Session</p>
                              <h4 className="font-display font-black text-sm text-white">Table #04 (Main Hall)</h4>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              ● Connected
                            </span>
                          </div>

                          {/* Running Order Tab */}
                          <div className="space-y-2 mb-3">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Table Dishes</p>
                            
                            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400 font-bold">1×</span>
                                <div>
                                  <p className="font-semibold text-white">Doro Wat Special</p>
                                  <p className="text-[10px] text-slate-400">Kitchen Preparing</p>
                                </div>
                              </div>
                              <span className="font-bold text-amber-400">280 ETB</span>
                            </div>

                            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-bold">2×</span>
                                <div>
                                  <p className="font-semibold text-white">Mango Smoothie</p>
                                  <p className="text-[10px] text-emerald-400">Ready to Serve</p>
                                </div>
                              </div>
                              <span className="font-bold text-amber-400">180 ETB</span>
                            </div>
                          </div>

                          {/* Waiter Buzzer Strip */}
                          <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                            <p className="text-[10px] font-bold text-slate-400 mb-2">Digital Waiter Buzzers:</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              <button
                                onClick={() => setWaiterCalled(true)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-200 transition"
                              >
                                💧 Water
                              </button>
                              <button
                                onClick={() => setWaiterCalled(true)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-200 transition"
                              >
                                🧾 Bill
                              </button>
                              <button
                                onClick={() => setWaiterCalled(true)}
                                className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-300 transition"
                              >
                                🔔 Call
                              </button>
                            </div>
                            {waiterCalled && (
                              <p className="text-[10px] text-emerald-400 font-semibold mt-2 text-center animate-pulse">
                                ✓ Waiter notified! Staff is heading to Table #04
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Tab Subtotal & Settle */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400">Table Tab Balance</p>
                            <p className="font-display font-black text-amber-400 text-sm">460 ETB</p>
                          </div>
                          <button
                            onClick={() => setActiveScreen('payment')}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-violet-900/30"
                          >
                            Pay Tab 💳
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* SCREEN 3: LIVE COURIER GPS TRACKING */}
                    {activeScreen === 'tracking' && (
                      <motion.div
                        key="screen-tracking"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col justify-between p-4 bg-slate-950 text-white"
                      >
                        <div>
                          {/* Order Header */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-slate-400 font-mono font-bold">#ORD-8942</span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                              On The Way
                            </span>
                          </div>

                          {/* Simulated Dark Mode Map */}
                          <div className="relative h-44 sm:h-52 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden mb-3">
                            {/* Stylized Map Roads */}
                            <svg className="w-full h-full opacity-30" viewBox="0 0 100 100">
                              <path d="M10 20 Q 50 40 90 20" stroke="#38bdf8" strokeWidth="2" fill="none" />
                              <path d="M20 90 Q 50 50 80 80" stroke="#38bdf8" strokeWidth="2" fill="none" />
                              <path d="M50 10 L 50 90" stroke="#f97316" strokeWidth="2" strokeDasharray="3 3" fill="none" />
                            </svg>

                            {/* Destination Pin (Bole Medhanialem) */}
                            <div className="absolute top-6 right-10 flex flex-col items-center">
                              <span className="text-xl">📍</span>
                              <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300 font-bold whitespace-nowrap">
                                Home (Bole)
                              </span>
                            </div>

                            {/* Animated Courier Bike on Map */}
                            <motion.div
                              animate={{
                                x: [20, 80, 20],
                                y: [80, 40, 80],
                              }}
                              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                              className="absolute w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-sm shadow-xl shadow-emerald-500/50 border-2 border-white"
                            >
                              🛵
                            </motion.div>
                          </div>

                          {/* Driver Info Card */}
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">
                                👨‍✈️
                              </div>
                              <div>
                                <p className="font-bold text-xs text-white">Abebe Kebede</p>
                                <p className="text-[10px] text-slate-400">TVS Apache • ⭐ 4.98</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-400 font-mono">ETA 12m</span>
                          </div>
                        </div>

                        {/* Status bar */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">Contact Courier:</span>
                          <button
                            onClick={() => alert('Calling driver Abebe Kebede (+251 911 234 567)...')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <span>📞 Call Driver</span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* SCREEN 4: INSTANT MULTI-RAIL PAYMENT */}
                    {activeScreen === 'payment' && (
                      <motion.div
                        key="screen-payment"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 flex flex-col justify-between p-4 bg-slate-950 text-white"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                              Instant Clearing
                            </span>
                            <span className="text-xs text-slate-400">Total: 460 ETB</span>
                          </div>

                          <h4 className="font-display font-black text-sm text-white mb-2">Select Payment Rail</h4>

                          {/* Rails Grid */}
                          <div className="space-y-2 mb-3">
                            <div className="p-2.5 bg-slate-900 rounded-xl border-2 border-emerald-500/60 flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2.5">
                                <span className="text-lg">🟢</span>
                                <div>
                                  <p className="font-bold text-xs text-white">Telebirr Mobile Pay</p>
                                  <p className="text-[10px] text-slate-400">Ethio Telecom Rail</p>
                                </div>
                              </div>
                              <span className="text-emerald-400 text-xs font-black">● Active</span>
                            </div>

                            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2.5">
                                <span className="text-lg">🔵</span>
                                <div>
                                  <p className="font-bold text-xs text-white">CBE Birr</p>
                                  <p className="text-[10px] text-slate-400">Commercial Bank of Ethiopia</p>
                                </div>
                              </div>
                              <span className="text-slate-400 text-xs">Ready</span>
                            </div>

                            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer">
                              <div className="flex items-center gap-2.5">
                                <span className="text-lg">🟣</span>
                                <div>
                                  <p className="font-bold text-xs text-white">M-Pesa Safaricom</p>
                                  <p className="text-[10px] text-slate-400">Safaricom Ethiopia Rail</p>
                                </div>
                              </div>
                              <span className="text-slate-400 text-xs">Ready</span>
                            </div>
                          </div>
                        </div>

                        {/* Pay Button */}
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => alert('Telebirr payment prompt simulated! Receipt verified.')}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                          >
                            <span>🔒 Authorize 460 ETB Telebirr Pay</span>
                          </button>
                          <p className="text-[10px] text-center text-slate-500">
                            🛡️ 256-bit Encrypted Local Gateway
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* iPhone Home Indicator Bar */}
                <div className="py-2 bg-slate-950 flex justify-center">
                  <div className="w-28 h-1 bg-slate-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Metrics & Enterprise Highlights (3 cols) */}
          <div className="lg:col-span-3 order-3 space-y-4">
            
            {/* Metric 1 */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl">
              <span className="text-2xl p-2 bg-orange-500/10 rounded-xl border border-orange-500/20 inline-block mb-2">
                🚀
              </span>
              <p className="text-xl font-black text-white font-display">Zero App Download</p>
              <p className="text-xs text-slate-400 mt-1">
                Works instantly inside iOS Safari &amp; Chrome. Guests scan the table QR code and start ordering with zero installation friction.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl">
              <span className="text-2xl p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 inline-block mb-2">
                👨‍🍳
              </span>
              <p className="text-xl font-black text-white font-display">Direct KDS Sync</p>
              <p className="text-xs text-slate-400 mt-1">
                Orders fired from tables immediately pop onto the chef's Kitchen Display System screen with preparation timers.
              </p>
            </div>

            {/* Metric 3 */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl">
              <span className="text-2xl p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 inline-block mb-2">
                📊
              </span>
              <p className="text-xl font-black text-white font-display">Live ERP Clearing</p>
              <p className="text-xs text-slate-400 mt-1">
                Automatic inventory depletion, recipe costing, and cash register shifts reconciled seamlessly.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default VirtualPhoneOverview;

