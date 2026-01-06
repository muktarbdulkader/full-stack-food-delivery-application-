import { useState, useEffect } from 'react';
import { foodService } from '../services/food.service';
import type { Food } from '../services/food.service';
import FoodCard from '../components/FoodCard';

const sampleFoods: Food[] = [
  { _id: '1', name: 'Doro Wat', description: 'Traditional Ethiopian spicy chicken stew with berbere spices', price: 280, category: 'Ethiopian', image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=500', isAvailable: true },
  { _id: '2', name: 'Classic Burger', description: 'Juicy beef patty with fresh lettuce, tomato, and special sauce', price: 185, category: 'Burger', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', isAvailable: true },
  { _id: '3', name: 'Margherita Pizza', description: 'Fresh mozzarella, tomatoes, and basil on crispy crust', price: 320, category: 'Pizza', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500', isAvailable: true },
  { _id: '4', name: 'Tibs', description: 'Sauteed beef or lamb with onions, peppers, and rosemary', price: 350, category: 'Ethiopian', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500', isAvailable: true },
  { _id: '5', name: 'Caesar Salad', description: 'Crisp romaine lettuce with parmesan and croutons', price: 145, category: 'Salad', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500', isAvailable: true },
  { _id: '6', name: 'Chocolate Cake', description: 'Rich chocolate layers with creamy frosting', price: 120, category: 'Dessert', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', isAvailable: true },
  { _id: '7', name: 'Mango Smoothie', description: 'Fresh mango blended with yogurt and honey', price: 85, category: 'Drinks', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500', isAvailable: true },
  { _id: '8', name: 'Kitfo', description: 'Ethiopian beef tartare seasoned with mitmita and kibbeh', price: 380, category: 'Ethiopian', image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=500', isAvailable: true },
];

const categories = [
  { id: 'all', name: 'All', emoji: '🍽️' },
  { id: 'ethiopian', name: 'Ethiopian', emoji: '🇪🇹' },
  { id: 'burger', name: 'Burgers', emoji: '🍔' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕' },
  { id: 'salad', name: 'Salads', emoji: '🥗' },
  { id: 'dessert', name: 'Desserts', emoji: '🍰' },
  { id: 'drinks', name: 'Drinks', emoji: '🥤' },
];

const Home = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await foodService.getAllFoods();
        setFoods(response.data.foods);
        setFilteredFoods(response.data.foods);
      } catch {
        setFoods(sampleFoods);
        setFilteredFoods(sampleFoods);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  useEffect(() => {
    let result = foods;
    if (selectedCategory !== 'all') {
      result = result.filter((food) => food.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery) {
      result = result.filter((food) =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredFoods(result);
  }, [selectedCategory, searchQuery, foods]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-orange-200 rounded-full animate-spin border-t-orange-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl animate-pulse">🍔</span>
          </div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Loading delicious food...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                🚀 Fast Delivery in 30 mins
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mb-6">
                Delicious Food
                <span className="block text-yellow-300">Delivered Fast</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-xl mx-auto lg:mx-0">
                Experience the finest Ethiopian and International cuisine delivered hot to your doorstep.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="#menu" className="px-8 py-4 bg-white text-orange-600 rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                  Order Now →
                </a>
                <a href="#menu" className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2">
                  🍽️ View Menu
                </a>
              </div>
            </div>
            
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="w-80 h-80 xl:w-96 xl:h-96 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                  <span className="text-[140px] xl:text-[180px]">🍔</span>
                </div>
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center animate-bounce">
                  <span className="text-5xl">🍟</span>
                </div>
                <div className="absolute -bottom-4 -left-8 w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-bounce" style={{ animationDelay: '0.3s' }}>
                  <span className="text-4xl">🥤</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: '🚀', title: 'Fast Delivery', desc: '30 min or free' },
              { icon: '🍳', title: 'Fresh Food', desc: 'Made with love' },
              { icon: '💳', title: 'Easy Payment', desc: 'Telebirr, M-Pesa' },
              { icon: '🎁', title: 'Best Offers', desc: 'Daily deals' },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-2xl sm:text-3xl">{feature.icon}</span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4">
              Our Menu
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
              Explore <span className="text-orange-500">Delicious</span> Food
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              From traditional Ethiopian dishes to international favorites.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <input
                type="text"
                placeholder="Search for food..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-14 bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
              />
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-10 overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-3 min-w-max justify-start sm:justify-center">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-5 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-white text-gray-600 hover:bg-orange-50 shadow-md border border-gray-100'
                  }`}
                >
                  <span className="text-xl">{category.emoji}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Food Grid */}
          {filteredFoods.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No food found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filter</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold shadow-lg"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFoods.map((food, index) => (
                <FoodCard key={food._id} food={food} index={index} />
              ))}
            </div>
          )}
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
                <span className="text-xl font-bold">FoodHub</span>
              </div>
              <p className="text-gray-400 text-sm">Delivering happiness one meal at a time.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-orange-400">About Us</a></li>
                <li><a href="#" className="hover:text-orange-400">Contact</a></li>
                <li><a href="#" className="hover:text-orange-400">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-orange-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-orange-400">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>📍 Bole, Addis Ababa</li>
                <li>📞 +251 911 234 567</li>
                <li>✉️ info@foodhub.et</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            © 2026 FoodHub. All rights reserved. Made with ❤️ in Ethiopia
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
