import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { Food } from '../services/food.service';
import { addToCart } from '../store/cartSlice';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface FoodCardProps {
  food: Food;
  index?: number;
}

const FoodCard = ({ food, index = 0 }: FoodCardProps) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsAdding(true);
    dispatch(addToCart(food));
    setTimeout(() => setIsAdding(false), 800);
  };

  const getCategoryEmoji = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('ethiopian')) return '🇪🇹';
    if (cat.includes('burger')) return '🍔';
    if (cat.includes('pizza')) return '🍕';
    if (cat.includes('salad')) return '🥗';
    if (cat.includes('dessert') || cat.includes('cake')) return '🍰';
    if (cat.includes('drink') || cat.includes('juice') || cat.includes('coffee')) return '🥤';
    return '🍽️';
  };

  return (
    <div
      className="group relative bg-white/95 rounded-3xl overflow-hidden border border-orange-100/70 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Image Banner */}
      <div className="relative h-52 sm:h-56 overflow-hidden bg-gradient-to-br from-orange-100/60 to-amber-50">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 animate-pulse" />
        )}
        <img
          src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}
          alt={food.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Ambient Dark Gradient on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-white/60 text-xs font-bold text-slate-700">
            <span>{getCategoryEmoji(food.category)}</span>
            <span>{food.category}</span>
          </span>
          {food.category.toLowerCase().includes('ethiopian') && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
              Local Special
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-300"
          title="Favorite"
        >
          <svg
            className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Sold Out Overlay */}
        {!food.isAvailable && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500/90 text-white px-5 py-2 rounded-2xl font-bold text-sm tracking-wide shadow-lg border border-red-400">
              Unavailable Today
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Rating & Fast Prep */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <div className="flex items-center gap-1 font-semibold text-amber-500">
              <span>★</span>
              <span>4.9</span>
              <span className="text-slate-400 font-normal">(120+)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span>⏱️</span>
              <span>20-30 min</span>
            </div>
          </div>

          <h3 className="font-display font-bold text-lg text-slate-800 group-hover:text-orange-600 transition-colors duration-300 line-clamp-1 mb-1.5">
            {food.name}
          </h3>

          <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4">
            {food.description}
          </p>
        </div>

        {/* Bottom Price & Action Row */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 block">
              Price
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-display text-slate-900">
                {food.price.toFixed(0)}
              </span>
              <span className="text-xs font-bold text-orange-600">ETB</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!food.isAvailable || isAdding}
            className={`relative overflow-hidden px-4 sm:px-5 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 shadow-sm ${
              food.isAvailable
                ? isAdding
                  ? 'bg-emerald-500 text-white scale-95 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white hover:shadow-lg hover:shadow-orange-500/30 hover:scale-105 active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isAdding ? (
              <>
                <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>Added!</span>
              </>
            ) : food.isAvailable ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add</span>
              </>
            ) : (
              <span>Sold Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodCard;
