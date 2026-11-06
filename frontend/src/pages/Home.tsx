import { useState, useEffect } from 'react';
import { foodService } from '../services/food.service';
import type { Food } from '../services/food.service';
import FoodCard from '../components/FoodCard';

const sampleFoods: Food[] = [
  {
    _id: '1',
    name: 'Doro Wat Special',
    description: 'Traditional slow-cooked spicy chicken stew infused with berbere, cardamom, boiled egg, served with fresh injera.',
    price: 280,
    category: 'Ethiopian',
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=700',
    isAvailable: true,
  },
  {
    _id: '2',
    name: 'Gourmet Beef Burger',
    description: 'Premium grilled beef patty, melted cheddar cheese, fresh crisp lettuce, caramelized onions & house special sauce.',
    price: 195,
    category: 'Burger',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700',
    isAvailable: true,
  },
  {
    _id: '3',
    name: 'Sizzling Beef Tibs',
    description: 'Tender beef sautéed in rosemary, onions, garlic, jalapeños, served sizzling hot with awaze and injera.',
    price: 350,
    category: 'Ethiopian',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=700',
    isAvailable: true,
  },
  {
    _id: '4',
    name: 'Margherita Wood-Fired Pizza',
    description: 'Fresh mozzarella cheese, San Marzano tomato puree, extra virgin olive oil, and aromatic fresh basil leaves.',
    price: 320,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=700',
    isAvailable: true,
  },
  {
    _id: '5',
    name: 'Traditional Kitfo Special',
    description: 'Finely minced lean beef seasoned with mitmita chili powder and purified spiced herbal butter (niter kibbeh), with ayib & gomen.',
    price: 390,
    category: 'Ethiopian',
    image: 'https://images.unsplash.com/photo-1529694157872-4e0c0f3b238b?w=700',
    isAvailable: true,
  },
  {
    _id: '6',
    name: 'Mediterranean Caesar Salad',
    description: 'Crispy romaine lettuce, parmesan shavings, seasoned croutons, and rich homemade creamy caesar dressing.',
    price: 155,
    category: 'Salad',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=700',
    isAvailable: true,
  },
  {
    _id: '7',
    name: 'Belgian Chocolate Fudge Cake',
    description: 'Moist multi-layered dark chocolate sponge draped in silky Belgian chocolate ganache.',
    price: 130,
    category: 'Dessert',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
    isAvailable: true,
  },
  {
    _id: '8',
    name: 'Tropical Mango Smoothie',
    description: 'Fresh Ethiopian mangoes blended smooth with creamy yogurt, splash of lime and honey.',
    price: 90,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=700',
    isAvailable: true,
  },
  {
    _id: '9',
    name: 'Authentic Buna Coffee',
    description: 'Traditional Ethiopian single-origin freshly roasted Arabica coffee brewed in a clay pot (jebena).',
    price: 65,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700',
    isAvailable: true,
  },
];

const categories = [
  { id: 'all', name: 'All Dishes', emoji: '🍽️' },
  { id: 'ethiopian', name: 'Ethiopian', emoji: '🇪🇹' },
  { id: 'burger', name: 'Burgers', emoji: '🍔' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕' },
  { id: 'salad', name: 'Salads', emoji: '🥗' },
  { id: 'dessert', name: 'Desserts', emoji: '🍰' },
  { id: 'drinks', name: 'Beverages', emoji: '🥤' },
];

const Home = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await foodService.getAllFoods();
        if (response.data.foods && response.data.foods.length > 0) {
          setFoods(response.data.foods);
          setFilteredFoods(response.data.foods);
        } else {
          setFoods(sampleFoods);
          setFilteredFoods(sampleFoods);
        }
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
    let result = [...foods];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(
        (food) => food.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (food) =>
          food.name.toLowerCase().includes(q) ||
          food.description.toLowerCase().includes(q) ||
          food.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredFoods(result);
  }, [selectedCategory, searchQuery, sortBy, foods]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-24">
      
      {/* Menu Header Banner */}
      <section className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 text-white py-12 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-widest inline-block mb-3">
              Addis Ababa Food Hall
            </span>
            <h1 className="font-display font-black text-3xl sm:text-5xl tracking-tight mb-2">
              Delicious Menu & Daily Specials
            </h1>
            <p className="text-white/80 text-sm sm:text-base max-w-xl">
              Freshly prepared Ethiopian staples and continental favorites delivered in 30 minutes.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl">
            <span className="text-3xl">🛵</span>
            <div className="text-left">
              <p className="text-xs text-white/70 font-semibold uppercase">Estimated Delivery</p>
              <p className="font-display font-black text-lg">30-40 Minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        
        {/* Search & Sort Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xl shadow-orange-500/5 border border-orange-100/70 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Doro Wat, Tibs, Burgers, Pizza..."
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Result Count & Sorting */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <span className="text-xs font-bold text-slate-500">
              Showing <span className="text-orange-600">{filteredFoods.length}</span> dishes
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories Tab Pill Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-display font-bold text-sm whitespace-nowrap transition-all duration-300 shadow-sm ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white shadow-md shadow-orange-500/25 scale-105'
                    : 'bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200/60'
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-orange-200 rounded-full animate-spin border-t-orange-500" />
              <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">
                🍔
              </div>
            </div>
            <p className="mt-5 text-slate-600 font-bold font-display text-lg">
              Cooking up the freshest menu...
            </p>
          </div>
        ) : filteredFoods.length === 0 ? (
          /* Empty Search State */
          <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto border border-orange-100 shadow-sm">
            <span className="text-6xl block mb-4">🔍</span>
            <h3 className="font-display font-bold text-xl text-slate-800 mb-2">
              No matching dishes found
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              We couldn't find anything matching "{searchQuery}". Try searching for another dish or reset your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-sm transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Food Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredFoods.map((food, idx) => (
              <FoodCard key={food._id} food={food} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
