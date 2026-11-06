import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('adminToken') || localStorage.getItem('token') || '';

const apiReq = async (endpoint: string, method = 'GET', body?: any) => {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API request failed');
  return data;
};

interface RecipeItem {
  _id: string;
  name: string;
  food?: { _id: string; name: string; price: number; image?: string };
  servingSize: number;
  preparationTime: number;
  ingredients: {
    ingredient: { _id: string; name: string; unit: string; unitCost: number };
    quantity: number;
    unit: string;
    wastagePercent?: number;
  }[];
  foodCost: number;
  sellingPrice: number;
  grossProfit: number;
  profitMargin: number;
}

const Recipes = () => {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [foods, setFoods] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalRecipes: 0, avgMargin: 0, highMargin: 0, lowMargin: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Recipe Creator Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [servingSize, setServingSize] = useState(1);
  const [prepTime, setPrepTime] = useState(20);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [recipeIngredients, setRecipeIngredients] = useState<
    { ingredientId: string; quantity: number; unit: string; wastagePercent: number }[]
  >([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, sumRes, foodRes, ingRes] = await Promise.all([
        apiReq('/recipes'),
        apiReq('/recipes/summary'),
        apiReq('/foods?limit=100'),
        apiReq('/inventory/ingredients'),
      ]);
      setRecipes(recRes.data.recipes || []);
      setSummary(sumRes.data.summary || { totalRecipes: 0, avgMargin: 0, highMargin: 0, lowMargin: 0 });
      setFoods(foodRes.data?.foods || foodRes.data || []);
      setIngredients(ingRes.data?.ingredients || []);
    } catch (err: any) {
      console.error('Failed to load recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addIngredientRow = () => {
    if (ingredients.length === 0) return;
    const first = ingredients[0];
    setRecipeIngredients([
      ...recipeIngredients,
      { ingredientId: first._id, quantity: 1, unit: first.unit, wastagePercent: 0 },
    ]);
  };

  const removeIngredientRow = (idx: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx));
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFoodId) {
      alert('Please choose a food menu item to link with this recipe');
      return;
    }
    if (recipeIngredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }
    try {
      await apiReq('/recipes', 'POST', {
        food: selectedFoodId,
        name: recipeName || foods.find((f) => f._id === selectedFoodId)?.name,
        servingSize,
        preparationTime: prepTime,
        sellingPrice: Number(sellingPrice),
        ingredients: recipeIngredients.map((r) => ({
          ingredient: r.ingredientId,
          quantity: Number(r.quantity),
          unit: r.unit,
          wastagePercent: Number(r.wastagePercent || 0),
        })),
      });
      setShowModal(false);
      setSelectedFoodId('');
      setRecipeName('');
      setRecipeIngredients([]);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create recipe');
    }
  };

  const handleRecalculate = async (id: string) => {
    try {
      await apiReq(`/recipes/${id}/recalculate`, 'POST');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Recalculation failed');
    }
  };

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍲</span>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Recipe & Food Costing
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Direct ingredient BOM, cost-of-goods-sold (COGS), and profit margin analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-950/50"
          >
            <span>+</span> Build Food Recipe
          </button>
          <button
            onClick={loadData}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-slate-400 text-xs font-semibold uppercase">Total Engineered Recipes</p>
          <p className="text-2xl font-black text-white mt-1">{summary.totalRecipes}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-amber-400 text-xs font-semibold uppercase">Average Profit Margin</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{summary.avgMargin}%</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-emerald-400 text-xs font-semibold uppercase">🌟 High Margin (&gt;= 60%)</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{summary.highMargin}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <p className="text-rose-400 text-xs font-semibold uppercase">⚠️ Low Margin (&lt; 30%)</p>
          <p className="text-2xl font-black text-rose-400 mt-1">{summary.lowMargin}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-6">
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Recipes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Loading food cost profiles...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            No recipes created yet. Click "Build Food Recipe" to engineer food cost.
          </div>
        ) : (
          filtered.map((r) => (
            <motion.div
              key={r._id}
              layout
              className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">{r.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Yield: {r.servingSize} portion | {r.preparationTime} mins prep</p>
                  </div>
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${
                      r.profitMargin >= 60
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : r.profitMargin >= 40
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {r.profitMargin}% Margin
                  </span>
                </div>

                {/* Cost Breakdown */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/60 rounded-2xl p-3 my-4 text-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Cost (BOM)</p>
                    <p className="text-sm font-bold text-rose-400 mt-0.5">ETB {r.foodCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Selling Price</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">ETB {r.sellingPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Gross Profit</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">ETB {r.grossProfit.toFixed(2)}</p>
                  </div>
                </div>

                {/* Ingredients List */}
                <div className="space-y-1.5 my-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Formula Ingredients</p>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {r.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-900">
                        <span className="text-slate-300 font-medium">{ing.ingredient?.name || 'Raw Item'}</span>
                        <span className="text-slate-400 font-mono">
                          {ing.quantity} {ing.unit} {ing.wastagePercent ? `(+${ing.wastagePercent}% waste)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">{r.ingredients.length} raw components</span>
                <button
                  onClick={() => handleRecalculate(r._id)}
                  className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-xl border border-slate-700 transition-all"
                >
                  🔄 Recalculate BOM
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Recipe Builder Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">Engineer Food Recipe &amp; BOM</h3>
              <form onSubmit={handleCreateRecipe} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Target Menu Food</label>
                    <select
                      required
                      value={selectedFoodId}
                      onChange={(e) => {
                        const fid = e.target.value;
                        setSelectedFoodId(fid);
                        const sel = foods.find((f) => f._id === fid);
                        if (sel) {
                          setRecipeName(sel.name);
                          setSellingPrice(sel.price);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select menu item...</option>
                      {foods.map((f) => (
                        <option key={f._id} value={f._id}>
                          {f.name} (ETB {f.price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Recipe Name</label>
                    <input
                      required
                      type="text"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Yield Portions</label>
                    <input
                      type="number"
                      min="1"
                      value={servingSize}
                      onChange={(e) => setServingSize(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Prep Time (Mins)</label>
                    <input
                      type="number"
                      value={prepTime}
                      onChange={(e) => setPrepTime(parseInt(e.target.value) || 20)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Selling Price (ETB)</label>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>
                </div>

                {/* Raw Ingredients Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Ingredients &amp; Consumption Quantities
                    </label>
                    <button
                      type="button"
                      onClick={addIngredientRow}
                      className="text-xs bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white px-3 py-1 rounded-lg border border-amber-500/30 font-semibold transition-all"
                    >
                      + Add Raw Material
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {recipeIngredients.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <select
                          value={row.ingredientId}
                          onChange={(e) => {
                            const ing = ingredients.find((i) => i._id === e.target.value);
                            const updated = [...recipeIngredients];
                            updated[idx].ingredientId = e.target.value;
                            if (ing) updated[idx].unit = ing.unit;
                            setRecipeIngredients(updated);
                          }}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing._id} value={ing._id}>
                              {ing.name} ({ing.unit}) — ETB {ing.unitCost}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="any"
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => {
                            const updated = [...recipeIngredients];
                            updated[idx].quantity = parseFloat(e.target.value) || 0;
                            setRecipeIngredients(updated);
                          }}
                          className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                        />
                        <span className="text-xs text-slate-400 font-mono w-10">{row.unit}</span>
                        <input
                          type="number"
                          placeholder="Waste %"
                          title="Wastage percent"
                          value={row.wastagePercent || ''}
                          onChange={(e) => {
                            const updated = [...recipeIngredients];
                            updated[idx].wastagePercent = parseFloat(e.target.value) || 0;
                            setRecipeIngredients(updated);
                          }}
                          className="w-16 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(idx)}
                          className="text-rose-400 hover:text-rose-300 px-2 py-1 font-bold text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                  >
                    Save Recipe Formula
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Recipes;

