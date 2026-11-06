import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Food } from '../services/food.service';

export interface CartItem {
  food: Food;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

const loadCartFromStorage = (): CartState => {
  const stored = localStorage.getItem('cart');
  if (stored) {
    return JSON.parse(stored);
  }
  return { items: [], totalItems: 0, totalAmount: 0 };
};

const saveCartToStorage = (state: CartState) => {
  localStorage.setItem('cart', JSON.stringify(state));
};

const initialState: CartState = loadCartFromStorage();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Food>) => {
      const existingItem = state.items.find(
        (item) => item.food._id === action.payload._id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ food: action.payload, quantity: 1 });
      }

      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalAmount = state.items.reduce(
        (sum, item) => sum + item.food.price * item.quantity,
        0
      );
      saveCartToStorage(state);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.food._id !== action.payload
      );
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalAmount = state.items.reduce(
        (sum, item) => sum + item.food.price * item.quantity,
        0
      );
      saveCartToStorage(state);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ foodId: string; quantity: number }>
    ) => {
      if (action.payload.quantity <= 0) {
        state.items = state.items.filter(
          (item) => item.food._id !== action.payload.foodId
        );
      } else {
        const item = state.items.find(
          (item) => item.food._id === action.payload.foodId
        );
        if (item) {
          item.quantity = action.payload.quantity;
        }
      }
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
      state.totalAmount = state.items.reduce(
        (sum, item) => sum + item.food.price * item.quantity,
        0
      );
      saveCartToStorage(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
      localStorage.removeItem('cart');
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
