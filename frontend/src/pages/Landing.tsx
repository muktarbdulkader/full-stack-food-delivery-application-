import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#FFFDF9] overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-8 pb-20 sm:pb-32 overflow-hidden">
        {/* Ambient Gradient Background */}
        <div className="absolute top-0 inset-x-0 h-[650px] bg-gradient-to-b from-orange-50 via-amber-50/40 to-transparent -z-10" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl -z-10 animate-float-slow" />
        <div className="absolute top-40 left-10 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl -z-10 animate-float" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 text-center lg:text-left pt-6 sm:pt-10">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white rounded-full shadow-sm border border-orange-200/70 text-slate-700 text-xs sm:text-sm font-bold mb-6 animate-fade-in-up">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>#1 Food Delivery Across Addis Ababa</span>
                <span className="text-orange-500 font-extrabold">• 30m Express</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                Authentic Taste,{' '}
                <span className="bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 bg-clip-text text-transparent">
                  Hot & Delivered
                </span>{' '}
                to Your Door.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                From spicy traditional Ethiopian favorites like <strong className="text-slate-800">Doro Wat</strong> and <strong className="text-slate-800">Tibs</strong> to wood-fired pizza and burgers. Pay easily with <strong className="text-slate-800">Telebirr, M-Pesa, or CBE Birr</strong>.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <Link
                  to="/menu"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white rounded-2xl font-display font-bold text-base shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Explore Menu Now</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-orange-50/50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-200 rounded-2xl font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Create Account</span>
                  <span className="text-sm">✨</span>
                </Link>
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/70 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-black text-slate-900">15K+</p>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Orders Delivered</p>
                </div>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-black text-slate-900">4.9 ★</p>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Customer Rating</p>
                </div>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-black text-slate-900">30 min</p>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Average Arrival</p>
                </div>
              </div>

            </div>

            {/* Right Visual Floating Showcase */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md sm:max-w-lg aspect-square">
                
                {/* Glowing Center Ring */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-orange-400 via-red-500 to-amber-300 blur-2xl opacity-30 animate-pulse-slow" />
                
                {/* Central Featured Dish */}
                <div className="relative z-10 w-full h-full rounded-full border-8 border-white shadow-2xl overflow-hidden bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1544025162-d76694265947?w=800"
                    alt="Ethiopian Tibs Specialty"
                    className="w-full h-full object-cover transform scale-105 hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-8">
                    <div className="text-white">
                      <span className="px-3 py-1 rounded-full bg-orange-500 text-white font-extrabold text-xs tracking-wider uppercase mb-2 inline-block">
                        Chef's Choice
                      </span>
                      <h3 className="font-display font-bold text-2xl">Special Sizzling Tibs</h3>
                      <p className="text-sm text-slate-300">Fresh meat, rosemary, jalapeño & injera</p>
                    </div>
                  </div>
                </div>

                {/* Floating Micro Badge 1 - Doro Wat */}
                <div className="absolute -top-4 -left-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-orange-100 flex items-center gap-3 animate-float">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl shadow-sm">
                    🥘
                  </div>
                  <div>
                    <p className="font-display font-bold text-slate-900 text-sm">Doro Wat Stew</p>
                    <p className="text-xs font-semibold text-orange-600">Spicy & Authentic</p>
                  </div>
                </div>

                {/* Floating Micro Badge 2 - Telebirr Instant Pay */}
                <div className="absolute -bottom-6 -right-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-emerald-100 flex items-center gap-3 animate-float-slow">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-display font-black text-xl shadow-sm">
                    📱
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-display font-bold text-slate-900 text-sm">Telebirr & M-Pesa</p>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Instant Payment Accepted</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Local Payment Badges Section */}
      <section className="py-10 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-1">Local Checkout</p>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-white">Accepted Ethiopian Payment Methods</h2>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-2xl shadow-sm">
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="font-bold text-sm text-slate-100">Telebirr</span>
                <span className="text-[10px] text-slate-400 font-medium">(Ethio Telecom)</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-2xl shadow-sm">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="font-bold text-sm text-slate-100">M-Pesa</span>
                <span className="text-[10px] text-slate-400 font-medium">(Safaricom ET)</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-2xl shadow-sm">
                <span className="w-3 h-3 rounded-full bg-sky-400"></span>
                <span className="font-bold text-sm text-slate-100">CBE Birr</span>
                <span className="text-[10px] text-slate-400 font-medium">(Commercial Bank)</span>
              </div>
              <div className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700 px-4 py-2.5 rounded-2xl shadow-sm">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="font-bold text-sm text-slate-100">Cash on Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Carousel / Grid */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 font-bold text-xs uppercase tracking-wider mb-3 inline-block">
            Taste the Diversity
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-slate-900 mb-4">
            Explore Handcrafted Categories
          </h2>
          <p className="text-slate-500 text-base">
            Prepared fresh by the best vetted kitchens in Addis Ababa.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {[
            { name: 'Ethiopian', emoji: '🇪🇹', items: 'Doro Wat, Tibs, Kitfo', color: 'from-amber-400 to-orange-500' },
            { name: 'Burgers', emoji: '🍔', items: 'Smash & Gourmet', color: 'from-orange-500 to-red-500' },
            { name: 'Pizza', emoji: '🍕', items: 'Italian Wood-Fired', color: 'from-red-500 to-rose-600' },
            { name: 'Salads', emoji: '🥗', items: 'Fresh & Healthy', color: 'from-emerald-400 to-teal-500' },
            { name: 'Desserts', emoji: '🍰', items: 'Cakes & Pastries', color: 'from-pink-400 to-rose-500' },
            { name: 'Drinks', emoji: '🥤', items: 'Smoothies & Coffee', color: 'from-purple-400 to-indigo-500' },
          ].map((cat, idx) => (
            <Link
              key={idx}
              to="/menu"
              className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 text-center flex flex-col items-center hover:-translate-y-1.5"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform duration-300 mb-3 text-white`}>
                {cat.emoji}
              </div>
              <h3 className="font-display font-bold text-slate-900 text-base group-hover:text-orange-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{cat.items}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3 Step Interactive Workflow */}
      <section className="py-20 bg-gradient-to-b from-orange-50/50 via-white to-orange-50/40 border-y border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 font-bold text-xs uppercase tracking-wider mb-3 inline-block">
              Effortless Ordering
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-slate-900 mb-4">
              How FoodHub Works
            </h2>
            <p className="text-slate-500 text-base">
              From your screen to your plate in 3 simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Select Your Favorites',
                desc: 'Browse our menu of traditional Ethiopian feasts and global delicacies with full customization.',
                icon: '🍽️',
              },
              {
                step: '02',
                title: 'Seamless Local Payment',
                desc: 'Pay safely using Telebirr, M-Pesa, CBE Birr or select Cash on Delivery at your convenience.',
                icon: '💳',
              },
              {
                step: '03',
                title: 'Live 30-Min Delivery',
                desc: 'Track your assigned driver live from cooking stage to your door with direct one-tap calling.',
                icon: '🚀',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-8 border border-orange-100 shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-14 h-14 rounded-2xl bg-orange-100/80 text-orange-600 flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform">
                      {step.icon}
                    </span>
                    <span className="font-display text-3xl font-black text-orange-200 group-hover:text-orange-500 transition-colors">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-orange-600 text-white rounded-2xl font-display font-bold text-base shadow-md transition-colors"
            >
              <span>Start Your Order</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Testimonials in Addis Ababa */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-3 inline-block">
            Happy Foodies
          </span>
          <h2 className="font-display font-black text-3xl sm:text-5xl text-slate-900 mb-4">
            Loved Across the City
          </h2>
          <p className="text-slate-500 text-base">
            Hear from our satisfied customers in Addis Ababa.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              quote: "The Doro Wat arrived steaming hot in Bole within 25 minutes! Paying via Telebirr was smooth and instant.",
              name: "Selamawit T.",
              location: "Bole Medhanialem",
              rating: "5.0 ★",
            },
            {
              quote: "Best food delivery service in Kazanchis. Being able to track the driver and call him directly saved so much time.",
              name: "Dawit M.",
              location: "Kazanchis",
              rating: "5.0 ★",
            },
            {
              quote: "CBE Birr integration worked without a hitch. The Kitfo was seasoned to perfection. Will order weekly!",
              name: "Yohannes A.",
              location: "Sarbet / Old Airport",
              rating: "5.0 ★",
            },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 text-amber-500 font-bold mb-4">
                {item.rating}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                "{item.quote}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 text-white font-bold flex items-center justify-center text-sm">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-sm">{item.name}</h4>
                  <p className="text-xs text-slate-400">{item.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-gradient-to-r from-orange-600 via-red-600 to-rose-600 p-8 sm:p-14 text-white overflow-hidden shadow-2xl shadow-orange-500/25">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 max-w-2xl">
            <span className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-xs uppercase tracking-wider mb-4 inline-block">
              Hungry Right Now?
            </span>
            <h2 className="font-display font-black text-3xl sm:text-5xl leading-tight mb-4">
              Your Next Delicious Meal is Just a Tap Away.
            </h2>
            <p className="text-white/80 text-base sm:text-lg mb-8 leading-relaxed">
              Join thousands of customers ordering daily meals with fast doorstep arrival.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="px-8 py-4 bg-white text-orange-600 hover:bg-orange-50 rounded-2xl font-display font-bold text-base shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                Order Now
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-2xl font-display font-bold text-base backdrop-blur-sm transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">🍔</span>
                <span className="font-display font-black text-2xl text-white">FoodHub</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                Empowering Ethiopian dining with authentic recipes, localized payments, and ultra-reliable logistics across Addis Ababa.
              </p>
              <p className="text-xs text-orange-400 font-semibold">📍 Addis Ababa, Ethiopia</p>
            </div>

            <div>
              <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/menu" className="hover:text-orange-400 transition-colors">Full Food Menu</Link></li>
                <li><Link to="/cart" className="hover:text-orange-400 transition-colors">My Cart</Link></li>
                <li><Link to="/orders" className="hover:text-orange-400 transition-colors">Track Orders</Link></li>
                <li><Link to="/login" className="hover:text-orange-400 transition-colors">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">Portals</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/admin" className="hover:text-amber-400 transition-colors">🏨 Hotel Pro Dashboard</Link></li>
                <li><Link to="/admin-login" className="hover:text-amber-400 transition-colors">Admin Portal Login</Link></li>
                <li><a href="#payments" className="hover:text-orange-400 transition-colors">Merchant Integration</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-white text-sm uppercase tracking-wider mb-4">Customer Care</h4>
              <ul className="space-y-2 text-sm">
                <li>📞 +251 911 234 567</li>
                <li>✉️ support@foodhub.et</li>
                <li>⏰ Daily: 7:00 AM – 11:00 PM</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} FoodHub Ethiopia. Delicious Delivered.</p>
            <p>Made with ❤️ for Ethiopia</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
