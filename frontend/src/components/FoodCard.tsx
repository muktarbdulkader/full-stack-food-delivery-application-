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
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsAdding(true);
    dispatch(addToCart(food));
    setTimeout(() => setIsAdding(false), 800);
  };

  return (
    <div
      className="group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 animate-fade-in-up opacity-0"
      style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'forwards' }}
    >
      <div className="relative h-48 sm:h-52 overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        )}
        <img
          src={food.image}
          alt={food.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/50">
          <span className="text-xs font-semibold text-gray-700">{food.category}</span>
        </div>

        <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:scale-110">
          <svg className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {!food.isAvailable && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg">Sold Out</span>
          </div>
        )}

        {food.isAvailable && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 w-11 h-11 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white shadow-xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:shadow-orange-500/40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 group-hover:text-orange-500 transition-colors mb-1 line-clamp-1">
          {food.name}
        </h3>

        <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px] leading-relaxed">
          {food.description}
        </p>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-400 block mb-0.5">Price</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {food.price.toFixed(0)}
              </span>
              <span className="text-sm font-semibold text-gray-400">ETB</span>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!food.isAvailable || isAdding}
            className={`px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
              food.isAvailable
                ? isAdding
                  ? 'bg-green-500 text-white scale-95 shadow-lg shadow-green-500/30'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:scale-105'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAdding ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>Added!</span>
              </>
            ) : food.isAvailable ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
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
