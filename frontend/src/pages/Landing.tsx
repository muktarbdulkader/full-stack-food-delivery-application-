import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                #1 Food Delivery in Ethiopia
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mb-6">
                Your Favorite Food
                <span className="block text-yellow-300">Delivered Hot!</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-xl mx-auto lg:mx-0">
                Order from the best restaurants in your city. Ethiopian cuisine, international dishes, and more - all delivered to your doorstep in 30 minutes!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/login" className="px-8 py-4 bg-white text-orange-600 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                  Get Started Free
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <a href="#how-it-works" className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2">
                  Learn More
                </a>
              </div>

              {/* Stats */}
              <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-8">
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-black text-white">10K+</p>
                  <p className="text-white/70 text-sm">Happy Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-black text-white">500+</p>
                  <p className="text-white/70 text-sm">Food Items</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-black text-white">30min</p>
                  <p className="text-white/70 text-sm">Fast Delivery</p>
                </div>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="w-80 h-80 xl:w-[400px] xl:h-[400px] bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse-slow">
                  <span className="text-[160px] xl:text-[200px]">🍔</span>
                </div>
                <div className="absolute -top-8 -right-8 w-28 h-28 bg-white rounded-3xl shadow-2xl flex items-center justify-center animate-bounce">
                  <span className="text-6xl">🍟</span>
                </div>
                <div className="absolute -bottom-6 -left-10 w-24 h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                  <span className="text-5xl">🥤</span>
                </div>
                <div className="absolute top-1/2 -right-16 w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce" style={{ animationDelay: '0.6s' }}>
                  <span className="text-4xl">🍕</span>
                </div>
                
                {/* Delivery Badge */}
                <div className="absolute -bottom-4 right-0 bg-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Delivery Time</p>
                    <p className="text-lg font-bold text-gray-800">30 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
              What We Offer
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Everything You <span className="text-orange-500">Need</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              From ordering to delivery, we've got you covered with the best food delivery experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: '🍽️', title: 'Wide Selection', desc: 'Choose from hundreds of dishes - Ethiopian favorites, burgers, pizza, salads, desserts, and more!', color: 'from-orange-500 to-red-500' },
              { icon: '🚀', title: 'Fast Delivery', desc: 'Get your food delivered hot and fresh in 30 minutes or less. We guarantee speed!', color: 'from-blue-500 to-indigo-500' },
              { icon: '💳', title: 'Easy Payment', desc: 'Pay with Telebirr, M-Pesa, CBE Birr, or Cash on Delivery. Your choice!', color: 'from-green-500 to-emerald-500' },
              { icon: '📱', title: 'Track Orders', desc: 'Real-time order tracking. Know exactly when your food will arrive.', color: 'from-purple-500 to-pink-500' },
              { icon: '⭐', title: 'Best Quality', desc: 'We partner with top-rated restaurants to ensure quality and taste.', color: 'from-amber-500 to-orange-500' },
              { icon: '🎁', title: 'Special Offers', desc: 'Enjoy daily deals, discounts, and exclusive offers for members.', color: 'from-rose-500 to-red-500' },
            ].map((item, i) => (
              <div key={i} className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
                <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <h3 className="font-bold text-gray-800 text-xl mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
              Order in <span className="text-orange-400">3 Easy Steps</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Getting your favorite food has never been easier. Just follow these simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { step: '01', icon: '📝', title: 'Create Account', desc: 'Sign up for free in seconds. Just enter your name, email, and phone number.' },
              { step: '02', icon: '🍔', title: 'Browse & Order', desc: 'Explore our menu, add items to cart, and place your order with your preferred payment.' },
              { step: '03', icon: '🚗', title: 'Fast Delivery', desc: 'Sit back and relax! Your food will be delivered hot and fresh to your doorstep.' },
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-orange-500 to-transparent"></div>
                )}
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 group-hover:scale-110 transition-transform">
                    <span className="text-6xl">{item.icon}</span>
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-white text-orange-500 rounded-xl flex items-center justify-center font-black text-lg shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-gray-400 max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link to="/login" className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-orange-500/30 hover:scale-105 transition-all duration-300">
              Start Ordering Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Food Categories Preview */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
              Our Menu
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Explore <span className="text-orange-500">Categories</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              From traditional Ethiopian dishes to international favorites, we have something for everyone.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {[
              { emoji: '🇪🇹', name: 'Ethiopian', count: '50+ items' },
              { emoji: '🍔', name: 'Burgers', count: '30+ items' },
              { emoji: '🍕', name: 'Pizza', count: '25+ items' },
              { emoji: '🥗', name: 'Salads', count: '20+ items' },
              { emoji: '🍰', name: 'Desserts', count: '35+ items' },
              { emoji: '🥤', name: 'Drinks', count: '40+ items' },
            ].map((cat, i) => (
              <div key={i} className="group bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 text-center cursor-pointer">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-4xl">{cat.emoji}</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{cat.name}</h3>
                <p className="text-gray-400 text-sm">{cat.count}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/login" className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:gap-4 transition-all">
              Sign up to see full menu
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Accepted Payment Methods</h3>
            <p className="text-gray-500">Pay the way you want - we support all major Ethiopian payment options</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: '🟢', name: 'Telebirr', desc: 'Ethio Telecom' },
              { icon: '🟣', name: 'M-Pesa', desc: 'Safaricom' },
              { icon: '🔵', name: 'CBE Birr', desc: 'Commercial Bank' },
              { icon: '💵', name: 'Cash', desc: 'On Delivery' },
            ].map((method, i) => (
              <div key={i} className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-md">
                <span className="text-3xl">{method.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800">{method.name}</p>
                  <p className="text-xs text-gray-400">{method.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-[2rem] sm:rounded-[3rem] overflow-hidden p-8 sm:p-12 lg:p-16 text-center">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative">
              <span className="text-6xl sm:text-8xl block mb-6">🍔</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
                Ready to Order?
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-xl mx-auto">
                Join thousands of happy customers and start ordering your favorite food today!
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-orange-600 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300">
                Create Free Account
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <p className="text-white/70 text-sm mt-4">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🍔</span>
                </div>
                <div>
                  <span className="text-xl font-bold">FoodHub</span>
                  <p className="text-xs text-gray-400">Delicious Delivered</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">Delivering happiness one meal at a time. Fresh, fast, and always delicious.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-orange-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-orange-400 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-orange-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-400 transition">FAQ</a></li>
                <li><a href="#" className="hover:text-orange-400 transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2">📍 Bole, Addis Ababa</li>
                <li className="flex items-center gap-2">📞 +251 911 234 567</li>
                <li className="flex items-center gap-2">✉️ info@foodhub.et</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">© 2026 FoodHub. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {['📘', '📸', '🐦', '📺'].map((icon, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-orange-500 transition-colors">
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
